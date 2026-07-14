import express from "express";
import auth from "../middleware/auth.js";
import user from "../models/auth.js";
import {
  createPost,
  updatePost,
  deletePost,
  getFeed,
  likePost,
  unlikePost,
  createComment,
  getCommentsForPost,
  updateComment,
  deleteComment,
  likeComment,
  bookmarkPost,
  unbookmarkPost,
  getBookmarkedPosts,
  followUser,
  unfollowUser,
  getTrendingPosts,
  sharePost,
  getNotifications,
  markNotificationsAsRead,
  reportPost,
  getReports,
  moderateReport,
  moderateUser,
  checkFollowStatus,
} from "../controller/community.js";

const router = express.Router();

// Inline Admin Authorization Middleware
const adminAuth = async (req, res, next) => {
  try {
    const currentUser = await user.findById(req.userid);
    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: "Admin authorization check failed" });
  }
};

// Feed & Global Reads
router.get("/feed", getFeed);
router.get("/trending", getTrendingPosts);
router.get("/post/:id/comments", getCommentsForPost);

// Authenticated Reads & Actions
router.post("/post", auth, createPost);
router.patch("/post/:id", auth, updatePost);
router.delete("/post/:id", auth, deletePost);

router.post("/post/:id/like", auth, likePost);
router.post("/post/:id/unlike", auth, unlikePost);

router.post("/post/:id/comment", auth, createComment);
router.patch("/comment/:id", auth, updateComment);
router.delete("/comment/:id", auth, deleteComment);
router.post("/comment/:id/like", auth, likeComment);

router.post("/post/:id/bookmark", auth, bookmarkPost);
router.post("/post/:id/unbookmark", auth, unbookmarkPost);
router.get("/bookmarks", auth, getBookmarkedPosts);

router.post("/user/:id/follow", auth, followUser);
router.post("/user/:id/unfollow", auth, unfollowUser);
router.get("/user/:id/follow-status", auth, checkFollowStatus);

router.post("/post/:id/share", sharePost);

router.get("/notifications", auth, getNotifications);
router.post("/notifications/read", auth, markNotificationsAsRead);

router.post("/post/:id/report", auth, reportPost);

// Admin Moderation Panel (Requires Admin role)
router.get("/admin/reports", auth, adminAuth, getReports);
router.post("/admin/reports/:reportId", auth, adminAuth, moderateReport);
router.post("/admin/user/:userId", auth, adminAuth, moderateUser);

export default router;
