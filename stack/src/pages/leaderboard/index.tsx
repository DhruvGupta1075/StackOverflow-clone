import React, { useEffect, useState } from "react";
import Mainlayout from "@/layout/Mainlayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Crown, Medal, Award, Flame, MessageSquare, FileText, Globe, Star, Sparkles, Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axiosinstance";
import Link from "next/link";
import { toast } from "react-toastify";

interface LeaderboardUser {
  rank: number;
  _id: string;
  name: string;
  username?: string;
  plan?: string;
  reputation: number;
  periodReputation: number;
  communityRank: string;
  badges: any[];
  questionCount: number;
  answerCount: number;
  postCount: number;
  totalContributions: number;
}

const LeaderboardPage = () => {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all_time">("all_time");
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/reputation/leaderboard?period=${period}`);
      setLeaderboard(res.data?.leaderboard || []);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      toast.error("Failed to load community leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const top3 = leaderboard.slice(0, 3);
  const remainingList = leaderboard.slice(3);

  return (
    <Mainlayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <Trophy className="w-7 h-7 text-amber-500" /> Community Reputation Leaderboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Recognizing top open-source contributors, solution providers, and mentor developers.
            </p>
          </div>

          {/* Filter Period Tabs */}
          <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs font-semibold">
            {[
              { id: "today", label: "Today" },
              { id: "week", label: "This Week" },
              { id: "month", label: "This Month" },
              { id: "all_time", label: "All Time" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id as any)}
                className={`px-3 py-1.5 rounded-md transition ${
                  period === tab.id
                    ? "bg-white text-orange-600 shadow-sm font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            <p className="text-sm text-gray-500">Fetching community rankings...</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium Cards */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* Second Place (Rank 2) */}
                {top3[1] && (
                  <Card className="border-2 border-slate-300 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden shadow hover:shadow-md transition">
                    <div className="absolute top-2 right-2">
                      <Medal className="w-8 h-8 text-slate-400" />
                    </div>
                    <CardContent className="pt-6 text-center space-y-3">
                      <div className="relative inline-block">
                        <Avatar className="w-20 h-20 mx-auto border-2 border-slate-400">
                          <AvatarFallback className="text-xl font-bold bg-slate-200 text-slate-800">
                            {top3[1].name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-2 right-0 bg-slate-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                          #2
                        </span>
                      </div>
                      <div>
                        <Link href={`/users/${top3[1]._id}`} className="font-bold text-lg text-gray-900 hover:text-orange-600">
                          {top3[1].name}
                        </Link>
                        <p className="text-xs text-gray-500">@{top3[1].username || "developer"}</p>
                      </div>
                      <div className="bg-slate-100/80 rounded-lg p-2 flex justify-around text-xs font-semibold">
                        <div>
                          <p className="text-gray-500">Reputation</p>
                          <p className="text-slate-800 font-bold text-base">{top3[1].reputation} pts</p>
                        </div>
                        <div className="border-l border-slate-200 pl-3">
                          <p className="text-gray-500">Contributions</p>
                          <p className="text-gray-900 text-base">{top3[1].totalContributions}</p>
                        </div>
                      </div>
                      <Badge className="bg-slate-200 text-slate-800 text-[11px] font-medium">{top3[1].communityRank}</Badge>
                    </CardContent>
                  </Card>
                )}

                {/* First Place (Rank 1) */}
                {top3[0] && (
                  <Card className="border-2 border-amber-400 bg-gradient-to-b from-amber-50/60 to-white relative overflow-hidden shadow-lg transform md:-translate-y-2 hover:shadow-xl transition">
                    <div className="absolute top-2 right-2">
                      <Crown className="w-9 h-9 text-amber-500 animate-pulse" />
                    </div>
                    <CardContent className="pt-6 text-center space-y-3">
                      <div className="relative inline-block">
                        <Avatar className="w-24 h-24 mx-auto border-4 border-amber-400 shadow">
                          <AvatarFallback className="text-2xl font-black bg-amber-200 text-amber-900">
                            {top3[0].name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-2 right-1 bg-amber-500 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow">
                          #1
                        </span>
                      </div>
                      <div>
                        <Link href={`/users/${top3[0]._id}`} className="font-extrabold text-xl text-gray-900 hover:text-orange-600 flex items-center justify-center gap-1">
                          {top3[0].name}
                          {top3[0].plan === "Gold" && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                        </Link>
                        <p className="text-xs text-gray-500">@{top3[0].username || "champion"}</p>
                      </div>
                      <div className="bg-amber-100/80 border border-amber-200 rounded-lg p-2.5 flex justify-around text-xs font-semibold">
                        <div>
                          <p className="text-amber-800">Reputation</p>
                          <p className="text-amber-900 font-extrabold text-lg">{top3[0].reputation} pts</p>
                        </div>
                        <div className="border-l border-amber-200 pl-3">
                          <p className="text-amber-800">Contributions</p>
                          <p className="text-gray-900 text-lg">{top3[0].totalContributions}</p>
                        </div>
                      </div>
                      <Badge className="bg-amber-500 text-white text-xs font-bold tracking-wider">{top3[0].communityRank}</Badge>
                    </CardContent>
                  </Card>
                )}

                {/* Third Place (Rank 3) */}
                {top3[2] && (
                  <Card className="border-2 border-amber-700/30 bg-gradient-to-b from-amber-50/20 to-white relative overflow-hidden shadow hover:shadow-md transition">
                    <div className="absolute top-2 right-2">
                      <Award className="w-8 h-8 text-amber-700" />
                    </div>
                    <CardContent className="pt-6 text-center space-y-3">
                      <div className="relative inline-block">
                        <Avatar className="w-20 h-20 mx-auto border-2 border-amber-700/40">
                          <AvatarFallback className="text-xl font-bold bg-amber-100 text-amber-900">
                            {top3[2].name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-2 right-0 bg-amber-700 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                          #3
                        </span>
                      </div>
                      <div>
                        <Link href={`/users/${top3[2]._id}`} className="font-bold text-lg text-gray-900 hover:text-orange-600">
                          {top3[2].name}
                        </Link>
                        <p className="text-xs text-gray-500">@{top3[2].username || "coder"}</p>
                      </div>
                      <div className="bg-amber-50/80 rounded-lg p-2 flex justify-around text-xs font-semibold">
                        <div>
                          <p className="text-gray-500">Reputation</p>
                          <p className="text-amber-900 font-bold text-base">{top3[2].reputation} pts</p>
                        </div>
                        <div className="border-l border-amber-200 pl-3">
                          <p className="text-gray-500">Contributions</p>
                          <p className="text-gray-900 text-base">{top3[2].totalContributions}</p>
                        </div>
                      </div>
                      <Badge className="bg-amber-100 text-amber-900 text-[11px] font-medium">{top3[2].communityRank}</Badge>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Rankings Table */}
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-base font-bold text-gray-800">Complete Rankings</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {leaderboard.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider">
                          <th className="py-3 px-4 text-center">Rank</th>
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4">Rank Tier</th>
                          <th className="py-3 px-4 text-center">Badges</th>
                          <th className="py-3 px-4 text-center">Answers</th>
                          <th className="py-3 px-4 text-center">Questions</th>
                          <th className="py-3 px-4 text-right">Reputation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {leaderboard.map((item) => (
                          <tr key={item._id} className="hover:bg-orange-50/30 transition">
                            <td className="py-3.5 px-4 text-center font-bold text-gray-700">
                              {item.rank === 1 ? (
                                <span className="inline-block bg-amber-100 text-amber-800 w-7 h-7 rounded-full leading-7 font-black">1</span>
                              ) : item.rank === 2 ? (
                                <span className="inline-block bg-slate-200 text-slate-800 w-7 h-7 rounded-full leading-7 font-black">2</span>
                              ) : item.rank === 3 ? (
                                <span className="inline-block bg-amber-200 text-amber-900 w-7 h-7 rounded-full leading-7 font-black">3</span>
                              ) : (
                                `#${item.rank}`
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="text-xs bg-orange-100 text-orange-800 font-semibold">
                                    {item.name ? item.name[0].toUpperCase() : "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <Link
                                    href={`/users/${item._id}`}
                                    className="font-bold text-gray-900 hover:text-orange-600 flex items-center gap-1.5"
                                  >
                                    {item.name}
                                    {item.plan && item.plan !== "Free" && (
                                      <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-700 py-0">
                                        {item.plan}
                                      </Badge>
                                    )}
                                  </Link>
                                  <span className="text-xs text-gray-500">@{item.username || "user"}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-medium text-gray-700">
                              <span className="inline-block bg-gray-100 text-gray-800 border px-2 py-0.5 rounded text-xs">
                                {item.communityRank}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <div className="flex justify-center flex-wrap gap-1">
                                {item.badges && item.badges.length > 0 ? (
                                  item.badges.slice(0, 3).map((b: any, idx: number) => (
                                    <span
                                      key={idx}
                                      title={b.name}
                                      className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                    >
                                      🏆 {b.name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center text-gray-700 font-semibold">
                              {item.answerCount}
                            </td>
                            <td className="py-3.5 px-4 text-center text-gray-700">
                              {item.questionCount}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <span className="font-extrabold text-orange-600 text-base">
                                {period === "all_time" ? item.reputation : item.periodReputation} pts
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">No leaderboard entries found.</div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Mainlayout>
  );
};

export default LeaderboardPage;
