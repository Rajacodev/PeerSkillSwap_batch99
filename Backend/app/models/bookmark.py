"""
Bookmark document model - lets a student save a skill for later.
"""
import datetime
from mongoengine import Document, ReferenceField, DateTimeField, CASCADE
from app.models.user import User
from app.models.skill import Skill


class Bookmark(Document):
    user = ReferenceField(User, required=True, reverse_delete_rule=CASCADE)
    skill = ReferenceField(Skill, required=True, reverse_delete_rule=CASCADE)
    created_at = DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        "collection": "bookmarks",
        "indexes": [{"fields": ["user", "skill"], "unique": True}],
        "ordering": ["-created_at"],
    }

    def to_dict(self):
        return {
            "id": str(self.id),
            "skill": self.skill.to_dict() if self.skill else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
