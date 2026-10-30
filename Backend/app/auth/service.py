"""
Business logic for authentication: registration, login, token issuing,
forgot/reset password.
"""
import datetime
import secrets

from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token, decode_token

from app.extensions import bcrypt
from app.auth.repository import AuthRepository
from app.common.exceptions import ConflictError, UnauthorizedError, NotFoundError, ValidationError
from app.utils.email_mock import send_password_reset_email
from app.wallet.service import WalletService
from app.notifications.service import NotificationService


class AuthService:
    def __init__(self):
        self.repo = AuthRepository()
        self.wallet_service = WalletService()
        self.notification_service = NotificationService()

    def _issue_tokens(self, user):
        additional_claims = {"role": user.role, "email": user.email}
        access_token = create_access_token(
            identity=str(user.id), additional_claims=additional_claims
        )
        refresh_token = create_refresh_token(
            identity=str(user.id), additional_claims=additional_claims
        )
        return access_token, refresh_token

    def register(self, name, email, password, role):
        existing = self.repo.get_by_email(email)
        if existing:
            raise ConflictError("An account with this email already exists")

        password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
        user = self.repo.create_user(name, email, password_hash, role)

        # Set up wallet with signup bonus credits
        self.wallet_service.initialize_wallet(user)

        # Welcome notification
        self.notification_service.create_notification(
            user=user,
            type_="system",
            title="Welcome to PeerSkillSwap!",
            message=f"Hi {user.name}, your account has been created. You've received "
            f"{current_app.config['DEFAULT_SIGNUP_CREDITS']} free credits to start learning!",
        )

        access_token, refresh_token = self._issue_tokens(user)
        return user, access_token, refresh_token

    def login(self, email, password):
        user = self.repo.get_by_email(email)
        if not user or not bcrypt.check_password_hash(user.password_hash, password):
            raise UnauthorizedError("Invalid email or password")
        if not user.is_active:
            raise UnauthorizedError("This account has been deactivated")

        access_token, refresh_token = self._issue_tokens(user)
        return user, access_token, refresh_token

    def refresh(self, user_id):
        user = self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        access_token, _ = self._issue_tokens(user)
        return access_token

    def forgot_password(self, email):
        user = self.repo.get_by_email(email)
        if not user:
            # Do not reveal whether the email exists
            return True
        token = secrets.token_urlsafe(24)
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
        self.repo.set_reset_token(user, token, expires_at)
        send_password_reset_email(user.email, token)
        return True

    def reset_password(self, email, reset_token, new_password):
        user = self.repo.get_by_email(email)
        if not user or user.reset_token != reset_token:
            raise ValidationError("Invalid or expired reset token")
        if not user.reset_token_expires or user.reset_token_expires < datetime.datetime.utcnow():
            raise ValidationError("Reset token has expired")

        password_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
        self.repo.update_password(user, password_hash)
        return True
