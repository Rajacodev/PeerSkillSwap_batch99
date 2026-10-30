"""
Standard API response helpers so every endpoint returns a consistent shape:
{
    "success": bool,
    "message": str,
    "data": any,
    "errors": any,
    "meta": {...}  # optional, used for pagination
}
"""
from flask import jsonify


def success_response(message="Success", data=None, status_code=200, meta=None):
    payload = {"success": True, "message": message, "data": data, "errors": None}
    if meta is not None:
        payload["meta"] = meta
    return jsonify(payload), status_code


def error_response(message="Something went wrong", errors=None, status_code=400):
    payload = {"success": False, "message": message, "data": None, "errors": errors}
    return jsonify(payload), status_code


def paginated_meta(page, per_page, total):
    return {
        "page": page,
        "per_page": per_page,
        "total": total,
        "total_pages": (total + per_page - 1) // per_page if per_page else 0,
    }
