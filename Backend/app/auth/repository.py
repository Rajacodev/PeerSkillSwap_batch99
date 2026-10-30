"""
Data access layer for authentication. Talks directly to MongoEngine models.
"""
import datetime
from app.models.user import User


class AuthRepository:
    @staticmethod
    def get_by_email(email):
        return User.objects(email=email.lower()).first()

    @staticmethod
    def get_by_id(user_id):
        return User.objects(id=user_id).first()

    @staticmethod
    def create_user(name, email, password_hash, role):
        user = User(
            name=name,
            email=email.lower(),
            password_hash=password_hash,
            role=role,
        )
        user.save()
        return user

    @staticmethod
    def set_reset_token(user, token, expires_at):
        user.reset_token = token
        user.reset_token_expires = expires_at
        user.updated_at = datetime.datetime.utcnow()
        user.save()
        return user

    @staticmethod
    def update_password(user, password_hash):
        user.password_hash = password_hash
        user.reset_token = None
        user.reset_token_expires = None
        user.updated_at = datetime.datetime.utcnow()
        user.save()
        return user
