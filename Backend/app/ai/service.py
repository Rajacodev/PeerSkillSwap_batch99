"""
Business logic for the AI Career Advisor: given a target job title, return
a short summary and a list of recommended skills to learn, cross-referenced
against skills actually available on the platform so the user can book a
session immediately.

Several AI APIs are supported (see providers.py). Providers that have an
API key configured are tried in AI_PROVIDER_ORDER; the first one to return
a usable answer wins. If none are configured, or every one fails, a curated
rule-based dataset is used instead, so the feature never hard-fails.
"""
import json
import re

import requests
from flask import current_app

from app.ai.providers import PROVIDERS
from app.ai.repository import CareerRecommendationRepository
from app.ai.fallback_data import find_fallback_recommendation
from app.skills.repository import SkillRepository

CURATED = "curated"

SYSTEM_PROMPT = (
    "You are a career advisor for PeerSkillSwap, a peer-to-peer skill exchange "
    "platform. Given a target job title, respond with STRICT JSON only (no "
    "markdown, no commentary, no code fences) matching exactly this shape:\n"
    '{"summary": "2-3 sentence overview of the role and what learning path makes '
    'sense", "skills": [{"name": "Skill name", "category": "one of Technology, '
    'Music, Art, Language, Business, Fitness, Cooking, Academics, Other", '
    '"reason": "1 short sentence on why this skill matters for the role", '
    '"priority": "high, medium, or low"}]}\n'
    "Return between 4 and 7 skills, ordered by priority (high first). Keep the "
    "summary concise and the reasons short."
)


def parse_recommendation(text):
    """Turn a model's raw text into (summary, skills), or None if unusable."""
    if not text:
        return None
    cleaned = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
    # Some models add a sentence before/after the JSON; keep just the object.
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start == -1 or end <= start:
        return None
    try:
        parsed = json.loads(cleaned[start : end + 1])
    except json.JSONDecodeError:
        return None

    summary = str(parsed.get("summary", "")).strip()
    skills = parsed.get("skills", [])
    if not summary or not isinstance(skills, list):
        return None

    cleaned_skills = []
    for skill in skills[:7]:
        if not isinstance(skill, dict) or not skill.get("name"):
            continue
        priority = skill.get("priority")
        cleaned_skills.append(
            {
                "name": str(skill["name"])[:100],
                "category": str(skill.get("category", "Other"))[:50],
                "reason": str(skill.get("reason", ""))[:300],
                "priority": priority if priority in ("high", "medium", "low") else "medium",
            }
        )
    if not cleaned_skills:
        return None
    return summary, cleaned_skills


class AIRecommendationService:
    def __init__(self):
        self.repo = CareerRecommendationRepository()
        self.skill_repo = SkillRepository()

    # ---- provider chain -------------------------------------------------
    @staticmethod
    def _provider_order():
        raw = current_app.config.get("AI_PROVIDER_ORDER", "")
        order = []
        for name in (p.strip().lower() for p in raw.split(",")):
            if name in PROVIDERS and name not in order:
                order.append(name)
        # Any provider missing from the configured order goes last.
        order += [name for name in PROVIDERS if name not in order]
        return order

    def provider_status(self):
        """Which providers are set up, in the order they will be tried.
        Never includes the API keys themselves."""
        cfg = current_app.config
        return [
            {
                "name": name,
                "label": PROVIDERS[name]["label"],
                "model": cfg.get(PROVIDERS[name]["model_setting"]),
                "configured": bool(cfg.get(PROVIDERS[name]["key_setting"])),
            }
            for name in self._provider_order()
        ]

    def _generate_with_providers(self, job_title):
        cfg = current_app.config
        timeout = cfg.get("AI_REQUEST_TIMEOUT", 20)
        user_message = f'Target job title: "{job_title}"'

        for name in self._provider_order():
            spec = PROVIDERS[name]
            api_key = cfg.get(spec["key_setting"])
            if not api_key:
                continue
            try:
                text = spec["call"](
                    api_key, cfg.get(spec["model_setting"]), SYSTEM_PROMPT, user_message, timeout
                )
                parsed = parse_recommendation(text)
                if parsed:
                    return name, parsed[0], parsed[1]
                current_app.logger.warning("AI provider %s returned an unusable answer", name)
            except (requests.RequestException, ValueError, KeyError, IndexError, TypeError) as exc:
                # One line, no stack trace: bad keys and network blips are
                # expected here. API keys are sent in headers, never in the
                # URL, so the error text cannot contain them.
                current_app.logger.warning(
                    "AI provider %s failed (%s: %s); trying the next one",
                    name, type(exc).__name__, str(exc)[:200],
                )
        return None

    # ---- platform cross-reference --------------------------------------
    def _attach_platform_matches(self, skills):
        """Attach any matching bookable skills already listed on the platform
        (by title) so the frontend can link straight to a mentor."""
        enriched = []
        for skill in skills:
            matches, _ = self.skill_repo.search(
                page=1, per_page=3, search=skill["name"], category=None,
                sort_by="total_bookings", order="desc",
            )
            enriched.append({**skill, "matching_platform_skills": [m.to_dict() for m in matches]})
        return enriched

    # ---- public API -----------------------------------------------------
    def recommend(self, user, job_title):
        result = self._generate_with_providers(job_title)

        if result:
            provider, summary, skills = result
            generated_by_ai = True
        else:
            summary, skills, _matched = find_fallback_recommendation(job_title)
            provider, generated_by_ai = CURATED, False

        enriched_skills = self._attach_platform_matches(skills)
        self.repo.create(user, job_title, summary, enriched_skills, generated_by_ai, provider)

        return {
            "job_title": job_title,
            "summary": summary,
            "recommended_skills": enriched_skills,
            "generated_by_ai": generated_by_ai,
            "provider": provider,
            "provider_label": PROVIDERS[provider]["label"] if provider in PROVIDERS else "Curated dataset",
        }

    def get_history(self, user, page, per_page):
        items, total = self.repo.list_for_user(user, page, per_page)
        return [r.to_dict() for r in items], total
