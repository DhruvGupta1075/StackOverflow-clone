import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send HTTP cookies along with requests
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.request.use((req) => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    if (user) {
      const token = JSON.parse(user).token;
      if (token) {
        req.headers.Authorization = `Bearer ${token}`;
      }
    }
  }
  return req;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 unauthorized errors
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // If we got 401 on refresh-token itself, clean up and redirect
      if (originalRequest.url && originalRequest.url.includes("/refresh-token")) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("user");
          if (window.location.pathname !== "/auth") {
            window.location.href = "/auth";
          }
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.post(
          `${axiosInstance.defaults.baseURL}/api/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newToken = refreshRes.data.token;
        if (typeof window !== "undefined") {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const userObj = JSON.parse(userStr);
            userObj.token = newToken;
            localStorage.setItem("user", JSON.stringify(userObj));
          }
        }

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("user");
          if (window.location.pathname !== "/auth") {
            window.location.href = "/auth";
          }
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
