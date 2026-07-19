import user from "../models/auth.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { sendRealSMS } from "../utils/sms.js";
import { sendLanguageVerificationEmail } from "../services/emailService.js";

const SUPPORTED_LANGUAGES = ["en", "es", "hi", "pt", "zh", "fr"];

// Helper to check if a user is currently locked out
const isLockedOut = (targetUser) => {
  if (targetUser.languageVerificationLockUntil) {
    const lockTime = new Date(targetUser.languageVerificationLockUntil);
    if (lockTime > new Date()) {
      return {
        locked: true,
        remainingMinutes: Math.ceil((lockTime - new Date()) / 1000 / 60)
      };
    }
  }
  return { locked: false };
};

// POST /api/language/request-change
export const requestLanguageChange = async (req, res) => {
  const { language } = req.body;
  const userId = req.userid;

  if (!language) {
    return res.status(400).json({ message: "Language is required." });
  }

  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return res.status(400).json({ message: "Unsupported language." });
  }

  try {
    const activeUser = await user.findById(userId);
    if (!activeUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if user is locked out
    const lockStatus = isLockedOut(activeUser);
    if (lockStatus.locked) {
      return res.status(429).json({
        message: `Too many incorrect attempts. Language switching is temporarily blocked. Please try again in ${lockStatus.remainingMinutes} minutes.`
      });
    }

    // Check resend limits (Max resend attempts: 3)
    if (activeUser.otpResendAttempts >= 3) {
      const lockUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes lockout
      activeUser.languageVerificationLockUntil = lockUntil;
      activeUser.otpResendAttempts = 0;
      activeUser.otpAttempts = 0;
      activeUser.otpCode = null;
      activeUser.otpExpiry = null;
      await activeUser.save();

      return res.status(429).json({
        message: "Maximum OTP resend attempts exceeded. Language switching is temporarily blocked for 30 minutes."
      });
    }

    // Determine verification method (French -> Email, others -> Mobile)
    const verificationType = (language === "fr") ? "email" : "sms";

    // Validate phone number exists for mobile OTP
    if (verificationType === "sms") {
      const phone = activeUser.billingDetails?.phone;
      if (!phone || phone.trim() === "") {
        return res.status(400).json({
          message: "No registered mobile number found in your profile. Please save a mobile number in your profile billing settings first."
        });
      }
    }

    // Generate a secure random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP before storing it
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Save state
    activeUser.otpCode = hashedOtp;
    activeUser.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
    activeUser.otpAttempts = 0;
    activeUser.otpType = verificationType;
    activeUser.languageVerificationStatus = "pending";
    activeUser.lastOtpSent = new Date();
    activeUser.otpResendAttempts += 1;
    await activeUser.save();

    if (verificationType === "email") {
      // Send Email OTP using centralized email service
      console.log(`[Language Controller] Requesting language verification email for ${activeUser.email}...`);
      const emailResult = await sendLanguageVerificationEmail(activeUser.email, activeUser.name, otp, activeUser.otpExpiry);

      if (!emailResult.success) {
        console.warn(`[Language Controller Warning] Email delivery failed:`, emailResult.error?.message);
        return res.status(200).json({
          success: true,
          message: "OTP generation succeeded (Email delivery failed, check server console/logs for OTP)."
        });
      }

      return res.status(200).json({
        success: true,
        message: "OTP sent to your registered email."
      });
    }

    // Try sending real SMS
    let smsSent = false;
    try {
      smsSent = await sendRealSMS(activeUser.billingDetails.phone, `Your Code Quest language change verification OTP is ${otp}. It will expire in 5 minutes.`);
    } catch (err) {
      return res.status(500).json({ message: "Failed to send verification SMS via Twilio." });
    }

    if (!smsSent) {
      // Send SMS OTP (Mock Provider)
      const smsDir = path.join(process.cwd(), "sent_sms");
      if (!fs.existsSync(smsDir)) {
        fs.mkdirSync(smsDir, { recursive: true });
      }
      const smsLogPath = path.join(smsDir, `sms-${activeUser._id}.json`);
      const smsContent = {
        to: activeUser.billingDetails.phone,
        body: `Your Code Quest language change verification OTP is ${otp}. It will expire in 5 minutes.`,
        otp,
        timestamp: new Date().toISOString()
      };
      fs.writeFileSync(smsLogPath, JSON.stringify(smsContent, null, 2));
      console.log(`[SMS Mock] Sent OTP ${otp} to ${smsContent.to}. Logged to: ${smsLogPath}`);
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent to your registered mobile number."
    });

  } catch (error) {
    console.error("Error requesting language change:", error);
    res.status(500).json({ message: "Something went wrong while requesting language change." });
  }
};

// POST /api/language/verify-otp
export const verifyLanguageOtp = async (req, res) => {
  const { otp, language } = req.body;
  const userId = req.userid;

  if (!otp || !language) {
    return res.status(400).json({ message: "OTP and target language are required." });
  }

  try {
    const activeUser = await user.findById(userId);
    if (!activeUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if user is locked out
    const lockStatus = isLockedOut(activeUser);
    if (lockStatus.locked) {
      return res.status(429).json({
        message: `Too many incorrect attempts. Language switching is temporarily blocked. Please try again in ${lockStatus.remainingMinutes} minutes.`
      });
    }

    // Check if there is a pending request
    if (activeUser.languageVerificationStatus !== "pending" || !activeUser.otpCode) {
      return res.status(400).json({ message: "No pending language change request found." });
    }

    // Check expiry
    if (new Date() > new Date(activeUser.otpExpiry)) {
      activeUser.otpCode = null;
      activeUser.otpExpiry = null;
      activeUser.languageVerificationStatus = "verified"; // revert status
      await activeUser.save();
      return res.status(400).json({ message: "OTP expired." });
    }

    // Verify OTP code
    const isMatched = await bcrypt.compare(otp, activeUser.otpCode);
    if (!isMatched) {
      activeUser.otpAttempts += 1;

      // Lockout if attempts exceed 5
      if (activeUser.otpAttempts >= 5) {
        const lockUntil = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes lockout
        activeUser.languageVerificationLockUntil = lockUntil;
        activeUser.otpAttempts = 0;
        activeUser.otpResendAttempts = 0;
        activeUser.otpCode = null;
        activeUser.otpExpiry = null;
        activeUser.languageVerificationStatus = "verified";
        await activeUser.save();

        return res.status(429).json({
          message: "Too many incorrect attempts. Language switching is temporarily blocked for 30 minutes."
        });
      }

      await activeUser.save();
      return res.status(400).json({ message: "Incorrect OTP." });
    }

    // Success! Update preferred language
    activeUser.preferredLanguage = language;
    activeUser.otpCode = null;
    activeUser.otpExpiry = null;
    activeUser.otpAttempts = 0;
    activeUser.otpResendAttempts = 0;
    activeUser.languageVerificationStatus = "verified";
    await activeUser.save();

    // Remove hashed password or sensitive keys before returning user data
    const userResponse = activeUser.toObject();
    delete userResponse.password;
    delete userResponse.otpCode;

    return res.status(200).json({
      success: true,
      message: "Language changed successfully.",
      user: userResponse
    });

  } catch (error) {
    console.error("Error verifying language OTP:", error);
    res.status(500).json({ message: "Something went wrong while verifying OTP." });
  }
};

// GET /api/language/current
export const getCurrentLanguage = async (req, res) => {
  const userId = req.userid;
  try {
    if (userId) {
      const activeUser = await user.findById(userId);
      if (activeUser) {
        return res.status(200).json({ preferredLanguage: activeUser.preferredLanguage || "en" });
      }
    }
    return res.status(200).json({ preferredLanguage: "en" });
  } catch (error) {
    console.error("Error getting current language:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// PUT /api/user/language
export const updateUserLanguageDirect = async (req, res) => {
  const { language } = req.body;
  const userId = req.userid;

  if (!language) {
    return res.status(400).json({ message: "Language preference is required." });
  }

  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return res.status(400).json({ message: "Unsupported language." });
  }

  try {
    const updatedUser = await user.findByIdAndUpdate(
      userId,
      { $set: { preferredLanguage: language } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const userResponse = updatedUser.toObject();
    delete userResponse.password;
    delete userResponse.otpCode;

    return res.status(200).json({
      success: true,
      message: "Language preference updated successfully.",
      user: userResponse
    });
  } catch (error) {
    console.error("Error updating user language direct:", error);
    res.status(500).json({ message: "Something went wrong updating language preference." });
  }
};

// POST /api/language/admin/reset-lock/:userId
export const adminResetLock = async (req, res) => {
  const { userId } = req.params;
  const adminId = req.userid;

  try {
    const adminUser = await user.findById(adminId);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ message: "Access Denied: Admins only." });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID format." });
    }

    const targetUser = await user.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found." });
    }

    targetUser.languageVerificationLockUntil = null;
    targetUser.otpAttempts = 0;
    targetUser.otpResendAttempts = 0;
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: `Language verification lock reset successfully for user: ${targetUser.name || targetUser.email}`
    });
  } catch (error) {
    console.error("Error in adminResetLock:", error);
    res.status(500).json({ message: "Something went wrong resetting user language lock." });
  }
};
