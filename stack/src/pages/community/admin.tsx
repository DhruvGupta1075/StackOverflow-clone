import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import {
  Shield,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  Loader2,
  ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      if (user) {
        if (user.role === "admin") {
          setIsAdmin(true);
        } else {
          toast.error("Access Denied: Admins only.");
          router.push("/community");
        }
      } else {
        if (!localStorage.getItem("user")) {
          toast.info("Please log in as an administrator");
          router.push("/auth");
        }
      }
    }
  }, [user, hasMounted]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/community/admin/reports");
      if (res.data.success) {
        setReports(res.data.reports);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load reports queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && hasMounted) {
      fetchReports();
    }
  }, [isAdmin, hasMounted]);

  const handleReportAction = async (reportId: string, action: "confirm" | "dismiss") => {
    try {
      const res = await axiosInstance.post(`/api/community/admin/reports/${reportId}`, { action });
      if (res.data.success) {
        toast.success(res.data.message || `Report ${action}ed`);
        fetchReports();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to perform moderation action");
    }
  };

  const handleUserAction = async (userId: string, action: "suspend" | "ban" | "unsuspend" | "unban") => {
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      const res = await axiosInstance.post(`/api/community/admin/user/${userId}`, { action });
      if (res.data.success) {
        toast.success(`User successfully ${action}ed!`);
        fetchReports();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to moderate user");
    }
  };

  if (!hasMounted || !isAdmin) {
    return (
      <Mainlayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <div className="max-w-[1200px] mx-auto min-h-screen pb-12 flex flex-col gap-6">
        {/* Header */}
        <div className="border-b border-gray-100 pb-4">
          <Link
            href="/community"
            className="text-xs text-orange-500 font-bold hover:underline mb-2 flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Community Feed
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-7 h-7 text-red-500" /> Admin Moderation Panel
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Review flagged community posts, handle reports, and manage repeat offenders.
          </p>
        </div>

        {/* Reports Queue */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <h3 className="font-bold text-gray-800">Clear Queue!</h3>
            <p className="text-gray-500 text-sm">No pending post reports are currently flagged for review.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="p-4">Report Details</th>
                    <th className="p-4">Violating Content</th>
                    <th className="p-4">Reporter Information</th>
                    <th className="p-4">Violator Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {reports.map((report) => (
                    <tr key={report._id} className="hover:bg-gray-50/50">
                      {/* Reason */}
                      <td className="p-4 vertical-top max-w-[200px]">
                        <span className="inline-block bg-orange-100 text-orange-800 text-xs font-bold px-2 py-0.5 rounded-full mb-1">
                          {report.reason}
                        </span>
                        <p className="text-xs text-gray-600 break-words">{report.details || "No details provided"}</p>
                        <span className="text-[10px] text-gray-400 block mt-1.5">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Content */}
                      <td className="p-4 vertical-top max-w-[300px]">
                        {report.post ? (
                          <div className="flex flex-col gap-1.5">
                            <p className="text-xs text-gray-800 line-clamp-3 italic">
                              "{report.post.text}"
                            </p>
                            {report.post.projectShowcase?.title && (
                              <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-fit">
                                Project: {report.post.projectShowcase.title}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-red-500 font-semibold">[POST DELETED/REMOVED]</span>
                        )}
                      </td>

                      {/* Reporter */}
                      <td className="p-4 vertical-top text-xs">
                        <p className="font-semibold text-gray-700">{report.reporter?.name}</p>
                        <p className="text-gray-400">@{report.reporter?.username}</p>
                        <p className="text-gray-400 text-[10px]">{report.reporter?.email}</p>
                      </td>

                      {/* Violator Info */}
                      <td className="p-4 vertical-top text-xs">
                        {report.post?.user ? (
                          <div className="flex flex-col gap-1">
                            <p className="font-semibold text-gray-700">{report.post.user.name}</p>
                            <p className="text-gray-400">@{report.post.user.username}</p>
                            <span className="text-[10px] font-bold text-red-600">
                              Confirmed Violations: {report.post.user.confirmedViolations || 0}
                            </span>
                            <div className="flex gap-1.5 mt-1">
                              {report.post.user.isSuspended ? (
                                <span className="bg-red-100 text-red-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  Suspended
                                </span>
                              ) : report.post.user.isBanned ? (
                                <span className="bg-red-200 text-red-900 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  Banned
                                </span>
                              ) : (
                                <span className="bg-green-100 text-green-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 vertical-top">
                        <div className="flex flex-col gap-1.5 items-center">
                          {report.status === "pending" && report.post ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleReportAction(report._id, "confirm")}
                                className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-2.5 py-1 rounded shadow-sm transition cursor-pointer border-0"
                                title="Confirm report and delete post"
                              >
                                <Trash2 className="w-3 h-3" /> Delete Post
                              </button>
                              <button
                                onClick={() => handleReportAction(report._id, "dismiss")}
                                className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded transition cursor-pointer border-0"
                                title="Dismiss report"
                              >
                                Dismiss
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-gray-500 capitalize">
                              Report Status: {report.status}
                            </span>
                          )}

                          {report.post?.user && (
                            <div className="flex gap-1.5 mt-2 border-t border-gray-100 pt-2 w-full justify-center">
                              {report.post.user.isSuspended ? (
                                <button
                                  onClick={() => handleUserAction(report.post.user._id, "unsuspend")}
                                  className="text-[10px] font-bold text-green-600 hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
                                >
                                  <UserCheck className="w-3 h-3" /> Unsuspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserAction(report.post.user._id, "suspend")}
                                  className="text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
                                >
                                  <UserX className="w-3 h-3" /> Suspend
                                </button>
                              )}

                              {report.post.user.isBanned ? (
                                <button
                                  onClick={() => handleUserAction(report.post.user._id, "unban")}
                                  className="text-[10px] font-bold text-green-600 hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
                                >
                                  Unban
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserAction(report.post.user._id, "ban")}
                                  className="text-[10px] font-bold text-red-600 hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
                                >
                                  Ban User
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Mainlayout>
  );
}
