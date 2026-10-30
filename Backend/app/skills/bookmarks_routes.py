from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.skills.bookmarks_service import BookmarkService
from app.common.responses import success_response, paginated_meta
from app.common.decorators import get_pagination_params
from app.models.user import User

bookmarks_bp = Blueprint("bookmarks", __name__, url_prefix="/api/bookmarks")
service = BookmarkService()


@bookmarks_bp.route("/<skill_id>", methods=["POST"])
@jwt_required()
def add_bookmark(skill_id):
    """
    Bookmark a skill for later.
    ---
    tags: [Bookmarks]
    """
    user = User.objects(id=get_jwt_identity()).first()
    bookmark = service.add_bookmark(user, skill_id)
    return success_response("Skill bookmarked", data=bookmark.to_dict(), status_code=201)


@bookmarks_bp.route("/<skill_id>", methods=["DELETE"])
@jwt_required()
def remove_bookmark(skill_id):
    """
    Remove a bookmarked skill.
    ---
    tags: [Bookmarks]
    """
    user = User.objects(id=get_jwt_identity()).first()
    service.remove_bookmark(user, skill_id)
    return success_response("Bookmark removed")


@bookmarks_bp.route("", methods=["GET"])
@jwt_required()
def list_bookmarks():
    """
    List the current user's bookmarked skills.
    ---
    tags: [Bookmarks]
    """
    user = User.objects(id=get_jwt_identity()).first()
    params = get_pagination_params()
    items, total = service.list_bookmarks(user, params["page"], params["per_page"])
    return success_response(
        "Bookmarks fetched", data=items,
        meta=paginated_meta(params["page"], params["per_page"], total),
    )
