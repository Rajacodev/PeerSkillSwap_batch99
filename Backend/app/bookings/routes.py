"""
Booking routes: create, accept, reject, complete, cancel, list.
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.bookings.service import BookingService
from app.bookings.schema import (
    CreateBookingSchema,
    CancelBookingSchema,
    AcceptBookingSchema,
    UpdateMeetingLinkSchema,
)
from app.bookings.validator import validate_payload
from app.common.responses import success_response, paginated_meta
from app.common.decorators import get_pagination_params, roles_required
from app.models.user import User

bookings_bp = Blueprint("bookings", __name__, url_prefix="/api/bookings")
service = BookingService()


@bookings_bp.route("", methods=["POST"])
@jwt_required()
def create_booking():
    """
    Request a new booking (session) for a skill.
    ---
    tags: [Bookings]
    """
    data = validate_payload(CreateBookingSchema(), request.get_json(force=True) or {})
    student = User.objects(id=get_jwt_identity()).first()
    booking = service.create_booking(student, data["skill_id"], data["scheduled_at"], data["notes"])
    return success_response("Booking requested", data=booking.to_dict(), status_code=201)


@bookings_bp.route("/student", methods=["GET"])
@jwt_required()
def my_bookings_as_student():
    """
    List bookings the current user made as a student.
    ---
    tags: [Bookings]
    """
    user = User.objects(id=get_jwt_identity()).first()
    params = get_pagination_params()
    status = request.args.get("status")
    items, total = service.list_my_bookings_as_student(
        user, params["page"], params["per_page"], status
    )
    return success_response(
        "Bookings fetched", data=items,
        meta=paginated_meta(params["page"], params["per_page"], total),
    )


@bookings_bp.route("/mentor", methods=["GET"])
@roles_required("mentor", "admin")
def my_bookings_as_mentor():
    """
    List bookings the current user received as a mentor.
    ---
    tags: [Bookings]
    """
    user = User.objects(id=get_jwt_identity()).first()
    params = get_pagination_params()
    status = request.args.get("status")
    items, total = service.list_my_bookings_as_mentor(
        user, params["page"], params["per_page"], status
    )
    return success_response(
        "Bookings fetched", data=items,
        meta=paginated_meta(params["page"], params["per_page"], total),
    )


@bookings_bp.route("/<booking_id>", methods=["GET"])
@jwt_required()
def get_booking(booking_id):
    """
    Get details of a single booking (participants or admin only).
    ---
    tags: [Bookings]
    """
    user = User.objects(id=get_jwt_identity()).first()
    booking = service.get_booking(booking_id, user)
    return success_response("Booking fetched", data=booking.to_dict())


@bookings_bp.route("/<booking_id>/accept", methods=["PATCH"])
@roles_required("mentor", "admin")
def accept_booking(booking_id):
    """
    Mentor accepts a pending booking request. Optionally include a
    meeting_link (e.g. Zoom/Google Meet URL) in the JSON body.
    ---
    tags: [Bookings]
    """
    data = validate_payload(AcceptBookingSchema(), request.get_json(silent=True) or {})
    mentor = User.objects(id=get_jwt_identity()).first()
    booking = service.accept_booking(booking_id, mentor, data["meeting_link"])
    return success_response("Booking accepted", data=booking.to_dict())


@bookings_bp.route("/<booking_id>/meeting-link", methods=["PATCH"])
@roles_required("mentor", "admin")
def update_meeting_link(booking_id):
    """
    Mentor sets or updates the meeting link for an accepted/completed booking.
    ---
    tags: [Bookings]
    """
    data = validate_payload(UpdateMeetingLinkSchema(), request.get_json(force=True) or {})
    mentor = User.objects(id=get_jwt_identity()).first()
    booking = service.update_meeting_link(booking_id, mentor, data["meeting_link"])
    return success_response("Meeting link updated", data=booking.to_dict())



@bookings_bp.route("/<booking_id>/reject", methods=["PATCH"])
@roles_required("mentor", "admin")
def reject_booking(booking_id):
    """
    Mentor rejects a pending booking request.
    ---
    tags: [Bookings]
    """
    data = validate_payload(CancelBookingSchema(), request.get_json(silent=True) or {})
    mentor = User.objects(id=get_jwt_identity()).first()
    booking = service.reject_booking(booking_id, mentor, data["cancellation_reason"])
    return success_response("Booking rejected", data=booking.to_dict())


@bookings_bp.route("/<booking_id>/complete", methods=["PATCH"])
@roles_required("mentor", "admin")
def complete_booking(booking_id):
    """
    Mentor marks an accepted booking as completed; triggers credit transfer.
    ---
    tags: [Bookings]
    """
    mentor = User.objects(id=get_jwt_identity()).first()
    booking = service.complete_booking(booking_id, mentor)
    return success_response("Booking marked as completed", data=booking.to_dict())


@bookings_bp.route("/<booking_id>/cancel", methods=["PATCH"])
@jwt_required()
def cancel_booking(booking_id):
    """
    Cancel a pending or accepted booking (either participant).
    ---
    tags: [Bookings]
    """
    data = validate_payload(CancelBookingSchema(), request.get_json(silent=True) or {})
    user = User.objects(id=get_jwt_identity()).first()
    booking = service.cancel_booking(booking_id, user, data["cancellation_reason"])
    return success_response("Booking cancelled", data=booking.to_dict())
