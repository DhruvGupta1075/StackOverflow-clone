import mongoose from "mongoose";
import user from "../models/auth.js";
import Post from "../models/post.js";
import Comment from "../models/comment.js";
import Follow from "../models/follow.js";
import Bookmark from "../models/bookmark.js";
import Notification from "../models/notification.js";
import Report from "../models/report.js";
import { modifyReputation } from "../services/reputationService.js";

// Helper to extract hashtags from text
const extractHashtags = (text) => {
  if (!text) return [];
  const regex = /#([a-zA-Z0-9_]+)/g;
  const matches = text.match(regex) || [];
  return [...new Set(matches.map((tag) => tag.replace("#", "").toLowerCase()))];
};

// ==========================================
// POST CRUD CONTROLLERS
// ==========================================

export const createPost = async (req, res) => {
  const { text, images, codeSnippet, projectShowcase, learningAchievement } = req.body;

  try {
    const hashtags = extractHashtags(text);
    const newPost = new Post({
      user: req.userid,
      text,
      images,
      codeSnippet,
      projectShowcase,
      learningAchievement,
      hashtags,
    });

    await newPost.save();
    const populatedPost = await Post.findById(newPost._id).populate("user", "name username plan");

    res.status(201).json({ success: true, post: populatedPost });
  } catch (error) {
    console.error("Error in createPost:", error);
    res.status(500).json({ message: "Failed to create post" });
  }
};

export const updatePost = async (req, res) => {
  const { id } = req.params;
  const { text, images, codeSnippet, projectShowcase, learningAchievement } = req.body;

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== req.userid) {
      return res.status(403).json({ message: "Unauthorized to update this post" });
    }

    const hashtags = extractHashtags(text);
    post.text = text !== undefined ? text : post.text;
    post.images = images !== undefined ? images : post.images;
    post.codeSnippet = codeSnippet !== undefined ? codeSnippet : post.codeSnippet;
    post.projectShowcase = projectShowcase !== undefined ? projectShowcase : post.projectShowcase;
    post.learningAchievement = learningAchievement !== undefined ? learningAchievement : post.learningAchievement;
    post.hashtags = hashtags;

    await post.save();
    const populatedPost = await Post.findById(post._id).populate("user", "name username plan");

    res.status(200).json({ success: true, post: populatedPost });
  } catch (error) {
    console.error("Error in updatePost:", error);
    res.status(500).json({ message: "Failed to update post" });
  }
};

export const deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Admins can also delete posts
    const currentUser = await user.findById(req.userid);
    const isAdmin = currentUser?.role === "admin";

    if (post.user.toString() !== req.userid && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized to delete this post" });
    }

    if (isAdmin && post.user.toString() !== req.userid) {
      // Deduct -10 reputation for Admin Removal
      await modifyReputation({
        userId: post.user,
        actionType: "Admin Removed Content",
        points: -10,
        referenceId: String(id),
        referenceType: "CommunityPost",
        description: "Administrator removed post for guideline violation (-10 reputation)"
      });
    }

    await Post.findByIdAndDelete(id);
    // Cleanup related comments, bookmarks, reports
    await Comment.deleteMany({ post: id });
    await Bookmark.deleteMany({ post: id });
    await Report.deleteMany({ post: id });
    await Notification.deleteMany({ post: id });

    res.status(200).json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error in deletePost:", error);
    res.status(500).json({ message: "Failed to delete post" });
  }
};

// ==========================================
// FEED CONTROLLER (PAGINATION, FILTERS, SEARCH, PERSONALIZATION)
// ==========================================

export const getFeed = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { filter, search, tag } = req.query;

  try {
    let matchQuery = {};

    // 1. Hashtag Filter
    if (tag) {
      matchQuery.hashtags = tag.toLowerCase();
    }

    // 2. Search Text
    if (search) {
      const searchRegex = new RegExp(search, "i");
      // Find matching users first
      const matchingUsers = await user.find({
        $or: [{ name: searchRegex }, { username: searchRegex }],
      }).select("_id");
      const userIds = matchingUsers.map((u) => u._id);

      matchQuery.$or = [
        { text: searchRegex },
        { hashtags: search.toLowerCase() },
        { "projectShowcase.title": searchRegex },
        { "projectShowcase.technologies": searchRegex },
        { user: { $in: userIds } },
      ];
    }

    // 3. Filters
    if (filter) {
      switch (filter) {
        case "projects":
          matchQuery["projectShowcase.title"] = { $ne: "" };
          break;
        case "achievements":
          matchQuery["learningAchievement.milestone"] = { $ne: "" };
          break;
        case "images":
          matchQuery.images = { $exists: true, $ne: [] };
          break;
        case "code":
          matchQuery["codeSnippet.code"] = { $ne: "" };
          break;
        case "following":
          if (req.userid) {
            const followings = await Follow.find({ follower: req.userid }).select("following");
            const followingIds = followings.map((f) => f.following);
            matchQuery.user = { $in: followingIds };
          } else {
            return res.status(401).json({ message: "Login required for following filter" });
          }
          break;
        default:
          break;
      }
    }

    // Get list of followed users for personalized ranking
    let followedUserIds = [];
    if (req.userid && filter !== "following") {
      const followings = await Follow.find({ follower: req.userid }).select("following");
      followedUserIds = followings.map((f) => f.following.toString());
    }

    // Build Sort Object
    let sortQuery = { createdAt: -1 };
    if (filter === "most-liked") {
      sortQuery = { likesCount: -1, createdAt: -1 };
    } else if (filter === "most-commented") {
      sortQuery = { commentsCount: -1, createdAt: -1 };
    }

    // Aggregation pipeline to handle personalization ranking + counts dynamically
    const pipeline = [
      { $match: matchQuery },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likes", []] } },
          isFollowed: req.userid
            ? {
                $cond: {
                  if: { $in: [{ $toString: "$user" }, followedUserIds] },
                  then: 1,
                  else: 0,
                },
              }
            : 0,
        },
      },
    ];

    // Personalization Sorting (places followed users first, then sorts by criteria)
    if (req.userid && filter !== "following" && filter !== "most-liked" && filter !== "most-commented") {
      pipeline.push({ $sort: { isFollowed: -1, createdAt: -1 } });
    } else {
      pipeline.push({ $sort: sortQuery });
    }

    // Pagination
    pipeline.push({ $skip: skip }, { $limit: limit });

    // Execute aggregation
    let posts = await Post.aggregate(pipeline);

    // Populate user details manually after aggregation
    posts = await Post.populate(posts, {
      path: "user",
      select: "name username plan",
    });

    const totalPosts = await Post.countDocuments(matchQuery);
    const totalPages = Math.ceil(totalPosts / limit);

    res.status(200).json({
      success: true,
      posts,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
    });
  } catch (error) {
    console.error("Error in getFeed:", error);
    res.status(500).json({ message: "Failed to fetch feed" });
  }
};

// ==========================================
// LIKE INTERACTION CONTROLLERS
// ==========================================

export const likePost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.likes.includes(req.userid)) {
      return res.status(400).json({ message: "Post already liked" });
    }

    post.likes.push(req.userid);
    await post.save();

    // Trigger Notification
    if (post.user.toString() !== req.userid) {
      const newNotification = new Notification({
        recipient: post.user,
        sender: req.userid,
        type: "like",
        post: post._id,
      });
      await newNotification.save();
    }

    res.status(200).json({ success: true, likes: post.likes });
  } catch (error) {
    console.error("Error in likePost:", error);
    res.status(500).json({ message: "Failed to like post" });
  }
};

export const unlikePost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.likes = post.likes.filter((userId) => userId.toString() !== req.userid);
    await post.save();

    // Clean up like notification
    await Notification.deleteOne({
      recipient: post.user,
      sender: req.userid,
      type: "like",
      post: post._id,
    });

    res.status(200).json({ success: true, likes: post.likes });
  } catch (error) {
    console.error("Error in unlikePost:", error);
    res.status(500).json({ message: "Failed to unlike post" });
  }
};

// ==========================================
// COMMENTS & REPLIES CONTROLLERS
// ==========================================

export const createComment = async (req, res) => {
  const { id: postId } = req.params;
  const { text, parentId } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = new Comment({
      post: postId,
      user: req.userid,
      text,
      parentId: parentId || null,
    });

    await newComment.save();

    // Increment comment count on Post
    post.commentsCount += 1;
    await post.save();

    const populatedComment = await Comment.findById(newComment._id).populate("user", "name username plan");

    // Notifications Logic
    if (parentId) {
      // Reply Notification
      const parentComment = await Comment.findById(parentId);
      if (parentComment && parentComment.user.toString() !== req.userid) {
        const replyNotification = new Notification({
          recipient: parentComment.user,
          sender: req.userid,
          type: "reply",
          post: postId,
          comment: newComment._id,
        });
        await replyNotification.save();
      }
    } else {
      // Comment Notification
      if (post.user.toString() !== req.userid) {
        const commentNotification = new Notification({
          recipient: post.user,
          sender: req.userid,
          type: "comment",
          post: postId,
          comment: newComment._id,
        });
        await commentNotification.save();
      }
    }

    // Mention Notification Parsing (@username)
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    let match;
    const mentionedUsernames = [];
    while ((match = mentionRegex.exec(text)) !== null) {
      mentionedUsernames.push(match[1].toLowerCase());
    }

    if (mentionedUsernames.length > 0) {
      const uniqueUsernames = [...new Set(mentionedUsernames)];
      const mentionedUsers = await user.find({ username: { $in: uniqueUsernames } });
      for (const mUser of mentionedUsers) {
        if (mUser._id.toString() !== req.userid) {
          const mentionNotification = new Notification({
            recipient: mUser._id,
            sender: req.userid,
            type: "mention",
            post: postId,
            comment: newComment._id,
          });
          await mentionNotification.save();
        }
      }
    }

    res.status(201).json({ success: true, comment: populatedComment });
  } catch (error) {
    console.error("Error in createComment:", error);
    res.status(500).json({ message: "Failed to create comment" });
  }
};

export const getCommentsForPost = async (req, res) => {
  const { id: postId } = req.params;

  try {
    const comments = await Comment.find({ post: postId })
      .populate("user", "name username plan")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error("Error in getComments:", error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};

export const updateComment = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  try {
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.user.toString() !== req.userid) {
      return res.status(403).json({ message: "Unauthorized to edit this comment" });
    }

    comment.text = text;
    await comment.save();

    const populatedComment = await Comment.findById(comment._id).populate("user", "name username plan");
    res.status(200).json({ success: true, comment: populatedComment });
  } catch (error) {
    console.error("Error in updateComment:", error);
    res.status(500).json({ message: "Failed to edit comment" });
  }
};

export const deleteComment = async (req, res) => {
  const { id } = req.params;

  try {
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.user.toString() !== req.userid) {
      return res.status(403).json({ message: "Unauthorized to delete this comment" });
    }

    // Decrement count on Post
    const post = await Post.findById(comment.post);
    if (post) {
      post.commentsCount = Math.max(0, post.commentsCount - 1);
      await post.save();
    }

    await Comment.findByIdAndDelete(id);
    // Delete replies recursively
    await Comment.deleteMany({ parentId: id });
    await Notification.deleteMany({ comment: id });

    res.status(200).json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error in deleteComment:", error);
    res.status(500).json({ message: "Failed to delete comment" });
  }
};

export const likeComment = async (req, res) => {
  const { id } = req.params;

  try {
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const index = comment.likes.indexOf(req.userid);
    if (index === -1) {
      comment.likes.push(req.userid);
    } else {
      comment.likes.splice(index, 1);
    }

    await comment.save();
    res.status(200).json({ success: true, likes: comment.likes });
  } catch (error) {
    console.error("Error in likeComment:", error);
    res.status(500).json({ message: "Failed to like comment" });
  }
};

// ==========================================
// BOOKMARKS CONTROLLERS
// ==========================================

export const bookmarkPost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const existingBookmark = await Bookmark.findOne({ user: req.userid, post: id });
    if (existingBookmark) {
      return res.status(400).json({ message: "Post already bookmarked" });
    }

    const newBookmark = new Bookmark({ user: req.userid, post: id });
    await newBookmark.save();

    post.bookmarksCount += 1;
    await post.save();

    res.status(200).json({ success: true, isBookmarked: true });
  } catch (error) {
    console.error("Error in bookmarkPost:", error);
    res.status(500).json({ message: "Failed to bookmark post" });
  }
};

export const unbookmarkPost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const deleted = await Bookmark.findOneAndDelete({ user: req.userid, post: id });
    if (deleted) {
      post.bookmarksCount = Math.max(0, post.bookmarksCount - 1);
      await post.save();
    }

    res.status(200).json({ success: true, isBookmarked: false });
  } catch (error) {
    console.error("Error in unbookmarkPost:", error);
    res.status(500).json({ message: "Failed to remove bookmark" });
  }
};

export const getBookmarkedPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const bookmarks = await Bookmark.find({ user: req.userid })
      .populate({
        path: "post",
        populate: { path: "user", select: "name username plan" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const validBookmarks = bookmarks.filter((b) => b.post !== null);
    const posts = validBookmarks.map((b) => b.post);

    const totalBookmarks = await Bookmark.countDocuments({ user: req.userid });
    const totalPages = Math.ceil(totalBookmarks / limit);

    res.status(200).json({
      success: true,
      posts,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
    });
  } catch (error) {
    console.error("Error in getBookmarkedPosts:", error);
    res.status(500).json({ message: "Failed to fetch bookmarks" });
  }
};

// ==========================================
// FOLLOW SYSTEM CONTROLLERS
// ==========================================

export const followUser = async (req, res) => {
  const { id } = req.params;

  if (id === req.userid) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  try {
    const targetUser = await user.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingFollow = await Follow.findOne({ follower: req.userid, following: id });
    if (existingFollow) {
      return res.status(400).json({ message: "Already following this user" });
    }

    const newFollow = new Follow({ follower: req.userid, following: id });
    await newFollow.save();

    // Increment counters
    await user.findByIdAndUpdate(req.userid, { $inc: { followingCount: 1 } });
    await user.findByIdAndUpdate(id, { $inc: { followersCount: 1 } });

    // Send Notification
    const newNotification = new Notification({
      recipient: id,
      sender: req.userid,
      type: "follow",
    });
    await newNotification.save();

    res.status(200).json({ success: true, message: "Successfully followed user" });
  } catch (error) {
    console.error("Error in followUser:", error);
    res.status(500).json({ message: "Failed to follow user" });
  }
};

export const unfollowUser = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedFollow = await Follow.findOneAndDelete({ follower: req.userid, following: id });
    if (!deletedFollow) {
      return res.status(400).json({ message: "Not following this user" });
    }

    // Decrement counters
    await user.findByIdAndUpdate(req.userid, { $inc: { followingCount: -1 } });
    await user.findByIdAndUpdate(id, { $inc: { followersCount: -1 } });

    // Clean up follow notification
    await Notification.deleteOne({
      recipient: id,
      sender: req.userid,
      type: "follow",
    });

    res.status(200).json({ success: true, message: "Successfully unfollowed user" });
  } catch (error) {
    console.error("Error in unfollowUser:", error);
    res.status(500).json({ message: "Failed to unfollow user" });
  }
};

// ==========================================
// TRENDING CONTROLLER
// ==========================================

export const getTrendingPosts = async (req, res) => {
  const { period } = req.query; // 'today', 'week', 'month'
  let startDate = new Date();

  if (period === "today") {
    startDate.setDate(startDate.getDate() - 1);
  } else if (period === "week") {
    startDate.setDate(startDate.getDate() - 7);
  } else {
    // default 'month'
    startDate.setDate(startDate.getDate() - 30);
  }

  try {
    const pipeline = [
      { $match: { createdAt: { $gte: startDate } } },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likes", []] } },
        },
      },
      {
        $addFields: {
          trendingScore: {
            $add: [
              { $multiply: ["$likesCount", 3] },
              { $multiply: ["$commentsCount", 4] },
              { $multiply: ["$sharesCount", 5] },
              { $multiply: ["$bookmarksCount", 2] },
            ],
          },
        },
      },
      { $sort: { trendingScore: -1, createdAt: -1 } },
      { $limit: 10 },
    ];

    let posts = await Post.aggregate(pipeline);
    posts = await Post.populate(posts, {
      path: "user",
      select: "name username plan",
    });

    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error("Error in getTrendingPosts:", error);
    res.status(500).json({ message: "Failed to fetch trending posts" });
  }
};

// ==========================================
// SHARING TRACKING
// ==========================================

export const sharePost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.sharesCount += 1;
    await post.save();

    res.status(200).json({ success: true, sharesCount: post.sharesCount });
  } catch (error) {
    console.error("Error in sharePost:", error);
    res.status(500).json({ message: "Failed to share post" });
  }
};

// ==========================================
// NOTIFICATIONS CONTROLLER
// ==========================================

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.userid })
      .populate("sender", "name username")
      .populate("post", "text projectShowcase.title")
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ recipient: req.userid, read: false });

    res.status(200).json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error("Error in getNotifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

export const markNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.userid, read: false }, { $set: { read: true } });
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error in markNotificationsAsRead:", error);
    res.status(500).json({ message: "Failed to mark notifications as read" });
  }
};

// ==========================================
// REPORT SYSTEM CONTROLLER
// ==========================================

export const reportPost = async (req, res) => {
  const { id } = req.params;
  const { reason, details } = req.body;

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() === req.userid) {
      return res.status(400).json({ message: "You cannot report your own post" });
    }

    const existingReport = await Report.findOne({ reporter: req.userid, post: id });
    if (existingReport) {
      return res.status(400).json({ message: "You have already reported this post" });
    }

    const newReport = new Report({
      post: id,
      reporter: req.userid,
      reason,
      details,
    });
    await newReport.save();

    // Add report to Post array and increment count
    post.reports.push({
      reporter: req.userid,
      reason,
      details,
    });
    post.reportsCount += 1;
    await post.save();

    res.status(201).json({ success: true, message: "Report submitted successfully" });
  } catch (error) {
    console.error("Error in reportPost:", error);
    res.status(500).json({ message: "Failed to report post" });
  }
};

// ==========================================
// ADMIN MODERATION CONTROLLERS
// ==========================================

export const getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "name username email")
      .populate({
        path: "post",
        populate: { path: "user", select: "name username email confirmedViolations" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reports });
  } catch (error) {
    console.error("Error in getReports:", error);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};

export const moderateReport = async (req, res) => {
  const { reportId } = req.params;
  const { action } = req.body; // 'confirm' or 'dismiss'

  try {
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (action === "dismiss") {
      report.status = "dismissed";
      await report.save();
      return res.status(200).json({ success: true, message: "Report dismissed" });
    }

    if (action === "confirm") {
      report.status = "confirmed";
      await report.save();

      // Find the post and increment author's confirmed violations
      const post = await Post.findById(report.post);
      if (post) {
        const violatorId = post.user;
        const violator = await user.findById(violatorId);

        if (violator) {
          violator.confirmedViolations += 1;
          // Auto suspend if 3 or more confirmed violations
          if (violator.confirmedViolations >= 3) {
            violator.isSuspended = true;
          }
          await violator.save();
        }

        // Delete the violating post
        await Post.findByIdAndDelete(post._id);
        await Comment.deleteMany({ post: post._id });
        await Bookmark.deleteMany({ post: post._id });
        await Notification.deleteMany({ post: post._id });
      }

      return res.status(200).json({ success: true, message: "Report confirmed and post removed" });
    }

    res.status(400).json({ message: "Invalid moderation action" });
  } catch (error) {
    console.error("Error in moderateReport:", error);
    res.status(500).json({ message: "Failed to moderate report" });
  }
};

export const moderateUser = async (req, res) => {
  const { userId } = req.params;
  const { action } = req.body; // 'suspend', 'ban', 'unsuspend', 'unban'

  try {
    const targetUser = await user.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (action === "suspend") {
      targetUser.isSuspended = true;
    } else if (action === "ban") {
      targetUser.isBanned = true;
    } else if (action === "unsuspend") {
      targetUser.isSuspended = false;
      targetUser.confirmedViolations = 0; // reset count
    } else if (action === "unban") {
      targetUser.isBanned = false;
      targetUser.confirmedViolations = 0; // reset count
    } else {
      return res.status(400).json({ message: "Invalid user action" });
    }

    await targetUser.save();
    res.status(200).json({ success: true, user: targetUser });
  } catch (error) {
    console.error("Error in moderateUser:", error);
    res.status(500).json({ message: "Failed to moderate user" });
  }
};

// Check follow status helper
export const checkFollowStatus = async (req, res) => {
  const { id } = req.params;
  try {
    if (!req.userid) return res.status(200).json({ isFollowing: false });
    const follow = await Follow.findOne({ follower: req.userid, following: id });
    res.status(200).json({ isFollowing: !!follow });
  } catch (error) {
    res.status(500).json({ message: "Error checking follow status" });
  }
};
