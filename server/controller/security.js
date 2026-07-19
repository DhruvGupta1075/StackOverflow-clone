import jwt from "jsonwebtoken";
import crypto from "crypto";
import userModel from "../models/auth.js";
import Session from "../models/session.js";
import TrustedDevice from "../models/trustedDevice.js";
import LoginActivity from "../models/loginActivity.js";
import { verifyOtpCode, resendOtpCode } from "../services/otpService.js";
import {
  createSession,
  rotateSessionToken,
  getCookieOptions,
  hashToken,
  establishSession,
  getInactivityLimit,
} from "../services/sessionService.js";
import { sendNewDeviceAlertEmail } from "../services/emailService.js";

// 1. Verify OTP for new device login
export const verifyOtp = async (req, res) => {
  const { tempToken, otpCode, trustDevice } = req.body;

  if (!tempToken || !otpCode) {
    return res.status(400).json({ message: "Verification parameters are missing." });
  }

  try {
    // Verify temporary token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: "Verification window expired. Please log in again." });
    }

    const { userId, authMethod, ipAddress, userAgentDetails } = decoded;
    const matchedUser = await userModel.findById(userId);
    if (!matchedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Verify OTP
    const verifyResult = await verifyOtpCode(userId, otpCode);
    if (!verifyResult.success) {
      return res.status(400).json({ message: verifyResult.reason });
    }

    // Establish session (which handles trusted device creation and cookie setting)
    const { session, accessToken } = await establishSession(
      res,
      matchedUser,
      ipAddress,
      userAgentDetails,
      authMethod,
      !!trustDevice
    );

    // Create login activity log
    await LoginActivity.create({
      userId,
      sessionId: session.sessionId,
      ipAddress,
      location: userAgentDetails.location,
      browser: userAgentDetails.browser,
      operatingSystem: userAgentDetails.operatingSystem,
      deviceType: userAgentDetails.deviceType,
      authenticationMethod: authMethod,
      isNewDevice: true,
      status: "Success",
    });

    // Send email alert for new device login
    await sendNewDeviceAlertEmail(matchedUser.email, matchedUser.name, {
      browser: userAgentDetails.browser,
      operatingSystem: userAgentDetails.operatingSystem,
      deviceType: userAgentDetails.deviceType,
      ipAddress,
      location: userAgentDetails.location,
      timestamp: new Date(),
    });

    return res.status(200).json({ data: matchedUser, token: accessToken });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return res.status(500).json({ message: "Something went wrong during verification." });
  }
};

// 2. Resend OTP code
export const resendOtp = async (req, res) => {
  const { tempToken } = req.body;

  if (!tempToken) {
    return res.status(400).json({ message: "Token is required." });
  }

  try {
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: "Verification window expired. Please log in again." });
    }

    const matchedUser = await userModel.findById(decoded.userId);
    if (!matchedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const resendResult = await resendOtpCode(matchedUser);
    if (!resendResult.success) {
      return res.status(400).json({ message: resendResult.reason });
    }

    return res.status(200).json({ message: resendResult.message });
  } catch (error) {
    console.error("Error in resendOtp:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// 3. Get all active sessions for current user
export const getSessions = async (req, res) => {
  try {
    // Inactivity timeout cleanup & listing
    const sessions = await Session.find({
      userId: req.userid,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    const activeSessions = [];
    const now = new Date();
    const inactivityLimit = getInactivityLimit();

    for (const session of sessions) {
      if (now.getTime() - session.lastActiveAt.getTime() > inactivityLimit) {
        session.isRevoked = true;
        session.revokedAt = now;
        await session.save();
      } else {
        activeSessions.push({
          sessionId: session.sessionId,
          deviceType: session.deviceType,
          browser: session.browser,
          operatingSystem: session.operatingSystem,
          location: session.location,
          ipAddress: session.ipAddress,
          createdAt: session.createdAt,
          lastActiveAt: session.lastActiveAt,
          authenticationMethod: session.authenticationMethod,
          isCurrent: session.sessionId === req.sessionId,
          isTrusted: !!session.trustedDeviceId,
        });
      }
    }

    return res.status(200).json({ data: activeSessions });
  } catch (error) {
    console.error("Error in getSessions:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// 4. Revoke a specific session
export const revokeSession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await Session.findOne({ userId: req.userid, sessionId });

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    session.isRevoked = true;
    session.revokedAt = new Date();
    await session.save();

    return res.status(200).json({ message: "Session revoked successfully." });
  } catch (error) {
    console.error("Error in revokeSession:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// 5. Revoke all other sessions (excluding current one)
export const revokeOtherSessions = async (req, res) => {
  try {
    if (!req.sessionId) {
      return res.status(400).json({ message: "Active session identifier is missing." });
    }

    await Session.updateMany(
      {
        userId: req.userid,
        sessionId: { $ne: req.sessionId },
        isRevoked: false,
      },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      }
    );

    return res.status(200).json({ message: "Other sessions revoked successfully." });
  } catch (error) {
    console.error("Error in revokeOtherSessions:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// 6. Get all trusted devices
export const getTrustedDevices = async (req, res) => {
  try {
    const devices = await TrustedDevice.find({
      userId: req.userid,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    const formattedDevices = devices.map((d) => ({
      deviceId: d._id,
      deviceName: d.deviceName,
      browser: d.browser,
      operatingSystem: d.operatingSystem,
      deviceType: d.deviceType,
      createdAt: d.createdAt,
      lastUsedAt: d.lastUsedAt,
    }));

    return res.status(200).json({ data: formattedDevices });
  } catch (error) {
    console.error("Error in getTrustedDevices:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// 7. Remove/revoke a trusted device
export const removeTrustedDevice = async (req, res) => {
  const { deviceId } = req.params;

  try {
    const device = await TrustedDevice.findOneAndDelete({
      userId: req.userid,
      _id: deviceId,
    });

    if (!device) {
      return res.status(404).json({ message: "Trusted device not found." });
    }

    // Also invalidate any sessions linked to this trusted device
    await Session.updateMany(
      { userId: req.userid, trustedDeviceId: deviceId, isRevoked: false },
      { $set: { isRevoked: true, revokedAt: new Date() } }
    );

    return res.status(200).json({ message: "Trusted device removed successfully." });
  } catch (error) {
    console.error("Error in removeTrustedDevice:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// 8. Get current user's login activity logs
export const getLoginHistory = async (req, res) => {
  try {
    const logs = await LoginActivity.find({ userId: req.userid })
      .sort({ timestamp: -1 })
      .limit(50);

    return res.status(200).json({ data: logs });
  } catch (error) {
    console.error("Error in getLoginHistory:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// 9. Refresh Access Token using Refresh Token cookie
export const refreshToken = async (req, res) => {
  const oldRefreshToken = req.cookies.refresh_token;

  if (!oldRefreshToken) {
    return res.status(401).json({ message: "Refresh token is missing." });
  }

  try {
    const { accessToken, refreshToken: newRefreshToken } = await rotateSessionToken(oldRefreshToken);

    // Set new refresh token cookie
    res.cookie("refresh_token", newRefreshToken, getCookieOptions("refresh"));

    return res.status(200).json({ token: accessToken });
  } catch (error) {
    console.error("Error refreshing token:", error.message);
    
    // Clear cookie on failure
    res.clearCookie("refresh_token", { path: "/" });
    return res.status(401).json({ message: error.message || "Failed to refresh token." });
  }
};

// 10. Admin Security: View login activities across the application
export const getAdminLoginHistory = async (req, res) => {
  try {
    // Confirm user is Admin
    const currentUser = await userModel.findById(req.userid);
    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Administrator privileges required." });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Date filtering
    if (req.query.startDate || req.query.endDate) {
      query.timestamp = {};
      if (req.query.startDate) {
        query.timestamp.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.timestamp.$lte = new Date(req.query.endDate);
      }
    }

    // Auth method filtering
    if (req.query.method) {
      query.authenticationMethod = req.query.method;
    }

    // User search filtering
    if (req.query.search) {
      const users = await userModel.find({
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }).select("_id");

      const userIds = users.map((u) => u._id);
      query.userId = { $in: userIds };
    }

    const logsCount = await LoginActivity.countDocuments(query);
    const logs = await LoginActivity.find(query)
      .populate("userId", "name email")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(logsCount / limit);

    return res.status(200).json({
      data: logs,
      pagination: {
        totalItems: logsCount,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error in getAdminLoginHistory:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

// 11. Logout current session
export const logoutCurrentSession = async (req, res) => {
  try {
    if (!req.sessionId) {
      return res.status(400).json({ message: "Active session identifier is missing." });
    }

    const session = await Session.findOne({ userId: req.userid, sessionId: req.sessionId });
    if (session) {
      session.isRevoked = true;
      session.revokedAt = new Date();
      await session.save();
    }

    // Clear refresh token cookie
    res.clearCookie("refresh_token", { path: "/" });

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Error in logoutCurrentSession:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};
