import express from "express";
import {
  getSessions,
  revokeSession,
  revokeOtherSessions,
  getTrustedDevices,
  removeTrustedDevice,
  getLoginHistory,
  getAdminLoginHistory,
  logoutCurrentSession,
} from "../controller/security.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Logout
router.post("/logout", auth, logoutCurrentSession);

// Active Sessions
router.get("/sessions", auth, getSessions);
router.delete("/sessions/:sessionId", auth, revokeSession);
router.delete("/sessions", auth, revokeOtherSessions);

// Trusted Devices
router.get("/trusted-devices", auth, getTrustedDevices);
router.delete("/trusted-devices/:deviceId", auth, removeTrustedDevice);

// Login History
router.get("/login-activity", auth, getLoginHistory);

// Admin monitoring logs
router.get("/admin/login-activity", auth, getAdminLoginHistory);

export default router;
