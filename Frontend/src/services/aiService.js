import api from "./api";

const aiService = {
  recommendSkills: (jobTitle) => api.post("/ai/recommend-skills", { job_title: jobTitle }),
  getHistory: (params) => api.get("/ai/recommendations", { params }),
  getProviders: () => api.get("/ai/providers"),
};

export default aiService;
