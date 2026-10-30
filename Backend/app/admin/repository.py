from app.models.user import User
from app.models.skill import Skill
from app.models.booking import Booking


class AdminRepository:
    @staticmethod
    def list_users(page, per_page, search="", role=None):
        qs = User.objects()
        if role:
            qs = qs.filter(role=role)
        if search:
            qs = qs.filter(name__icontains=search)
        qs = qs.order_by("-created_at")
        total = qs.count()
        items = qs.skip((page - 1) * per_page).limit(per_page)
        return items, total

    @staticmethod
    def get_user(user_id):
        return User.objects(id=user_id).first()

    @staticmethod
    def set_user_active(user, is_active):
        user.is_active = is_active
        user.save()
        return user

    @staticmethod
    def list_skills(page, per_page, search=""):
        qs = Skill.objects()
        if search:
            qs = qs.filter(title__icontains=search)
        qs = qs.order_by("-created_at")
        total = qs.count()
        items = qs.skip((page - 1) * per_page).limit(per_page)
        return items, total

    @staticmethod
    def get_skill(skill_id):
        return Skill.objects(id=skill_id).first()

    @staticmethod
    def set_skill_active(skill, is_active):
        skill.is_active = is_active
        skill.save()
        return skill

    @staticmethod
    def list_bookings(page, per_page, status=None):
        qs = Booking.objects()
        if status:
            qs = qs.filter(status=status)
        qs = qs.order_by("-created_at")
        total = qs.count()
        items = qs.skip((page - 1) * per_page).limit(per_page)
        return items, total
