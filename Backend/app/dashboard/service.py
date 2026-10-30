"""
Business logic for user dashboard, admin analytics, leaderboard, achievements.
"""
from app.dashboard.repository import DashboardRepository


class DashboardService:
    def __init__(self):
        self.repo = DashboardRepository()

    def get_user_dashboard(self, user):
        return {
            "stats": self.repo.user_stats(user),
            "wallet": self.repo.wallet_summary(user),
        }

    def get_admin_dashboard(self):
        return self.repo.admin_platform_stats()

    def get_leaderboard(self, limit=50, refresh=False):
        if refresh:
            entries = self.repo.rebuild_leaderboard(limit)
        else:
            entries = self.repo.get_leaderboard(limit)
            if entries.count() == 0:
                entries = self.repo.rebuild_leaderboard(limit)
        return [e.to_dict() for e in entries]

    def get_achievements(self, user):
        return [a.to_dict() for a in self.repo.get_achievements(user)]
