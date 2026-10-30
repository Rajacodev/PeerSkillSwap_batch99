"""
Business logic for user profile management.
"""
from app.users.repository import UserRepository
from app.common.exceptions import NotFoundError, ValidationError, UnauthorizedError
from app.extensions import bcrypt
from app.utils.file_upload import save_uploaded_file


class UserService:
    def __init__(self):
        self.repo = UserRepository()

    def get_profile(self, user_id):
        user = self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user

    def update_profile(self, user_id, updates):
        user = self.get_profile(user_id)
        allowed = {"name", "bio", "skills_offered", "skills_wanted"}
        clean_updates = {k: v for k, v in updates.items() if k in allowed}
        return self.repo.update_profile(user, clean_updates)

    def upload_profile_picture(self, user_id, file_storage):
        user = self.get_profile(user_id)
        try:
            url = save_uploaded_file(file_storage, subfolder="profile_pictures")
        except ValueError as exc:
            raise ValidationError(str(exc))
        if not url:
            raise ValidationError("No file provided")
        return self.repo.update_profile_picture(user, url)

    def change_password(self, user_id, current_password, new_password):
        user = self.get_profile(user_id)
        if not bcrypt.check_password_hash(user.password_hash, current_password):
            raise UnauthorizedError("Current password is incorrect")
        password_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
        return self.repo.update_password(user, password_hash)

    def list_mentors(self, page, per_page, search=""):
        items, total = self.repo.list_mentors(page, per_page, search)
        return [u.to_public_dict() for u in items], total

    def get_public_profile(self, user_id):
        user = self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user
