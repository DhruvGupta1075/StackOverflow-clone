import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    reason: {
      type: String,
      enum: ["Spam", "Harassment", "Hate Speech", "Misinformation", "Adult Content", "Other"],
      required: true,
    },
    details: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "dismissed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });

export default mongoose.model("Report", reportSchema);
