"""
Notification document model.
"""
import datetime
from mongoengine import Document, ReferenceField, StringField, BooleanField, DateTimeField, CASCADE
from app.models.user import User


class Notification(Document):
    TYPE_CHOICES = (
        "booking_request",
        "booking_accepted",
        "booking_rejected",
        "booking_completed",
        "booking_cancelled",
        "new_review",
        "credit_earned",
        "credit_spent",
        "achievement_unlocked",
        "system",
    )

    user = ReferenceField(User, required=True, reverse_delete_rule=CASCADE)
    type = StringField(choices=TYPE_CHOICES, required=True)
    title = StringField(required=True, max_length=150)
    message = StringField(required=True, max_length=500)
    is_read = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        "collection": "notifications",
        "indexes": ["user", "is_read", "-created_at"],
        "ordering": ["-created_at"],
    }

    def to_dict(self):
        return {
            "id": str(self.id),
            "type": self.type,
            "title": self.title,
            "message": self.message,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
