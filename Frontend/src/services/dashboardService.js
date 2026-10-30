import api from "./api";

const dashboardService = {
  getMyDashboard: () => api.get("/dashboard/me"),
  getAdminDashboard: () => api.get("/dashboard/admin"),
  getLeaderboard: (limit = 50, refresh = false) =>
    api.get("/dashboard/leaderboard", { params: { limit, refresh } }),
  getAchievements: () => api.get("/dashboard/achievements"),
};

export default dashboardService;
