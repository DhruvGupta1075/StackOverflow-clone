import express from "express";
import auth from "../middleware/auth.js";
import {
  getUserReputation,
  getReputationHistory,
  getTransferHistory,
  transferReputation,
  getLeaderboard
} from "../controller/reputation.js";

const router = express.Router();

router.get("/", auth, getUserReputation);
router.get("/history", auth, getReputationHistory);
router.get("/transfers", auth, getTransferHistory);
router.post("/transfer", auth, transferReputation);
router.get("/leaderboard", getLeaderboard);

export default router;
