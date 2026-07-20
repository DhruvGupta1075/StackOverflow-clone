import User from "../models/auth.js";
import { PRIVILEGES } from "../services/reputationService.js";

export const requirePrivilege = (privilegeKey, minRepOverride) => {
  return async (req, res, next) => {
    try {
      if (!req.userid) {
        return res.status(401).json({ message: "Authentication required." });
      }

      const currentUser = await User.findById(req.userid);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found." });
      }

      // Admins bypass privilege restrictions
      if (currentUser.role === "admin") {
        return next();
      }

      const privInfo = PRIVILEGES[privilegeKey];
      const requiredRep = minRepOverride || privInfo?.minRep || 0;

      const userRep = currentUser.reputation || 0;
      if (userRep < requiredRep) {
        return res.status(403).json({
          message: `Insufficient reputation. You need at least ${requiredRep} reputation to perform this action. Your current reputation is ${userRep}.`,
          requiredReputation: requiredRep,
          currentReputation: userRep,
          privilegeKey,
          privilegeName: privInfo?.name || privilegeKey
        });
      }

      next();
    } catch (error) {
      console.error("[PrivilegeCheck Middleware Error]:", error);
      return res.status(500).json({ message: "Failed to verify privilege permissions." });
    }
  };
};
