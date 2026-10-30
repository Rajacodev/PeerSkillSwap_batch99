"""
Review document model - a rating/comment left by a student for a mentor
after a completed booking.
"""
import datetime
from mongoengine import (
    Document,
    ReferenceField,
    StringField,
    IntField,
    DateTimeField,
    CASCADE,
)
from app.models.user import User
from app.models.skill import Skill
from app.models.booking import Booking


class Review(Document):
    booking = ReferenceField(Booking, required=True, unique=True, reverse_delete_rule=CASCADE)
    skill = ReferenceField(Skill, required=True, reverse_delete_rule=CASCADE)
    reviewer = ReferenceField(User, required=True, reverse_delete_rule=CASCADE)
    mentor = ReferenceField(User, required=True, reverse_delete_rule=CASCADE)
    rating = IntField(required=True, min_value=1, max_value=5)
    comment = StringField(default="", max_length=1000)
    created_at = DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        "collection": "reviews",
        "indexes": ["mentor", "skill", "booking"],
        "ordering": ["-created_at"],
    }

    def to_dict(self):
        return {
            "id": str(self.id),
            "booking_id": str(self.booking.id) if self.booking else None,
            "skill_id": str(self.skill.id) if self.skill else None,
            "reviewer": self.reviewer.to_public_dict() if self.reviewer else None,
            "mentor_id": str(self.mentor.id) if self.mentor else None,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
