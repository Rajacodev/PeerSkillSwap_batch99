"""
Admin routes: user management, skill moderation, booking oversight.
All routes require the 'admin' role.
"""
from flask import Blueprint, request

from app.admin.service import AdminService
from app.admin.schema import SetActiveStatusSchema, SetSkillActiveSchema
from app.admin.validator import validate_payload
from app.common.responses import success_response, paginated_meta
from app.common.decorators import roles_required, get_pagination_params

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")
service = AdminService()


@admin_bp.route("/users", methods=["GET"])
@roles_required("admin")
def list_users():
    """
    List all users (paginated, searchable, filterable by role).
    ---
    tags: [Admin]
    """
    params = get_pagination_params()
    role = request.args.get("role")
    items, total = service.list_users(params["page"], params["per_page"], params["search"], role)
    return success_response(
        "Users fetched", data=items,
        meta=paginated_meta(params["page"], params["per_page"], total),
    )


@admin_bp.route("/users/<user_id>/active-status", methods=["PATCH"])
@roles_required("admin")
def set_user_active(user_id):
    """
    Activate or deactivate a user account.
    ---
    tags: [Admin]
    """
    data = validate_payload(SetActiveStatusSchema(), request.get_json(force=True) or {})
    user = service.set_user_active(user_id, data["is_active"])
    return success_response("User status updated", data=user.to_public_dict())


@admin_bp.route("/skills", methods=["GET"])
@roles_required("admin")
def list_skills():
    """
    List all skills (paginated, searchable) for moderation.
    ---
    tags: [Admin]
    """
    params = get_pagination_params()
    items, total = service.list_skills(params["page"], params["per_page"], params["search"])
    return success_response(
        "Skills fetched", data=items,
        meta=paginated_meta(params["page"], params["per_page"], total),
    )


@admin_bp.route("/skills/<skill_id>/active-status", methods=["PATCH"])
@roles_required("admin")
def set_skill_active(skill_id):
    """
    Activate or deactivate (moderate) a skill listing.
    ---
    tags: [Admin]
    """
    data = validate_payload(SetSkillActiveSchema(), request.get_json(force=True) or {})
    skill = service.set_skill_active(skill_id, data["is_active"])
    return success_response("Skill status updated", data=skill.to_dict())


@admin_bp.route("/bookings", methods=["GET"])
@roles_required("admin")
def list_bookings():
    """
    List all bookings on the platform (paginated, filterable by status).
    ---
    tags: [Admin]
    """
    params = get_pagination_params()
    status = request.args.get("status")
    items, total = service.list_bookings(params["page"], params["per_page"], status)
    return success_response(
        "Bookings fetched", data=items,
        meta=paginated_meta(params["page"], params["per_page"], total),
    )
