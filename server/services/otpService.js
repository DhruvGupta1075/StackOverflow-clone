import crypto from "crypto";
import OTPVerification from "../models/otpVerification.js";
import { sendOtpEmail } from "./emailService.js";

// Hash utility
const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

// Generate 6-digit OTP
export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createAndSendOtp = async (user) => {
  const otp = generateOtp();
  const hashed = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

  // Delete any existing OTP first
  await OTPVerification.deleteMany({ userId: user._id });

  // Create new OTP document
  await OTPVerification.create({
    userId: user._id,
    purpose: "new_device_login",
    otpHash: hashed,
    expiresAt,
    attempts: 0,
    resendCount: 0,
    lastSentAt: new Date(),
  });

  // Send OTP via email service (asynchronously in the background)
  sendOtpEmail(user.email, user.name, otp);

  // Return the OTP in console for easy debugging if SMTP fails
  console.log(`[OTP Service] Generated OTP for user ${user.email}: ${otp}`);
  return otp;
};

export const verifyOtpCode = async (userId, otpCode) => {
  const verification = await OTPVerification.findOne({ userId, purpose: "new_device_login" });

  if (!verification) {
    return { success: false, reason: "OTP has expired." };
  }

  // Check if expired
  if (verification.expiresAt < new Date()) {
    await OTPVerification.deleteOne({ _id: verification._id });
    return { success: false, reason: "OTP has expired." };
  }

  // Check attempt limit
  if (verification.attempts >= 5) {
    return { success: false, reason: "Too many verification attempts. Please try again later." };
  }

  const hashedCode = hashOtp(otpCode);
  if (verification.otpHash !== hashedCode) {
    verification.attempts += 1;
    await verification.save();

    if (verification.attempts >= 5) {
      return { success: false, reason: "Too many verification attempts. Please try again later." };
    }

    return {
      success: false,
      reason: "Incorrect OTP.",
      remainingAttempts: 5 - verification.attempts,
    };
  }

  // Success: Delete the OTP document so it is single-use
  await OTPVerification.deleteOne({ _id: verification._id });
  return { success: true };
};

export const resendOtpCode = async (user) => {
  const verification = await OTPVerification.findOne({ userId: user._id, purpose: "new_device_login" });

  if (!verification) {
    // If expired/not found, create a brand new one
    await createAndSendOtp(user);
    return { success: true, message: "An OTP has been sent to your registered email." };
  }

  // Check time elapsed since last sent (60s)
  const now = new Date();
  const elapsedSeconds = Math.floor((now.getTime() - verification.lastSentAt.getTime()) / 1000);
  if (elapsedSeconds < 60) {
    return {
      success: false,
      reason: `Please wait ${60 - elapsedSeconds} seconds before requesting a new OTP.`,
    };
  }

  // Check max resend attempts (3)
  if (verification.resendCount >= 3) {
    return {
      success: false,
      reason: "Too many resend attempts. Please try again later.",
    };
  }

  const otp = generateOtp();
  const hashed = hashOtp(otp);

  verification.otpHash = hashed;
  verification.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // refresh expiry
  verification.attempts = 0; // reset attempts
  verification.resendCount += 1;
  verification.lastSentAt = now;
  await verification.save();

  sendOtpEmail(user.email, user.name, otp);
  console.log(`[OTP Service Resend] Generated OTP for user ${user.email}: ${otp}`);

  return { success: true, message: "An OTP has been sent to your registered email." };
};
