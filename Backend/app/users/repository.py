import datetime
from app.models.user import User


class UserRepository:
    @staticmethod
    def get_by_id(user_id):
        return User.objects(id=user_id).first()

    @staticmethod
    def get_by_email(email):
        return User.objects(email=email.lower()).first()

    @staticmethod
    def update_profile(user, updates):
        for key, value in updates.items():
            setattr(user, key, value)
        user.updated_at = datetime.datetime.utcnow()
        user.save()
        return user

    @staticmethod
    def update_profile_picture(user, url):
        user.profile_picture = url
        user.updated_at = datetime.datetime.utcnow()
        user.save()
        return user

    @staticmethod
    def update_password(user, password_hash):
        user.password_hash = password_hash
        user.updated_at = datetime.datetime.utcnow()
        user.save()
        return user

    @staticmethod
    def list_mentors(page, per_page, search=""):
        qs = User.objects(role="mentor", is_active=True)
        if search:
            qs = qs.filter(name__icontains=search)
        qs = qs.order_by("-rating_average")
        total = qs.count()
        items = qs.skip((page - 1) * per_page).limit(per_page)
        return items, total

    @staticmethod
    def list_all_users(page, per_page, search="", role=None):
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
    def set_active_status(user, is_active):
        user.is_active = is_active
        user.save()
        return user
