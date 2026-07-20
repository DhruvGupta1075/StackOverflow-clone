import mongoose from "mongoose";
import User from "../models/auth.js";
import ReputationHistory from "../models/reputationHistory.js";
import ReputationTransfer from "../models/reputationTransfer.js";
import Question from "../models/question.js";
import Post from "../models/post.js";
import {
  modifyReputation,
  getCommunityRank,
  getUnlockedPrivileges,
  PRIVILEGES
} from "../services/reputationService.js";

// GET /api/reputation
export const getUserReputation = async (req, res) => {
  try {
    const targetUserId = req.query.userId || req.userid;
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const userDoc = await User.findById(targetUserId).select("-password");
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate lifetime earned and lost from history
    const historyLogs = await ReputationHistory.find({ userId: targetUserId });
    let lifetimeEarned = 0;
    let lifetimeLost = 0;

    historyLogs.forEach((log) => {
      if (log.points > 0) {
        lifetimeEarned += log.points;
      } else if (log.points < 0) {
        lifetimeLost += Math.abs(log.points);
      }
    });

    const rank = getCommunityRank(userDoc.reputation);
    const unlockedPrivileges = getUnlockedPrivileges(userDoc.reputation);

    // Calculate progress to next rank milestone
    let nextMilestone = 50;
    if (userDoc.reputation >= 1000) nextMilestone = 1000;
    else if (userDoc.reputation >= 500) nextMilestone = 1000;
    else if (userDoc.reputation >= 250) nextMilestone = 500;
    else if (userDoc.reputation >= 100) nextMilestone = 250;
    else if (userDoc.reputation >= 50) nextMilestone = 100;

    const progressBarPercent = Math.min(100, Math.round((userDoc.reputation / nextMilestone) * 100));

    const isProfileComplete = !!(
      userDoc.name &&
      userDoc.about &&
      userDoc.about.trim().length > 10 &&
      userDoc.tags &&
      userDoc.tags.length > 0
    );

    const recentActivity = await ReputationHistory.find({ userId: targetUserId })
      .sort({ timestamp: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        reputation: userDoc.reputation || 0,
        rank,
        unlockedPrivileges,
        allPrivileges: PRIVILEGES,
        lifetimeEarned,
        lifetimeLost,
        nextMilestone,
        progressBarPercent,
        isProfileComplete,
        profileCompletedRewardClaimed: !!userDoc.profileCompletedRewardClaimed,
        badges: userDoc.badges || [],
        suspendTransfer: !!userDoc.suspendTransfer,
        recentActivity
      }
    });
  } catch (error) {
    console.error("Error in getUserReputation:", error);
    res.status(500).json({ message: "Failed to fetch reputation data" });
  }
};

// GET /api/reputation/history
export const getReputationHistory = async (req, res) => {
  const targetUserId = req.query.userId || req.userid;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const skip = (page - 1) * limit;
  const actionType = req.query.actionType;

  try {
    const query = { userId: targetUserId };
    if (actionType) {
      query.actionType = actionType;
    }

    const history = await ReputationHistory.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await ReputationHistory.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      history,
      currentPage: page,
      totalPages,
      totalCount
    });
  } catch (error) {
    console.error("Error in getReputationHistory:", error);
    res.status(500).json({ message: "Failed to fetch reputation history" });
  }
};

// GET /api/reputation/transfers
export const getTransferHistory = async (req, res) => {
  const userId = req.userid;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { filter, search } = req.query;

  try {
    let matchQuery = {};

    if (filter === "incoming") {
      matchQuery.receiverId = new mongoose.Types.ObjectId(userId);
    } else if (filter === "outgoing") {
      matchQuery.senderId = new mongoose.Types.ObjectId(userId);
    } else {
      matchQuery.$or = [
        { senderId: new mongoose.Types.ObjectId(userId) },
        { receiverId: new mongoose.Types.ObjectId(userId) }
      ];
    }

    let transfers = await ReputationTransfer.find(matchQuery)
      .populate("senderId", "name username email")
      .populate("receiverId", "name username email")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    if (search) {
      const s = search.toLowerCase();
      transfers = transfers.filter(
        (t) =>
          t.reason.toLowerCase().includes(s) ||
          t.senderId?.name?.toLowerCase().includes(s) ||
          t.receiverId?.name?.toLowerCase().includes(s) ||
          t.transactionId.toLowerCase().includes(s)
      );
    }

    const totalCount = await ReputationTransfer.countDocuments(matchQuery);
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      transfers,
      currentPage: page,
      totalPages,
      totalCount
    });
  } catch (error) {
    console.error("Error in getTransferHistory:", error);
    res.status(500).json({ message: "Failed to fetch transfer history" });
  }
};

// POST /api/reputation/transfer
export const transferReputation = async (req, res) => {
  const senderId = req.userid;
  const { receiverId, amount, reason } = req.body;

  try {
    if (!receiverId || !amount || !reason) {
      return res.status(400).json({ message: "Recipient, amount, and reason are required." });
    }

    const transferAmount = parseInt(amount, 10);

    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ message: "Transfer amount must be a positive integer." });
    }

    if (transferAmount > 50) {
      return res.status(400).json({ message: "Maximum transfer limit is 50 reputation per transaction." });
    }

    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({ message: "You cannot transfer reputation to yourself." });
    }

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender) {
      return res.status(404).json({ message: "Sender account not found." });
    }

    if (!receiver) {
      return res.status(404).json({ message: "Recipient user not found." });
    }

    if (sender.suspendTransfer) {
      return res.status(403).json({ message: "Your reputation transfer feature has been suspended by an administrator." });
    }

    if ((sender.reputation || 0) <= 50) {
      return res.status(400).json({ message: "You must have more than 50 reputation to transfer points." });
    }

    if ((sender.reputation || 0) < transferAmount) {
      return res.status(400).json({ message: `Insufficient reputation balance. You have ${sender.reputation} points available.` });
    }

    // Daily limit validation (Max 100 daily)
    const todayStr = new Date().toISOString().split("T")[0];
    const senderLastDateStr = sender.dailyTransferDate
      ? new Date(sender.dailyTransferDate).toISOString().split("T")[0]
      : null;

    let dailyTransferred = sender.dailyTransferredToday || 0;
    if (senderLastDateStr !== todayStr) {
      dailyTransferred = 0;
    }

    if (dailyTransferred + transferAmount > 100) {
      return res.status(400).json({
        message: `Daily transfer limit exceeded. You have transferred ${dailyTransferred}/100 points today. Maximum allowed remaining: ${100 - dailyTransferred}.`
      });
    }

    // Deduct from sender
    await modifyReputation({
      userId: senderId,
      actionType: "Transfer Sent",
      points: -transferAmount,
      referenceId: receiverId,
      referenceType: "Transfer",
      description: `Transferred ${transferAmount} reputation to ${receiver.name} (${reason})`
    });

    // Add to receiver
    await modifyReputation({
      userId: receiverId,
      actionType: "Transfer Received",
      points: transferAmount,
      referenceId: senderId,
      referenceType: "Transfer",
      description: `Received ${transferAmount} reputation from ${sender.name} (${reason})`
    });

    // Update sender daily transfer counter
    sender.dailyTransferredToday = dailyTransferred + transferAmount;
    sender.dailyTransferDate = new Date();
    await sender.save();

    // Record transfer log
    const transactionId = `TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const transferRecord = new ReputationTransfer({
      senderId,
      receiverId,
      amount: transferAmount,
      reason,
      timestamp: new Date(),
      status: "completed",
      transactionId
    });

    await transferRecord.save();

    res.status(200).json({
      success: true,
      message: `Successfully transferred ${transferAmount} reputation to ${receiver.name}!`,
      transfer: transferRecord,
      newReputation: sender.reputation - transferAmount
    });
  } catch (error) {
    console.error("Error in transferReputation:", error);
    res.status(500).json({ message: "Failed to complete reputation transfer" });
  }
};

// GET /api/reputation/leaderboard
export const getLeaderboard = async (req, res) => {
  const period = req.query.period || "all_time"; // today, week, month, all_time

  try {
    let usersList = [];

    if (period === "all_time") {
      usersList = await User.find({ isBanned: { $ne: true } })
        .select("name username reputation badges joinDate plan")
        .sort({ reputation: -1 })
        .limit(50);
    } else {
      let startDate = new Date();
      if (period === "today") {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === "week") {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === "month") {
        startDate.setDate(startDate.getDate() - 30);
      }

      // Aggregate history records within time range
      const periodAgg = await ReputationHistory.aggregate([
        { $match: { timestamp: { $gte: startDate }, points: { $gt: 0 } } },
        { $group: { _id: "$userId", periodPoints: { $sum: "$points" } } },
        { $sort: { periodPoints: -1 } },
        { $limit: 50 }
      ]);

      const userIds = periodAgg.map((item) => item._id);
      const userDocs = await User.find({ _id: { $in: userIds }, isBanned: { $ne: true } }).select(
        "name username reputation badges joinDate plan"
      );

      const userMap = {};
      userDocs.forEach((u) => {
        userMap[u._id.toString()] = u;
      });

      usersList = periodAgg
        .map((item) => {
          const uDoc = userMap[item._id.toString()];
          if (!uDoc) return null;
          const uObj = uDoc.toObject();
          uObj.periodReputation = item.periodPoints;
          return uObj;
        })
        .filter(Boolean);
    }

    // Attach contribution counts & community rank
    const leaderboard = await Promise.all(
      usersList.map(async (uDoc, index) => {
        const uId = uDoc._id.toString();
        const [questionCount, postCount] = await Promise.all([
          Question.countDocuments({ userid: uId }),
          Post.countDocuments({ user: uId })
        ]);

        const questionsWithAns = await Question.find({ "answer.userid": uId });
        let answerCount = 0;
        questionsWithAns.forEach((q) => {
          q.answer.forEach((ans) => {
            if (ans.userid === uId) answerCount++;
          });
        });

        const totalContributions = questionCount + answerCount + postCount;
        const rankName = getCommunityRank(uDoc.reputation);

        return {
          rank: index + 1,
          _id: uDoc._id,
          name: uDoc.name,
          username: uDoc.username,
          plan: uDoc.plan || "Free",
          reputation: uDoc.reputation || 0,
          periodReputation: uDoc.periodReputation !== undefined ? uDoc.periodReputation : uDoc.reputation || 0,
          communityRank: rankName,
          badges: uDoc.badges || [],
          questionCount,
          answerCount,
          postCount,
          totalContributions
        };
      })
    );

    res.status(200).json({
      success: true,
      period,
      leaderboard
    });
  } catch (error) {
    console.error("Error in getLeaderboard:", error);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
};
