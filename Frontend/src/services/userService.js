import api from "./api";

const userService = {
  getMe: () => api.get("/users/me"),
  updateMe: (payload) => api.put("/users/me", payload),
  uploadProfilePicture: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/users/me/profile-picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  changePassword: (payload) => api.post("/users/me/change-password", payload),
  listMentors: (params) => api.get("/users/mentors", { params }),
  getPublicProfile: (userId) => api.get(`/users/${userId}`),
};

export default userService;
