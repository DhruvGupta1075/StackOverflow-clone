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
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function HashtagPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { tag } = router.query;

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBookmarks, setUserBookmarks] = useState<string[]>([]);
  const [followingStateMap, setFollowingStateMap] = useState<{ [userId: string]: boolean }>({});

  // Comments state
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<{ [postId: string]: any[] }>({});
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [replyInputs, setReplyInputs] = useState<{ [commentId: string]: string }>({});
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [activeSharePostId, setActiveSharePostId] = useState<string | null>(null);
  const [activePostMenuId, setActivePostMenuId] = useState<string | null>(null);

  // Lightbox Preview
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const fetchHashtagPosts = async () => {
    if (!tag) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/community/feed", {
        params: {
          tag: String(tag).toLowerCase(),
          limit: 30,
        },
      });
      if (res.data.success) {
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tag feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router.isReady) {
      fetchHashtagPosts();
    }
  }, [router.isReady, tag]);

  // Bookmarks
  useEffect(() => {
    if (!user) return;
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
  }, [user]);

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

  // Follow
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
        fetchHashtagPosts();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Share click
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
      default:
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(postLink)}`, "_blank");
        break;
    }
  };

  // Comments
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
      }
    }
  };

  const handleAddComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Render text helper
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

  // Render comments helper (flat list for tag page simplicity)
  const renderComment = (comment: any, postId: string) => {
    return (
      <div key={comment._id} className="ml-4 mt-2 border-l-2 border-orange-100 pl-3 py-1 flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700">{comment.user?.name || "Developer"}</span>
          <span className="text-[10px] text-gray-400">@{comment.user?.username}</span>
        </div>
        <p className="text-sm text-gray-800 break-words">{comment.text}</p>
      </div>
    );
  };

  return (
    <Mainlayout>
      <div className="max-w-[800px] mx-auto min-h-screen pb-12 flex flex-col gap-6">
        <div className="border-b border-gray-100 pb-4">
          <Link
            href="/community"
            className="text-xs text-orange-500 font-bold hover:underline mb-2 block"
          >
            ← Back to Community Feed
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🏷️ Posts tagged with <span className="text-orange-500">#{tag}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Displaying all programmer updates mentioning #{tag}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No posts contain this hashtag yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {posts.map((post) => {
              const isLiked = user && post.likes?.includes(user._id);
              const isBookmarked = userBookmarks.includes(post._id);
              const hasCommentsOpen = activeCommentsPostId === post._id;

              if (post.user?._id && followingStateMap[post.user._id] === undefined) {
                fetchFollowStatus(post.user._id);
              }

              return (
                <div
                  key={post._id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
                >
                  {/* Header */}
                  <div className="p-4 flex items-center justify-between border-b border-gray-50 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center relative flex-shrink-0">
                        {post.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-800 text-sm">
                            {post.user?.name || "Developer"}
                          </span>
                          {post.user?._id !== user?._id && (
                            <button
                              onClick={() => handleFollowToggle(post.user?._id)}
                              className={`text-[10px] font-bold border rounded px-1.5 py-0.5 cursor-pointer transition ${
                                followingStateMap[post.user?._id]
                                  ? "bg-gray-100 border-gray-300 text-gray-600"
                                  : "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                              }`}
                            >
                              {followingStateMap[post.user?._id] ? "Unfollow" : "Follow"}
                            </button>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          @{post.user?.username || "dev"} • {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex flex-col gap-4">
                    {post.text && <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{renderPostText(post.text)}</p>}

                    {/* Images */}
                    {post.images && post.images.length > 0 && (
                      <div className={`grid gap-2 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                        {post.images.map((img: string, index: number) => (
                          <img
                            key={index}
                            src={img}
                            alt="Upload"
                            onClick={() => setPreviewImageUrl(img)}
                            className="max-h-72 w-full object-cover rounded-lg cursor-pointer"
                          />
                        ))}
                      </div>
                    )}

                    {/* Code Snippet */}
                    {post.codeSnippet && post.codeSnippet.code && (
                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-900">
                        <div className="bg-gray-800 px-3 py-1.5 flex justify-between items-center text-xs text-gray-300 font-mono">
                          <span>{post.codeSnippet.language.toUpperCase()} Snippet</span>
                        </div>
                        <pre className="p-4 text-xs font-mono text-gray-100 overflow-x-auto max-h-[300px]">
                          <code>{post.codeSnippet.code}</code>
                        </pre>
                      </div>
                    )}

                    {/* Project Showcase */}
                    {post.projectShowcase && post.projectShowcase.title && (
                      <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col md:flex-row bg-gray-50/50 p-4 gap-4">
                        <div className="flex-1 flex flex-col gap-2">
                          <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                            <FolderGit2 className="w-4 h-4 text-orange-500" /> {post.projectShowcase.title}
                          </h4>
                          <p className="text-xs text-gray-600">{post.projectShowcase.description}</p>
                          <div className="flex gap-2">
                            {post.projectShowcase.githubRepo && (
                              <Link href={post.projectShowcase.githubRepo} target="_blank" className="text-xs text-blue-500 font-semibold flex items-center gap-1">
                                GitHub <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}
                            {post.projectShowcase.liveDemo && (
                              <Link href={post.projectShowcase.liveDemo} target="_blank" className="text-xs text-green-500 font-semibold flex items-center gap-1">
                                Demo <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium bg-gray-50/50">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLikeToggle(post)}
                        className={`flex items-center gap-1 cursor-pointer ${isLiked ? "text-red-500" : "text-gray-500"}`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500" : ""}`} />
                        <span>{post.likes?.length || 0}</span>
                      </button>

                      <button
                        onClick={() => toggleCommentsSection(post._id)}
                        className="flex items-center gap-1 cursor-pointer hover:text-orange-500"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.commentsCount || 0}</span>
                      </button>

                      <button
                        onClick={() => handleShareClick(post._id, "copy")}
                        className="flex items-center gap-1 cursor-pointer hover:text-blue-500"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>{post.sharesCount || 0}</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleBookmarkToggle(post._id)}
                      className={`p-1 rounded cursor-pointer ${isBookmarked ? "text-blue-500" : "text-gray-400"}`}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-blue-500" : ""}`} />
                    </button>
                  </div>

                  {/* Comments section */}
                  {hasCommentsOpen && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50/20">
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
                          className="flex-1 text-xs border border-gray-200 rounded-md px-3 py-2 bg-white"
                        />
                        <button
                          type="submit"
                          className="p-2 rounded bg-orange-500 text-white flex items-center justify-center"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>

                      <div className="flex flex-col gap-1.5">
                        {commentsMap[post._id]?.map((c) => renderComment(c, post._id))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {previewImageUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <img src={previewImageUrl} alt="Preview" className="max-w-full max-h-[90vh] object-contain" />
        </div>
      )}
    </Mainlayout>
  );
}
