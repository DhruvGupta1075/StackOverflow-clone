import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});
axiosInstance.interceptors.request.use((req) => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    console.log("[Axios Request Interceptor] user in localStorage:", user);
    if (user) {
      const token = JSON.parse(user).token;
      console.log("[Axios Request Interceptor] token parsed:", token);
      if (token) {
        req.headers.Authorization = `Bearer ${token}`;
      }
    }
  }
  return req;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        if (window.location.pathname !== "/auth") {
          window.location.href = "/auth";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
