import api from "./api";

const walletService = {
  getMyWallet: () => api.get("/wallet"),
  getTransactions: (params) => api.get("/wallet/transactions", { params }),
  adminAdjust: (payload) => api.post("/wallet/admin/adjust", payload),
};

export default walletService;
