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
  lastForgotPasswordRequest: { type: Date, default: null }
});
export default mongoose.model("user", userschema);
