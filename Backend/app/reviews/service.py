"""
Business logic for reviews: a student may review a mentor once per completed
booking. Updates the mentor's and skill's aggregate rating afterward.
"""
from app.reviews.repository import ReviewRepository
from app.bookings.repository import BookingRepository
from app.skills.repository import SkillRepository
from app.notifications.service import NotificationService
from app.common.exceptions import NotFoundError, ForbiddenError, ConflictError
from app.utils.achievements import check_review_achievements, check_top_rated_achievement


class ReviewService:
    def __init__(self):
        self.repo = ReviewRepository()
        self.booking_repo = BookingRepository()
        self.skill_repo = SkillRepository()
        self.notification_service = NotificationService()

    def create_review(self, reviewer, booking_id, rating, comment):
        booking = self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise NotFoundError("Booking not found")
        if str(booking.student.id) != str(reviewer.id):
            raise ForbiddenError("Only the student who took the session can leave a review")
        if booking.status != "completed":
            raise ConflictError("You can only review completed sessions")
        if self.repo.get_by_booking(booking):
            raise ConflictError("You have already reviewed this session")

        review = self.repo.create(booking, reviewer, rating, comment)

        # Recompute mentor + skill aggregate ratings
        mentor_avg = self.repo.average_rating_for_mentor(booking.mentor)
        booking.mentor.rating_average = mentor_avg
        booking.mentor.save()

        skill_avg = self.repo.average_rating_for_skill(booking.skill)
        self.skill_repo.update_average_rating(booking.skill, skill_avg)

        self.notification_service.create_notification(
            user=booking.mentor,
            type_="new_review",
            title="New Review Received",
            message=f"{reviewer.name} left you a {rating}-star review for "
            f"'{booking.skill.title}'.",
        )

        # Achievements
        check_review_achievements(booking.mentor, self.notification_service)
        check_top_rated_achievement(booking.mentor, mentor_avg, self.notification_service)

        return review

    def list_for_mentor(self, mentor, page, per_page):
        items, total = self.repo.list_for_mentor(mentor, page, per_page)
        return [r.to_dict() for r in items], total

    def list_for_skill(self, skill, page, per_page):
        items, total = self.repo.list_for_skill(skill, page, per_page)
        return [r.to_dict() for r in items], total
