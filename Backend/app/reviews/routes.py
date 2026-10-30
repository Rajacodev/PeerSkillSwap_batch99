from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.reviews.service import ReviewService
from app.reviews.schema import CreateReviewSchema
from app.reviews.validator import validate_payload
from app.common.responses import success_response, paginated_meta
from app.common.decorators import get_pagination_params
from app.common.exceptions import NotFoundError
from app.models.user import User
from app.models.skill import Skill

reviews_bp = Blueprint("reviews", __name__, url_prefix="/api/reviews")
service = ReviewService()


@reviews_bp.route("", methods=["POST"])
@jwt_required()
def create_review():
    """
    Leave a review for a completed booking.
    ---
    tags: [Reviews]
    """
    data = validate_payload(CreateReviewSchema(), request.get_json(force=True) or {})
    reviewer = User.objects(id=get_jwt_identity()).first()
    review = service.create_review(reviewer, data["booking_id"], data["rating"], data["comment"])
    return success_response("Review submitted", data=review.to_dict(), status_code=201)


@reviews_bp.route("/mentor/<mentor_id>", methods=["GET"])
def list_reviews_for_mentor(mentor_id):
    """
    List all reviews for a given mentor.
    ---
    tags: [Reviews]
    """
    mentor = User.objects(id=mentor_id).first()
    if not mentor:
        raise NotFoundError("Mentor not found")
    params = get_pagination_params()
    items, total = service.list_for_mentor(mentor, params["page"], params["per_page"])
    return success_response(
        "Reviews fetched", data=items,
        meta=paginated_meta(params["page"], params["per_page"], total),
    )


@reviews_bp.route("/skill/<skill_id>", methods=["GET"])
def list_reviews_for_skill(skill_id):
    """
    List all reviews for a given skill.
    ---
    tags: [Reviews]
    """
    skill = Skill.objects(id=skill_id).first()
    if not skill:
        raise NotFoundError("Skill not found")
    params = get_pagination_params()
    items, total = service.list_for_skill(skill, params["page"], params["per_page"])
    return success_response(
        "Reviews fetched", data=items,
        meta=paginated_meta(params["page"], params["per_page"], total),
    )
