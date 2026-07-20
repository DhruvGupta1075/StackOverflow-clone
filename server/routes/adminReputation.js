import express from "express";
import auth from "../middleware/auth.js";
import {
  getAdminReputationStats,
  getAdminReputationHistory,
  getAdminTransferHistory,
  adjustReputationManually,
  reverseTransfer,
  toggleSuspendTransfer
} from "../controller/adminReputation.js";

const router = express.Router();

router.get("/stats", auth, getAdminReputationStats);
router.get("/history", auth, getAdminReputationHistory);
router.get("/transfers", auth, getAdminTransferHistory);
router.post("/adjust", auth, adjustReputationManually);
router.post("/reverse-transfer", auth, reverseTransfer);
router.post("/toggle-suspend-transfer", auth, toggleSuspendTransfer);

export default router;
