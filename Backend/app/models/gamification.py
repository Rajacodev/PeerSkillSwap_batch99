"""
Leaderboard and Achievement document models.

Leaderboard entries are derived/cached snapshots per user (recomputed by the
dashboard service) rather than a running ledger, which keeps ranking queries
cheap. Achievements are unlocked badges tied to milestones.
"""
import datetime
from mongoengine import Document, ReferenceField, IntField, StringField, DateTimeField, CASCADE
from app.models.user import User


class LeaderboardEntry(Document):
    user = ReferenceField(User, required=True, unique=True, reverse_delete_rule=CASCADE)
    sessions_taught = IntField(default=0)
    sessions_learned = IntField(default=0)
    total_credits_earned = IntField(default=0)
    rating_average = IntField(default=0)  # x10
    score = IntField(default=0)  # composite ranking score
    updated_at = DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        "collection": "leaderboard",
        "indexes": ["-score"],
        "ordering": ["-score"],
    }

    def to_dict(self):
        return {
            "user": self.user.to_public_dict() if self.user else None,
            "sessions_taught": self.sessions_taught,
            "sessions_learned": self.sessions_learned,
            "total_credits_earned": self.total_credits_earned,
            "rating_average": self.rating_average / 10 if self.rating_average else 0,
            "score": self.score,
        }


class Achievement(Document):
    CODE_CHOICES = (
        "FIRST_SESSION_TAUGHT",
        "FIRST_SESSION_LEARNED",
        "FIVE_SESSIONS_TAUGHT",
        "TEN_SESSIONS_TAUGHT",
        "TOP_RATED_MENTOR",
        "FIRST_REVIEW",
        "SKILL_CREATOR",
    )

    user = ReferenceField(User, required=True, reverse_delete_rule=CASCADE)
    code = StringField(choices=CODE_CHOICES, required=True)
    title = StringField(required=True)
    description = StringField(default="")
    earned_at = DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        "collection": "achievements",
        "indexes": [{"fields": ["user", "code"], "unique": True}],
        "ordering": ["-earned_at"],
    }

    def to_dict(self):
        return {
            "id": str(self.id),
            "code": self.code,
            "title": self.title,
            "description": self.description,
            "earned_at": self.earned_at.isoformat() if self.earned_at else None,
        }
