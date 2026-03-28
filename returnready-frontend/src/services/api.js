import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE });

export const onboardUser = (data) => api.post("/api/onboard", data);
export const analyzeUser = (user_id) => api.post("/api/analyze", { user_id });
export const getProgress = (user_id) => api.get(`/api/progress/${user_id}`);
export const completeAction = (action_id, user_id) =>
  api.post("/api/complete-action", { action_id, user_id });