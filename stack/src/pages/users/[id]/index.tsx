import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Calendar, Edit, Plus, X, Award, Star, Sparkles, Lock, CreditCard, Download, Send, Bookmark as BookmarkIcon, Loader2, Monitor, Smartphone, Tablet, Globe, Shield, ShieldAlert, History, Key, CheckCircle, AlertTriangle, AlertCircle, Trash2, Power, ShieldCheck, Trophy, TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "@/lib/useTranslationSafe";
import { ReputationTransferModal } from "@/components/ReputationTransferModal";
import { ReputationPrivilegeNotice } from "@/components/ReputationPrivilegeNotice";
const getUserData = (id: string) => {
  const users = {
    "1": {
      id: 1,
      name: "John Doe",
      joinDate: "2019-03-15",
      about:
        "Full-stack developer with 8+ years of experience in JavaScript, React, and Node.js. Passionate about clean code and helping others learn programming. I enjoy working on open-source projects and contributing to the developer community.",
      tags: [
        "javascript",
        "react",
        "node.js",
        "typescript",
        "python",
        "mongodb",
      ],
    },
  };
  return users[id as keyof typeof users] || users["1"];
};
const index = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = router.query;
  const [users, setusers] = useState<any>(null);
  const [loading, setloading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    about: "",
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");

  const [activeTab, setActiveTab] = useState("profile");
  
  // Security management states
  const [sessions, setSessions] = useState<any[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [loadingSecurity, setLoadingSecurity] = useState(false);

  const [confirmRevokeSessionId, setConfirmRevokeSessionId] = useState<string | null>(null);
  const [confirmRevokeAllOthers, setConfirmRevokeAllOthers] = useState(false);
  const [confirmRemoveDeviceId, setConfirmRemoveDeviceId] = useState<string | null>(null);

  const fetchSecurityData = async () => {
    setLoadingSecurity(true);
    try {
      const [sessionsRes, devicesRes, historyRes] = await Promise.all([
        axiosInstance.get("/api/security/sessions"),
        axiosInstance.get("/api/security/trusted-devices"),
        axiosInstance.get("/api/security/login-activity"),
      ]);
      setSessions(sessionsRes.data.data);
      setTrustedDevices(devicesRes.data.data);
      setLoginHistory(historyRes.data.data);
    } catch (err) {
      console.error("Failed to load security details:", err);
      toast.error("Failed to load security details");
    } finally {
      setLoadingSecurity(false);
    }
  };

  // Reputation management states
  const [reputationData, setReputationData] = useState<any>(null);
  const [loadingReputation, setLoadingReputation] = useState(false);
  const [reputationHistoryList, setReputationHistoryList] = useState<any[]>([]);
  const [transferHistoryList, setTransferHistoryList] = useState<any[]>([]);
  const [transferFilter, setTransferFilter] = useState<"all" | "incoming" | "outgoing">("all");
  const [transferSearch, setTransferSearch] = useState("");
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const fetchReputationDetails = async () => {
    if (!id) return;
    setLoadingReputation(true);
    try {
      const [repRes, histRes, transRes] = await Promise.all([
        axiosInstance.get(`/api/reputation?userId=${id}`),
        axiosInstance.get(`/api/reputation/history?userId=${id}`),
        axiosInstance.get(`/api/reputation/transfers?filter=${transferFilter}&search=${transferSearch}`),
      ]);
      setReputationData(repRes.data?.data || null);
      setReputationHistoryList(histRes.data?.history || []);
      setTransferHistoryList(transRes.data?.transfers || []);
    } catch (err) {
      console.error("Failed to load reputation details:", err);
    } finally {
      setLoadingReputation(false);
    }
  };

  useEffect(() => {
    if (activeTab === "security") {
      fetchSecurityData();
    }
    if (activeTab === "reputation") {
      fetchReputationDetails();
    }
  }, [activeTab, id, transferFilter, transferSearch]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [billingForm, setBillingForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [goldPosts, setGoldPosts] = useState([
    {
      id: 1,
      author: "Admin",
      content: "Welcome to the Gold Lounge! Here you have direct access to exclusive community features, priority announcements, and beta APIs.",
      date: "2026-07-01",
    },
    {
      id: 2,
      author: "Developer Advocate",
      content: "Reminder: The monthly StackOverflow Core Ask-Me-Anything (AMA) will take place this Thursday at 18:00 UTC.",
      date: "2026-07-05",
    },
  ]);
  const [newGoldPost, setNewGoldPost] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchuser = async () => {
      try {
        const res = await axiosInstance.get(`/user/profile/${id}`);
        setusers(res.data.data);
        if (res.data.data) {
          setEditForm({
            name: res.data.data.name || "",
            about: res.data.data.about || "",
            tags: res.data.data.tags || [],
          });
          setBillingForm({
            name: res.data.data.billingDetails?.name || res.data.data.name || "",
            email: res.data.data.billingDetails?.email || res.data.data.email || "",
            phone: res.data.data.billingDetails?.phone || "",
            address: res.data.data.billingDetails?.address || "",
          });
        }
      } catch (error) {
        console.log("Failed to fetch custom profile, falling back", error);
        try {
          const resFallback = await axiosInstance.get("/user/getalluser");
          const matcheduser = resFallback.data.data.find((u: any) => u._id === id);
          if (matcheduser) {
            setusers(matcheduser);
            setEditForm({
              name: matcheduser.name || "",
              about: matcheduser.about || "",
              tags: matcheduser.tags || [],
            });
            setBillingForm({
              name: matcheduser.billingDetails?.name || matcheduser.name || "",
              email: matcheduser.billingDetails?.email || matcheduser.email || "",
              phone: matcheduser.billingDetails?.phone || "",
              address: matcheduser.billingDetails?.address || "",
            });
          }
        } catch (err) {
          console.log(err);
        }
      } finally {
        setloading(false);
      }
    };
    fetchuser();
  }, [id]);

  useEffect(() => {
    if (activeTab === "bookmarks") {
      const fetchBookmarks = async () => {
        setLoadingBookmarks(true);
        try {
          const res = await axiosInstance.get("/user/bookmarks");
          setBookmarks(res.data.data);
        } catch (error) {
          console.error("Failed to fetch bookmarks:", error);
          toast.error("Failed to load bookmarks");
        } finally {
          setLoadingBookmarks(false);
        }
      };
      fetchBookmarks();
    }
  }, [activeTab]);

  const handleSaveBilling = async () => {
    try {
      const res = await axiosInstance.patch(`/user/update/${user?._id}`, {
        billingDetails: billingForm,
      });
      if (res.data.data) {
        setusers(res.data.data);
        toast.success("Billing details updated successfully!");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to update billing details");
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const response = await axiosInstance.get(`/payment/invoice/${invoiceId}`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${invoiceId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error("Failed to download invoice PDF");
    }
  };
  if (loading) {
    return (
      <Mainlayout>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </Mainlayout>
    );
  }
  if (!users || users.length === 0) {
    return <div className="text-center text-gray-500 mt-4">No user found.</div>;
  }

  const handleSaveProfile = async () => {
    try {
      const res = await axiosInstance.patch(`/user/update/${user?._id}`, {
        editForm,
      });
      if (res.data.data) {
        const updatedUser = {
          ...users,
          name: editForm.name,
          about: editForm.about,
          tags: editForm.tags,
        };

        setusers(updatedUser);
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !editForm.tags.includes(trimmedTag)) {
      setEditForm({ ...editForm, tags: [...editForm.tags, trimmedTag] });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditForm({
      ...editForm,
      tags: editForm.tags.filter((tag: any) => tag !== tagToRemove),
    });
  };

  const currentUserId = user?._id;
  const isOwnProfile = id === currentUserId;
  return (
    <Mainlayout>
      <div className="max-w-6xl">
        {/* User Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 mb-8">
          <Avatar className="w-24 h-24 lg:w-32 lg:h-32">
            <AvatarFallback className="text-2xl lg:text-3xl">
              {users.name
                .split(" ")
                .map((n: any) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1 flex items-center gap-2 flex-wrap">
                  {users.name}
                  {users.plan && users.plan !== "Free" && (
                    <Badge className={`font-semibold uppercase tracking-wider text-xs border py-0.5 px-2.5 rounded-full flex items-center gap-1 ${
                      users.plan === "Gold" ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow" :
                      users.plan === "Silver" ? "bg-slate-500 hover:bg-slate-600 text-white border-slate-600" :
                      "bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-700"
                    }`}>
                      {users.plan === "Gold" ? <Star className="w-3.5 h-3.5" /> : users.plan === "Silver" ? <Sparkles className="w-3.5 h-3.5" /> : <Award className="w-3.5 h-3.5" />}
                      {users.plan} Member
                    </Badge>
                  )}
                </h1>
              </div>

              {isOwnProfile && (
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription className="sr-only">
                        Edit your public name, bio, and key skills to display on your user profile page.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Basic Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Display Name</Label>
                            <Input
                              id="name"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  name: e.target.value,
                                })
                              }
                              placeholder="Your display name"
                            />
                          </div>
                        </div>
                      </div>
                      {/* About Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">About</h3>
                        <div>
                          <Label htmlFor="about">About Me</Label>
                          <Textarea
                            id="about"
                            value={editForm.about}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                about: e.target.value,
                              })
                            }
                            placeholder="Tell us about yourself, your experience, and interests..."
                            className="min-h-32"
                          />
                        </div>
                      </div>

                      {/* Tags/Skills Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Skills & Technologies
                        </h3>

                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Input
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              placeholder="Add a skill or technology"
                              onKeyPress={(e) =>
                                e.key === "Enter" && handleAddTag()
                              }
                            />
                            <Button
                              onClick={handleAddTag}
                              variant="outline"
                              size="sm"
                              className="bg-orange-600 text-white"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {editForm.tags.map((tag: any) => {
                              return (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="bg-orange-100 text-orange-800 flex items-center gap-1"
                                >
                                  {tag}
                                  <button
                                    onClick={() => handleRemoveTag(tag)}
                                    className="ml-1 hover:text-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="bg-white text-gray-800 hover:text-gray-900"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveProfile}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Member since{" "}
                {new Date(users.joinDate).toISOString().split("T")[0]}
              </div>
            </div>
            <div className="flex flex-wrap items-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="font-semibold">5</span>
                <span className="text-gray-600 ml-1">gold badges</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                <span className="font-semibold">23</span>
                <span className="text-gray-600 ml-1">silver badges</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-amber-600 rounded-full mr-2"></div>
                <span className="font-semibold">45</span>
                <span className="text-gray-600 ml-1">bronze badges</span>
              </div>
            </div>
          </div>
        </div>
        {/* Tabs Menu */}
        <div className="flex border-b border-gray-200 mb-6 gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-3 px-4 font-semibold text-sm border-b-2 transition ${
              activeTab === "profile" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Profile
          </button>
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab("billing")}
              className={`pb-3 px-4 font-semibold text-sm border-b-2 transition ${
                activeTab === "billing" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Billing & Subscription
            </button>
          )}
          {(users.plan === "Silver" || users.plan === "Gold") && (
            <button
              onClick={() => setActiveTab("bookmarks")}
              className={`pb-3 px-4 font-semibold text-sm border-b-2 transition ${
                activeTab === "bookmarks" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Saved Questions ({users.bookmarks?.length || 0})
            </button>
          )}
          {users.plan === "Gold" && (
            <button
              onClick={() => setActiveTab("goldlounge")}
              className={`pb-3 px-4 font-semibold text-sm border-b-2 transition ${
                activeTab === "goldlounge" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Gold Lounge 👑
            </button>
          )}
          <button
            onClick={() => setActiveTab("reputation")}
            className={`pb-3 px-4 font-semibold text-sm border-b-2 transition ${
              activeTab === "reputation" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Reputation & Rewards 🏆
          </button>
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab("security")}
              className={`pb-3 px-4 font-semibold text-sm border-b-2 transition ${
                activeTab === "security" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Security 🔒
            </button>
          )}
        </div>

        {/* Tab Content Panels */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {users.about || "No profile bio available yet."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {users.tags && users.tags.length > 0 ? (
                      users.tags.map((tag: string) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                        >
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No tags added yet.</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "billing" && isOwnProfile && (
          <div className="space-y-6">
            {/* Active Subscription Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-orange-200 bg-orange-50/10">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                    <Award className="w-5 h-5 text-orange-600" /> Active Membership Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{users.plan || "Free"} Plan</h3>
                      <p className="text-sm text-gray-600">
                        {users.plan === "Gold" ? "Unlimited Questions" :
                         users.plan === "Silver" ? "15 Questions/day, Bookmarks unlocked" :
                         users.plan === "Bronze" ? "5 Questions/day, Advanced Filters unlocked" :
                         "1 Question/day limit"}
                      </p>
                    </div>
                    <Badge className="font-semibold uppercase tracking-wider text-xs border bg-green-100 text-green-800 border-green-300">
                      {users.subscriptionStatus === "active" ? "Active" : "Standard"}
                    </Badge>
                  </div>

                  {users.renewalDate && (
                    <div className="text-sm text-gray-600 border-t pt-3 flex justify-between">
                      <span>Next Renewal Date:</span>
                      <span className="font-semibold text-gray-900">{new Date(users.renewalDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  {users.plan !== "Gold" && (
                    <div className="pt-2">
                      <Button onClick={() => router.push("/upgrade")} className="bg-orange-600 hover:bg-orange-700 text-white w-full">
                        Upgrade / Change Plan
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Billing Address Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" /> {t("profile.billing_details", "Billing Details")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billingFormName">{t("profile.name", "Billing Name")}</Label>
                      <Input
                        id="billingFormName"
                        value={billingForm.name}
                        onChange={(e) => setBillingForm({ ...billingForm, name: e.target.value })}
                        placeholder="Full Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billingFormEmail">{t("profile.email", "Billing Email")}</Label>
                      <Input
                        id="billingFormEmail"
                        type="email"
                        value={billingForm.email}
                        onChange={(e) => setBillingForm({ ...billingForm, email: e.target.value })}
                        placeholder="Email Address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billingFormPhone">{t("profile.phone", "Phone Number")}</Label>
                      <Input
                        id="billingFormPhone"
                        value={billingForm.phone}
                        onChange={(e) => setBillingForm({ ...billingForm, phone: e.target.value })}
                        placeholder="+91 99999 99999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billingFormAddress">{t("profile.address", "Billing Address")}</Label>
                      <Input
                        id="billingFormAddress"
                        value={billingForm.address}
                        onChange={(e) => setBillingForm({ ...billingForm, address: e.target.value })}
                        placeholder="Billing Address, City, State"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveBilling} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                    {t("profile.save_billing", "Save Billing Details")}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Payment History and Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">Payment & Billing History</CardTitle>
              </CardHeader>
              <CardContent>
                {users.paymentHistory && users.paymentHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b text-gray-600 font-semibold text-sm">
                          <th className="py-3 px-4">Invoice ID</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Plan Purchased</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.paymentHistory.map((pm: any) => (
                          <tr key={pm.invoiceId} className="border-b hover:bg-gray-50/50 text-sm">
                            <td className="py-3 px-4 font-mono text-gray-900">{pm.invoiceId}</td>
                            <td className="py-3 px-4 text-gray-600">{new Date(pm.date).toLocaleDateString()}</td>
                            <td className="py-3 px-4 font-medium">{pm.plan} Plan</td>
                            <td className="py-3 px-4 text-gray-900">INR {pm.amount}.00</td>
                            <td className="py-3 px-4">
                              <span className="inline-block bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-xs font-semibold">
                                {pm.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadInvoice(pm.invoiceId)}
                                className="flex items-center gap-1 mx-auto text-xs bg-transparent border-gray-300 hover:bg-gray-100"
                              >
                                <Download className="w-3.5 h-3.5" /> Invoice PDF
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-6 text-sm">No payment history found.</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "bookmarks" && (users.plan === "Silver" || users.plan === "Gold") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookmarkIcon className="w-5 h-5 text-yellow-600" /> Bookmarked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBookmarks ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : bookmarks.length > 0 ? (
                <div className="space-y-4">
                  {bookmarks.map((q: any) => (
                    <div key={q._id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <Link
                        href={`/questions/${q._id}`}
                        className="text-blue-600 hover:text-blue-800 font-semibold block text-base mb-1"
                      >
                        {q.questiontitle}
                      </Link>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">{q.questionbody}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>asked {new Date(q.askedon).toLocaleDateString()}</span>
                        <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                          {q.noofanswer} answers
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-10 text-sm">
                  You haven't saved any questions yet. Bookmark questions to see them here!
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "goldlounge" && users.plan === "Gold" && (
          <Card className="border-yellow-200">
            <CardHeader className="bg-yellow-50/50 border-b border-yellow-100">
              <CardTitle className="text-lg text-yellow-800 flex items-center gap-2 font-bold">
                👑 Exclusive Gold Members Lounge
              </CardTitle>
              <p className="text-xs text-yellow-700">
                You are viewing the exclusive gold-tier developer community workspace. Share ideas, browse beta announcements, and connect directly.
              </p>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Exclusive Post form */}
              <div className="space-y-3 border-b pb-6">
                <Label htmlFor="goldpost" className="font-semibold text-sm">Post to the Gold Lounge</Label>
                <div className="flex gap-2">
                  <Input
                    id="goldpost"
                    value={newGoldPost}
                    onChange={(e) => setNewGoldPost(e.target.value)}
                    placeholder="Share an exclusive announcement or query..."
                  />
                  <Button
                    onClick={() => {
                      if (!newGoldPost.trim()) return;
                      const post = {
                        id: Date.now(),
                        author: user?.name || "Gold Member",
                        content: newGoldPost,
                        date: new Date().toISOString().split("T")[0],
                      };
                      setGoldPosts([post, ...goldPosts]);
                      setNewGoldPost("");
                      toast.success("Post shared in Gold Lounge!");
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" /> Share
                  </Button>
                </div>
              </div>

              {/* Gold Social Posts Wall */}
              <div className="space-y-4">
                {goldPosts.map((gp) => (
                  <div key={gp.id} className="p-4 bg-yellow-50/10 border border-yellow-100 rounded-lg space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-yellow-800">
                      <span>@{gp.author}</span>
                      <span className="text-gray-400 font-normal">{gp.date}</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed font-medium">{gp.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "security" && isOwnProfile && (
          <div className="space-y-6">
            {/* Active Sessions */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2 font-bold">
                  <Monitor className="w-5 h-5 text-blue-600" /> Active Sessions
                </CardTitle>
                {sessions.filter(s => !s.isCurrent).length > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setConfirmRevokeAllOthers(true)}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Power className="w-3.5 h-3.5" /> Revoke Other Sessions
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {loadingSecurity ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                ) : sessions.length > 0 ? (
                  sessions.map((session) => (
                    <div
                      key={session.sessionId}
                      className="p-4 border border-gray-100 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mt-1">
                          {session.deviceType === "Mobile" ? <Smartphone className="w-5 h-5" /> :
                           session.deviceType === "Tablet" ? <Tablet className="w-5 h-5" /> :
                           <Monitor className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                            {session.browser} on {session.operatingSystem}
                            {session.isCurrent && (
                              <Badge className="bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold py-0.5 px-2 rounded-full">
                                Current Device
                              </Badge>
                            )}
                            {session.isTrusted && (
                              <Badge className="bg-green-100 text-green-800 border border-green-200 text-xs font-semibold py-0.5 px-2 rounded-full">
                                Trusted Device
                              </Badge>
                            )}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                            <Globe className="w-3.5 h-3.5 text-gray-400" /> {session.location} &bull; IP: {session.ipAddress} &bull; Method: {session.authenticationMethod}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Created: {new Date(session.createdAt).toLocaleString()} &bull; Active: {new Date(session.lastActiveAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmRevokeSessionId(session.sessionId)}
                          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 bg-transparent flex items-center gap-1 cursor-pointer"
                        >
                          Revoke Session
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-6 text-sm">No active sessions found.</div>
                )}
              </CardContent>
            </Card>

            {/* Trusted Devices */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2 font-bold">
                  <ShieldCheck className="w-5 h-5 text-green-600" /> Trusted Devices
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {loadingSecurity ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                ) : trustedDevices.length > 0 ? (
                  trustedDevices.map((device) => (
                    <div
                      key={device.deviceId}
                      className="p-4 border border-gray-100 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg mt-1">
                          {device.deviceType === "Mobile" ? <Smartphone className="w-5 h-5" /> :
                           device.deviceType === "Tablet" ? <Tablet className="w-5 h-5" /> :
                           <Monitor className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{device.deviceName}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            OS: {device.operatingSystem} &bull; Browser: {device.browser}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Trusted since: {new Date(device.createdAt).toLocaleString()} &bull; Last used: {new Date(device.lastUsedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmRemoveDeviceId(device.deviceId)}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 bg-transparent flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Trust
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-6 text-sm">
                    No trusted devices registered. Check "Trust this device" when verifying login OTP.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Login History */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2 font-bold">
                  <History className="w-5 h-5 text-purple-600" /> Recent Login History
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {loadingSecurity ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                ) : loginHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b text-gray-600 font-semibold text-sm">
                          <th className="py-3 px-4">Date & Time</th>
                          <th className="py-3 px-4">Browser / OS</th>
                          <th className="py-3 px-4">IP Address</th>
                          <th className="py-3 px-4">Location</th>
                          <th className="py-3 px-4">Method</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loginHistory.map((log) => (
                          <tr key={log._id} className="border-b hover:bg-gray-50/50 text-sm">
                            <td className="py-3 px-4 text-gray-900 font-medium">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              {log.browser} on {log.operatingSystem} ({log.deviceType})
                            </td>
                            <td className="py-3 px-4 text-gray-600 font-mono">{log.ipAddress}</td>
                            <td className="py-3 px-4 text-gray-600">{log.location}</td>
                            <td className="py-3 px-4 font-semibold text-blue-600">{log.authenticationMethod}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block border px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  log.status === "Success"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : log.status === "OTP_Required"
                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                                }`}
                              >
                                {log.status === "OTP_Required" ? "OTP Verification Sent" : log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-6 text-sm">No login attempts recorded yet.</div>
                )}
              </CardContent>
            </Card>

            {/* Dialog Confirmations */}
            <Dialog open={!!confirmRevokeSessionId} onOpenChange={(open) => !open && setConfirmRevokeSessionId(null)}>
              <DialogContent className="bg-white text-gray-900">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600 font-bold">
                    <AlertTriangle className="w-5 h-5" /> Revoke Authentication Session?
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to revoke this session? The device will be signed out immediately and cannot access your account until logging back in.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-3 mt-4 border-t pt-4">
                  <Button variant="outline" onClick={() => setConfirmRevokeSessionId(null)} className="bg-white border-gray-300 text-gray-700">Cancel</Button>
                  <Button variant="destructive" onClick={async () => {
                    if (confirmRevokeSessionId) {
                      try {
                        await axiosInstance.delete(`/api/security/sessions/${confirmRevokeSessionId}`);
                        toast.success("Session revoked successfully.");
                        fetchSecurityData();
                      } catch (err) {
                        toast.error("Failed to revoke session");
                      } finally {
                        setConfirmRevokeSessionId(null);
                      }
                    }
                  }} className="bg-red-600 text-white">Confirm Revoke</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={confirmRevokeAllOthers} onOpenChange={setConfirmRevokeAllOthers}>
              <DialogContent className="bg-white text-gray-900">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600 font-bold">
                    <AlertTriangle className="w-5 h-5" /> Revoke All Other Sessions?
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to revoke all other active sessions? All other devices will be forced out of their accounts immediately. Your current session will remain active.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-3 mt-4 border-t pt-4">
                  <Button variant="outline" onClick={() => setConfirmRevokeAllOthers(false)} className="bg-white border-gray-300 text-gray-700">Cancel</Button>
                  <Button variant="destructive" onClick={async () => {
                    try {
                      await axiosInstance.delete("/api/security/sessions");
                      toast.success("All other sessions revoked successfully.");
                      fetchSecurityData();
                    } catch (err) {
                      toast.error("Failed to revoke other sessions");
                    } finally {
                      setConfirmRevokeAllOthers(false);
                    }
                  }} className="bg-red-600 text-white">Revoke All Others</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={!!confirmRemoveDeviceId} onOpenChange={(open) => !open && setConfirmRemoveDeviceId(null)}>
              <DialogContent className="bg-white text-gray-900">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600 font-bold">
                    <AlertTriangle className="w-5 h-5" /> Remove Device Trust?
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to remove trust from this device? On your next login attempt from this device, you will be required to verify your identity via email OTP again.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-3 mt-4 border-t pt-4">
                  <Button variant="outline" onClick={() => setConfirmRemoveDeviceId(null)} className="bg-white border-gray-300 text-gray-700">Cancel</Button>
                  <Button variant="destructive" onClick={async () => {
                    if (confirmRemoveDeviceId) {
                      try {
                        await axiosInstance.delete(`/api/security/trusted-devices/${confirmRemoveDeviceId}`);
                        toast.success("Device trust removed successfully.");
                        fetchSecurityData();
                      } catch (err) {
                        toast.error("Failed to remove trusted device");
                      } finally {
                        setConfirmRemoveDeviceId(null);
                      }
                    }
                  }} className="bg-red-600 text-white">Confirm Remove</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Reputation Tab Panel */}
        {activeTab === "reputation" && (
          <div className="space-y-6">
            {/* Reputation Overview Card */}
            <Card className="border-orange-200 bg-gradient-to-r from-orange-50/40 via-white to-orange-50/20">
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-500 text-white rounded-xl shadow-md">
                      <Trophy className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-3xl font-black text-gray-900">
                          {reputationData?.reputation || users.reputation || 0} pts
                        </h2>
                        <Badge className="bg-orange-600 text-white text-xs font-bold uppercase tracking-wider">
                          Rank: {reputationData?.rank || "Novice"}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        Total earned reputation points across Q&A contributions, community answers, and accepted solutions.
                      </p>
                    </div>
                  </div>

                  {isOwnProfile && (
                    <Button
                      onClick={() => setIsTransferModalOpen(true)}
                      className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1.5 shadow"
                    >
                      <Send className="w-4 h-4" /> Transfer Reputation
                    </Button>
                  )}
                </div>

                {/* Lifetime Stats & Progress Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4 text-xs font-medium">
                  <div className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-green-800 flex items-center gap-1 font-semibold">
                      <TrendingUp className="w-4 h-4" /> Lifetime Earned:
                    </span>
                    <span className="font-extrabold text-green-900 text-sm">+{reputationData?.lifetimeEarned || 0} pts</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg border border-red-200">
                    <span className="text-red-800 flex items-center gap-1 font-semibold">
                      <TrendingDown className="w-4 h-4" /> Lifetime Lost:
                    </span>
                    <span className="font-extrabold text-red-900 text-sm">-{reputationData?.lifetimeLost || 0} pts</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-blue-800 flex items-center gap-1 font-semibold">
                      <CheckCircle className="w-4 h-4" /> Profile Completion:
                    </span>
                    <span className="font-bold text-blue-900">
                      {reputationData?.isProfileComplete ? "Complete (+10 pts claimed)" : "Incomplete (Fill bio & tags)"}
                    </span>
                  </div>
                </div>

                {/* Progress Bar to Next Rank Milestone */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>Progress to Next Rank Milestone ({reputationData?.nextMilestone || 50} pts)</span>
                    <span>{reputationData?.progressBarPercent || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-orange-500 h-full transition-all duration-500 rounded-full"
                      style={{ width: `${reputationData?.progressBarPercent || 0}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privilege Notice */}
            <ReputationPrivilegeNotice
              currentReputation={reputationData?.reputation || users.reputation || 0}
              communityRank={reputationData?.rank || "Novice"}
            />

            {/* Earned Badges Grid */}
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" /> Earned Badges & Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reputationData?.badges && reputationData.badges.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {reputationData.badges.map((b: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-center space-y-1 shadow-sm hover:shadow transition"
                      >
                        <span className="text-2xl block">🏆</span>
                        <p className="font-bold text-xs text-amber-900">{b.name}</p>
                        <p className="text-[11px] text-amber-700 leading-tight">{b.description}</p>
                        <span className="text-[10px] text-gray-400 block pt-1">
                          {new Date(b.awardedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-6 text-xs">
                    No badges earned yet. Complete answers, reach reputation milestones, and help peers to unlock badges!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity History & Transfer History Split Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Activity History Timeline */}
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-600" /> Recent Reputation Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {reputationHistoryList.length > 0 ? (
                    <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                      {reputationHistoryList.map((h: any) => (
                        <div key={h._id} className="p-3 hover:bg-gray-50 flex items-center justify-between text-xs">
                          <div className="space-y-0.5">
                            <span className="font-bold text-gray-900 block">{h.actionType}</span>
                            <span className="text-gray-500 text-[11px] block">{h.description}</span>
                            <span className="text-gray-400 text-[10px]">{new Date(h.timestamp).toLocaleString()}</span>
                          </div>
                          <span
                            className={`font-black text-sm px-2 py-0.5 rounded ${
                              h.points > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {h.points > 0 ? `+${h.points}` : h.points}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500 text-xs">No activity recorded yet.</div>
                  )}
                </CardContent>
              </Card>

              {/* Transfer History Card */}
              <Card>
                <CardHeader className="py-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <ArrowLeftRight className="w-5 h-5 text-orange-600" /> Transfer History
                  </CardTitle>
                  <div className="flex gap-1 text-[11px]">
                    {["all", "incoming", "outgoing"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setTransferFilter(f as any)}
                        className={`px-2 py-1 rounded capitalize ${
                          transferFilter === f ? "bg-orange-500 text-white font-bold" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {transferHistoryList.length > 0 ? (
                    <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                      {transferHistoryList.map((t: any) => (
                        <div key={t._id} className="p-3 hover:bg-gray-50 space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-900">
                              {t.senderId?._id === id ? `Sent to @${t.receiverId?.name}` : `Received from @${t.senderId?.name}`}
                            </span>
                            <span
                              className={`font-black text-xs px-2 py-0.5 rounded ${
                                t.senderId?._id === id ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                              }`}
                            >
                              {t.senderId?._id === id ? `-${t.amount} pts` : `+${t.amount} pts`}
                            </span>
                          </div>
                          <p className="text-gray-600 text-[11px] italic">"{t.reason}"</p>
                          <div className="flex justify-between text-[10px] text-gray-400">
                            <span>TX: {t.transactionId}</span>
                            <span>{new Date(t.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500 text-xs">No transfer history found.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Reputation Transfer Modal Trigger */}
        <ReputationTransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          currentUserReputation={reputationData?.reputation || users.reputation || 0}
          onSuccess={() => fetchReputationDetails()}
        />
      </div>
    </Mainlayout>
  );
};

export default index;
