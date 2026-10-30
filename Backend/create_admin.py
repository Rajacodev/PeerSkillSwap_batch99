"""
Create an administrator account, or promote an existing account to admin.

Usage (in a running deployment):
    docker compose exec -it backend python create_admin.py

Values come from the environment (ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD) or
are prompted for, so the password does not end up in shell history.
"""
import getpass
import os
import sys

from app import create_app
from app.extensions import bcrypt
from app.models import User

MIN_PASSWORD_LENGTH = 12


def main():
    app = create_app()
    with app.app_context():
        email = (os.getenv("ADMIN_EMAIL") or input("Admin email: ")).strip().lower()
        if not email:
            print("An email address is required.")
            return 1
        password = os.getenv("ADMIN_PASSWORD") or getpass.getpass(
            f"Password (at least {MIN_PASSWORD_LENGTH} characters): "
        )
        if len(password) < MIN_PASSWORD_LENGTH:
            print(f"Password must be at least {MIN_PASSWORD_LENGTH} characters.")
            return 1

        password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
        user = User.objects(email=email).first()
        if user:
            user.role = "admin"
            user.password_hash = password_hash
            user.is_active = True
            user.save()
            print(f"Promoted {email} to admin and set a new password.")
        else:
            name = os.getenv("ADMIN_NAME") or input("Admin name: ").strip() or "Administrator"
            User(name=name, email=email, password_hash=password_hash, role="admin").save()
            print(f"Created administrator account {email}.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
