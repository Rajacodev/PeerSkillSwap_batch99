import api from "./api";

const callService = {
  getIceServers: () => api.get("/calls/ice-servers"),
};

export default callService;
