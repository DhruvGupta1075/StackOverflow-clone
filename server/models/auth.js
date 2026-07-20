import mongoose from "mongoose";

const userschema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String },
  googleId: { type: String, default: null },
  githubId: { type: String, default: null },
  username: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  confirmedViolations: { type: Number, default: 0 },
  isSuspended: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  about: { type: String },
  tags: { type: [String] },
  joinDate: { type: Date, default: Date.now },
  plan: { type: String, enum: ["Free", "Bronze", "Silver", "Gold"], default: "Free" },
  subscriptionStatus: { type: String, enum: ["active", "inactive", "canceled"], default: "inactive" },
  subscriptionId: { type: String, default: null },
  customerId: { type: String, default: null },
  renewalDate: { type: Date, default: null },
  billingDetails: {
    type: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      address: { type: String, default: "" }
    },
    default: { name: "", email: "", phone: "", address: "" }
  },
  paymentHistory: {
    type: [
      {
        paymentId: String,
        amount: Number,
        currency: { type: String, default: "INR" },
        status: String,
        date: { type: Date, default: Date.now },
        invoiceId: String,
        plan: String
      }
    ],
    default: []
  },
  bookmarks: { type: [String], default: [] },
  lastForgotPasswordRequest: { type: Date, default: null },
  preferredLanguage: { type: String, default: "en" },
  otpCode: { type: String, default: null },
  otpExpiry: { type: Date, default: null },
  otpAttempts: { type: Number, default: 0 },
  otpResendAttempts: { type: Number, default: 0 },
  lastOtpSent: { type: Date, default: null },
  otpType: { type: String, default: null },
  languageVerificationStatus: { type: String, default: "verified" },
  languageVerificationLockUntil: { type: Date, default: null },
  reputation: { type: Number, default: 0 },
  profileCompletedRewardClaimed: { type: Boolean, default: false },
  dailyTransferredToday: { type: Number, default: 0 },
  dailyTransferDate: { type: Date, default: null },
  unlockedPrivileges: { type: [String], default: [] },
  suspendTransfer: { type: Boolean, default: false },
  badges: {
    type: [
      {
        name: { type: String, required: true },
        icon: { type: String, default: "trophy" },
        description: { type: String, default: "" },
        awardedAt: { type: Date, default: Date.now }
      }
    ],
    default: []
  }
});
export default mongoose.model("user", userschema);
