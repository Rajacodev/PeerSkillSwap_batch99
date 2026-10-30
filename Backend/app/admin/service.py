from app.admin.repository import AdminRepository
from app.common.exceptions import NotFoundError


class AdminService:
    def __init__(self):
        self.repo = AdminRepository()

    def list_users(self, page, per_page, search="", role=None):
        items, total = self.repo.list_users(page, per_page, search, role)
        return [u.to_public_dict() for u in items], total

    def set_user_active(self, user_id, is_active):
        user = self.repo.get_user(user_id)
        if not user:
            raise NotFoundError("User not found")
        return self.repo.set_user_active(user, is_active)

    def list_skills(self, page, per_page, search=""):
        items, total = self.repo.list_skills(page, per_page, search)
        return [s.to_dict() for s in items], total

    def set_skill_active(self, skill_id, is_active):
        skill = self.repo.get_skill(skill_id)
        if not skill:
            raise NotFoundError("Skill not found")
        return self.repo.set_skill_active(skill, is_active)

    def list_bookings(self, page, per_page, status=None):
        items, total = self.repo.list_bookings(page, per_page, status)
        return [b.to_dict() for b in items], total
