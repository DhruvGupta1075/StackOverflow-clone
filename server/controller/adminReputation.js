import User from "../models/auth.js";
import ReputationHistory from "../models/reputationHistory.js";
import ReputationTransfer from "../models/reputationTransfer.js";
import { modifyReputation } from "../services/reputationService.js";

// Helper to check if requester is admin
const verifyAdmin = async (userId) => {
  const currentUser = await User.findById(userId);
  return currentUser && currentUser.role === "admin";
};

// GET /api/admin/reputation/stats
export const getAdminReputationStats = async (req, res) => {
  try {
    if (!(await verifyAdmin(req.userid))) {
      return res.status(403).json({ message: "Admin authorization required." });
    }

    const totalUsers = await User.countDocuments();
    const totalReputationResult = await User.aggregate([
      { $group: { _id: null, totalRep: { $sum: "$reputation" } } }
    ]);
    const totalReputation = totalReputationResult[0]?.totalRep || 0;

    const totalTransfers = await ReputationTransfer.countDocuments();
    const transferVolumeResult = await ReputationTransfer.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, totalVolume: { $sum: "$amount" } } }
    ]);
    const totalTransferVolume = transferVolumeResult[0]?.totalVolume || 0;

    const totalActivityLogs = await ReputationHistory.countDocuments();

    const topContributors = await User.find({ isBanned: { $ne: true } })
      .select("name username email reputation badges suspendTransfer role")
      .sort({ reputation: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalReputation,
        totalTransfers,
        totalTransferVolume,
        totalActivityLogs
      },
      topContributors
    });
  } catch (error) {
    console.error("Error in getAdminReputationStats:", error);
    res.status(500).json({ message: "Failed to fetch admin reputation stats" });
  }
};

// GET /api/admin/reputation/history
export const getAdminReputationHistory = async (req, res) => {
  try {
    if (!(await verifyAdmin(req.userid))) {
      return res.status(403).json({ message: "Admin authorization required." });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { actionType, search } = req.query;

    let query = {};
    if (actionType) {
      query.actionType = actionType;
    }

    let history = await ReputationHistory.find(query)
      .populate("userId", "name username email")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    if (search) {
      const s = search.toLowerCase();
      history = history.filter(
        (h) =>
          h.description?.toLowerCase().includes(s) ||
          h.userId?.name?.toLowerCase().includes(s) ||
          h.userId?.username?.toLowerCase().includes(s) ||
          h.userId?.email?.toLowerCase().includes(s)
      );
    }

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
    console.error("Error in getAdminReputationHistory:", error);
    res.status(500).json({ message: "Failed to fetch admin reputation history" });
  }
};

// GET /api/admin/reputation/transfers
export const getAdminTransferHistory = async (req, res) => {
  try {
    if (!(await verifyAdmin(req.userid))) {
      return res.status(403).json({ message: "Admin authorization required." });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, status } = req.query;

    let matchQuery = {};
    if (status) {
      matchQuery.status = status;
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
          t.reason?.toLowerCase().includes(s) ||
          t.transactionId?.toLowerCase().includes(s) ||
          t.senderId?.name?.toLowerCase().includes(s) ||
          t.receiverId?.name?.toLowerCase().includes(s)
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
    console.error("Error in getAdminTransferHistory:", error);
    res.status(500).json({ message: "Failed to fetch admin transfer history" });
  }
};

// POST /api/admin/reputation/adjust
export const adjustReputationManually = async (req, res) => {
  try {
    if (!(await verifyAdmin(req.userid))) {
      return res.status(403).json({ message: "Admin authorization required." });
    }

    const { userId, points, reason } = req.body;

    if (!userId || points === undefined || !reason || !reason.trim()) {
      return res.status(400).json({ message: "User ID, point adjustment (+/-), and reason are required." });
    }

    const numericPoints = parseInt(points, 10);
    if (isNaN(numericPoints) || numericPoints === 0) {
      return res.status(400).json({ message: "Points must be a non-zero integer." });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found." });
    }

    const adminUser = await User.findById(req.userid);

    const result = await modifyReputation({
      userId,
      actionType: "Manual Admin Adjustment",
      points: numericPoints,
      referenceId: req.userid,
      referenceType: "AdminAdjustment",
      description: `Manual adjustment by admin ${adminUser.name}: ${reason} (${numericPoints > 0 ? "+" : ""}${numericPoints} pts)`
    });

    res.status(200).json({
      success: true,
      message: `Successfully adjusted reputation by ${numericPoints > 0 ? "+" : ""}${numericPoints} points for ${targetUser.name}.`,
      user: result.user,
      newReputation: result.user.reputation
    });
  } catch (error) {
    console.error("Error in adjustReputationManually:", error);
    res.status(500).json({ message: "Failed to adjust user reputation" });
  }
};

// POST /api/admin/reputation/reverse-transfer
export const reverseTransfer = async (req, res) => {
  try {
    if (!(await verifyAdmin(req.userid))) {
      return res.status(403).json({ message: "Admin authorization required." });
    }

    const { transferId, reason } = req.body;

    if (!transferId || !reason) {
      return res.status(400).json({ message: "Transfer ID and reason are required for reversal." });
    }

    const transferDoc = await ReputationTransfer.findById(transferId);
    if (!transferDoc) {
      return res.status(404).json({ message: "Transfer record not found." });
    }

    if (transferDoc.status === "reversed") {
      return res.status(400).json({ message: "This transfer has already been reversed." });
    }

    const amount = transferDoc.amount;

    // Refund sender
    await modifyReputation({
      userId: transferDoc.senderId,
      actionType: "Manual Admin Adjustment",
      points: amount,
      referenceId: String(transferDoc._id),
      referenceType: "Transfer",
      description: `Reversal refund of transfer ${transferDoc.transactionId}: ${reason}`
    });

    // Deduct from receiver
    await modifyReputation({
      userId: transferDoc.receiverId,
      actionType: "Manual Admin Adjustment",
      points: -amount,
      referenceId: String(transferDoc._id),
      referenceType: "Transfer",
      description: `Reversal deduction of transfer ${transferDoc.transactionId}: ${reason}`
    });

    transferDoc.status = "reversed";
    await transferDoc.save();

    res.status(200).json({
      success: true,
      message: `Transfer ${transferDoc.transactionId} reversed successfully.`,
      transfer: transferDoc
    });
  } catch (error) {
    console.error("Error in reverseTransfer:", error);
    res.status(500).json({ message: "Failed to reverse transfer" });
  }
};

// POST /api/admin/reputation/toggle-suspend-transfer
export const toggleSuspendTransfer = async (req, res) => {
  try {
    if (!(await verifyAdmin(req.userid))) {
      return res.status(403).json({ message: "Admin authorization required." });
    }

    const { userId, suspend } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    targetUser.suspendTransfer = suspend !== undefined ? Boolean(suspend) : !targetUser.suspendTransfer;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `User transfer capability is now ${targetUser.suspendTransfer ? "SUSPENDED" : "ACTIVE"}.`,
      suspendTransfer: targetUser.suspendTransfer
    });
  } catch (error) {
    console.error("Error in toggleSuspendTransfer:", error);
    res.status(500).json({ message: "Failed to update user transfer status" });
  }
};
