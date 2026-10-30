from app.models.career_recommendation import CareerRecommendation


class CareerRecommendationRepository:
    @staticmethod
    def create(user, job_title, summary, recommended_skills, generated_by_ai, provider="curated"):
        rec = CareerRecommendation(
            user=user,
            job_title=job_title,
            summary=summary,
            recommended_skills=recommended_skills,
            generated_by_ai=generated_by_ai,
            provider=provider,
        )
        rec.save()
        return rec

    @staticmethod
    def list_for_user(user, page, per_page):
        qs = CareerRecommendation.objects(user=user).order_by("-created_at")
        total = qs.count()
        items = qs.skip((page - 1) * per_page).limit(per_page)
        return items, total
