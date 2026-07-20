import React, { useEffect, useState } from "react";
import Mainlayout from "@/layout/Mainlayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, Award, Send, RefreshCw, Search, AlertTriangle, CheckCircle, RotateCcw, Power, User, ArrowLeftRight, Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "react-toastify";
import Link from "next/link";

export const AdminReputationPage = () => {
  const [activeTab, setActiveTab] = useState<"users" | "transfers" | "history">("users");
  const [stats, setStats] = useState<any>(null);
  const [topContributors, setTopContributors] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Manual Adjustment Form States
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [adjustPoints, setAdjustPoints] = useState<number | "">(10);
  const [adjustReason, setAdjustReason] = useState("");
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  // Transfer & History Tab States
  const [transfers, setTransfers] = useState<any[]>([]);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await axiosInstance.get("/api/admin/reputation/stats");
      setStats(res.data?.stats || null);
      setTopContributors(res.data?.topContributors || []);
    } catch (error: any) {
      console.error("Failed to load admin stats:", error);
      toast.error(error.response?.data?.message || "Failed to load admin stats");
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchTransfers = async () => {
    setLoadingTable(true);
    try {
      const res = await axiosInstance.get(`/api/admin/reputation/transfers?search=${searchQuery}`);
      setTransfers(res.data?.transfers || []);
    } catch (error) {
      console.error("Failed to fetch admin transfers:", error);
    } finally {
      setLoadingTable(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingTable(true);
    try {
      const res = await axiosInstance.get(`/api/admin/reputation/history?search=${searchQuery}`);
      setHistoryLogs(res.data?.history || []);
    } catch (error) {
      console.error("Failed to fetch admin history:", error);
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "transfers") fetchTransfers();
    if (activeTab === "history") fetchHistory();
  }, [activeTab, searchQuery]);

  const handleManualAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error("Please select a target user for adjustment.");
      return;
    }
    const pts = Number(adjustPoints);
    if (isNaN(pts) || pts === 0) {
      toast.error("Please enter a valid non-zero point value.");
      return;
    }
    if (!adjustReason.trim()) {
      toast.error("An administrative reason is mandatory for manual adjustments.");
      return;
    }

    setSubmittingAdjust(true);
    try {
      const res = await axiosInstance.post("/api/admin/reputation/adjust", {
        userId: selectedUser._id,
        points: pts,
        reason: adjustReason.trim(),
      });

      toast.success(res.data?.message || "Reputation adjusted successfully!");
      setSelectedUser(null);
      setAdjustReason("");
      fetchStats();
    } catch (error: any) {
      console.error("Manual adjust error:", error);
      toast.error(error.response?.data?.message || "Failed to adjust reputation");
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const handleReverseTransfer = async (transferId: string) => {
    const reason = prompt("Please enter the reason for reversing this transfer:");
    if (!reason || !reason.trim()) return;

    try {
      const res = await axiosInstance.post("/api/admin/reputation/reverse-transfer", {
        transferId,
        reason: reason.trim(),
      });
      toast.success(res.data?.message || "Transfer reversed successfully.");
      fetchTransfers();
      fetchStats();
    } catch (error: any) {
      console.error("Reverse transfer error:", error);
      toast.error(error.response?.data?.message || "Failed to reverse transfer.");
    }
  };

  const handleToggleSuspendTransfer = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await axiosInstance.post("/api/admin/reputation/toggle-suspend-transfer", {
        userId,
        suspend: !currentStatus,
      });
      toast.success(res.data?.message || "Transfer status updated.");
      fetchStats();
    } catch (error: any) {
      console.error("Toggle suspend error:", error);
      toast.error("Failed to update transfer suspension status.");
    }
  };

  return (
    <Mainlayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-600" /> Admin Reputation Moderation Panel
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Overview of system reputation statistics, user adjustments, transfer reversals, and transfer suspension enforcement.
          </p>
        </div>

        {/* Global Statistics Grid */}
        {loadingStats ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-orange-50/50 border-orange-200">
              <CardContent className="pt-4 space-y-1">
                <p className="text-xs text-orange-800 font-semibold uppercase tracking-wider">Total Community Rep</p>
                <p className="text-2xl font-black text-orange-900">{stats.totalReputation} pts</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50/50 border-blue-200">
              <CardContent className="pt-4 space-y-1">
                <p className="text-xs text-blue-800 font-semibold uppercase tracking-wider">Total Transfers</p>
                <p className="text-2xl font-black text-blue-900">{stats.totalTransfers}</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50/50 border-green-200">
              <CardContent className="pt-4 space-y-1">
                <p className="text-xs text-green-800 font-semibold uppercase tracking-wider">Transfer Volume</p>
                <p className="text-2xl font-black text-green-900">{stats.totalTransferVolume} pts</p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50/50 border-purple-200">
              <CardContent className="pt-4 space-y-1">
                <p className="text-xs text-purple-800 font-semibold uppercase tracking-wider">Total System Users</p>
                <p className="text-2xl font-black text-purple-900">{stats.totalUsers}</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Tab Menu */}
        <div className="flex border-b border-gray-200 gap-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 px-4 font-semibold text-sm border-b-2 transition ${
              activeTab === "users"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            User Reputation Management
          </button>
          <button
            onClick={() => setActiveTab("transfers")}
            className={`pb-3 px-4 font-semibold text-sm border-b-2 transition ${
              activeTab === "transfers"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Global Transfer Logs & Reversal
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 px-4 font-semibold text-sm border-b-2 transition ${
              activeTab === "history"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Global Activity Audit Log
          </button>
        </div>

        {/* Tab 1: User Management & Manual Adjustments */}
        {activeTab === "users" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Manual Adjustment Card Form */}
            <Card className="md:col-span-1 border-orange-200 bg-orange-50/20">
              <CardHeader className="py-4">
                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-orange-600" /> Manual Point Adjustment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleManualAdjust} className="space-y-3">
                  <div>
                    <Label className="text-xs font-semibold">Selected Target User</Label>
                    <div className="p-2 border rounded bg-white mt-1 text-xs">
                      {selectedUser ? (
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-900">{selectedUser.name}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {selectedUser.reputation} pts
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-gray-400">Select a user from the list on right.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="adjustPts" className="text-xs font-semibold">
                      Points Adjustment (Positive or Negative)
                    </Label>
                    <Input
                      id="adjustPts"
                      type="number"
                      value={adjustPoints}
                      onChange={(e) => setAdjustPoints(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g. +20 or -15"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="adjustReason" className="text-xs font-semibold">
                      Administrative Reason (Required)
                    </Label>
                    <Textarea
                      id="adjustReason"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="e.g., Award for organizing community event..."
                      className="mt-1 min-h-20 text-xs"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submittingAdjust || !selectedUser}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {submittingAdjust ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Apply Adjustment
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Top Contributors & User List Table */}
            <Card className="md:col-span-2">
              <CardHeader className="py-4">
                <CardTitle className="text-base font-bold text-gray-900">User Reputation Moderation List</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50 text-gray-600 font-bold uppercase">
                        <th className="py-2.5 px-3">User</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3 text-center">Reputation</th>
                        <th className="py-2.5 px-3 text-center">Transfer Status</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {topContributors.map((u) => {
                        const isSelected = selectedUser?._id === u._id;
                        return (
                          <tr
                            key={u._id}
                            className={`hover:bg-orange-50/30 transition ${
                              isSelected ? "bg-orange-100/50" : ""
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-7 h-7">
                                  <AvatarFallback className="text-xs bg-orange-100 text-orange-800 font-bold">
                                    {u.name ? u.name[0].toUpperCase() : "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-gray-900">{u.name}</p>
                                  <p className="text-[10px] text-gray-500">{u.email}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-2.5 px-3">
                              <Badge
                                className={`text-[10px] ${
                                  u.role === "admin" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {u.role}
                              </Badge>
                            </td>

                            <td className="py-2.5 px-3 text-center font-bold text-orange-600 text-sm">
                              {u.reputation || 0} pts
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleSuspendTransfer(u._id, !!u.suspendTransfer)}
                                className={`text-[10px] h-7 px-2 border ${
                                  u.suspendTransfer
                                    ? "bg-red-50 text-red-700 border-red-300"
                                    : "bg-green-50 text-green-700 border-green-300"
                                }`}
                              >
                                {u.suspendTransfer ? "Suspended" : "Active"}
                              </Button>
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <Button
                                size="sm"
                                onClick={() => setSelectedUser(u)}
                                className="h-7 px-2 text-[10px] bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                Select User
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: Global Transfers & Reversal */}
        {activeTab === "transfers" && (
          <Card>
            <CardHeader className="py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-gray-900">Global Reputation Transfers</CardTitle>
              <div className="w-64">
                <Input
                  placeholder="Search transfers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingTable ? (
                <div className="p-8 text-center text-xs text-gray-500">Loading transfers...</div>
              ) : transfers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50 text-gray-600 font-bold uppercase">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">TX ID</th>
                        <th className="py-2.5 px-3">Sender</th>
                        <th className="py-2.5 px-3">Receiver</th>
                        <th className="py-2.5 px-3 text-center">Amount</th>
                        <th className="py-2.5 px-3">Reason</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transfers.map((t) => (
                        <tr key={t._id} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 text-gray-500">
                            {new Date(t.timestamp).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium text-gray-800">{t.transactionId}</td>
                          <td className="py-2.5 px-3 font-medium text-gray-900">{t.senderId?.name}</td>
                          <td className="py-2.5 px-3 font-medium text-gray-900">{t.receiverId?.name}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-orange-600">{t.amount} pts</td>
                          <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate">{t.reason}</td>
                          <td className="py-2.5 px-3 text-center">
                            <Badge
                              className={`text-[10px] ${
                                t.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {t.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {t.status === "completed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReverseTransfer(t._id)}
                                className="h-7 px-2 text-[10px] text-red-600 border-red-300 hover:bg-red-50 flex items-center gap-1 mx-auto"
                              >
                                <RotateCcw className="w-3 h-3" /> Reverse
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-gray-500">No transfer records found.</div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Global Activity History */}
        {activeTab === "history" && (
          <Card>
            <CardHeader className="py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-gray-900">Global Activity Audit Log</CardTitle>
              <div className="w-64">
                <Input
                  placeholder="Search activity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingTable ? (
                <div className="p-8 text-center text-xs text-gray-500">Loading activity logs...</div>
              ) : historyLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50 text-gray-600 font-bold uppercase">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">User</th>
                        <th className="py-2.5 px-3">Action Type</th>
                        <th className="py-2.5 px-3 text-center">Points</th>
                        <th className="py-2.5 px-3 text-center">New Total</th>
                        <th className="py-2.5 px-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {historyLogs.map((h) => (
                        <tr key={h._id} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 text-gray-500">
                            {new Date(h.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-gray-900">{h.userId?.name || "User"}</td>
                          <td className="py-2.5 px-3">
                            <Badge variant="secondary" className="text-[10px]">
                              {h.actionType}
                            </Badge>
                          </td>
                          <td
                            className={`py-2.5 px-3 text-center font-bold ${
                              h.points > 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {h.points > 0 ? `+${h.points}` : h.points}
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold text-gray-800">
                            {h.newReputation} pts
                          </td>
                          <td className="py-2.5 px-3 text-gray-600 max-w-sm truncate">{h.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-gray-500">No activity logs found.</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Mainlayout>
  );
};

export default AdminReputationPage;
