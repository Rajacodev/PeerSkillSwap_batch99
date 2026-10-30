from app.models.bookmark import Bookmark


class BookmarkRepository:
    @staticmethod
    def create(user, skill):
        bookmark = Bookmark(user=user, skill=skill)
        bookmark.save()
        return bookmark

    @staticmethod
    def get(user, skill):
        return Bookmark.objects(user=user, skill=skill).first()

    @staticmethod
    def delete(bookmark):
        bookmark.delete()

    @staticmethod
    def list_for_user(user, page, per_page):
        qs = Bookmark.objects(user=user).order_by("-created_at")
        total = qs.count()
        items = qs.skip((page - 1) * per_page).limit(per_page)
        return items, total
