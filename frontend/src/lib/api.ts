import axios from "axios";

// Backend'in çalıştığı adres
const BASE_URL = "http://127.0.0.1:8001/api/v1";

// Axios instance — tüm API istekleri buradan geçer
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Her istekte token varsa otomatik ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token süresi dolarsa login sayfasına yönlendir
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),

  register: (data: {
    full_name: string;
    email: string;
    password: string;
    approval_limit?: number;
  }) => api.post("/auth/register", data),

  getUsers: () => api.get("/auth/users"),
};

// ── Workflow ──────────────────────────────────────────────

export const workflowApi = {
  getAll: () => api.get("/workflows/"),

  getById: (id: number) => api.get(`/workflows/${id}`),

  create: (data: any) => api.post("/workflows/", data),

  delete: (id: number) => api.delete(`/workflows/${id}`),

  getApprovers: () => api.get("/workflows/users/approvers"),
};

// ── Requests ──────────────────────────────────────────────

export const requestApi = {
  getAll: () => api.get("/requests/"),

  getMy: () => api.get("/requests/my"),

  getById: (id: number) => api.get(`/requests/${id}`),

  create: (data: any) => api.post("/requests/", data),

  approve: (id: number, comment?: string) =>
    api.post(`/requests/${id}/approve`, { comment }),

  reject: (id: number, comment: string) =>
    api.post(`/requests/${id}/reject`, { comment }),

  cancel: (id: number) => api.post(`/requests/${id}/cancel`),

  revise: (id: number, data: any) => api.put(`/requests/${id}/revise`, data),

  getActions: (id: number) => api.get(`/requests/${id}/actions`),
};