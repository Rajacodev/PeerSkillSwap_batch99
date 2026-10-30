import api from "./api";

const adminService = {
  listUsers: (params) => api.get("/admin/users", { params }),
  setUserActive: (userId, isActive) =>
    api.patch(`/admin/users/${userId}/active-status`, { is_active: isActive }),
  listSkills: (params) => api.get("/admin/skills", { params }),
  setSkillActive: (skillId, isActive) =>
    api.patch(`/admin/skills/${skillId}/active-status`, { is_active: isActive }),
  listBookings: (params) => api.get("/admin/bookings", { params }),
};

export default adminService;
