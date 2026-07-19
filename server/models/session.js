import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    deviceType: {
      type: String,
      enum: ["Desktop", "Mobile", "Tablet", "Other"],
      default: "Other",
    },
    browser: {
      type: String,
      default: "Unknown",
    },
    operatingSystem: {
      type: String,
      default: "Unknown",
    },
    ipAddress: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: "Unknown",
    },
    authenticationMethod: {
      type: String,
      enum: ["Email/Password", "Google", "GitHub"],
      required: true,
    },
    trustedDeviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrustedDevice",
      default: null,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Session", sessionSchema);
