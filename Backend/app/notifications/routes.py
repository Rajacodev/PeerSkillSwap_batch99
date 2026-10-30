from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.notifications.service import NotificationService
from app.common.responses import success_response, paginated_meta
from app.common.decorators import get_pagination_params
from app.models.user import User

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")
service = NotificationService()


@notifications_bp.route("", methods=["GET"])
@jwt_required()
def list_notifications():
    """
    List the current user's notifications (paginated). Supports ?unread_only=true.
    ---
    tags: [Notifications]
    """
    user = User.objects(id=get_jwt_identity()).first()
    params = get_pagination_params()
    unread_only = request.args.get("unread_only", "false").lower() == "true"
    items, total = service.list_notifications(
        user, params["page"], params["per_page"], unread_only
    )
    return success_response(
        "Notifications fetched",
        data=items,
        meta=paginated_meta(params["page"], params["per_page"], total),
    )


@notifications_bp.route("/unread-count", methods=["GET"])
@jwt_required()
def unread_count():
    """
    Get the count of unread notifications.
    ---
    tags: [Notifications]
    """
    user = User.objects(id=get_jwt_identity()).first()
    count = service.unread_count(user)
    return success_response("Unread count fetched", data={"unread_count": count})


@notifications_bp.route("/<notification_id>/read", methods=["PATCH"])
@jwt_required()
def mark_read(notification_id):
    """
    Mark a single notification as read.
    ---
    tags: [Notifications]
    """
    user = User.objects(id=get_jwt_identity()).first()
    notification = service.mark_read(user, notification_id)
    return success_response("Notification marked as read", data=notification.to_dict())


@notifications_bp.route("/read-all", methods=["PATCH"])
@jwt_required()
def mark_all_read():
    """
    Mark all notifications as read.
    ---
    tags: [Notifications]
    """
    user = User.objects(id=get_jwt_identity()).first()
    service.mark_all_read(user)
    return success_response("All notifications marked as read")
