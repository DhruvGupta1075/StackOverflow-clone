import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import {
  Bookmark,
  ChevronLeft,
  Lock,
  Search,
  Sparkles,
  Trash2,
  AlertCircle,
  HelpCircle,
  Globe,
  Award,
  FolderGit2,
  Github,
  ExternalLink,
  Code,
  Heart,
  MessageCircle,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "@/lib/useTranslationSafe";

export default function SavesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"questions" | "posts">("questions");

  // Questions Bookmark State
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questionsSearch, setQuestionsSearch] = useState("");

  // Posts Bookmark State
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsSearch, setPostsSearch] = useState("");

  const [hasMounted, setHasMounted] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const isPremium = user && (user.plan === "Silver" || user.plan === "Gold");

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const fetchSavedQuestions = async () => {
    if (!user || !isPremium) {
      setLoadingQuestions(false);
      return;
    }
    setLoadingQuestions(true);
    try {
      const res = await axiosInstance.get("/user/bookmarks");
      setQuestions(res.data.data || []);
    } catch (err: any) {
      console.error("Error loading bookmarked questions:", err);
      toast.error(err.response?.data?.message || "Failed to load saved questions");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const fetchSavedPosts = async () => {
    if (!user) {
      setLoadingPosts(false);
      return;
    }
    setLoadingPosts(true);
    try {
      const res = await axiosInstance.get("/api/community/bookmarks");
      if (res.data.success) {
        setPosts(res.data.posts || []);
      }
    } catch (err) {
      console.error("Error loading bookmarked posts:", err);
      toast.error("Failed to load saved community posts");
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (hasMounted && user) {
      if (activeTab === "questions") {
        fetchSavedQuestions();
      } else {
        fetchSavedPosts();
      }
    }
  }, [user, activeTab, hasMounted]);

  // Remove bookmark from Q&A Question
  const handleRemoveQuestionSave = async (questionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await axiosInstance.post(`/user/bookmark/${questionId}`);
      if (res.status === 200) {
        setQuestions((prev) => prev.filter((q) => q._id !== questionId));
        
        // Synchronize local storage user bookmarks
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.bookmarks = res.data.bookmarks;
          localStorage.setItem("user", JSON.stringify(parsed));
        }

        toast.success("Question removed from saves");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove question from saves");
    }
  };

  // Remove bookmark from Community Post
  const handleRemovePostSave = async (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await axiosInstance.post(`/api/community/post/${postId}/unbookmark`);
      if (res.data.success) {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
        toast.success("Community post removed from saves");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove post from saves");
    }
  };

  // Filters
  const filteredQuestions = questions.filter((q) => {
    const searchLower = questionsSearch.toLowerCase();
    const titleMatch = q.questiontitle?.toLowerCase().includes(searchLower);
    const bodyMatch = q.questionbody?.toLowerCase().includes(searchLower);
    const tagMatch = q.questiontags?.some((t: string) => t.toLowerCase().includes(searchLower));
    return titleMatch || bodyMatch || tagMatch;
  });

  const filteredPosts = posts.filter((p) => {
    const searchLower = postsSearch.toLowerCase();
    const textMatch = p.text?.toLowerCase().includes(searchLower);
    const userMatch = p.user?.name?.toLowerCase().includes(searchLower) || p.user?.username?.toLowerCase().includes(searchLower);
    const techMatch = p.projectShowcase?.title?.toLowerCase().includes(searchLower) || p.projectShowcase?.technologies?.some((t: string) => t.toLowerCase().includes(searchLower));
    const milestoneMatch = p.learningAchievement?.milestone?.toLowerCase().includes(searchLower);
    return textMatch || userMatch || techMatch || milestoneMatch;
  });

  // Hashtags Parser helper
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
            className="text-blue-600 font-semibold hover:underline"
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
        <div className="max-w-[1000px] mx-auto min-h-[80vh] pb-12 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
        </div>
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <div className="max-w-[1000px] mx-auto min-h-[80vh] pb-12 flex flex-col gap-6">
        {/* Header */}
        <div className="border-b border-gray-100 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-xs text-blue-600 font-semibold hover:underline mb-2 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> {t("saves.back_to_dashboard", "Back to dashboard")}
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Bookmark className="w-6 h-6 text-blue-600 fill-blue-600" /> {t("saves.my_saved_items", "My Saved Items")}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {t("saves.description", "Access your bookmarked questions and community post updates.")}
            </p>
          </div>

          {/* Search Inputs */}
          {user && (
            <div className="relative w-full md:w-64">
              {activeTab === "questions" ? (
                <>
                  <input
                    type="text"
                    placeholder={t("saves.search_questions", "Search saved questions...")}
                    value={questionsSearch}
                    onChange={(e) => setQuestionsSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  />
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder={t("saves.search_posts", "Search saved posts...")}
                    value={postsSearch}
                    onChange={(e) => setPostsSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  />
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </>
              )}
            </div>
          )}
        </div>

        {/* Tabs Control Header */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("questions")}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-semibold text-sm transition cursor-pointer bg-transparent border-0 ${
              activeTab === "questions"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <HelpCircle className="w-4 h-4" /> {t("saves.saved_questions", "Saved Questions")}
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-semibold text-sm transition cursor-pointer bg-transparent border-0 ${
              activeTab === "posts"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Globe className="w-4 h-4" /> {t("saves.saved_posts", "Saved Posts")}
          </button>
        </div>

        {/* Tab Contents */}
        {!user ? (
          /* Unauthenticated state */
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-4 max-w-lg mx-auto shadow-sm">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">{t("saves.auth_required", "Authentication Required")}</h3>
            <p className="text-gray-500 text-sm">
              {t("saves.auth_desc", "Please log in to your account to save questions and access them later.")}
            </p>
            <Link
              href="/auth"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded transition shadow border-0"
            >
              {t("saves.login_signup_btn", "Log in / Sign up")}
            </Link>
          </div>
        ) : activeTab === "questions" ? (
          /* QUESTIONS TAB CONTENT */
          loadingQuestions ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
              <span className="text-xs text-gray-500 font-semibold">{t("saves.loading_questions", "Loading saved questions...")}</span>
            </div>
          ) : !isPremium ? (
            /* Premium Locked State */
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-4 max-w-xl mx-auto shadow-sm mt-6">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 animate-pulse">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-1.5 justify-center">
                {t("saves.premium_title", "Saves is a Premium Feature")}
              </h3>
              <p className="text-gray-600 text-sm max-w-md">
                {t("saves.premium_desc", "Upgrade to the Silver or Gold Plan to unlock bookmarking forum threads. Stay organized by saving questions, reference snippets, and answers for easy lookup!")}
              </p>
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 text-left w-full flex items-start gap-2 max-w-md">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  Your current plan is <strong>{user.plan || "Free"}</strong>. Upgrade from as low as ₹99/month to access saves and advanced features.
                </span>
              </div>
              <button
                onClick={() => router.push("/upgrade")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded shadow transition border-0 cursor-pointer"
              >
                {t("saves.view_pricing_btn", "View Pricing Plans")}
              </button>
            </div>
          ) : filteredQuestions.length === 0 ? (
            /* Questions Empty state */
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                {questionsSearch ? t("saves.no_results_title", "No search results") : t("saves.empty_title", "No saved questions yet")}
              </h3>
              <p className="text-gray-500 text-sm max-w-md">
                {questionsSearch
                  ? t("saves.no_results_desc", "Try searching for a different keyword or checking tags.")
                  : t("saves.empty_desc", "When browsing forum threads, click the bookmark icon on any question to save it here for quick reference.")}
              </p>
              <Link
                href="/"
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 font-bold transition shadow-sm"
              >
                {t("saves.browse_questions_btn", "Browse Questions")}
              </Link>
            </div>
          ) : (
            /* Bookmarked Questions List */
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
              {filteredQuestions.map((q) => (
                <div
                  key={q._id}
                  className="p-5 flex flex-col sm:flex-row gap-4 hover:bg-gray-50/40 transition group"
                >
                  <div className="flex sm:flex-col items-center sm:items-center text-sm text-gray-500 sm:w-20 gap-4 sm:gap-1.5 flex-shrink-0">
                    <div className="text-center w-full sm:bg-gray-50 sm:p-2 sm:rounded border border-gray-200/50">
                      <div className="font-bold text-gray-700">
                        {q.upvote.length - q.downvote.length}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-gray-400">votes</div>
                    </div>
                    <div className="text-center w-full sm:bg-gray-50 sm:p-2 sm:rounded border border-gray-200/50">
                      <div className={`font-bold ${q.answer?.length > 0 ? "text-green-600" : "text-gray-700"}`}>
                        {q.noofanswer || 0}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-gray-400">answers</div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-2">
                      <Link
                        href={`/questions/${q._id}`}
                        className="text-blue-600 hover:text-blue-800 text-base lg:text-lg font-bold block leading-snug hover:underline"
                      >
                        {q.questiontitle}
                      </Link>
                      <button
                        onClick={(e) => handleRemoveQuestionSave(q._id, e)}
                        className="p-1 rounded text-gray-400 hover:bg-red-50 hover:text-red-500 transition opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer bg-transparent border-0"
                        title="Remove from saves"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-2 italic">
                      "{q.questionbody}"
                    </p>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-1">
                      <div className="flex flex-wrap gap-1">
                        {q.questiontags?.map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold border border-blue-100"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center text-xs text-gray-500 gap-1.5">
                        <span>Posted by</span>
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-[9px] bg-blue-600 text-white font-bold">
                            {q.userposted?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-gray-700">{q.userposted}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* POSTS TAB CONTENT */
          loadingPosts ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
              <span className="text-xs text-gray-500 font-semibold">Loading saved posts...</span>
            </div>
          ) : filteredPosts.length === 0 ? (
            /* Posts Empty state */
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                {postsSearch ? "No search results" : "No saved posts yet"}
              </h3>
              <p className="text-gray-500 text-sm max-w-md">
                {postsSearch
                  ? "Try searching for a different keyword or checking tags."
                  : "When browsing the community feed, click the bookmark icon on any post to save it here."}
              </p>
              <Link
                href="/community"
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 font-bold transition shadow-sm"
              >
                Explore Community Feed
              </Link>
            </div>
          ) : (
            /* Bookmarked Posts List */
            <div className="flex flex-col gap-5">
              {filteredPosts.map((post) => (
                <div
                  key={post._id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
                >
                  {/* Header */}
                  <div className="p-4 flex items-center justify-between border-b border-gray-50 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                        {post.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800 text-sm">
                          {post.user?.name || "Developer"}
                        </span>
                        <span className="text-xs text-gray-500">
                          @{post.user?.username || "dev"} • {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleRemovePostSave(post._id, e)}
                      className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-500 transition cursor-pointer border-0 bg-transparent"
                      title="Remove bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col gap-3">
                    <p className="text-gray-800 text-sm whitespace-pre-line leading-relaxed">
                      {renderPostText(post.text)}
                    </p>

                    {/* Image grid */}
                    {post.images && post.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {post.images.map((img: string, i: number) => (
                          <img
                            key={i}
                            src={img}
                            alt="post preview"
                            className="rounded-lg max-h-60 object-cover w-full cursor-pointer hover:opacity-95 transition"
                            onClick={() => setPreviewImageUrl(img)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Code Snippet attachment */}
                    {post.codeSnippet && post.codeSnippet.code && (
                      <div className="mt-3 bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs overflow-x-auto relative">
                        <div className="absolute top-2 right-2 text-[10px] uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold">
                          {post.codeSnippet.language}
                        </div>
                        <pre className="mt-2">
                          <code>{post.codeSnippet.code}</code>
                        </pre>
                      </div>
                    )}

                    {/* Project Showcase attachment */}
                    {post.projectShowcase && post.projectShowcase.title && (
                      <div className="mt-3 border border-blue-100 bg-blue-50/30 rounded-lg p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                          <FolderGit2 className="w-4 h-4 text-blue-600" />
                          <span>Project: {post.projectShowcase.title}</span>
                        </div>
                        <p className="text-xs text-gray-600">{post.projectShowcase.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {post.projectShowcase.technologies?.map((tech: string) => (
                            <Badge
                              key={tech}
                              variant="outline"
                              className="text-[10px] border-blue-200 text-blue-700 bg-blue-50"
                            >
                              {tech}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-3 mt-1">
                          {post.projectShowcase.githubRepo && (
                            <a
                              href={post.projectShowcase.githubRepo}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[10px] font-bold text-gray-700 hover:text-black hover:underline"
                            >
                              <Github className="w-3.5 h-3.5" /> Repository
                            </a>
                          )}
                          {post.projectShowcase.liveDemo && (
                            <a
                              href={post.projectShowcase.liveDemo}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Achievement badge attachment */}
                    {post.learningAchievement && post.learningAchievement.milestone && (
                      <div className="mt-3 border border-emerald-100 bg-emerald-50/20 rounded-lg p-4 flex flex-col gap-2.5">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                          <Award className="w-4 h-4 text-emerald-600 animate-bounce" />
                          <span>Milestone: {post.learningAchievement.milestone}</span>
                        </div>
                        {post.learningAchievement.courseTitle && (
                          <div className="text-xs text-gray-600">
                            Course: <strong className="text-gray-700">{post.learningAchievement.courseTitle}</strong>
                          </div>
                        )}
                        {post.learningAchievement.certificationName && (
                          <div className="text-xs text-gray-600">
                            Cert: <strong className="text-gray-700">{post.learningAchievement.certificationName}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer stats summary */}
                  <div className="p-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500 bg-gray-50/20">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> {post.likes?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4 text-blue-500" /> {post.commentsCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

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
            alt="full preview"
            className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl"
          />
        </div>
      )}
    </Mainlayout>
  );
}
