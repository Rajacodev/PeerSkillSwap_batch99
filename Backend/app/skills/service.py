"""
Business logic for skills.
"""
from app.skills.repository import SkillRepository
from app.common.exceptions import NotFoundError, ForbiddenError


class SkillService:
    def __init__(self):
        self.repo = SkillRepository()

    def create_skill(self, mentor, data):
        return self.repo.create(mentor, data)

    def get_skill(self, skill_id):
        skill = self.repo.get_by_id(skill_id)
        if not skill:
            raise NotFoundError("Skill not found")
        return skill

    def update_skill(self, skill_id, user, updates):
        skill = self.get_skill(skill_id)
        if str(skill.mentor.id) != str(user.id) and user.role != "admin":
            raise ForbiddenError("You can only edit your own skills")
        return self.repo.update(skill, updates)

    def delete_skill(self, skill_id, user):
        skill = self.get_skill(skill_id)
        if str(skill.mentor.id) != str(user.id) and user.role != "admin":
            raise ForbiddenError("You can only delete your own skills")
        self.repo.delete(skill)
        return True

    def search_skills(self, page, per_page, search, category, sort_by, order):
        items, total = self.repo.search(page, per_page, search, category, sort_by, order)
        return [s.to_dict() for s in items], total

    def list_my_skills(self, user, page, per_page):
        items, total = self.repo.list_by_mentor(user, page, per_page)
        return [s.to_dict() for s in items], total

    def trending_skills(self, limit=10):
        return [s.to_dict() for s in self.repo.trending(limit)]

    def recommended_skills(self, user, limit=10):
        return [s.to_dict() for s in self.repo.recommended_for_user(user, limit)]
