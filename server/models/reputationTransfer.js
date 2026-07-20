import mongoose from "mongoose";

const reputationTransferSchema = mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    status: {
      type: String,
      enum: ["completed", "reversed", "failed"],
      default: "completed"
    },
    transactionId: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

reputationTransferSchema.index({ senderId: 1, timestamp: -1 });
reputationTransferSchema.index({ receiverId: 1, timestamp: -1 });

export default mongoose.model("ReputationTransfer", reputationTransferSchema);
