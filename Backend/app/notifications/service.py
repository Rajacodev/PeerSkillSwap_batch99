from app.notifications.repository import NotificationRepository
from app.common.exceptions import NotFoundError


class NotificationService:
    def __init__(self):
        self.repo = NotificationRepository()

    def create_notification(self, user, type_, title, message):
        return self.repo.create(user, type_, title, message)

    def list_notifications(self, user, page, per_page, unread_only=False):
        items, total = self.repo.list_for_user(user, page, per_page, unread_only)
        return [n.to_dict() for n in items], total

    def mark_read(self, user, notification_id):
        notification = self.repo.get_by_id(notification_id, user)
        if not notification:
            raise NotFoundError("Notification not found")
        return self.repo.mark_read(notification)

    def mark_all_read(self, user):
        self.repo.mark_all_read(user)
        return True

    def unread_count(self, user):
        return self.repo.unread_count(user)
