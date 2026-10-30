import api from "./api";

const bookingService = {
  create: (payload) => api.post("/bookings", payload),
  listAsStudent: (params) => api.get("/bookings/student", { params }),
  listAsMentor: (params) => api.get("/bookings/mentor", { params }),
  getById: (bookingId) => api.get(`/bookings/${bookingId}`),
  accept: (bookingId, meetingLink = "") =>
    api.patch(`/bookings/${bookingId}/accept`, { meeting_link: meetingLink }),
  updateMeetingLink: (bookingId, meetingLink) =>
    api.patch(`/bookings/${bookingId}/meeting-link`, { meeting_link: meetingLink }),
  reject: (bookingId, reason) =>
    api.patch(`/bookings/${bookingId}/reject`, { cancellation_reason: reason }),
  complete: (bookingId) => api.patch(`/bookings/${bookingId}/complete`),
  cancel: (bookingId, reason) =>
    api.patch(`/bookings/${bookingId}/cancel`, { cancellation_reason: reason }),
};

export default bookingService;
