"""
Authentication routes: register, login, logout, refresh, forgot/reset password.
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from app.auth.schema import (
    RegisterSchema,
    LoginSchema,
    ForgotPasswordSchema,
    ResetPasswordSchema,
)
from app.auth.validator import validate_payload
from app.auth.service import AuthService
from app.common.responses import success_response

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
service = AuthService()

# In-memory blocklist for logged-out tokens (JTI). For production scale this
# should live in Redis; kept simple here for a self-contained project.
BLOCKLIST = set()


@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Register a new user.
    ---
    tags: [Auth]
    """
    data = validate_payload(RegisterSchema(), request.get_json(force=True) or {})
    user, access_token, refresh_token = service.register(
        data["name"], data["email"], data["password"], data.get("role", "student")
    )
    return success_response(
        "Registration successful",
        data={
            "user": user.to_public_dict(),
            "access_token": access_token,
            "refresh_token": refresh_token,
        },
        status_code=201,
    )


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Log in an existing user.
    ---
    tags: [Auth]
    """
    data = validate_payload(LoginSchema(), request.get_json(force=True) or {})
    user, access_token, refresh_token = service.login(data["email"], data["password"])
    return success_response(
        "Login successful",
        data={
            "user": user.to_public_dict(),
            "access_token": access_token,
            "refresh_token": refresh_token,
        },
    )


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """
    Exchange a valid refresh token for a new access token.
    ---
    tags: [Auth]
    """
    user_id = get_jwt_identity()
    access_token = service.refresh(user_id)
    return success_response("Token refreshed", data={"access_token": access_token})


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """
    Log out the current user by blocklisting the current access token's JTI.
    ---
    tags: [Auth]
    """
    jti = get_jwt()["jti"]
    BLOCKLIST.add(jti)
    return success_response("Logout successful")


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """
    Request a password reset token (mock email).
    ---
    tags: [Auth]
    """
    data = validate_payload(ForgotPasswordSchema(), request.get_json(force=True) or {})
    service.forgot_password(data["email"])
    return success_response(
        "If an account with that email exists, a reset link has been sent"
    )


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """
    Reset password using the token issued via forgot-password.
    ---
    tags: [Auth]
    """
    data = validate_payload(ResetPasswordSchema(), request.get_json(force=True) or {})
    service.reset_password(data["email"], data["reset_token"], data["new_password"])
    return success_response("Password has been reset successfully")
