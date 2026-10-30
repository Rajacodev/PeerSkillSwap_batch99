"""
Data access layer for bookings.
"""
import datetime
from app.models.booking import Booking


class BookingRepository:
    @staticmethod
    def create(skill, student, mentor, scheduled_at, notes, credits_charged):
        booking = Booking(
            skill=skill,
            student=student,
            mentor=mentor,
            scheduled_at=scheduled_at,
            notes=notes,
            credits_charged=credits_charged,
            status="pending",
        )
        booking.save()
        return booking

    @staticmethod
    def get_by_id(booking_id):
        return Booking.objects(id=booking_id).first()

    @staticmethod
    def update_status(booking, status, cancellation_reason=None, meeting_link=None):
        booking.status = status
        if cancellation_reason is not None:
            booking.cancellation_reason = cancellation_reason
        if meeting_link is not None:
            booking.meeting_link = meeting_link
        booking.updated_at = datetime.datetime.utcnow()
        booking.save()
        return booking

    @staticmethod
    def set_meeting_link(booking, meeting_link):
        booking.meeting_link = meeting_link
        booking.updated_at = datetime.datetime.utcnow()
        booking.save()
        return booking

    @staticmethod
    def list_for_student(student, page, per_page, status=None):
        qs = Booking.objects(student=student)
        if status:
            qs = qs.filter(status=status)
        qs = qs.order_by("-created_at")
        total = qs.count()
        items = qs.skip((page - 1) * per_page).limit(per_page)
        return items, total

    @staticmethod
    def list_for_mentor(mentor, page, per_page, status=None):
        qs = Booking.objects(mentor=mentor)
        if status:
            qs = qs.filter(status=status)
        qs = qs.order_by("-created_at")
        total = qs.count()
        items = qs.skip((page - 1) * per_page).limit(per_page)
        return items, total

    @staticmethod
    def count_completed_for_mentor(mentor):
        return Booking.objects(mentor=mentor, status="completed").count()

    @staticmethod
    def count_completed_for_student(student):
        return Booking.objects(student=student, status="completed").count()

    @staticmethod
    def list_all(page, per_page, status=None):
        qs = Booking.objects()
        if status:
            qs = qs.filter(status=status)
        qs = qs.order_by("-created_at")
        total = qs.count()
        items = qs.skip((page - 1) * per_page).limit(per_page)
        return items, total
