import api from "./api";

const skillService = {
  create: (payload) => api.post("/skills", payload),
  search: (params) => api.get("/skills", { params }),
  trending: (limit = 10) => api.get("/skills/trending", { params: { limit } }),
  recommended: (limit = 10) => api.get("/skills/recommended", { params: { limit } }),
  mine: (params) => api.get("/skills/mine", { params }),
  getById: (skillId) => api.get(`/skills/${skillId}`),
  update: (skillId, payload) => api.put(`/skills/${skillId}`, payload),
  remove: (skillId) => api.delete(`/skills/${skillId}`),
  addBookmark: (skillId) => api.post(`/bookmarks/${skillId}`),
  removeBookmark: (skillId) => api.delete(`/bookmarks/${skillId}`),
  listBookmarks: (params) => api.get("/bookmarks", { params }),
};

export default skillService;
