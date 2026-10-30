"""
User document model.
"""
import datetime
from mongoengine import (
    Document,
    StringField,
    EmailField,
    BooleanField,
    DateTimeField,
    ListField,
    IntField,
    URLField,
)


class User(Document):
    ROLE_CHOICES = ("student", "mentor", "admin")

    name = StringField(required=True, max_length=120)
    email = EmailField(required=True, unique=True)
    password_hash = StringField(required=True)
    role = StringField(choices=ROLE_CHOICES, default="student")
    bio = StringField(default="", max_length=1000)
    profile_picture = StringField(default="")
    skills_offered = ListField(StringField(), default=list)
    skills_wanted = ListField(StringField(), default=list)
    is_active = BooleanField(default=True)
    reset_token = StringField(default=None)
    reset_token_expires = DateTimeField(default=None)
    total_sessions_taught = IntField(default=0)
    total_sessions_learned = IntField(default=0)
    rating_average = IntField(default=0)  # stored as x10 int for simplicity, e.g. 45 = 4.5
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    updated_at = DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        "collection": "users",
        "indexes": ["email", "role"],
        "ordering": ["-created_at"],
    }

    def to_public_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "bio": self.bio,
            "profile_picture": self.profile_picture,
            "skills_offered": self.skills_offered,
            "skills_wanted": self.skills_wanted,
            "is_active": self.is_active,
            "total_sessions_taught": self.total_sessions_taught,
            "total_sessions_learned": self.total_sessions_learned,
            "rating_average": self.rating_average / 10 if self.rating_average else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
