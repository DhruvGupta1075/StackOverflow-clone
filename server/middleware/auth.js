import jwt from "jsonwebtoken";
import user from "../models/auth.js";
import Session from "../models/session.js";
import { getInactivityLimit } from "../services/sessionService.js";

const auth = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Authorization token is missing." });
    }
    
    const token = req.headers.authorization.split(" ")[1];
    let decodedata;
    try {
      decodedata = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Authentication failed. Session expired or invalid." });
    }

    req.userid = decodedata?.id;
    req.sessionId = decodedata?.sessionId;

    if (!req.sessionId) {
      return res.status(401).json({ message: "Session identifier is missing. Please log in again." });
    }

    // Look up session in MongoDB
    const session = await Session.findOne({ sessionId: req.sessionId });
    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      return res.status(401).json({ message: "Session revoked or expired. Please log in again." });
    }

    // Inactivity check
    const inactivityLimit = getInactivityLimit();
    if (Date.now() - session.lastActiveAt.getTime() > inactivityLimit) {
      session.isRevoked = true;
      session.revokedAt = new Date();
      await session.save();
      return res.status(401).json({ message: "Session expired due to inactivity. Please log in again." });
    }

    // Throttled update of lastActiveAt (once every 2 minutes)
    if (Date.now() - session.lastActiveAt.getTime() > 2 * 60 * 1000) {
      session.lastActiveAt = new Date();
      await session.save();
    }

    // Check if user is suspended/banned
    if (req.userid) {
      const currentUser = await user.findById(req.userid);
      if (currentUser) {
        if (currentUser.isSuspended || currentUser.isBanned) {
          return res.status(403).json({ message: "Your account is suspended or banned due to content violations." });
        }
      }
    }
    
    next();
  } catch (error) {
    console.error("Authentication verification failed:", error.message);
    return res.status(401).json({ message: "Authentication failed. Session expired or invalid." });
  }
};

export default auth;
