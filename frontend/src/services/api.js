import axios from "axios";

// Base API URL configuration
export const API_BASE_URL = "http://localhost:5000/api";
export const SERVER_BASE_URL = "http://localhost:5000";

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Request interceptor to attach JWT from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("foodloop_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If token is invalid or expired
    if (error.response && error.response.status === 401) {
      // Clear token if it was invalid or expired
      if (
        error.response.data?.message?.toLowerCase().includes("expired") ||
        error.response.data?.message?.toLowerCase().includes("invalid")
      ) {
        localStorage.removeItem("foodloop_token");
        localStorage.removeItem("foodloop_user");
      }
    }
    return Promise.reject(error);
  }
);

/* ============================================================================
   AUTH SERVICES
   ============================================================================ */
export const authService = {
  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post("/auth/register", userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  }
};

/* ============================================================================
   FOOD LISTING SERVICES
   ============================================================================ */
export const foodService = {
  create: async (formData) => {
    // Check if formData is multipart or json
    const isFormData = formData instanceof FormData;
    const res = await api.post("/food", formData, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {}
    });
    return res.data;
  },
  getMine: async () => {
    const res = await api.get("/food/mine");
    return res.data;
  },
  getAvailable: async (params = {}) => {
    const res = await api.get("/food", { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/food/${id}`);
    return res.data;
  },
  update: async (id, data) => {
    const isFormData = data instanceof FormData;
    const res = await api.put(`/food/${id}`, data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {}
    });
    return res.data;
  },
  cancel: async (id) => {
    const res = await api.delete(`/food/${id}`);
    return res.data;
  }
};

/* ============================================================================
   REQUEST SERVICES
   ============================================================================ */
export const requestService = {
  create: async ({ foodListingId, requestedQuantity, message }) => {
    const res = await api.post("/requests", {
      foodListingId,
      requestedQuantity,
      message
    });
    return res.data;
  },
  getMyRequests: async (params = {}) => {
    const res = await api.get("/requests/my", { params });
    return res.data;
  },
  getReceivedRequests: async (params = {}) => {
    const res = await api.get("/requests/received", { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/requests/${id}`);
    return res.data;
  },
  approve: async (id) => {
    const res = await api.patch(`/requests/${id}/approve`);
    return res.data;
  },
  reject: async (id) => {
    const res = await api.patch(`/requests/${id}/reject`);
    return res.data;
  },
  cancel: async (id) => {
    const res = await api.patch(`/requests/${id}/cancel`);
    return res.data;
  },
  collect: async (id) => {
    const res = await api.patch(`/requests/${id}/collect`);
    return res.data;
  },
  distribute: async (id, { quantityDistributed, beneficiaryCount, distributionNotes }) => {
    const res = await api.patch(`/requests/${id}/distribute`, {
      quantityDistributed,
      beneficiaryCount,
      distributionNotes
    });
    return res.data;
  }
};

/* ============================================================================
   NOTIFICATION SERVICES
   ============================================================================ */
export const notificationService = {
  getAll: async () => {
    const res = await api.get("/notifications");
    return res.data;
  },
  markRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.patch("/notifications/read-all");
    return res.data;
  }
};

/* ============================================================================
   REPORT SERVICES
   ============================================================================ */
export const reportService = {
  create: async ({ reportedUserId, foodListingId, reason, description }) => {
    const res = await api.post("/reports", {
      reportedUserId,
      foodListingId,
      reason,
      description
    });
    return res.data;
  },
  getMyReports: async () => {
    const res = await api.get("/reports/my");
    return res.data;
  }
};

/* ============================================================================
   ADMIN SERVICES
   ============================================================================ */
export const adminService = {
  getDashboardStats: async () => {
    const res = await api.get("/admin/dashboard");
    return res.data;
  },
  getUsers: async (params = {}) => {
    const res = await api.get("/admin/users", { params });
    return res.data;
  },
  verifyUser: async (id, verificationStatus) => {
    const res = await api.patch(`/admin/users/${id}/verify`, { verificationStatus });
    return res.data;
  },
  getReports: async (params = {}) => {
    const res = await api.get("/admin/reports", { params });
    return res.data;
  },
  updateReport: async (id, { status, adminRemarks }) => {
    const res = await api.patch(`/admin/reports/${id}`, { status, adminRemarks });
    return res.data;
  }
};

export default api;
