"""
Reusable decorators: role-based authorization and pagination arg parsing.
"""
from functools import wraps
from flask import request
from flask_jwt_extended import verify_jwt_in_request, get_jwt

from app.common.exceptions import ForbiddenError


def roles_required(*roles):
    """Restrict an endpoint to one or more roles (e.g. 'admin', 'mentor')."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get("role")
            if user_role not in roles:
                raise ForbiddenError(
                    f"This action requires one of the following roles: {', '.join(roles)}"
                )
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def get_pagination_params():
    """Parse page, per_page, sort_by, order, search from query string."""
    page = max(int(request.args.get("page", 1)), 1)
    per_page = min(max(int(request.args.get("per_page", 10)), 1), 100)
    sort_by = request.args.get("sort_by", "created_at")
    order = request.args.get("order", "desc")
    search = request.args.get("search", "").strip()
    return {
        "page": page,
        "per_page": per_page,
        "sort_by": sort_by,
        "order": order,
        "search": search,
    }
