"""
Skill document model - represents a skill a mentor offers to teach.
"""
import datetime
from mongoengine import (
    Document,
    StringField,
    ReferenceField,
    IntField,
    DateTimeField,
    ListField,
    BooleanField,
    CASCADE,
)
from app.models.user import User


class Skill(Document):
    CATEGORY_CHOICES = (
        "Technology",
        "Music",
        "Art",
        "Language",
        "Business",
        "Fitness",
        "Cooking",
        "Academics",
        "Other",
    )

    title = StringField(required=True, max_length=150)
    description = StringField(required=True, max_length=2000)
    category = StringField(choices=CATEGORY_CHOICES, default="Other")
    tags = ListField(StringField(), default=list)
    mentor = ReferenceField(User, required=True, reverse_delete_rule=CASCADE)
    credits_per_session = IntField(default=1, min_value=1)
    duration_minutes = IntField(default=60)
    is_active = BooleanField(default=True)
    total_bookings = IntField(default=0)
    average_rating = IntField(default=0)  # x10
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    updated_at = DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        "collection": "skills",
        "indexes": ["title", "category", "mentor", "-total_bookings"],
        "ordering": ["-created_at"],
    }

    def to_dict(self):
        return {
            "id": str(self.id),
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "tags": self.tags,
            "mentor": self.mentor.to_public_dict() if self.mentor else None,
            "credits_per_session": self.credits_per_session,
            "duration_minutes": self.duration_minutes,
            "is_active": self.is_active,
            "total_bookings": self.total_bookings,
            "average_rating": self.average_rating / 10 if self.average_rating else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
