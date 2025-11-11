import axios from "axios";

// Create axios instance
const api = axios.create({
    baseURL: "/api",
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
    withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("auth_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // If data is FormData, let browser set Content-Type with boundary
        // Don't set Content-Type header for FormData - browser will set it automatically
        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear token
            // Don't remove token for /api/user endpoint - let AuthContext handle it
            // This prevents premature token removal on page refresh
            const url = error.config?.url || "";
            if (!url.includes("/user")) {
                localStorage.removeItem("auth_token");
            }
        }
        return Promise.reject(error);
    }
);

export default api;

