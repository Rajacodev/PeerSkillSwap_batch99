from app.models.review import Review


class ReviewRepository:
    @staticmethod
    def create(booking, reviewer, rating, comment):
        review = Review(
            booking=booking,
            skill=booking.skill,
            reviewer=reviewer,
            mentor=booking.mentor,
            rating=rating,
            comment=comment,
        )
        review.save()
        return review

    @staticmethod
    def get_by_booking(booking):
        return Review.objects(booking=booking).first()

    @staticmethod
    def list_for_mentor(mentor, page, per_page):
        qs = Review.objects(mentor=mentor).order_by("-created_at")
        total = qs.count()
        items = qs.skip((page - 1) * per_page).limit(per_page)
        return items, total

    @staticmethod
    def list_for_skill(skill, page, per_page):
        qs = Review.objects(skill=skill).order_by("-created_at")
        total = qs.count()
        items = qs.skip((page - 1) * per_page).limit(per_page)
        return items, total

    @staticmethod
    def average_rating_for_mentor(mentor):
        reviews = Review.objects(mentor=mentor)
        if reviews.count() == 0:
            return 0
        total = sum(r.rating for r in reviews)
        return round((total / reviews.count()) * 10)  # x10 int

    @staticmethod
    def average_rating_for_skill(skill):
        reviews = Review.objects(skill=skill)
        if reviews.count() == 0:
            return 0
        total = sum(r.rating for r in reviews)
        return round((total / reviews.count()) * 10)
