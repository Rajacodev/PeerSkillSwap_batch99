"""
Tests for the multi-provider AI layer. Real AI APIs are never called: the
HTTP layer (requests.post inside app.ai.providers) is replaced with a fake,
so these verify the request each provider receives, how each provider's
response format is parsed, and the failover behaviour between providers.
"""
import json
import os
import pytest
import requests

os.environ["FLASK_ENV"] = "testing"
os.environ["MONGODB_URI"] = "mongomock://localhost"

from app import create_app
from config import TestingConfig
from mongoengine.connection import disconnect

GOOD_JSON = json.dumps(
    {
        "summary": "A short overview of the role.",
        "skills": [
            {"name": "Python", "category": "Technology", "reason": "Core language.", "priority": "high"},
            {"name": "SQL", "category": "Technology", "reason": "Data access.", "priority": "medium"},
        ],
    }
)


class FakeResponse:
    def __init__(self, payload, status=200):
        self._payload, self.status_code = payload, status

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"{self.status_code} error")

    def json(self):
        return self._payload


def anthropic_reply(text):
    return FakeResponse({"content": [{"type": "text", "text": text}]})


def openai_reply(text):
    return FakeResponse({"choices": [{"message": {"content": text}}]})


def gemini_reply(text):
    return FakeResponse({"candidates": [{"content": {"parts": [{"text": text}]}}]})


@pytest.fixture()
def app():
    flask_app = create_app(TestingConfig)
    yield flask_app
    disconnect(alias="default")


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def headers(client):
    r = client.post(
        "/api/auth/register",
        json={"name": "Tester", "email": "prov@test.com", "password": "password123", "role": "student"},
    )
    return {"Authorization": f"Bearer {r.get_json()['data']['access_token']}"}


@pytest.fixture()
def calls(monkeypatch):
    """Record every outgoing request; behaviour is set per test via .route."""
    class Recorder(list):
        route = {}

    recorded = Recorder()
    routes = recorded.route = {}

    def fake_post(url, headers=None, json=None, timeout=None):
        recorded.append({"url": url, "headers": headers, "json": json, "timeout": timeout})
        for fragment, handler in routes.items():
            if fragment in url:
                return handler()
        raise AssertionError(f"unexpected URL {url}")

    monkeypatch.setattr("app.ai.providers.requests.post", fake_post)
    return recorded


def recommend(client, headers, title="Software Engineer"):
    return client.post("/api/ai/recommend-skills", json={"job_title": title}, headers=headers)


def test_no_keys_means_curated_fallback(client, headers, calls):
    data = recommend(client, headers).get_json()["data"]
    assert data["generated_by_ai"] is False
    assert data["provider"] == "curated"
    assert calls == []  # nothing was called


def test_anthropic_request_and_parsing(app, client, headers, calls):
    app.config["ANTHROPIC_API_KEY"] = "sk-ant-test"
    calls.route["anthropic.com"] = lambda: anthropic_reply(GOOD_JSON)
    data = recommend(client, headers).get_json()["data"]
    assert data["provider"] == "anthropic" and data["generated_by_ai"] is True
    assert [s["name"] for s in data["recommended_skills"]] == ["Python", "SQL"]
    req = calls[0]
    assert req["url"] == "https://api.anthropic.com/v1/messages"
    assert req["headers"]["x-api-key"] == "sk-ant-test"
    assert req["json"]["system"] and req["json"]["messages"][0]["role"] == "user"


def test_openai_request_and_parsing(app, client, headers, calls):
    app.config["AI_PROVIDER_ORDER"] = "openai"
    app.config["OPENAI_API_KEY"] = "sk-openai-test"
    calls.route["api.openai.com"] = lambda: openai_reply(GOOD_JSON)
    data = recommend(client, headers).get_json()["data"]
    assert data["provider"] == "openai"
    req = calls[0]
    assert req["url"] == "https://api.openai.com/v1/chat/completions"
    assert req["headers"]["Authorization"] == "Bearer sk-openai-test"
    assert req["json"]["messages"][0]["role"] == "system"
    assert req["json"]["response_format"] == {"type": "json_object"}


def test_gemini_request_and_parsing(app, client, headers, calls):
    app.config["AI_PROVIDER_ORDER"] = "gemini"
    app.config["GEMINI_API_KEY"] = "gem-test"
    calls.route["generativelanguage.googleapis.com"] = lambda: gemini_reply(GOOD_JSON)
    data = recommend(client, headers).get_json()["data"]
    assert data["provider"] == "gemini"
    req = calls[0]
    assert req["url"].endswith(f"/models/{app.config['GEMINI_MODEL']}:generateContent")
    assert req["headers"]["x-goog-api-key"] == "gem-test"
    assert req["json"]["systemInstruction"]["parts"][0]["text"]


def test_groq_uses_openai_compatible_endpoint(app, client, headers, calls):
    app.config["AI_PROVIDER_ORDER"] = "groq"
    app.config["GROQ_API_KEY"] = "gsk-test"
    calls.route["api.groq.com"] = lambda: openai_reply(GOOD_JSON)
    data = recommend(client, headers).get_json()["data"]
    assert data["provider"] == "groq"
    assert calls[0]["url"] == "https://api.groq.com/openai/v1/chat/completions"
    assert calls[0]["headers"]["Authorization"] == "Bearer gsk-test"


def test_failover_to_next_provider_on_error(app, client, headers, calls):
    app.config["ANTHROPIC_API_KEY"] = "a"
    app.config["OPENAI_API_KEY"] = "o"

    def boom():
        raise requests.ConnectionError("network down")

    calls.route["anthropic.com"] = boom
    calls.route["api.openai.com"] = lambda: openai_reply(GOOD_JSON)
    data = recommend(client, headers).get_json()["data"]
    assert data["provider"] == "openai"
    assert [c["url"].split("/")[2] for c in calls] == ["api.anthropic.com", "api.openai.com"]


def test_failover_on_http_error_status(app, client, headers, calls):
    app.config["ANTHROPIC_API_KEY"] = "bad-key"
    app.config["GEMINI_API_KEY"] = "g"
    calls.route["anthropic.com"] = lambda: FakeResponse({}, status=401)
    calls.route["generativelanguage"] = lambda: gemini_reply(GOOD_JSON)
    assert recommend(client, headers).get_json()["data"]["provider"] == "gemini"


def test_unusable_answer_falls_through_to_next_provider(app, client, headers, calls):
    app.config["ANTHROPIC_API_KEY"] = "a"
    app.config["GROQ_API_KEY"] = "g"
    calls.route["anthropic.com"] = lambda: anthropic_reply("Sorry, I can't help with that.")
    calls.route["api.groq.com"] = lambda: openai_reply(GOOD_JSON)
    assert recommend(client, headers).get_json()["data"]["provider"] == "groq"


def test_all_providers_failing_uses_curated_fallback(app, client, headers, calls):
    app.config["ANTHROPIC_API_KEY"] = "a"
    app.config["OPENAI_API_KEY"] = "o"
    calls.route["anthropic.com"] = lambda: FakeResponse({}, status=500)
    calls.route["api.openai.com"] = lambda: openai_reply("not json at all")
    r = recommend(client, headers)
    assert r.status_code == 201
    data = r.get_json()["data"]
    assert data["provider"] == "curated" and data["generated_by_ai"] is False
    assert any(s["name"] == "Python" for s in data["recommended_skills"])


def test_provider_order_is_respected(app, client, headers, calls):
    app.config["AI_PROVIDER_ORDER"] = "groq,anthropic"
    app.config["ANTHROPIC_API_KEY"] = "a"
    app.config["GROQ_API_KEY"] = "g"
    calls.route["api.groq.com"] = lambda: openai_reply(GOOD_JSON)
    calls.route["anthropic.com"] = lambda: anthropic_reply(GOOD_JSON)
    assert recommend(client, headers).get_json()["data"]["provider"] == "groq"
    assert len(calls) == 1  # first success stops the chain


def test_json_wrapped_in_code_fence_and_prose_is_parsed(app, client, headers, calls):
    app.config["ANTHROPIC_API_KEY"] = "a"
    wrapped = "Here you go:\n```json\n" + GOOD_JSON + "\n```\nHope that helps!"
    calls.route["anthropic.com"] = lambda: anthropic_reply(wrapped)
    assert recommend(client, headers).get_json()["data"]["provider"] == "anthropic"


def test_invalid_priority_is_normalised(app, client, headers, calls):
    app.config["ANTHROPIC_API_KEY"] = "a"
    odd = json.dumps({"summary": "x", "skills": [{"name": "Go", "priority": "URGENT"}]})
    calls.route["anthropic.com"] = lambda: anthropic_reply(odd)
    skills = recommend(client, headers).get_json()["data"]["recommended_skills"]
    assert skills[0]["priority"] == "medium" and skills[0]["category"] == "Other"


def test_providers_endpoint_reports_status_without_leaking_keys(app, client, headers):
    app.config["OPENAI_API_KEY"] = "sk-super-secret"
    r = client.get("/api/ai/providers", headers=headers)
    assert r.status_code == 200
    assert "sk-super-secret" not in r.get_data(as_text=True)
    by_name = {p["name"]: p for p in r.get_json()["data"]["providers"]}
    assert by_name["openai"]["configured"] is True
    assert by_name["anthropic"]["configured"] is False
    assert set(by_name) == {"anthropic", "openai", "gemini", "groq"}


def test_providers_endpoint_requires_auth(client):
    assert client.get("/api/ai/providers").status_code == 401


def test_history_records_which_provider_answered(app, client, headers, calls):
    app.config["GEMINI_API_KEY"] = "g"
    calls.route["generativelanguage"] = lambda: gemini_reply(GOOD_JSON)
    recommend(client, headers, "Data Analyst")
    history = client.get("/api/ai/recommendations", headers=headers).get_json()["data"]
    assert history[0]["provider"] == "gemini"
