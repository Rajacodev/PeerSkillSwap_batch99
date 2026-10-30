import api from "./api";

const reviewService = {
  create: (payload) => api.post("/reviews", payload),
  listForMentor: (mentorId, params) => api.get(`/reviews/mentor/${mentorId}`, { params }),
  listForSkill: (skillId, params) => api.get(`/reviews/skill/${skillId}`, { params }),
};

export default reviewService;
