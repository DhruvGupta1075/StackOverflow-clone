import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    text: {
      type: String,
      default: "",
    },
    images: {
      type: [String], // Array of base64 image strings
      default: [],
    },
    codeSnippet: {
      code: { type: String, default: "" },
      language: { type: String, default: "" },
    },
    projectShowcase: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      githubRepo: { type: String, default: "" },
      liveDemo: { type: String, default: "" },
      technologies: { type: [String], default: [] },
      thumbnail: { type: String, default: "" }, // Base64 thumbnail string
    },
    learningAchievement: {
      milestone: { type: String, default: "" },
      courseTitle: { type: String, default: "" },
      certificationName: { type: String, default: "" },
      contestRanking: { type: String, default: "" },
      badge: { type: String, default: "" },
    },
    likes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
      default: [],
    },
    bookmarksCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    sharesCount: {
      type: Number,
      default: 0,
    },
    reportsCount: {
      type: Number,
      default: 0,
    },
    reports: {
      type: [
        {
          reporter: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
          reason: {
            type: String,
            enum: ["Spam", "Harassment", "Hate Speech", "Misinformation", "Adult Content", "Other"],
          },
          details: { type: String, default: "" },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    hashtags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Indexes for searching/sorting performance
postSchema.index({ user: 1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ "projectShowcase.title": "text", text: "text" });

export default mongoose.model("Post", postSchema);
