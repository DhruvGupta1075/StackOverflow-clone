import express from "express";
import {
  requestLanguageChange,
  verifyLanguageOtp,
  getCurrentLanguage,
  adminResetLock
} from "../controller/language.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/request-change", auth, requestLanguageChange);
router.post("/verify-otp", auth, verifyLanguageOtp);
router.get("/current", auth, getCurrentLanguage);
router.post("/admin/reset-lock/:userId", auth, adminResetLock);

export default router;
