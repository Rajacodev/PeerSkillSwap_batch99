"""
Skill routes: CRUD, search/filter/sort, trending, recommended, my-skills.
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.skills.service import SkillService
from app.skills.schema import CreateSkillSchema, UpdateSkillSchema
from app.skills.validator import validate_payload
from app.common.responses import success_response, paginated_meta
from app.common.decorators import roles_required, get_pagination_params
from app.models.user import User

skills_bp = Blueprint("skills", __name__, url_prefix="/api/skills")
service = SkillService()


@skills_bp.route("", methods=["POST"])
@roles_required("mentor", "admin")
def create_skill():
    """
    Create a new skill listing (mentor or admin only).
    ---
    tags: [Skills]
    """
    data = validate_payload(CreateSkillSchema(), request.get_json(force=True) or {})
    mentor = User.objects(id=get_jwt_identity()).first()
    skill = service.create_skill(mentor, data)
    return success_response("Skill created", data=skill.to_dict(), status_code=201)


@skills_bp.route("", methods=["GET"])
def search_skills():
    """
    Search/filter/sort/paginate active skills. Query params: search, category,
    sort_by (created_at|credits_per_session|total_bookings|average_rating|title),
    order (asc|desc), page, per_page.
    ---
    tags: [Skills]
    """
    params = get_pagination_params()
    category = request.args.get("category")
    items, total = service.search_skills(
        params["page"], params["per_page"], params["search"], category,
        params["sort_by"], params["order"],
    )
    return success_response(
        "Skills fetched",
        data=items,
        meta=paginated_meta(params["page"], params["per_page"], total),
    )


@skills_bp.route("/trending", methods=["GET"])
def trending_skills():
    """
    Get trending skills (most booked).
    ---
    tags: [Skills]
    """
    limit = int(request.args.get("limit", 10))
    return success_response("Trending skills fetched", data=service.trending_skills(limit))


@skills_bp.route("/recommended", methods=["GET"])
@jwt_required()
def recommended_skills():
    """
    Get skills recommended for the current user based on their wanted skills.
    ---
    tags: [Skills]
    """
    user = User.objects(id=get_jwt_identity()).first()
    limit = int(request.args.get("limit", 10))
    return success_response(
        "Recommended skills fetched", data=service.recommended_skills(user, limit)
    )


@skills_bp.route("/mine", methods=["GET"])
@roles_required("mentor", "admin")
def my_skills():
    """
    List skills created by the current mentor.
    ---
    tags: [Skills]
    """
    user = User.objects(id=get_jwt_identity()).first()
    params = get_pagination_params()
    items, total = service.list_my_skills(user, params["page"], params["per_page"])
    return success_response(
        "Your skills fetched",
        data=items,
        meta=paginated_meta(params["page"], params["per_page"], total),
    )


@skills_bp.route("/<skill_id>", methods=["GET"])
def get_skill(skill_id):
    """
    Get skill details by id.
    ---
    tags: [Skills]
    """
    skill = service.get_skill(skill_id)
    return success_response("Skill fetched", data=skill.to_dict())


@skills_bp.route("/<skill_id>", methods=["PUT"])
@jwt_required()
def update_skill(skill_id):
    """
    Update a skill (owner mentor or admin only).
    ---
    tags: [Skills]
    """
    data = validate_payload(
        UpdateSkillSchema(), request.get_json(force=True) or {}, partial=True
    )
    user = User.objects(id=get_jwt_identity()).first()
    skill = service.update_skill(skill_id, user, data)
    return success_response("Skill updated", data=skill.to_dict())


@skills_bp.route("/<skill_id>", methods=["DELETE"])
@jwt_required()
def delete_skill(skill_id):
    """
    Delete a skill (owner mentor or admin only).
    ---
    tags: [Skills]
    """
    user = User.objects(id=get_jwt_identity()).first()
    service.delete_skill(skill_id, user)
    return success_response("Skill deleted")
