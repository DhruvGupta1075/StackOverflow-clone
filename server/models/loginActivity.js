import mongoose from "mongoose";

const loginActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: "Unknown",
    },
    browser: {
      type: String,
      default: "Unknown",
    },
    operatingSystem: {
      type: String,
      default: "Unknown",
    },
    deviceType: {
      type: String,
      enum: ["Desktop", "Mobile", "Tablet", "Other"],
      default: "Other",
    },
    authenticationMethod: {
      type: String,
      enum: ["Email/Password", "Google", "GitHub"],
      required: true,
    },
    isNewDevice: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Success", "Failed", "OTP_Required"],
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("LoginActivity", loginActivitySchema);
