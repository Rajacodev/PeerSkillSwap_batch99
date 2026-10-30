"""
User profile routes.
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.users.service import UserService
from app.users.schema import UpdateProfileSchema, ChangePasswordSchema
from app.users.validator import validate_payload
from app.common.responses import success_response, paginated_meta
from app.common.decorators import get_pagination_params

users_bp = Blueprint("users", __name__, url_prefix="/api/users")
service = UserService()


@users_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    """
    Get the current authenticated user's profile.
    ---
    tags: [Users]
    """
    user = service.get_profile(get_jwt_identity())
    return success_response("Profile fetched", data=user.to_public_dict())


@users_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_me():
    """
    Update the current user's profile (name, bio, skills offered/wanted).
    ---
    tags: [Users]
    """
    data = validate_payload(
        UpdateProfileSchema(), request.get_json(force=True) or {}, partial=True
    )
    user = service.update_profile(get_jwt_identity(), data)
    return success_response("Profile updated", data=user.to_public_dict())


@users_bp.route("/me/profile-picture", methods=["POST"])
@jwt_required()
def upload_profile_picture():
    """
    Upload/replace the current user's profile picture.
    ---
    tags: [Users]
    consumes:
      - multipart/form-data
    """
    file_storage = request.files.get("file")
    user = service.upload_profile_picture(get_jwt_identity(), file_storage)
    return success_response("Profile picture updated", data=user.to_public_dict())


@users_bp.route("/me/change-password", methods=["POST"])
@jwt_required()
def change_password():
    """
    Change the current user's password.
    ---
    tags: [Users]
    """
    data = validate_payload(ChangePasswordSchema(), request.get_json(force=True) or {})
    service.change_password(get_jwt_identity(), data["current_password"], data["new_password"])
    return success_response("Password changed successfully")


@users_bp.route("/mentors", methods=["GET"])
def list_mentors():
    """
    List all mentors (public), paginated and searchable.
    ---
    tags: [Users]
    """
    params = get_pagination_params()
    items, total = service.list_mentors(params["page"], params["per_page"], params["search"])
    return success_response(
        "Mentors fetched",
        data=items,
        meta=paginated_meta(params["page"], params["per_page"], total),
    )


@users_bp.route("/<user_id>", methods=["GET"])
def get_public_profile(user_id):
    """
    Get a user's public profile by id.
    ---
    tags: [Users]
    """
    user = service.get_public_profile(user_id)
    return success_response("Profile fetched", data=user.to_public_dict())
