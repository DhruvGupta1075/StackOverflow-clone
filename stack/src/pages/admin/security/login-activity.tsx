import React, { useEffect, useState } from "react";
import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Search,
  Filter,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { toast } from "react-toastify";

export default function AdminLoginActivity() {
  const { user } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Pagination states
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
  });

  // Verify Admin role
  useEffect(() => {
    if (user && user.role !== "admin") {
      toast.error("Access denied. Admin privileges required.");
      router.push("/");
    }
  }, [user, router]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append("search", search);
      if (method) params.append("method", method);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await axiosInstance.get(`/api/security/admin/login-activity?${params.toString()}`);
      setLogs(res.data.data);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      console.error("Failed to fetch admin security logs:", err);
      toast.error(err.response?.data?.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchLogs();
    }
  }, [user, page, method, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearch("");
    setMethod("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  if (!user || user.role !== "admin") {
    return (
      <Mainlayout>
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
          <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
          <p className="text-gray-500 mt-2 max-w-md">
            You do not have permission to access the security audit logs page. Please contact your system administrator.
          </p>
        </div>
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <div className="max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Security Control Hub</h1>
          <p className="text-gray-500 text-sm mt-1">
            Application-wide login activity monitoring and threat auditing logs.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base text-gray-700 flex items-center gap-1.5 font-bold">
              <Filter className="w-4 h-4 text-blue-600" /> Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="search" className="text-xs font-semibold text-gray-600">Search User</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Name or Email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="method" className="text-xs font-semibold text-gray-600">Auth Method</Label>
                <select
                  id="method"
                  value={method}
                  onChange={(e) => {
                    setMethod(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                >
                  <option value="">All Methods</option>
                  <option value="Email/Password">Email/Password</option>
                  <option value="Google">Google</option>
                  <option value="GitHub">GitHub</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-xs font-semibold text-gray-600">Start Date</Label>
                <div className="relative">
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endDate" className="text-xs font-semibold text-gray-600">End Date</Label>
                <div className="relative">
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 md:col-span-4 flex justify-end gap-3 mt-2 border-t pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetFilters}
                  className="text-gray-600 border-gray-300 text-sm bg-transparent cursor-pointer"
                >
                  Reset Filters
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm cursor-pointer"
                >
                  Search Audit Logs
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base text-gray-700 font-bold">
              User Login Logs ({pagination.totalItems} total logs)
            </CardTitle>
            <CardDescription>
              Chronological log of successful and failed authentication attempts.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
            ) : logs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                      <th className="py-3.5 px-6">User</th>
                      <th className="py-3.5 px-6">Time</th>
                      <th className="py-3.5 px-6">Device / Browser</th>
                      <th className="py-3.5 px-6">IP & Location</th>
                      <th className="py-3.5 px-6">Method</th>
                      <th className="py-3.5 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id} className="border-b hover:bg-gray-50/30">
                        <td className="py-4 px-6">
                          {log.userId ? (
                            <div>
                              <div className="font-semibold text-gray-900">{log.userId.name}</div>
                              <div className="text-xs text-gray-500">{log.userId.email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Deleted User</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-gray-700 font-medium">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-gray-800">
                          <div className="flex items-center gap-2">
                            {log.deviceType === "Mobile" ? <Smartphone className="w-4 h-4 text-gray-400" /> :
                             log.deviceType === "Tablet" ? <Tablet className="w-4 h-4 text-gray-400" /> :
                             <Monitor className="w-4 h-4 text-gray-400" />}
                            <span>{log.browser} on {log.operatingSystem}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-600">
                          <div className="font-mono text-xs">{log.ipAddress}</div>
                          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <Globe className="w-3 h-3" /> {log.location}
                          </div>
                        </td>
                        <td className="py-4 px-6 font-semibold text-blue-600">
                          {log.authenticationMethod}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-block border px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              log.status === "Success"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : log.status === "OTP_Required"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {log.status === "OTP_Required" ? "OTP Pending" : log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-16 text-sm">No security logs match your search criteria.</div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-6 py-4 bg-gray-50">
                <span className="text-xs text-gray-600">
                  Page <strong className="text-gray-900">{pagination.currentPage}</strong> of{" "}
                  <strong className="text-gray-900">{pagination.totalPages}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    className="flex items-center gap-1 cursor-pointer bg-white"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                    className="flex items-center gap-1 cursor-pointer bg-white"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Mainlayout>
  );
}
