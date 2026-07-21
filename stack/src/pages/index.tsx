import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Star, Award, Sparkles, Filter, Lock, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/useTranslationSafe";

export default function Home() {
  const { user } = useAuth();
  const [question, setquestion] = useState<any>(null);
  const [loading, setloading] = useState(true);
  const router = useRouter();
  const { t } = useTranslation();

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [filterTags, setFilterTags] = useState("");
  const [filterAuthor, setFilterAuthor] = useState("");
  const [filterMinVotes, setFilterMinVotes] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterUnanswered, setFilterUnanswered] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const fetchquestion = async () => {
      setloading(true);
      try {
        const res = await axiosInstance.get("/question/getallquestion", {
          params: router.query,
        });
        setquestion(res.data.data);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchquestion();
  }, [router.isReady, router.query]);

  useEffect(() => {
    if (!router.isReady) return;
    setFilterTags((router.query.tags as string) || "");
    setFilterAuthor((router.query.author as string) || "");
    setFilterMinVotes((router.query.minVotes as string) || "");
    setFilterStartDate((router.query.startDate as string) || "");
    setFilterEndDate((router.query.endDate as string) || "");
    setFilterUnanswered(router.query.unanswered === "true");
  }, [router.isReady, router.query]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const query: any = {};
    if (router.query.search) query.search = router.query.search;
    if (filterTags) query.tags = filterTags;
    if (filterAuthor) query.author = filterAuthor;
    if (filterMinVotes) query.minVotes = filterMinVotes;
    if (filterStartDate) query.startDate = filterStartDate;
    if (filterEndDate) query.endDate = filterEndDate;
    if (filterUnanswered) query.unanswered = "true";

    router.push({ pathname: "/", query });
  };

  const handleResetFilters = () => {
    setFilterTags("");
    setFilterAuthor("");
    setFilterMinVotes("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterUnanswered(false);
    router.push("/");
  };
  if (loading) {
    return (
      <Mainlayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Mainlayout>
    );
  }
  if (!question || question.length === 0) {
    return (
      <Mainlayout>
        <div className="text-center text-gray-500 mt-4">{t("dashboard.empty_questions", "No questions found.")}</div>
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <div className="min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-xl lg:text-2xl font-semibold">{t("dashboard.top_questions", "Top Questions")}</h1>
          <button
            onClick={() => router.push("/ask")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium whitespace-nowrap cursor-pointer border-0"
          >
            {t("dashboard.ask_question", "Ask Question")}
          </button>
        </div>
        <div className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 text-sm gap-2 sm:gap-4">
            <span className="text-gray-600">{question?.length || 0} {t("sidebar.questions", "questions")}</span>
            <div className="flex flex-wrap gap-1 sm:gap-2 flex-grow items-center">
              <button className="px-2 sm:px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs sm:text-sm cursor-pointer border-0">
                {t("dashboard.newest", "Newest")}
              </button>
              <button className="px-2 sm:px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-xs sm:text-sm cursor-pointer border-0">
                {t("dashboard.active", "Active")}
              </button>
              <button className="px-2 sm:px-3 py-1 text-gray-600 hover:bg-gray-100 rounded flex items-center text-xs sm:text-sm cursor-pointer border-0">
                {t("dashboard.bountied", "Bountied")}
                <Badge variant="secondary" className="ml-1 text-xs">
                  25
                </Badge>
              </button>
              <button className="px-2 sm:px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-xs sm:text-sm cursor-pointer border-0">
                {t("dashboard.unanswered", "Unanswered")}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-2 sm:px-3 py-1 border rounded ml-auto text-xs sm:text-sm flex items-center gap-1 transition cursor-pointer ${
                  showFilters ? "bg-orange-100 text-orange-800 border-orange-300 font-semibold shadow-xs" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Filter className="w-3.5 h-3.5" /> {t("dashboard.filter_button", "Filter")} {Object.keys(router.query).filter(k => k !== "search").length > 0 && "•"}
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="relative border border-gray-200 rounded-lg p-5 bg-gray-50/50 mb-6 transition-all duration-300">
              {/* Premium Lock Overlay */}
              {(!user || user.plan === "Free") && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center rounded-lg z-10 p-6 text-center">
                  <Lock className="w-8 h-8 text-orange-500 mb-2 animate-bounce" />
                  <h4 className="font-bold text-gray-900 text-base">{t("dashboard.advanced_filters_premium", "Advanced Search Filters (Premium Feature)")}</h4>
                  <p className="text-xs text-gray-600 max-w-sm my-1">
                    {t("dashboard.advanced_filters_upgrade", "Upgrade to Bronze, Silver, or Gold plan to search by tag, date ranges, vote count, and author name.")}
                  </p>
                  <button
                    onClick={() => router.push("/upgrade")}
                    className="mt-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow hover:opacity-90 cursor-pointer border-0"
                  >
                    {t("dashboard.unlock_filters_btn", "Unlock Filters (From ₹99)")}
                  </button>
                </div>
              )}

              <form onSubmit={handleApplyFilters} className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                    <Filter className="w-4 h-4 text-orange-500" /> {t("dashboard.advanced_filters_title", "Advanced Filter Settings")}
                  </span>
                  <button type="button" onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-red-500 cursor-pointer border-0 bg-transparent">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="tags-filter">{t("dashboard.filter_tags", "Search Tags (comma separated)")}</Label>
                    <Input
                      id="tags-filter"
                      placeholder="e.g. javascript, react"
                      value={filterTags}
                      onChange={(e) => setFilterTags(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="author-filter">{t("dashboard.filter_author", "Author Display Name")}</Label>
                    <Input
                      id="author-filter"
                      placeholder="e.g. PR0X"
                      value={filterAuthor}
                      onChange={(e) => setFilterAuthor(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="votes-filter">{t("dashboard.filter_min_votes", "Min Net Votes")}</Label>
                    <Input
                      id="votes-filter"
                      type="number"
                      placeholder="e.g. 5"
                      value={filterMinVotes}
                      onChange={(e) => setFilterMinVotes(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="start-date-filter">{t("dashboard.filter_start_date", "Start Date")}</Label>
                    <Input
                      id="start-date-filter"
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date-filter">{t("dashboard.filter_end_date", "End Date")}</Label>
                    <Input
                      id="end-date-filter"
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      id="unanswered-filter"
                      type="checkbox"
                      checked={filterUnanswered}
                      onChange={(e) => setFilterUnanswered(e.target.checked)}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                    />
                    <Label htmlFor="unanswered-filter" className="cursor-pointer select-none font-medium text-gray-700">
                      {t("dashboard.filter_unanswered_only", "Show Unanswered Questions Only")}
                    </Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="outline" onClick={handleResetFilters} size="sm" className="bg-transparent border-gray-300 cursor-pointer">
                    {t("dashboard.reset_filters", "Reset")}
                  </Button>
                  <Button type="submit" size="sm" className="bg-orange-600 hover:bg-orange-700 text-white cursor-pointer border-0">
                    {t("dashboard.apply_filters", "Apply Filters")}
                  </Button>
                </div>
              </form>
            </div>
          )}
          <div className="space-y-4">
            {question.map((question: any) => (
              <div key={question._id} className="border-b border-gray-200 pb-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex sm:flex-col items-center sm:items-center text-sm text-gray-600 sm:w-16 lg:w-20 gap-4 sm:gap-2">
                    <div className="text-center">
                      <div className="font-medium">
                        {question.upvote.length - question.downvote.length}
                      </div>
                      <div className="text-xs">{t("dashboard.votes", "votes")}</div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`font-medium ${
                          question.answer.length > 0
                            ? "text-green-600 bg-green-100 px-2 py-1 rounded"
                            : ""
                        }`}
                      >
                        {question.noofanswer}
                      </div>
                      <div className="text-xs">
                        {question.noofanswer === 1
                          ? t("compiler.answer", "answer")
                          : t("compiler.answers", "answers")}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/questions/${question._id}`}
                      className="text-blue-600 hover:text-blue-800 text-base lg:text-lg font-medium mb-2 block"
                    >
                      {question.questiontitle}
                    </Link>
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                      {question.questionbody}
                    </p>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {question.questiontags.map((tag: any) => (
                          <div key={tag}>
                            <Badge
                              variant="secondary"
                              className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                            >
                              {tag}
                            </Badge>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center text-xs text-gray-600 flex-shrink-0 flex-wrap gap-1">
                        <Link
                          href={`/users/${question.userid}`}
                          className="flex items-center"
                        >
                          <Avatar className="w-5 h-5 mr-1 relative">
                            <AvatarFallback className="text-[10px]">
                              {question.userposted[0]}
                            </AvatarFallback>
                            {question.authorPlan && question.authorPlan !== "Free" && (
                              <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
                                question.authorPlan === "Gold" ? "bg-amber-500" :
                                question.authorPlan === "Silver" ? "bg-slate-400" :
                                "bg-yellow-600"
                              }`} />
                            )}
                          </Avatar>
                          <span className="text-blue-600 hover:text-blue-800 mr-1 font-semibold flex items-center gap-1">
                            {question.userposted}
                            {question.authorPlan && question.authorPlan !== "Free" && (
                              <span className={`text-[8px] px-1 py-0.2 rounded border uppercase font-extrabold scale-90 ${
                                question.authorPlan === "Gold" ? "bg-amber-100 text-amber-800 border-amber-300" :
                                question.authorPlan === "Silver" ? "bg-slate-100 text-slate-800 border-slate-300" :
                                "bg-yellow-100 text-yellow-800 border-yellow-300"
                              }`}>
                                {question.authorPlan}
                              </span>
                            )}
                          </span>
                        </Link>

                        <span>{t("dashboard.asked", "asked")} {new Date(question.askedon).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Mainlayout>
  );
}
