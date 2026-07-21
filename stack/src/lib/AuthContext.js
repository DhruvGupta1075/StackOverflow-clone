import { useState, useEffect } from "react";
import { createContext } from "react";
import axiosInstance from "./axiosinstance";
import { toast } from "react-toastify";
import { useContext } from "react";
import i18n from "i18next";
import "@/lib/i18n";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [loading, setloading] = useState(false);
  const [error, seterror] = useState(null);

  // Sync translation language with user state
  useEffect(() => {
    if (user && user.preferredLanguage) {
      if (i18n.language !== user.preferredLanguage) {
        i18n.changeLanguage(user.preferredLanguage);
      }
    } else if (typeof window !== "undefined") {
      const localLang = localStorage.getItem("i18nextLng");
      if (localLang && i18n.language !== localLang) {
        i18n.changeLanguage(localLang);
      }
    }
  }, [user]);

  const Signup = async ({ name, email, password }) => {
    setloading(true);
    seterror(null);
    try {
      const res = await axiosInstance.post("/user/signup", {
        name,
        email,
        password,
      });
      const { data, token } = res.data;
      localStorage.setItem("user", JSON.stringify({ ...data, token }));
      setUser({ ...data, token });
      toast.success("Signup Successful");
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || "Signup failed";
      seterror(msg);
      toast.error(msg);
      return { success: false };
    } finally {
      setloading(false);
    }
  };

  const Login = async ({ email, password }) => {
    setloading(true);
    seterror(null);
    try {
      const res = await axiosInstance.post("/user/login", {
        email,
        password,
      });

      if (res.data.status === "OTP_REQUIRED") {
        return { otpRequired: true, tempToken: res.data.tempToken };
      }

      const { data, token } = res.data;
      localStorage.setItem("user", JSON.stringify({ ...data, token }));
      setUser({ ...data, token });
      toast.success("Login Successful");
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || "Login failed";
      seterror(msg);
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setloading(false);
    }
  };

  const SocialLogin = async (provider, tokenOrCode) => {
    setloading(true);
    seterror(null);
    try {
      const endpoint = provider === "google" ? "/user/google-login" : "/user/github-login";
      const payload = provider === "google" ? { accessToken: tokenOrCode } : { code: tokenOrCode };
      
      const res = await axiosInstance.post(endpoint, payload);

      if (res.data.status === "OTP_REQUIRED") {
        return { otpRequired: true, tempToken: res.data.tempToken };
      }
      
      const { data, token } = res.data;
      localStorage.setItem("user", JSON.stringify({ ...data, token }));
      setUser({ ...data, token });
      toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} Login Successful`);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || `${provider} Login failed`;
      seterror(msg);
      toast.error(msg);
      return { success: false };
    } finally {
      setloading(false);
    }
  };

  const VerifyOtp = async (tempToken, otpCode, trustDevice) => {
    setloading(true);
    seterror(null);
    try {
      const res = await axiosInstance.post("/user/device/verify-otp", {
        tempToken,
        otpCode,
        trustDevice,
      });
      const { data, token } = res.data;
      localStorage.setItem("user", JSON.stringify({ ...data, token }));
      setUser({ ...data, token });
      toast.success("Login Successful");
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || "OTP verification failed";
      seterror(msg);
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setloading(false);
    }
  };

  const ResendOtp = async (tempToken) => {
    try {
      const res = await axiosInstance.post("/user/device/resend-otp", {
        tempToken,
      });
      toast.success(res.data.message || "OTP resent successfully");
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to resend OTP";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const Logout = async () => {
    try {
      await axiosInstance.post("/api/security/logout");
    } catch (err) {
      console.warn("Failed to logout from backend:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
      toast.info("Logged out");
    }
  };

  const updateUser = (updatedUserData) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const token = prevUser.token || (typeof window !== "undefined" && JSON.parse(localStorage.getItem("user") || "{}").token);
      const newUser = { ...prevUser, ...updatedUserData };
      if (token) {
        newUser.token = token;
      }
      localStorage.setItem("user", JSON.stringify(newUser));
      return newUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, Signup, Login, Logout, SocialLogin, VerifyOtp, ResendOtp, loading, error, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);
