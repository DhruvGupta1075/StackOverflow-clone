import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreVertical,
  Globe,
  Plus,
  Code,
  Award,
  FolderGit2,
  Image as ImageIcon,
  Send,
  Github,
  ExternalLink,
  AlertTriangle,
  Trash2,
  Edit2,
  X,
  Search,
  Check,
  Twitter,
  Linkedin,
  Facebook,
  Mail,
  Link2,
  Loader2,
  Flag,
  UserPlus,
  UserMinus,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";

export default function CommunityPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Feed & Pagination States
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Search & Filter States
  const [searchVal, setSearchVal] = useState("");
  const [activeFilter, setActiveFilter] = useState("latest");
  const [trendingPeriod, setTrendingPeriod] = useState("week");
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);

  // Create Post States & Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postText, setPostText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);

  // Project Showcase form state
  const [showProjectInput, setShowProjectInput] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectGithub, setProjectGithub] = useState("");
  const [projectDemo, setProjectDemo] = useState("");
  const [projectTech, setProjectTech] = useState("");
  const [projectThumbnail, setProjectThumbnail] = useState("");

  // Achievement form state
  const [showAchievementInput, setShowAchievementInput] = useState(false);
  const [achMilestone, setAchMilestone] = useState("");
  const [achCourse, setAchCourse] = useState("");
  const [achCert, setAchCert] = useState("");
  const [achRanking, setAchRanking] = useState("");
  const [achBadge, setAchBadge] = useState("");

  // Editing Post state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Reporting Post state
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("Spam");
  const [reportDetails, setReportDetails] = useState("");

  // Comments & Share state
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<{ [postId: string]: any[] }>({});
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [replyInputs, setReplyInputs] = useState<{ [commentId: string]: string }>({});
  const [replyToId, setReplyToId] = useState<string | null>(null); // comment being replied to
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  const [activeSharePostId, setActiveSharePostId] = useState<string | null>(null);

  // Menu states
  const [activePostMenuId, setActivePostMenuId] = useState<string | null>(null);

  // Follow tracking
  const [followingStateMap, setFollowingStateMap] = useState<{ [userId: string]: boolean }>({});

  // Image Preview Modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Fetch Feed
  const fetchFeed = async (resetPage = false) => {
    const targetPage = resetPage ? 1 : page;
    if (resetPage) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await axiosInstance.get("/api/community/feed", {
        params: {
          page: targetPage,
          limit: 10,
          filter: activeFilter,
          search: searchVal || undefined,
        },
      });

      if (res.data.success) {
        if (resetPage) {
          setPosts(res.data.posts);
        } else {
          setPosts((prev) => [...prev, ...res.data.posts]);
        }
        setTotalPages(res.data.totalPages);
        setHasNextPage(res.data.hasNextPage);
      }
    } catch (error: any) {
      console.error("Error fetching community feed", error);
      toast.error("Failed to load community feed");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch Trending Panel Posts
  const fetchTrending = async () => {
    setLoadingTrending(true);
    try {
      const res = await axiosInstance.get("/api/community/trending", {
        params: { period: trendingPeriod },
      });
      if (res.data.success) {
        setTrendingPosts(res.data.posts);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingTrending(false);
    }
  };

  // Initial loads and filter changes
  useEffect(() => {
    if (hasMounted) {
      setPage(1);
      fetchFeed(true);
    }
  }, [activeFilter, searchVal, hasMounted]);

  useEffect(() => {
    if (hasMounted) {
      fetchTrending();
    }
  }, [trendingPeriod, hasMounted]);

  // Window scroll event for Infinite Scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 150 &&
        !loading &&
        !loadingMore &&
        hasNextPage
      ) {
        setPage((prev) => {
          const nextPage = prev + 1;
          axiosInstance
            .get("/api/community/feed", {
              params: {
                page: nextPage,
                limit: 10,
                filter: activeFilter,
                search: searchVal || undefined,
              },
            })
            .then((res) => {
              if (res.data.success) {
                setPosts((prevPosts) => [...prevPosts, ...res.data.posts]);
                setHasNextPage(res.data.hasNextPage);
              }
            })
            .catch(console.error);
          return nextPage;
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, loadingMore, hasNextPage, activeFilter, searchVal]);

  // Image Conversion helper
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isProjectThumbnail = false) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image file size should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          if (isProjectThumbnail) {
            setProjectThumbnail(reader.result);
          } else {
            setImages((prev) => [...prev, reader.result as string]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Create or Update Post
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim() && images.length === 0 && !code.trim() && !projectTitle.trim() && !achMilestone.trim()) {
      toast.error("Post content cannot be completely empty!");
      return;
    }

    const payload = {
      text: postText,
      images,
      codeSnippet: showCodeInput ? { code, language: selectedLanguage } : undefined,
      projectShowcase: showProjectInput
        ? {
            title: projectTitle,
            description: projectDesc,
            githubRepo: projectGithub,
            liveDemo: projectDemo,
            technologies: projectTech.split(",").map((t) => t.trim()).filter(Boolean),
            thumbnail: projectThumbnail,
          }
        : undefined,
      learningAchievement: showAchievementInput
        ? {
            milestone: achMilestone,
            courseTitle: achCourse,
            certificationName: achCert,
            contestRanking: achRanking,
            badge: achBadge,
          }
        : undefined,
    };

    try {
      if (editingPostId) {
        const res = await axiosInstance.patch(`/api/community/post/${editingPostId}`, payload);
        if (res.data.success) {
          setPosts((prev) => prev.map((p) => (p._id === editingPostId ? res.data.post : p)));
          toast.success("Post updated successfully!");
        }
      } else {
        const res = await axiosInstance.post("/api/community/post", payload);
        if (res.data.success) {
          setPosts((prev) => [res.data.post, ...prev]);
          toast.success("Posted to community feed!");
        }
      }
      resetCreateForm();
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit post");
    }
  };

  const resetCreateForm = () => {
    setPostText("");
    setImages([]);
    setCode("");
    setShowCodeInput(false);
    setShowProjectInput(false);
    setProjectTitle("");
    setProjectDesc("");
    setProjectGithub("");
    setProjectDemo("");
    setProjectTech("");
    setProjectThumbnail("");
    setShowAchievementInput(false);
    setAchMilestone("");
    setAchCourse("");
    setAchCert("");
    setAchRanking("");
    setAchBadge("");
    setShowCreateModal(false);
    setEditingPostId(null);
  };

  const triggerEdit = (post: any) => {
    setEditingPostId(post._id);
    setPostText(post.text || "");
    setImages(post.images || []);
    if (post.codeSnippet && post.codeSnippet.code) {
      setShowCodeInput(true);
      setCode(post.codeSnippet.code);
      setSelectedLanguage(post.codeSnippet.language);
    }
    if (post.projectShowcase && post.projectShowcase.title) {
      setShowProjectInput(true);
      setProjectTitle(post.projectShowcase.title);
      setProjectDesc(post.projectShowcase.description || "");
      setProjectGithub(post.projectShowcase.githubRepo || "");
      setProjectDemo(post.projectShowcase.liveDemo || "");
      setProjectTech(post.projectShowcase.technologies?.join(", ") || "");
      setProjectThumbnail(post.projectShowcase.thumbnail || "");
    }
    if (post.learningAchievement && post.learningAchievement.milestone) {
      setShowAchievementInput(true);
      setAchMilestone(post.learningAchievement.milestone);
      setAchCourse(post.learningAchievement.courseTitle || "");
      setAchCert(post.learningAchievement.certificationName || "");
      setAchRanking(post.learningAchievement.contestRanking || "");
      setAchBadge(post.learningAchievement.badge || "");
    }
    setActivePostMenuId(null);
    setShowCreateModal(true);
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await axiosInstance.delete(`/api/community/post/${postId}`);
      if (res.data.success) {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
        toast.success("Post deleted successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete post");
    }
  };

  // Likes
  const handleLikeToggle = async (post: any) => {
    if (!user) {
      toast.info("Please login to like posts");
      router.push("/auth");
      return;
    }

    const isLiked = post.likes.includes(user._id);
    const url = `/api/community/post/${post._id}/${isLiked ? "unlike" : "like"}`;

    try {
      const res = await axiosInstance.post(url);
      if (res.data.success) {
        setPosts((prev) =>
          prev.map((p) => (p._id === post._id ? { ...p, likes: res.data.likes } : p))
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Bookmarks
  const [userBookmarks, setUserBookmarks] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !hasMounted) return;
    const fetchUserBookmarks = async () => {
      try {
        const res = await axiosInstance.get("/api/community/bookmarks");
        if (res.data.success) {
          setUserBookmarks(res.data.posts.map((p: any) => p._id));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUserBookmarks();
  }, [user, hasMounted]);

  const handleBookmarkToggle = async (postId: string) => {
    if (!user) {
      toast.info("Please login to bookmark posts");
      router.push("/auth");
      return;
    }

    const isBookmarked = userBookmarks.includes(postId);
    const url = `/api/community/post/${postId}/${isBookmarked ? "unbookmark" : "bookmark"}`;

    try {
      const res = await axiosInstance.post(url);
      if (res.data.success) {
        if (isBookmarked) {
          setUserBookmarks((prev) => prev.filter((id) => id !== postId));
          toast.success("Removed from bookmarks");
        } else {
          setUserBookmarks((prev) => [...prev, postId]);
          toast.success("Added to bookmarks");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to bookmark post");
    }
  };

  // Report Form Submit
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPostId) return;

    try {
      const res = await axiosInstance.post(`/api/community/post/${reportingPostId}/report`, {
        reason: reportReason,
        details: reportDetails,
      });
      if (res.data.success) {
        toast.success("Report submitted successfully for review");
      }
      setReportingPostId(null);
      setReportDetails("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit report");
      setReportingPostId(null);
    }
  };

  // Follow/Unfollow
  const fetchFollowStatus = async (userId: string) => {
    if (!user) return;
    try {
      const res = await axiosInstance.get(`/api/community/user/${userId}/follow-status`);
      setFollowingStateMap((prev) => ({ ...prev, [userId]: res.data.isFollowing }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollowToggle = async (authorId: string) => {
    if (!user) {
      toast.info("Please login to follow creators");
      router.push("/auth");
      return;
    }

    const isFollowing = followingStateMap[authorId];
    const url = `/api/community/user/${authorId}/${isFollowing ? "unfollow" : "follow"}`;

    try {
      const res = await axiosInstance.post(url);
      if (res.data.success) {
        setFollowingStateMap((prev) => ({ ...prev, [authorId]: !isFollowing }));
        toast.success(isFollowing ? "Unfollowed user" : "Following user");
        fetchFeed(true);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  // Share Counter & Modal
  const handleShareClick = async (postId: string, platform: string) => {
    setActiveSharePostId(null);
    const postLink = `${window.location.origin}/community?search=${postId}`;

    try {
      await axiosInstance.post(`/api/community/post/${postId}/share`);
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, sharesCount: p.sharesCount + 1 } : p))
      );
    } catch (err) {
      console.error(err);
    }

    switch (platform) {
      case "copy":
        navigator.clipboard.writeText(postLink);
        toast.success("Post link copied to clipboard!");
        break;
      case "whatsapp":
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(postLink)}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(postLink)}&text=Check out this programmer post on Code Quest!`, "_blank");
        break;
      case "linkedin":
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postLink)}`, "_blank");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postLink)}`, "_blank");
        break;
      case "email":
        window.location.href = `mailto:?subject=CodeQuest Post Share&body=${encodeURIComponent(postLink)}`;
        break;
    }
  };

  // Fetch Comments on toggle
  const toggleCommentsSection = async (postId: string) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      return;
    }

    setActiveCommentsPostId(postId);
    if (!commentsMap[postId]) {
      try {
        const res = await axiosInstance.get(`/api/community/post/${postId}/comments`);
        if (res.data.success) {
          setCommentsMap((prev) => ({ ...prev, [postId]: res.data.comments }));
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load comments");
      }
    }
  };

  // Add Comment
  const handleAddComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info("Please login to comment");
      router.push("/auth");
      return;
    }

    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    try {
      const res = await axiosInstance.post(`/api/community/post/${postId}/comment`, { text });
      if (res.data.success) {
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), res.data.comment],
        }));
        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
        );
        toast.success("Comment added");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add comment");
    }
  };

  // Add Reply
  const handleAddReply = async (postId: string, commentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info("Please login to reply");
      router.push("/auth");
      return;
    }

    const text = replyInputs[commentId];
    if (!text || !text.trim()) return;

    try {
      const res = await axiosInstance.post(`/api/community/post/${postId}/comment`, {
        text,
        parentId: commentId,
      });
      if (res.data.success) {
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), res.data.comment],
        }));
        setReplyInputs((prev) => ({ ...prev, [commentId]: "" }));
        setReplyToId(null);
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
        );
        toast.success("Reply added");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Comment
  const handleSaveCommentEdit = async (postId: string, commentId: string) => {
    if (!editingCommentText.trim()) return;
    try {
      const res = await axiosInstance.patch(`/api/community/comment/${commentId}`, {
        text: editingCommentText,
      });
      if (res.data.success) {
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: prev[postId].map((c) => (c._id === commentId ? res.data.comment : c)),
        }));
        setEditingCommentId(null);
        setEditingCommentText("");
        toast.success("Comment updated");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const res = await axiosInstance.delete(`/api/community/comment/${commentId}`);
      if (res.data.success) {
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: prev[postId].filter((c) => c._id !== commentId && c.parentId !== commentId),
        }));
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p))
        );
        toast.success("Comment deleted");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Like Comment
  const handleLikeComment = async (postId: string, commentId: string) => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/api/community/comment/${commentId}/like`);
      if (res.data.success) {
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: prev[postId].map((c) =>
            c._id === commentId ? { ...c, likes: res.data.likes } : c
          ),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Recursive Comment Renderer
  const renderCommentNode = (comment: any, allComments: any[], postId: string) => {
    const replies = allComments.filter((c) => c.parentId === comment._id);
    const isEditing = editingCommentId === comment._id;
    const isReplying = replyToId === comment._id;
    const isCommentLiked = user && comment.likes.includes(user._id);

    // Parse Mentions in Comment Text
    const renderCommentText = (text: string) => {
      const words = text.split(" ");
      return words.map((word, idx) => {
        if (word.startsWith("@")) {
          const username = word.replace(/[^a-zA-Z0-9_]/g, "");
          return (
            <span key={idx} className="text-orange-500 font-medium mr-1">
              @{username}
            </span>
          );
        }
        return word + " ";
      });
    };

    return (
      <div key={comment._id} className="ml-4 md:ml-6 mt-3 border-l-2 border-orange-100 pl-3 py-1 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-semibold">
            {comment.user?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-semibold text-gray-700">{comment.user?.name || "User"}</span>
          <span className="text-[10px] text-gray-400">@{comment.user?.username || "user"}</span>
          <span className="text-[10px] text-gray-400">
            {new Date(comment.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
          </span>
        </div>

        {isEditing ? (
          <div className="flex gap-2 items-center mt-1">
            <input
              type="text"
              value={editingCommentText}
              onChange={(e) => setEditingCommentText(e.target.value)}
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <button
              onClick={() => handleSaveCommentEdit(postId, comment._id)}
              className="text-xs font-semibold text-green-600 hover:text-green-700 bg-transparent border-0 cursor-pointer"
            >
              Save
            </button>
            <button
              onClick={() => setEditingCommentId(null)}
              className="text-xs text-gray-500 bg-transparent border-0 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-800 break-words">{renderCommentText(comment.text)}</p>
        )}

        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
          <button
            onClick={() => handleLikeComment(postId, comment._id)}
            className={`flex items-center gap-1 cursor-pointer bg-transparent border-0 font-medium ${
              isCommentLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isCommentLiked ? "fill-red-500" : ""}`} />
            {comment.likes.length}
          </button>
          <button
            onClick={() => {
              setReplyToId(isReplying ? null : comment._id);
              setReplyInputs((prev) => ({ ...prev, [comment._id]: `@${comment.user?.username} ` }));
            }}
            className="hover:text-orange-500 cursor-pointer bg-transparent border-0 font-medium"
          >
            Reply
          </button>

          {user && comment.user?._id === user._id && (
            <>
              <button
                onClick={() => {
                  setEditingCommentId(comment._id);
                  setEditingCommentText(comment.text);
                }}
                className="hover:text-blue-500 cursor-pointer bg-transparent border-0 font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteComment(postId, comment._id)}
                className="hover:text-red-500 cursor-pointer bg-transparent border-0 font-medium"
              >
                Delete
              </button>
            </>
          )}
        </div>

        {isReplying && (
          <form
            onSubmit={(e) => handleAddReply(postId, comment._id, e)}
            className="flex gap-2 items-center mt-2 pl-2"
          >
            <input
              type="text"
              placeholder={`Reply to @${comment.user?.username}...`}
              value={replyInputs[comment._id] || ""}
              onChange={(e) => setReplyInputs((prev) => ({ ...prev, [comment._id]: e.target.value }))}
              className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <button
              type="submit"
              className="text-xs bg-orange-500 hover:bg-orange-600 text-white rounded px-3 py-1.5 font-semibold transition"
            >
              Reply
            </button>
          </form>
        )}

        {replies.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            {replies.map((reply) => renderCommentNode(reply, allComments, postId))}
          </div>
        )}
      </div>
    );
  };

  // Parse hashtags in Post body text
  const renderPostText = (text: string) => {
    if (!text) return null;
    const words = text.split(/(\s+)/);
    return words.map((word, idx) => {
      if (word.startsWith("#")) {
        const cleanTag = word.replace(/[^a-zA-Z0-9_]/g, "");
        return (
          <Link
            key={idx}
            href={`/community/tag/${cleanTag.toLowerCase()}`}
            className="text-orange-500 font-semibold hover:underline"
          >
            {word}
          </Link>
        );
      }
      return word;
    });
  };

  if (!hasMounted) {
    return (
      <Mainlayout>
        <div className="max-w-[1440px] mx-auto min-h-screen pb-12 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <div className="max-w-[1440px] mx-auto min-h-screen pb-12 flex flex-col lg:flex-row gap-6">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-5">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Globe className="w-7 h-7 text-orange-500" /> Developer Community
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Share snippets, projects, milestones and connect with global developers
              </p>
            </div>
            {user && (
              <button
                onClick={() => {
                  resetCreateForm();
                  setShowCreateModal(true);
                }}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded px-4 py-2.5 shadow-sm transition self-start sm:sm:self-auto cursor-pointer border-0"
              >
                <Plus className="w-4 h-4" /> Create Post
              </button>
            )}
          </div>

          {/* Filter, Search & Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200/60 shadow-sm">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "latest", label: "Latest" },
                { id: "trending", label: "Trending" },
                { id: "following", label: "Following" },
                { id: "projects", label: "Projects" },
                { id: "achievements", label: "Achievements" },
                { id: "images", label: "Images" },
                { id: "code", label: "Code Snippets" },
                { id: "most-liked", label: "Most Liked" },
                { id: "most-commented", label: "Most Commented" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    if (f.id === "following" && !user) {
                      toast.info("Please login to see followed user feed");
                      return;
                    }
                    setActiveFilter(f.id);
                  }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded transition cursor-pointer border ${
                    activeFilter === f.id
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative md:w-64">
              <input
                type="text"
                placeholder="Search community..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Posts Feed */}
          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                    </div>
                  </div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-100 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">No Posts Found</h3>
              <p className="text-gray-500 text-sm max-w-md">
                We couldn't find any posts matching your criteria. Try changing filters or posting a new updates to get the conversation started!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {posts.map((post) => {
                const isLiked = user && post.likes?.includes(user._id);
                const isBookmarked = userBookmarks.includes(post._id);
                const hasCommentsOpen = activeCommentsPostId === post._id;

                // Sync follow status map on post hover or mount
                if (post.user?._id && followingStateMap[post.user._id] === undefined) {
                  fetchFollowStatus(post.user._id);
                }

                return (
                  <div
                    key={post._id}
                    className="bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
                  >
                    {/* Post Author Card Header */}
                    <div className="p-4 flex items-center justify-between border-b border-gray-50 bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center justify-center relative flex-shrink-0 cursor-pointer">
                          {post.user?.name?.charAt(0).toUpperCase()}
                          {post.user?.plan && post.user?.plan !== "Free" && (
                            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-extrabold border text-white shadow ${
                              post.user.plan === "Gold" ? "bg-gradient-to-r from-yellow-500 to-amber-500 border-yellow-600" :
                              post.user.plan === "Silver" ? "bg-slate-500 border-slate-600" :
                              "bg-amber-600 border-amber-700"
                            }`}>
                              {post.user.plan[0]}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-gray-800 text-sm hover:underline cursor-pointer">
                              {post.user?.name || "Developer"}
                            </span>
                            {post.user?._id !== user?._id && (
                              <button
                                onClick={() => handleFollowToggle(post.user?._id)}
                                className={`text-[10px] font-bold flex items-center gap-0.5 border rounded px-1.5 py-0.5 cursor-pointer transition ${
                                  followingStateMap[post.user?._id]
                                    ? "bg-gray-100 border-gray-300 text-gray-600"
                                    : "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                                }`}
                              >
                                {followingStateMap[post.user?._id] ? (
                                  <>
                                    <UserMinus className="w-2.5 h-2.5" /> Unfollow
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="w-2.5 h-2.5" /> Follow
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            @{post.user?.username || "dev"} • {new Date(post.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })} at {new Date(post.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {post.updatedAt !== post.createdAt && (
                              <span className="text-[10px] text-gray-400 ml-1.5 font-medium">(edited)</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Right side menu */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActivePostMenuId(activePostMenuId === post._id ? null : post._id)
                          }
                          className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 cursor-pointer bg-transparent border-0"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {activePostMenuId === post._id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20">
                            {user && post.user?._id === user._id ? (
                              <>
                                <button
                                  onClick={() => triggerEdit(post)}
                                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer bg-transparent border-0"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-blue-500" /> Edit Post
                                </button>
                                <button
                                  onClick={() => handleDeletePost(post._id)}
                                  className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer bg-transparent border-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" /> Delete Post
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  if (!user) {
                                    toast.info("Please login to report posts");
                                    return;
                                  }
                                  setReportingPostId(post._id);
                                  setActivePostMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-orange-600 hover:bg-orange-50 flex items-center gap-2 cursor-pointer bg-transparent border-0"
                              >
                                <Flag className="w-3.5 h-3.5 text-orange-500" /> Report Post
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Post Card Content body */}
                    <div className="p-5 flex flex-col gap-4">
                      {/* Plain Text with hashtag styling */}
                      {post.text && <p className="text-sm text-gray-800 whitespace-pre-wrap lead-relaxed">{renderPostText(post.text)}</p>}

                      {/* Image Preview Gallery */}
                      {post.images && post.images.length > 0 && (
                        <div className={`grid gap-2 mt-1 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                          {post.images.map((img: string, index: number) => (
                            <img
                              key={index}
                              src={img}
                              alt="Upload"
                              onClick={() => setPreviewImageUrl(img)}
                              className="max-h-72 w-full object-cover rounded-lg border border-gray-100 hover:opacity-90 transition cursor-pointer"
                              loading="lazy"
                            />
                          ))}
                        </div>
                      )}

                      {/* Code Snippet block */}
                      {post.codeSnippet && post.codeSnippet.code && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden mt-1 shadow-inner bg-gray-900">
                          <div className="bg-gray-800 px-3 py-1.5 flex justify-between items-center text-xs text-gray-300 font-mono">
                            <span>{post.codeSnippet.language.toUpperCase()} Snippet</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(post.codeSnippet.code);
                                toast.success("Code snippet copied!");
                              }}
                              className="hover:text-white transition cursor-pointer bg-transparent border-0 text-[11px]"
                            >
                              Copy
                            </button>
                          </div>
                          <pre className="p-4 text-xs font-mono text-gray-100 overflow-x-auto max-h-[300px] whitespace-pre">
                            <code>{post.codeSnippet.code}</code>
                          </pre>
                        </div>
                      )}

                      {/* Project Showcase showcase block */}
                      {post.projectShowcase && post.projectShowcase.title && (
                        <div className="border border-gray-200 rounded-xl overflow-hidden mt-1 shadow-sm flex flex-col md:flex-row bg-gray-50/50">
                          {post.projectShowcase.thumbnail && (
                            <img
                              src={post.projectShowcase.thumbnail}
                              alt="Project thumbnail"
                              className="w-full md:w-40 h-32 object-cover border-b md:border-b-0 md:border-r border-gray-200"
                            />
                          )}
                          <div className="p-4 flex-1 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                                <FolderGit2 className="w-4 h-4 text-orange-500" /> {post.projectShowcase.title}
                              </h4>
                              <div className="flex items-center gap-2">
                                {post.projectShowcase.githubRepo && (
                                  <Link
                                    href={post.projectShowcase.githubRepo}
                                    target="_blank"
                                    className="p-1.5 rounded-full bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 transition"
                                  >
                                    <Github className="w-3.5 h-3.5" />
                                  </Link>
                                )}
                                {post.projectShowcase.liveDemo && (
                                  <Link
                                    href={post.projectShowcase.liveDemo}
                                    target="_blank"
                                    className="p-1.5 rounded-full bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 transition"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{post.projectShowcase.description}</p>
                            {post.projectShowcase.technologies && post.projectShowcase.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {post.projectShowcase.technologies.map((t: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="text-[9px] font-bold bg-white text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full shadow-sm"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Learning achievements badge */}
                      {post.learningAchievement && post.learningAchievement.milestone && (
                        <div className="border border-orange-100 bg-orange-50/40 rounded-xl p-4 flex items-start gap-3 mt-1">
                          <div className="p-2 rounded-lg bg-orange-100 text-orange-600 flex-shrink-0">
                            <Award className="w-6 h-6" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <h4 className="font-bold text-gray-800 text-sm">
                              Achievement Badge: {post.learningAchievement.milestone}
                            </h4>
                            <div className="flex flex-col text-xs text-gray-600 gap-0.5">
                              {post.learningAchievement.courseTitle && (
                                <span>🏆 Completed Course: <strong className="text-gray-800">{post.learningAchievement.courseTitle}</strong></span>
                              )}
                              {post.learningAchievement.certificationName && (
                                <span>📜 Certified In: <strong className="text-gray-800">{post.learningAchievement.certificationName}</strong></span>
                              )}
                              {post.learningAchievement.contestRanking && (
                                <span>⚡ Contest Rank achieved: <strong className="text-gray-800">{post.learningAchievement.contestRanking}</strong></span>
                              )}
                              {post.learningAchievement.badge && (
                                <span>🏅 Earned Badge: <span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">{post.learningAchievement.badge}</span></span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Post Card Footer Interactions */}
                    <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium bg-gray-50/50">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => handleLikeToggle(post)}
                          className={`flex items-center gap-1 cursor-pointer transition p-1.5 rounded-md ${
                            isLiked ? "text-red-500 hover:bg-red-50" : "text-gray-500 hover:text-red-500 hover:bg-red-50"
                          } bg-transparent border-0`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500" : ""}`} />
                          <span>{post.likes?.length || 0}</span>
                        </button>

                        <button
                          onClick={() => toggleCommentsSection(post._id)}
                          className={`flex items-center gap-1 cursor-pointer transition p-1.5 rounded-md ${
                            hasCommentsOpen ? "text-orange-500 hover:bg-orange-50" : "text-gray-500 hover:text-orange-500 hover:bg-orange-50"
                          } bg-transparent border-0`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.commentsCount || 0}</span>
                        </button>

                        {/* Share dropdown */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveSharePostId(activeSharePostId === post._id ? null : post._id)
                            }
                            className="flex items-center gap-1 cursor-pointer hover:text-blue-500 hover:bg-blue-50 transition p-1.5 rounded-md bg-transparent border-0"
                          >
                            <Share2 className="w-4 h-4" />
                            <span>{post.sharesCount || 0}</span>
                          </button>

                          {activeSharePostId === post._id && (
                            <div className="absolute left-0 mt-1 w-44 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20 flex flex-col">
                              <button
                                onClick={() => handleShareClick(post._id, "copy")}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 cursor-pointer bg-transparent border-0 text-gray-700"
                              >
                                <Link2 className="w-3.5 h-3.5" /> Copy Link
                              </button>
                              <button
                                onClick={() => handleShareClick(post._id, "whatsapp")}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 cursor-pointer bg-transparent border-0 text-gray-700"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-green-500" /> WhatsApp
                              </button>
                              <button
                                onClick={() => handleShareClick(post._id, "twitter")}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 cursor-pointer bg-transparent border-0 text-gray-700"
                              >
                                <Twitter className="w-3.5 h-3.5 text-blue-400" /> Twitter/X
                              </button>
                              <button
                                onClick={() => handleShareClick(post._id, "linkedin")}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 cursor-pointer bg-transparent border-0 text-gray-700"
                              >
                                <Linkedin className="w-3.5 h-3.5 text-blue-600" /> LinkedIn
                              </button>
                              <button
                                onClick={() => handleShareClick(post._id, "facebook")}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 cursor-pointer bg-transparent border-0 text-gray-700"
                              >
                                <Facebook className="w-3.5 h-3.5 text-blue-800" /> Facebook
                              </button>
                              <button
                                onClick={() => handleShareClick(post._id, "email")}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 cursor-pointer bg-transparent border-0 text-gray-700"
                              >
                                <Mail className="w-3.5 h-3.5 text-red-400" /> Share via Email
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleBookmarkToggle(post._id)}
                        className={`p-1.5 rounded-md cursor-pointer transition ${
                          isBookmarked ? "text-blue-500 hover:bg-blue-50" : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                        } bg-transparent border-0`}
                      >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-blue-500" : ""}`} />
                      </button>
                    </div>

                    {/* Comments Node render area */}
                    {hasCommentsOpen && (
                      <div className="p-4 border-t border-gray-100 bg-gray-50/20">
                        {/* comment add form */}
                        <form
                          onSubmit={(e) => handleAddComment(post._id, e)}
                          className="flex gap-2 items-center mb-3"
                        >
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={commentInputs[post._id] || ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({ ...prev, [post._id]: e.target.value }))
                            }
                            className="flex-1 text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                          />
                          <button
                            type="submit"
                            className="p-2 rounded bg-orange-500 hover:bg-orange-600 text-white font-semibold flex items-center justify-center transition"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>

                        {/* comments list */}
                        <div className="flex flex-col gap-1.5 divide-y divide-gray-50">
                          {commentsMap[post._id]?.length === 0 ? (
                            <p className="text-xs text-gray-500 py-2">No comments yet. Write one above!</p>
                          ) : (
                            commentsMap[post._id]
                              ?.filter((c) => !c.parentId) // render roots first
                              .map((c) => renderCommentNode(c, commentsMap[post._id], post._id))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Loading More spinner */}
          {loadingMore && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          )}
        </div>

        {/* Sidebar Widgets Panel */}
        <div className="w-full lg:w-80 flex flex-col gap-5 flex-shrink-0">
          {/* User overview card */}
          {user && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-lg font-bold flex items-center justify-center relative cursor-pointer shadow">
                {user.name?.charAt(0).toUpperCase()}
                {user.plan && user.plan !== "Free" && (
                  <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold border text-white shadow ${
                    user.plan === "Gold" ? "bg-gradient-to-r from-yellow-500 to-amber-500 border-yellow-600" :
                    user.plan === "Silver" ? "bg-slate-500 border-slate-600" :
                    "bg-amber-600 border-amber-700"
                  }`}>
                    {user.plan[0]}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{user.name}</h3>
                <span className="text-xs text-gray-500">@{user.username || "username"}</span>
              </div>
              <div className="grid grid-cols-2 w-full border-t border-gray-100 pt-3 text-center gap-1">
                <div>
                  <span className="block font-bold text-gray-800 text-sm">{user.followersCount || 0}</span>
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Followers</span>
                </div>
                <div className="border-l border-gray-100">
                  <span className="block font-bold text-gray-800 text-sm">{user.followingCount || 0}</span>
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Following</span>
                </div>
              </div>
              {user.role === "admin" && (
                <Link
                  href="/community/admin"
                  className="w-full text-center bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs py-2 rounded-md transition mt-2 shadow"
                >
                  Admin Moderation
                </Link>
              )}
            </div>
          )}

          {/* Trending sidebar block */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-2">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                🔥 Trending Posts
              </h3>
              <div className="flex gap-1 border-b border-gray-100 pb-1">
                {[
                  { id: "today", label: "Today" },
                  { id: "week", label: "Week" },
                  { id: "month", label: "Month" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTrendingPeriod(tab.id)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded transition border-0 cursor-pointer ${
                      trendingPeriod === tab.id
                        ? "bg-blue-600 text-white"
                        : "bg-transparent text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {loadingTrending ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                </div>
              ) : trendingPosts.length === 0 ? (
                <p className="text-xs text-gray-500">No popular posts inside this range</p>
              ) : (
                trendingPosts.slice(0, 5).map((tPost) => (
                  <button
                    key={tPost._id}
                    onClick={() => {
                      setSearchVal(tPost._id);
                      setActiveFilter("latest");
                    }}
                    className="w-full text-left flex flex-col border-b border-gray-50 pb-2 hover:bg-gray-50 transition border-0 bg-transparent cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-gray-800 line-clamp-1">
                      {tPost.text || tPost.projectShowcase?.title || "Programmer post"}
                    </span>
                    <div className="flex items-center justify-between w-full mt-1 text-[10px] text-gray-400">
                      <span>@{tPost.user?.username || "dev"}</span>
                      <span className="flex items-center gap-0.5 text-orange-500">
                        <Heart className="w-2.5 h-2.5 fill-orange-500" /> {tPost.likes?.length || 0}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT POST MODAL DIALOG */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-gray-800">
                {editingPostId ? "Edit Community Post" : "Create New Post"}
              </h2>
              <button
                onClick={resetCreateForm}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition bg-transparent border-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostSubmit} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {/* Text Body */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase">What's on your mind?</label>
                <textarea
                  placeholder="Share code tips, project releases, or updates... Use #hashtags to tag topics!"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg p-3 h-28 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                />
              </div>

              {/* Attachments Toggle Options */}
              <div className="flex flex-wrap gap-2 py-1.5 border-y border-gray-100 my-1 justify-between bg-gray-50 p-2 rounded-lg">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCodeInput(!showCodeInput)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer border ${
                      showCodeInput
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" /> Code Snippet
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProjectInput(!showProjectInput)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer border ${
                      showProjectInput
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <FolderGit2 className="w-3.5 h-3.5" /> Project Showcase
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAchievementInput(!showAchievementInput)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer border ${
                      showAchievementInput
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" /> Achievement
                  </button>
                </div>

                <label className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition cursor-pointer">
                  <ImageIcon className="w-3.5 h-3.5 text-green-500" />
                  <span>Images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(e)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Uploaded Images List preview */}
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded overflow-hidden border border-gray-100">
                      <img src={img} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-black/60 text-white p-0.5 rounded-full hover:bg-black transition cursor-pointer border-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Code Snippet input fields */}
              {showCodeInput && (
                <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Code Snippet Details</span>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                    >
                      {["c", "cpp", "java", "python", "javascript", "typescript", "go", "rust"].map((l) => (
                        <option key={l} value={l}>
                          {l.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    placeholder="Paste or write code snippet here..."
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full text-xs font-mono border border-gray-300 rounded p-3 h-32 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                  />
                </div>
              )}

              {/* Project Showcase inputs */}
              {showProjectInput && (
                <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3 bg-gray-50">
                  <span className="text-xs font-bold text-gray-700">Project Showcase details</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500">Project Title</label>
                      <input
                        type="text"
                        placeholder="My Awesome App"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        className="text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500">Technologies (comma-separated)</label>
                      <input
                        type="text"
                        placeholder="React, Express, MongoDB"
                        value={projectTech}
                        onChange={(e) => setProjectTech(e.target.value)}
                        className="text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500">GitHub Repository Link</label>
                      <input
                        type="url"
                        placeholder="https://github.com/..."
                        value={projectGithub}
                        onChange={(e) => setProjectGithub(e.target.value)}
                        className="text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500">Live Demo Link</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={projectDemo}
                        onChange={(e) => setProjectDemo(e.target.value)}
                        className="text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-500">Description</label>
                    <textarea
                      placeholder="Brief project details..."
                      value={projectDesc}
                      onChange={(e) => setProjectDesc(e.target.value)}
                      className="text-xs border border-gray-300 rounded p-2 h-16 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold bg-white border border-gray-300 rounded px-3 py-2 hover:bg-gray-100 transition cursor-pointer text-gray-700">
                      Upload Project Thumbnail
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                    {projectThumbnail && (
                      <div className="relative w-16 h-12 rounded border border-gray-200 overflow-hidden">
                        <img src={projectThumbnail} alt="project thumbnail" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setProjectThumbnail("")}
                          className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                        >
                          <X className="w-2 h-2" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Learning Achievement inputs */}
              {showAchievementInput && (
                <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3 bg-gray-50">
                  <span className="text-xs font-bold text-gray-700">Learning Achievement details</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500">Milestone Met (e.g. 100 Solved Milestone)</label>
                      <input
                        type="text"
                        placeholder="Solved 500 Questions on Leetcode"
                        value={achMilestone}
                        onChange={(e) => setAchMilestone(e.target.value)}
                        className="text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500">Course Completion Title</label>
                      <input
                        type="text"
                        placeholder="MongoDB Developer Path"
                        value={achCourse}
                        onChange={(e) => setAchCourse(e.target.value)}
                        className="text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500">Certification Name</label>
                      <input
                        type="text"
                        placeholder="AWS Solutions Architect"
                        value={achCert}
                        onChange={(e) => setAchCert(e.target.value)}
                        className="text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500">Contest Rankings (if any)</label>
                      <input
                        type="text"
                        placeholder="Rank 242 out of 10000"
                        value={achRanking}
                        onChange={(e) => setAchRanking(e.target.value)}
                        className="text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-gray-500">Achievement Badge Label</label>
                      <input
                        type="text"
                        placeholder="Python Specialist / Algorithm Master"
                        value={achBadge}
                        onChange={(e) => setAchBadge(e.target.value)}
                        className="text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 flex justify-end gap-2 bg-white">
                <button
                  type="button"
                  onClick={resetCreateForm}
                  className="px-4 py-2 border border-gray-300 rounded text-xs font-semibold hover:bg-gray-50 transition cursor-pointer text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs transition cursor-pointer shadow-sm border-0"
                >
                  {editingPostId ? "Save Changes" : "Post Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT POST OVERLAY DIALOG */}
      {reportingPostId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-gray-800 flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5 text-orange-500" /> Report Content
              </h2>
              <button
                onClick={() => setReportingPostId(null)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-200 transition bg-transparent border-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleReportSubmit} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase">Reason for Report</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="text-xs border border-gray-300 rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                >
                  {["Spam", "Harassment", "Hate Speech", "Misinformation", "Adult Content", "Other"].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase">Details (Optional)</label>
                <textarea
                  placeholder="Provide additional details regarding the violation..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded p-2 h-20 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                />
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportingPostId(null)}
                  className="px-4 py-2 border border-gray-300 rounded text-xs font-semibold hover:bg-gray-50 transition cursor-pointer text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs transition cursor-pointer shadow border-0"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL IMAGE LIGHTBOX MODAL */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <button
            onClick={() => setPreviewImageUrl(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 cursor-pointer border-0"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImageUrl}
            alt="Expanded preview"
            className="max-w-full max-h-[90vh] object-contain rounded shadow-lg"
          />
        </div>
      )}
    </Mainlayout>
  );
}
