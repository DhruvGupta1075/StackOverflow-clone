import mongoose from "mongoose";

const reputationHistorySchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    actionType: {
      type: String,
      required: true,
      enum: [
        "Answer Posted",
        "Accepted Answer",
        "Answer Upvoted",
        "Question Upvoted",
        "Profile Completed",
        "Downvote Received",
        "Answer Deleted",
        "Admin Removed Content",
        "Transfer Sent",
        "Transfer Received",
        "Manual Admin Adjustment"
      ],
      index: true
    },
    points: { type: Number, required: true },
    previousReputation: { type: Number, default: 0 },
    newReputation: { type: Number, default: 0 },
    referenceId: { type: String, default: null },
    referenceType: {
      type: String,
      enum: ["Question", "Answer", "Profile", "Transfer", "AdminAdjustment", "CommunityPost", null],
      default: null
    },
    description: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

reputationHistorySchema.index({ userId: 1, timestamp: -1 });
reputationHistorySchema.index({ userId: 1, actionType: 1 });

export default mongoose.model("ReputationHistory", reputationHistorySchema);
