"""
Aggregation queries for dashboards, leaderboard, and achievements.
"""
from app.models.user import User
from app.models.skill import Skill
from app.models.booking import Booking
from app.models.wallet import Wallet, Transaction
from app.models.review import Review
from app.models.gamification import LeaderboardEntry, Achievement


class DashboardRepository:
    @staticmethod
    def user_stats(user):
        return {
            "total_sessions_taught": user.total_sessions_taught,
            "total_sessions_learned": user.total_sessions_learned,
            "rating_average": user.rating_average / 10 if user.rating_average else 0,
            "pending_bookings_as_mentor": Booking.objects(mentor=user, status="pending").count(),
            "upcoming_bookings_as_student": Booking.objects(
                student=user, status="accepted"
            ).count(),
            "skills_listed": Skill.objects(mentor=user).count(),
        }

    @staticmethod
    def wallet_summary(user):
        wallet = Wallet.objects(user=user).first()
        balance = wallet.balance if wallet else 0
        total_earned = sum(
            t.amount for t in Transaction.objects(user=user, type="credit")
        )
        total_spent = sum(
            t.amount for t in Transaction.objects(user=user, type="debit")
        )
        return {"balance": balance, "total_earned": total_earned, "total_spent": total_spent}

    @staticmethod
    def admin_platform_stats():
        return {
            "total_users": User.objects.count(),
            "total_students": User.objects(role="student").count(),
            "total_mentors": User.objects(role="mentor").count(),
            "total_skills": Skill.objects.count(),
            "active_skills": Skill.objects(is_active=True).count(),
            "total_bookings": Booking.objects.count(),
            "completed_bookings": Booking.objects(status="completed").count(),
            "pending_bookings": Booking.objects(status="pending").count(),
            "total_reviews": Review.objects.count(),
            "total_credits_in_circulation": sum(w.balance for w in Wallet.objects()),
        }

    @staticmethod
    def rebuild_leaderboard(limit=50):
        """Recompute leaderboard entries from current user stats."""
        users = User.objects(role__in=["mentor", "student"])
        for user in users:
            wallet = Wallet.objects(user=user).first()
            total_earned = sum(
                t.amount for t in Transaction.objects(
                    user=user, type="credit", reason="session_taught"
                )
            )
            score = (
                user.total_sessions_taught * 10
                + user.total_sessions_learned * 3
                + (user.rating_average or 0)
            )
            entry = LeaderboardEntry.objects(user=user).first()
            if not entry:
                entry = LeaderboardEntry(user=user)
            entry.sessions_taught = user.total_sessions_taught
            entry.sessions_learned = user.total_sessions_learned
            entry.total_credits_earned = total_earned
            entry.rating_average = user.rating_average or 0
            entry.score = score
            entry.save()
        return LeaderboardEntry.objects().order_by("-score")[:limit]

    @staticmethod
    def get_leaderboard(limit=50):
        return LeaderboardEntry.objects().order_by("-score")[:limit]

    @staticmethod
    def get_achievements(user):
        return Achievement.objects(user=user).order_by("-earned_at")
