import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { Calendar, Search, Star } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
const index = () => {
  const [users, setusers] = useState<any>(null);
  const [loading, setloading] = useState(true);
  useEffect(() => {
    const fetchuser = async () => {
      try {
        const res = await axiosInstance.get("/user/getalluser");
        setusers(res.data.data);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchuser();
  }, []);
  if (loading) {
    return (
      <Mainlayout>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </Mainlayout>
    );
  }
  if (!users || users.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-4">No users found.</div>
    );
  }
  return (
    <Mainlayout>
      <div className="max-w-6xl">
        <h1 className="text-xl lg:text-2xl font-semibold mb-6">Users</h1>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Filter by user" className="pl-10" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...users]
            .sort((a: any, b: any) => {
              const getPlanWeight = (plan: string) => {
                if (plan === "Gold") return 3;
                if (plan === "Silver") return 2;
                if (plan === "Bronze") return 1;
                return 0;
              };
              return getPlanWeight(b.plan || "Free") - getPlanWeight(a.plan || "Free");
            })
            .map((user: any) => {
              const isGold = user.plan === "Gold";
              const isSilver = user.plan === "Silver";
              
              return (
                <Link key={user._id} href={`/users/${user._id}`}>
                  <div className={`relative border rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden ${
                    isGold
                      ? "border-yellow-400 bg-yellow-50/15 shadow-xs ring-1 ring-yellow-400/30"
                      : isSilver
                      ? "border-slate-300 bg-slate-50/10 shadow-3xs"
                      : "border-gray-200 bg-white"
                  }`}>
                    {/* Featured / Premium Banner details */}
                    {isGold && (
                      <span className="absolute top-0 right-0 bg-yellow-500 text-[8px] text-white font-extrabold uppercase px-2 py-0.5 rounded-bl tracking-wider flex items-center gap-0.5">
                        <Star className="w-2 h-2 fill-current" /> Featured
                      </span>
                    )}

                    <div className="flex items-center mb-3">
                      <Avatar className="w-12 h-12 mr-3 relative">
                        <AvatarFallback className="text-lg">
                          {user.name
                            .split(" ")
                            .map((n: any) => n[0])
                            .join("")}
                        </AvatarFallback>
                        {user.plan && user.plan !== "Free" && (
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-white flex items-center justify-center ${
                            isGold ? "bg-amber-500" : isSilver ? "bg-slate-400" : "bg-yellow-600"
                          }`} />
                        )}
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-blue-600 hover:text-blue-800 truncate flex items-center gap-1.5 flex-wrap">
                          {user.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                          @{user.name}
                          {user.plan && user.plan !== "Free" && (
                            <Badge className={`text-[8px] font-extrabold uppercase py-0 px-1 rounded-sm scale-90 ${
                              isGold ? "bg-amber-100 text-amber-800 border-amber-300" :
                              isSilver ? "bg-slate-100 text-slate-800 border-slate-300" :
                              "bg-yellow-100 text-yellow-800 border-yellow-300"
                            }`}>
                              {user.plan}
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      <span>Joined {new Date(user.joinDate).getFullYear()}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      </div>
    </Mainlayout>
  );
};

export default index;
