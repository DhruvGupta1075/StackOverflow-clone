import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/session.js";
import TrustedDevice from "../models/trustedDevice.js";
import LoginActivity from "../models/loginActivity.js";
import { parseUserAgent } from "../utils/userAgent.js";
import { getApproximateLocation } from "../utils/location.js";
import { createAndSendOtp } from "./otpService.js";

// Get configurable inactivity timeout limit (default to 7 days)
export const getInactivityLimit = () => {
  return process.env.SESSION_INACTIVITY_TIMEOUT_MS
    ? parseInt(process.env.SESSION_INACTIVITY_TIMEOUT_MS, 10)
    : 7 * 24 * 60 * 60 * 1000;
};

// Helper to hash tokens
export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Parse client IP address securely
export const getClientIp = (req) => {
  const forwarded = req?.headers?.["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req?.socket?.remoteAddress || req?.ip || "127.0.0.1";
};

// Generate Access Token (JWT)
export const generateAccessToken = (user, sessionId) => {
  return jwt.sign(
    { email: user.email, id: user._id, sessionId },
    process.env.JWT_SECRET,
    { expiresIn: "15m" } // short-lived access token
  );
};

// Generate Refresh Token (JWT)
export const generateRefreshToken = (userId, sessionId, nonce) => {
  return jwt.sign(
    { id: userId, sessionId, nonce },
    process.env.JWT_SECRET,
    { expiresIn: "7d" } // 7-day refresh token
  );
};

// Cookie configuration options
export const getCookieOptions = (type = "refresh") => {
  const maxAge = type === "refresh" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge,
  };
};

export const createSession = async (user, ipAddress, userAgentDetails, authMethod, trustedDeviceId = null) => {
  const sessionId = crypto.randomBytes(16).toString("hex");
  const nonce = crypto.randomBytes(16).toString("hex");
  
  const rawRefreshToken = generateRefreshToken(user._id, sessionId, nonce);
  const refreshTokenHash = hashToken(rawRefreshToken);
  
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  const session = await Session.create({
    userId: user._id,
    sessionId,
    refreshTokenHash,
    deviceType: userAgentDetails.deviceType,
    browser: userAgentDetails.browser,
    operatingSystem: userAgentDetails.operatingSystem,
    ipAddress,
    location: userAgentDetails.location || "Unknown",
    authenticationMethod: authMethod,
    trustedDeviceId,
    expiresAt,
  });

  const accessToken = generateAccessToken(user, sessionId);

  return {
    session,
    accessToken,
    refreshToken: rawRefreshToken,
  };
};

export const rotateSessionToken = async (oldRawRefreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(oldRawRefreshToken, process.env.JWT_SECRET);
  } catch (err) {
    throw new Error("Invalid refresh token.");
  }

  const { id: userId, sessionId } = decoded;
  const oldHash = hashToken(oldRawRefreshToken);

  // Look up session by refresh token hash
  const session = await Session.findOne({ sessionId, refreshTokenHash: oldHash });

  if (!session) {
    // Replay attack detection!
    // If the session exists in DB but with a DIFFERENT refresh token hash, it means the token was already rotated.
    const replayedSession = await Session.findOne({ sessionId });
    if (replayedSession && !replayedSession.isRevoked) {
      console.warn(`[Security Alert] Refresh token reuse detected for session ${sessionId}. Revoking session.`);
      replayedSession.isRevoked = true;
      replayedSession.revokedAt = new Date();
      await replayedSession.save();
    }
    throw new Error("Session has been revoked due to token reuse detection.");
  }

  // Check if session is revoked or expired
  if (session.isRevoked || session.expiresAt < new Date()) {
    throw new Error("Session has expired or been revoked.");
  }

  // Check inactivity timeout
  const inactivityLimit = getInactivityLimit();
  if (Date.now() - session.lastActiveAt.getTime() > inactivityLimit) {
    session.isRevoked = true;
    session.revokedAt = new Date();
    await session.save();
    throw new Error("Session expired due to inactivity.");
  }

  // Rotate token: generate new refresh token and hash
  const newNonce = crypto.randomBytes(16).toString("hex");
  const newRawRefreshToken = generateRefreshToken(userId, sessionId, newNonce);
  const newHash = hashToken(newRawRefreshToken);

  session.refreshTokenHash = newHash;
  session.lastActiveAt = new Date();
  await session.save();

  // Get user details
  const user = { _id: userId, email: decoded.email };

  // Generate new access token
  const accessToken = generateAccessToken(user, sessionId);

  return {
    accessToken,
    refreshToken: newRawRefreshToken,
  };
};

export const establishSession = async (res, user, ipAddress, userAgentDetails, authMethod, trustDevice = true) => {
  let trustedDeviceId = null;
  let rawTrustedToken = null;

  if (trustDevice) {
    rawTrustedToken = crypto.randomBytes(32).toString("hex");
    const hashedTrustedToken = hashToken(rawTrustedToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const trustedDeviceRecord = await TrustedDevice.create({
      userId: user._id,
      tokenHash: hashedTrustedToken,
      deviceName: `${userAgentDetails.browser} on ${userAgentDetails.operatingSystem}`,
      browser: userAgentDetails.browser,
      operatingSystem: userAgentDetails.operatingSystem,
      deviceType: userAgentDetails.deviceType,
      expiresAt,
    });

    trustedDeviceId = trustedDeviceRecord._id;
    res.cookie("trusted_device_token", rawTrustedToken, getCookieOptions("trusted"));
  }

  const { session, accessToken, refreshToken } = await createSession(
    user,
    ipAddress,
    userAgentDetails,
    authMethod,
    trustedDeviceId
  );

  res.cookie("refresh_token", refreshToken, getCookieOptions("refresh"));

  return { session, accessToken, refreshToken, rawTrustedToken };
};

export const handleUserLogin = async (req, res, user, authMethod) => {
  const ipAddress = getClientIp(req);
  const userAgentString = req.headers["user-agent"];
  const userAgentDetails = parseUserAgent(userAgentString);
  userAgentDetails.location = await getApproximateLocation(ipAddress);

  // Check trusted device cookie
  const cookies = req.cookies || {};
  const trustedToken = cookies.trusted_device_token;
  let isRecognized = false;
  let trustedDeviceRecord = null;

  if (trustedToken) {
    const tokenHash = hashToken(trustedToken);
    trustedDeviceRecord = await TrustedDevice.findOne({
      userId: user._id,
      tokenHash,
      expiresAt: { $gt: new Date() },
    });

    if (trustedDeviceRecord) {
      isRecognized = true;
      // Update last used time
      trustedDeviceRecord.lastUsedAt = new Date();
      await trustedDeviceRecord.save();
    }
  }

  if (isRecognized) {
    // 1. Create successful session
    const { session, accessToken, refreshToken } = await createSession(
      user,
      ipAddress,
      userAgentDetails,
      authMethod,
      trustedDeviceRecord._id
    );

    // 2. Create LoginActivity
    await LoginActivity.create({
      userId: user._id,
      sessionId: session.sessionId,
      ipAddress,
      location: userAgentDetails.location,
      browser: userAgentDetails.browser,
      operatingSystem: userAgentDetails.operatingSystem,
      deviceType: userAgentDetails.deviceType,
      authenticationMethod: authMethod,
      isNewDevice: false,
      status: "Success",
    });

    // 3. Set refresh token cookie
    res.cookie("refresh_token", refreshToken, getCookieOptions("refresh"));

    // 4. Return response
    return res.status(200).json({ data: user, token: accessToken });
  } else {
    // 1. Create LoginActivity (OTP Required)
    await LoginActivity.create({
      userId: user._id,
      sessionId: null,
      ipAddress,
      location: userAgentDetails.location,
      browser: userAgentDetails.browser,
      operatingSystem: userAgentDetails.operatingSystem,
      deviceType: userAgentDetails.deviceType,
      authenticationMethod: authMethod,
      isNewDevice: true,
      status: "OTP_Required",
    });

    // 2. Generate temporary token for OTP phase
    const tempToken = jwt.sign(
      {
        userId: user._id,
        authMethod,
        ipAddress,
        userAgentDetails,
      },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    // 3. Generate and send OTP
    await createAndSendOtp(user);

    // 4. Return OTP Required response
    return res.status(200).json({
      status: "OTP_REQUIRED",
      tempToken,
      message: "An OTP has been sent to your registered email.",
    });
  }
};
