"""
CareerRecommendation document model — stores the result of an AI (or
fallback rule-based) "what skills do I need for job X" query, so users can
revisit their recommendation history.
"""
import datetime
from mongoengine import (
    Document,
    ReferenceField,
    StringField,
    ListField,
    DictField,
    BooleanField,
    DateTimeField,
    CASCADE,
)
from app.models.user import User


class CareerRecommendation(Document):
    user = ReferenceField(User, required=True, reverse_delete_rule=CASCADE)
    job_title = StringField(required=True, max_length=150)
    summary = StringField(default="", max_length=2000)
    recommended_skills = ListField(DictField(), default=list)
    generated_by_ai = BooleanField(default=False)
    provider = StringField(default="curated", max_length=30)
    created_at = DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        "collection": "career_recommendations",
        "indexes": ["user", "-created_at"],
        "ordering": ["-created_at"],
    }

    def to_dict(self):
        return {
            "id": str(self.id),
            "job_title": self.job_title,
            "summary": self.summary,
            "recommended_skills": self.recommended_skills,
            "generated_by_ai": self.generated_by_ai,
            "provider": self.provider,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
