"""
Dashboard routes: user dashboard, admin analytics, leaderboard, achievements.
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.dashboard.service import DashboardService
from app.common.responses import success_response
from app.common.decorators import roles_required
from app.models.user import User

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")
service = DashboardService()


@dashboard_bp.route("/me", methods=["GET"])
@jwt_required()
def my_dashboard():
    """
    Get the current user's dashboard: stats + wallet summary.
    ---
    tags: [Dashboard]
    """
    user = User.objects(id=get_jwt_identity()).first()
    return success_response("Dashboard fetched", data=service.get_user_dashboard(user))


@dashboard_bp.route("/admin", methods=["GET"])
@roles_required("admin")
def admin_dashboard():
    """
    Get platform-wide analytics for admins.
    ---
    tags: [Dashboard, Admin]
    """
    return success_response("Admin dashboard fetched", data=service.get_admin_dashboard())


@dashboard_bp.route("/leaderboard", methods=["GET"])
def leaderboard():
    """
    Get the top mentors/students leaderboard.
    ---
    tags: [Dashboard]
    """
    limit = int(request.args.get("limit", 50))
    refresh = request.args.get("refresh", "false").lower() == "true"
    return success_response(
        "Leaderboard fetched", data=service.get_leaderboard(limit, refresh)
    )


@dashboard_bp.route("/achievements", methods=["GET"])
@jwt_required()
def my_achievements():
    """
    Get the current user's earned achievement badges.
    ---
    tags: [Dashboard]
    """
    user = User.objects(id=get_jwt_identity()).first()
    return success_response("Achievements fetched", data=service.get_achievements(user))
