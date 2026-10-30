from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.ai.service import AIRecommendationService
from app.ai.schema import RecommendSkillsSchema
from app.ai.validator import validate_payload
from app.common.responses import success_response, paginated_meta
from app.common.decorators import get_pagination_params
from app.models.user import User

ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")
service = AIRecommendationService()


@ai_bp.route("/recommend-skills", methods=["POST"])
@jwt_required()
def recommend_skills():
    """
    Get AI-powered (or curated fallback) skill recommendations for a target
    job title, cross-referenced against skills available to book on the platform.
    ---
    tags: [AI]
    """
    data = validate_payload(RecommendSkillsSchema(), request.get_json(force=True) or {})
    user = User.objects(id=get_jwt_identity()).first()
    result = service.recommend(user, data["job_title"])
    return success_response("Recommendations generated", data=result, status_code=201)


@ai_bp.route("/recommendations", methods=["GET"])
@jwt_required()
def get_recommendation_history():
    """
    Get the current user's past career recommendation queries.
    ---
    tags: [AI]
    """
    user = User.objects(id=get_jwt_identity()).first()
    params = get_pagination_params()
    items, total = service.get_history(user, params["page"], params["per_page"])
    return success_response(
        "Recommendation history fetched",
        data=items,
        meta=paginated_meta(params["page"], params["per_page"], total),
    )


@ai_bp.route("/providers", methods=["GET"])
@jwt_required()
def get_providers():
    """
    List the AI providers the career advisor can use, whether each is
    configured, and the order they're tried in. API keys are never returned.
    ---
    tags: [AI]
    """
    return success_response(
        "AI providers fetched",
        data={"providers": service.provider_status(), "fallback": "curated dataset"},
    )
