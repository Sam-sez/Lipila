import axios from "axios";

// Local dev: backend runs standalone on :8000, now mounted under /api
// (see backend/app/main.py). Production on Vercel: set VITE_API_BASE_URL
// to the relative path "/api" — frontend and backend share one domain
// under the Services model, so no absolute URL or CORS config is needed.
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const api = axios.create({ baseURL: API_BASE });

export const Users = {
  create: (data) => api.post("/users", data).then((r) => r.data),
  get: (id) => api.get(`/users/${id}`).then((r) => r.data),
  list: () => api.get("/users").then((r) => r.data),
};

export const QR = {
  getStatic: (userId) => api.get(`/qr/static/${userId}`).then((r) => r.data),
  resolveStatic: (qrToken) =>
    api.post("/qr/static/resolve", { qr_token: qrToken }).then((r) => r.data),
  createDynamic: (payeeId, amount, note) =>
    api.post("/qr/dynamic", { payee_id: payeeId, amount, note }).then((r) => r.data),
  getDynamicImage: (qrToken) => api.get(`/qr/dynamic/${qrToken}/image`).then((r) => r.data),
  resolveDynamic: (qrToken) =>
    api.post("/qr/dynamic/resolve", { qr_token: qrToken }).then((r) => r.data),
};

export const Payments = {
  confirm: (body) => api.post("/payments/confirm", body).then((r) => r.data),
  status: (txnId) => api.get(`/payments/${txnId}/status`).then((r) => r.data),
  history: (userId) => api.get(`/payments/history/${userId}`).then((r) => r.data),
};

export const Favorites = {
  list: (ownerId) => api.get(`/favorites/${ownerId}`).then((r) => r.data),
  add: (ownerId, savedUserId) =>
    api.post(`/favorites?owner_id=${ownerId}&saved_user_id=${savedUserId}`).then((r) => r.data),
  remove: (ownerId, savedUserId) =>
    api.delete(`/favorites/${ownerId}/${savedUserId}`).then((r) => r.data),
};

export const Bong = {
  announce: (userId, sessionToken) =>
    api.post("/bong/announce", { user_id: userId, session_token: sessionToken }).then((r) => r.data),
  candidates: (detected) => api.post("/bong/candidates", detected).then((r) => r.data),
  reveal: (sessionToken) => api.post(`/bong/reveal/${sessionToken}`).then((r) => r.data),
};

export const Agents = {
  cashIn: (agentId, userQrToken, amount) =>
    api.post("/agents/cash-in", { agent_id: agentId, user_qr_token: userQrToken, amount }).then((r) => r.data),
  cashOut: (userId, agentQrToken, amount) =>
    api.post("/agents/cash-out", { user_id: userId, agent_qr_token: agentQrToken, amount }).then((r) => r.data),
  disclaimer: (agentId) => api.get(`/agents/${agentId}/disclaimer`).then((r) => r.data),
};

export default api;
