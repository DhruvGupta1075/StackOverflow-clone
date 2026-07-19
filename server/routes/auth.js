import express from "express";
import {
  getallusers,
  Login,
  Signup,
  updateprofile,
  toggleBookmark,
  getBookmarks,
  getProfile,
  googleLogin,
  githubLogin,
  forgotPassword,
} from "../controller/auth.js";
import { verifyOtp, resendOtp, refreshToken } from "../controller/security.js";
import { updateUserLanguageDirect } from "../controller/language.js";

const router = express.Router();
import auth from "../middleware/auth.js";
router.post("/signup", Signup);
router.post("/login", Login);
router.post("/google-login", googleLogin);
router.post("/github-login", githubLogin);
router.post("/forgot-password", forgotPassword);
router.post("/device/verify-otp", verifyOtp);
router.post("/device/resend-otp", resendOtp);
router.post("/refresh-token", refreshToken);
router.get("/getalluser", getallusers);
router.patch("/update/:id", auth, updateprofile);
router.post("/bookmark/:questionId", auth, toggleBookmark);
router.get("/bookmarks", auth, getBookmarks);
router.get("/profile/:id", getProfile);
router.put("/language", auth, updateUserLanguageDirect);
export default router;
