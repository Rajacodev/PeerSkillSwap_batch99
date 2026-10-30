from app.models.notification import Notification


class NotificationRepository:
    @staticmethod
    def create(user, type_, title, message):
        notification = Notification(user=user, type=type_, title=title, message=message)
        notification.save()
        return notification

    @staticmethod
    def list_for_user(user, page, per_page, unread_only=False):
        qs = Notification.objects(user=user)
        if unread_only:
            qs = qs.filter(is_read=False)
        qs = qs.order_by("-created_at")
        total = qs.count()
        items = qs.skip((page - 1) * per_page).limit(per_page)
        return items, total

    @staticmethod
    def get_by_id(notification_id, user):
        return Notification.objects(id=notification_id, user=user).first()

    @staticmethod
    def mark_read(notification):
        notification.is_read = True
        notification.save()
        return notification

    @staticmethod
    def mark_all_read(user):
        Notification.objects(user=user, is_read=False).update(is_read=True)

    @staticmethod
    def unread_count(user):
        return Notification.objects(user=user, is_read=False).count()
