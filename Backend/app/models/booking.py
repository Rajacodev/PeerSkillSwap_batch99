"""
Booking document model - a session request between a student and a mentor
for a specific skill.
"""
import datetime
from mongoengine import (
    Document,
    ReferenceField,
    StringField,
    DateTimeField,
    IntField,
    CASCADE,
)
from app.models.user import User
from app.models.skill import Skill


class Booking(Document):
    STATUS_CHOICES = ("pending", "accepted", "rejected", "completed", "cancelled")

    skill = ReferenceField(Skill, required=True, reverse_delete_rule=CASCADE)
    student = ReferenceField(User, required=True, reverse_delete_rule=CASCADE)
    mentor = ReferenceField(User, required=True, reverse_delete_rule=CASCADE)
    status = StringField(choices=STATUS_CHOICES, default="pending")
    credits_charged = IntField(default=0)
    scheduled_at = DateTimeField(required=True)
    notes = StringField(default="", max_length=1000)
    meeting_link = StringField(default="", max_length=500)
    cancellation_reason = StringField(default="")
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    updated_at = DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        "collection": "bookings",
        "indexes": ["student", "mentor", "status", "skill"],
        "ordering": ["-created_at"],
    }

    def to_dict(self):
        return {
            "id": str(self.id),
            "skill": self.skill.to_dict() if self.skill else None,
            "student": self.student.to_public_dict() if self.student else None,
            "mentor": self.mentor.to_public_dict() if self.mentor else None,
            "status": self.status,
            "credits_charged": self.credits_charged,
            "scheduled_at": self.scheduled_at.isoformat() if self.scheduled_at else None,
            "notes": self.notes,
            "meeting_link": self.meeting_link,
            "cancellation_reason": self.cancellation_reason,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
