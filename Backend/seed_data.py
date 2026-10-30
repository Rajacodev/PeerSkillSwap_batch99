"""
Seed the database with sample data: an admin, mentors, students, skills,
and a couple of completed bookings/reviews so the app has content on first run.

Usage: python seed_data.py
"""
import os
import datetime

os.environ.setdefault("FLASK_ENV", "development")

from app import create_app
from app.extensions import bcrypt
from app.models import User, Skill, Wallet, Transaction, Booking, Review

app = create_app()


def run_seed():
    if app.config.get("ENVIRONMENT") == "production" and not os.getenv("ALLOW_DEMO_SEED"):
        raise SystemExit(
            "Refusing to create demo accounts with known passwords in production. "
            "Use create_admin.py to create an administrator instead."
        )
    with app.app_context():
        if User.objects(email="admin@peerskillswap.com").first():
            print("Sample data already exists. Skipping seed.")
            return

        print("Seeding database...")

        def make_user(name, email, password, role):
            user = User(
                name=name,
                email=email,
                password_hash=bcrypt.generate_password_hash(password).decode("utf-8"),
                role=role,
                bio=f"Hi, I'm {name}!",
            )
            user.save()
            wallet = Wallet(user=user, balance=20)
            wallet.save()
            Transaction(
                user=user, amount=20, type="credit", reason="signup_bonus", balance_after=20
            ).save()
            return user

        admin = make_user("Admin User", "admin@peerskillswap.com", "Admin@123", "admin")
        mentor1 = make_user("Alice Johnson", "alice@example.com", "Password@123", "mentor")
        mentor2 = make_user("Bob Smith", "bob@example.com", "Password@123", "mentor")
        student1 = make_user("Carol Davis", "carol@example.com", "Password@123", "student")
        student2 = make_user("David Lee", "david@example.com", "Password@123", "student")

        skill1 = Skill(
            title="Python Programming for Beginners",
            description="Learn Python fundamentals: variables, loops, functions, and OOP.",
            category="Technology",
            tags=["python", "programming", "coding"],
            mentor=mentor1,
            credits_per_session=2,
            duration_minutes=60,
        )
        skill1.save()

        skill2 = Skill(
            title="Acoustic Guitar Basics",
            description="Learn to play your first chords and songs on acoustic guitar.",
            category="Music",
            tags=["guitar", "music"],
            mentor=mentor2,
            credits_per_session=3,
            duration_minutes=45,
        )
        skill2.save()

        skill3 = Skill(
            title="Conversational Spanish",
            description="Practice everyday Spanish conversation with a native-level speaker.",
            category="Language",
            tags=["spanish", "language"],
            mentor=mentor1,
            credits_per_session=1,
            duration_minutes=30,
        )
        skill3.save()

        booking1 = Booking(
            skill=skill1,
            student=student1,
            mentor=mentor1,
            status="completed",
            credits_charged=2,
            scheduled_at=datetime.datetime.utcnow() - datetime.timedelta(days=3),
        )
        booking1.save()

        Review(
            booking=booking1, skill=skill1, reviewer=student1, mentor=mentor1,
            rating=5, comment="Alice explained everything so clearly!",
        ).save()

        mentor1.rating_average = 50
        mentor1.total_sessions_taught = 1
        mentor1.save()
        student1.total_sessions_learned = 1
        student1.save()
        skill1.total_bookings = 1
        skill1.average_rating = 50
        skill1.save()

        print("Seed complete!")
        print("Admin login:   admin@peerskillswap.com / Admin@123")
        print("Mentor login:  alice@example.com / Password@123")
        print("Student login: carol@example.com / Password@123")


if __name__ == "__main__":
    run_seed()
