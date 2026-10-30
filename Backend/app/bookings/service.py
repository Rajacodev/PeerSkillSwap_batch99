"""
Business logic for the booking lifecycle: create, accept, reject, complete,
cancel. Coordinates with skills (booking counts), wallet (credit transfer),
notifications, and achievements.
"""
import datetime
from app.bookings.repository import BookingRepository
from app.skills.repository import SkillRepository
from app.wallet.service import WalletService
from app.notifications.service import NotificationService
from app.common.exceptions import NotFoundError, ForbiddenError, ValidationError, ConflictError
from app.utils.achievements import check_teaching_achievements, check_learning_achievements


class BookingService:
    def __init__(self):
        self.repo = BookingRepository()
        self.skill_repo = SkillRepository()
        self.wallet_service = WalletService()
        self.notification_service = NotificationService()

    @staticmethod
    def _to_naive_utc(dt):
        """Normalize an incoming datetime to naive UTC.

        Marshmallow's DateTime field parses ISO strings like
        '2026-07-25T08:41:00.000Z' into a timezone-aware datetime, while the
        rest of this codebase (and MongoEngine's DateTimeField) works with
        naive UTC datetimes via datetime.utcnow(). Comparing an aware and a
        naive datetime raises TypeError, so we normalize here before any
        comparison or storage happens.
        """
        if dt.tzinfo is not None:
            return dt.astimezone(datetime.timezone.utc).replace(tzinfo=None)
        return dt

    def create_booking(self, student, skill_id, scheduled_at, notes):
        scheduled_at = self._to_naive_utc(scheduled_at)

        skill = self.skill_repo.get_by_id(skill_id)
        if not skill or not skill.is_active:
            raise NotFoundError("Skill not found or no longer active")
        if str(skill.mentor.id) == str(student.id):
            raise ValidationError("You cannot book your own skill")
        if scheduled_at <= datetime.datetime.utcnow():
            raise ValidationError("Scheduled time must be in the future")

        wallet = self.wallet_service.get_wallet(student)
        if wallet.balance < skill.credits_per_session:
            raise ConflictError(
                f"Insufficient credits. This session requires "
                f"{skill.credits_per_session} credits, you have {wallet.balance}."
            )

        booking = self.repo.create(
            skill=skill,
            student=student,
            mentor=skill.mentor,
            scheduled_at=scheduled_at,
            notes=notes,
            credits_charged=skill.credits_per_session,
        )

        self.notification_service.create_notification(
            user=skill.mentor,
            type_="booking_request",
            title="New Booking Request",
            message=f"{student.name} requested a session for '{skill.title}'.",
        )
        return booking

    def _get_owned_booking(self, booking_id, user, as_mentor=False, as_student=False):
        booking = self.repo.get_by_id(booking_id)
        if not booking:
            raise NotFoundError("Booking not found")
        if as_mentor and str(booking.mentor.id) != str(user.id) and user.role != "admin":
            raise ForbiddenError("Only the assigned mentor can perform this action")
        if as_student and str(booking.student.id) != str(user.id) and user.role != "admin":
            raise ForbiddenError("Only the requesting student can perform this action")
        return booking

    def accept_booking(self, booking_id, mentor, meeting_link=""):
        booking = self._get_owned_booking(booking_id, mentor, as_mentor=True)
        if booking.status != "pending":
            raise ConflictError(f"Cannot accept a booking with status '{booking.status}'")
        booking = self.repo.update_status(booking, "accepted", meeting_link=meeting_link)
        message = (
            f"{booking.mentor.name} accepted your session request for "
            f"'{booking.skill.title}'."
        )
        if meeting_link:
            message += f" Meeting link: {meeting_link}"
        self.notification_service.create_notification(
            user=booking.student,
            type_="booking_accepted",
            title="Booking Accepted",
            message=message,
        )
        return booking

    def update_meeting_link(self, booking_id, mentor, meeting_link):
        booking = self._get_owned_booking(booking_id, mentor, as_mentor=True)
        if booking.status not in ("accepted", "completed"):
            raise ConflictError(
                "A meeting link can only be set on an accepted or completed booking"
            )
        booking = self.repo.set_meeting_link(booking, meeting_link)
        self.notification_service.create_notification(
            user=booking.student,
            type_="booking_accepted",
            title="Meeting Link Updated",
            message=f"{booking.mentor.name} updated the meeting link for "
            f"'{booking.skill.title}': {meeting_link}",
        )
        return booking

    def reject_booking(self, booking_id, mentor, reason=""):
        booking = self._get_owned_booking(booking_id, mentor, as_mentor=True)
        if booking.status != "pending":
            raise ConflictError(f"Cannot reject a booking with status '{booking.status}'")
        booking = self.repo.update_status(booking, "rejected", cancellation_reason=reason)
        self.notification_service.create_notification(
            user=booking.student,
            type_="booking_rejected",
            title="Booking Rejected",
            message=f"{booking.mentor.name} rejected your session request for "
            f"'{booking.skill.title}'.",
        )
        return booking

    def cancel_booking(self, booking_id, user, reason=""):
        booking = self.repo.get_by_id(booking_id)
        if not booking:
            raise NotFoundError("Booking not found")
        is_participant = str(booking.student.id) == str(user.id) or str(booking.mentor.id) == str(
            user.id
        )
        if not is_participant and user.role != "admin":
            raise ForbiddenError("You are not a participant in this booking")
        if booking.status not in ("pending", "accepted"):
            raise ConflictError(f"Cannot cancel a booking with status '{booking.status}'")

        booking = self.repo.update_status(booking, "cancelled", cancellation_reason=reason)

        other_party = booking.mentor if str(booking.student.id) == str(user.id) else booking.student
        self.notification_service.create_notification(
            user=other_party,
            type_="booking_cancelled",
            title="Booking Cancelled",
            message=f"The session for '{booking.skill.title}' was cancelled.",
        )
        return booking

    def complete_booking(self, booking_id, mentor):
        """Mentor marks a session complete: credits transfer from student to mentor."""
        booking = self._get_owned_booking(booking_id, mentor, as_mentor=True)
        if booking.status != "accepted":
            raise ConflictError("Only accepted bookings can be marked complete")

        booking = self.repo.update_status(booking, "completed")

        # Transfer credits: debit student, credit mentor
        self.wallet_service.debit(
            booking.student, booking.credits_charged, "session_learned",
            related_booking_id=str(booking.id),
        )
        self.wallet_service.credit(
            booking.mentor, booking.credits_charged, "session_taught",
            related_booking_id=str(booking.id),
        )

        # Update stats
        booking.mentor.total_sessions_taught += 1
        booking.mentor.save()
        booking.student.total_sessions_learned += 1
        booking.student.save()

        # Update skill popularity
        self.skill_repo.increment_bookings(booking.skill)

        # Notifications
        self.notification_service.create_notification(
            user=booking.student,
            type_="booking_completed",
            title="Session Completed",
            message=f"Your session '{booking.skill.title}' is complete. "
            f"{booking.credits_charged} credits were deducted. Leave a review!",
        )
        self.notification_service.create_notification(
            user=booking.mentor,
            type_="credit_earned",
            title="Credits Earned",
            message=f"You earned {booking.credits_charged} credits for teaching "
            f"'{booking.skill.title}'.",
        )

        # Achievements
        check_teaching_achievements(
            booking.mentor, booking.mentor.total_sessions_taught, self.notification_service
        )
        check_learning_achievements(
            booking.student, booking.student.total_sessions_learned, self.notification_service
        )

        return booking

    def get_booking(self, booking_id, user):
        booking = self.repo.get_by_id(booking_id)
        if not booking:
            raise NotFoundError("Booking not found")
        is_participant = str(booking.student.id) == str(user.id) or str(booking.mentor.id) == str(
            user.id
        )
        if not is_participant and user.role != "admin":
            raise ForbiddenError("You are not authorized to view this booking")
        return booking

    def list_my_bookings_as_student(self, user, page, per_page, status=None):
        items, total = self.repo.list_for_student(user, page, per_page, status)
        return [b.to_dict() for b in items], total

    def list_my_bookings_as_mentor(self, user, page, per_page, status=None):
        items, total = self.repo.list_for_mentor(user, page, per_page, status)
        return [b.to_dict() for b in items], total

    def list_all_bookings(self, page, per_page, status=None):
        items, total = self.repo.list_all(page, per_page, status)
        return [b.to_dict() for b in items], total
