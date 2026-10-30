from app.skills.bookmarks_repository import BookmarkRepository
from app.skills.repository import SkillRepository
from app.common.exceptions import NotFoundError, ConflictError


class BookmarkService:
    def __init__(self):
        self.repo = BookmarkRepository()
        self.skill_repo = SkillRepository()

    def add_bookmark(self, user, skill_id):
        skill = self.skill_repo.get_by_id(skill_id)
        if not skill:
            raise NotFoundError("Skill not found")
        if self.repo.get(user, skill):
            raise ConflictError("Skill already bookmarked")
        return self.repo.create(user, skill)

    def remove_bookmark(self, user, skill_id):
        skill = self.skill_repo.get_by_id(skill_id)
        if not skill:
            raise NotFoundError("Skill not found")
        bookmark = self.repo.get(user, skill)
        if not bookmark:
            raise NotFoundError("Bookmark not found")
        self.repo.delete(bookmark)
        return True

    def list_bookmarks(self, user, page, per_page):
        items, total = self.repo.list_for_user(user, page, per_page)
        return [b.to_dict() for b in items], total
