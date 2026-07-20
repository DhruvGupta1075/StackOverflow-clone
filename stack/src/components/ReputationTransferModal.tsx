import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Send, AlertTriangle, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "react-toastify";

interface UserItem {
  _id: string;
  name: string;
  username?: string;
  email: string;
  reputation?: number;
}

interface ReputationTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserReputation: number;
  onSuccess?: () => void;
}

export const ReputationTransferModal: React.FC<ReputationTransferModalProps> = ({
  isOpen,
  onClose,
  currentUserReputation,
  onSuccess,
}) => {
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [amount, setAmount] = useState<number | "">(10);
  const [reason, setReason] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setStep("form");
      setSelectedUser(null);
      setAmount(10);
      setReason("");
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await axiosInstance.get("/user/getalluser");
      const list = res.data?.data || res.data || [];
      setUsers(list);
    } catch (err) {
      console.error("Failed to fetch user list:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error("Please select a recipient user.");
      return;
    }
    const numericAmt = Number(amount);
    if (!numericAmt || numericAmt <= 0) {
      toast.error("Please enter a valid transfer amount (> 0).");
      return;
    }
    if (numericAmt > 50) {
      toast.error("Maximum allowed transfer per transaction is 50 reputation.");
      return;
    }
    if (currentUserReputation < numericAmt) {
      toast.error(`Insufficient balance. You currently have ${currentUserReputation} reputation.`);
      return;
    }
    if (currentUserReputation <= 50) {
      toast.error("You must possess more than 50 reputation to transfer points.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for this reputation transfer.");
      return;
    }
    setStep("confirm");
  };

  const handleExecuteTransfer = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await axiosInstance.post("/api/reputation/transfer", {
        receiverId: selectedUser._id,
        amount: Number(amount),
        reason: reason.trim(),
      });

      toast.success(res.data?.message || "Reputation transfer completed successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Transfer error:", error);
      const errMsg = error.response?.data?.message || "Failed to complete reputation transfer.";
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-orange-600">
            <Send className="w-5 h-5" /> Transfer Reputation Points
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Reward fellow developers by transferring reputation. Sender must possess &gt; 50 reputation. Max 50 per transaction, max 100 daily.
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <form onSubmit={handleProceedToConfirm} className="space-y-4 py-2">
            {/* Sender Balance Alert */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex justify-between items-center text-sm">
              <span className="text-orange-900 font-medium">Your Reputation Balance:</span>
              <span className="font-bold text-orange-700 bg-orange-100 px-2.5 py-0.5 rounded-full">
                {currentUserReputation} pts
              </span>
            </div>

            {/* Step 1: Select Recipient */}
            <div className="space-y-2">
              <Label className="font-semibold text-sm">Select Recipient</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search user by name, username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="max-h-36 overflow-y-auto border rounded-md divide-y divide-gray-100 bg-gray-50/50">
                {loadingUsers ? (
                  <div className="p-4 text-center text-xs text-gray-500">Loading users...</div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => {
                    const isSelected = selectedUser?._id === u._id;
                    return (
                      <div
                        key={u._id}
                        onClick={() => setSelectedUser(u)}
                        className={`p-2.5 flex items-center justify-between cursor-pointer transition ${
                          isSelected ? "bg-orange-100/70 border-l-4 border-orange-500" : "hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-7 h-7">
                            <AvatarFallback className="text-xs bg-orange-200 text-orange-800 font-semibold">
                              {u.name ? u.name[0].toUpperCase() : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">{u.name}</p>
                            <p className="text-[11px] text-gray-500">{u.email}</p>
                          </div>
                        </div>
                        {isSelected && <Badge className="bg-orange-600 text-white text-[10px]">Selected</Badge>}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-gray-500">No users found.</div>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="transferAmount" className="font-semibold text-sm">
                Transfer Amount (1 - 50 pts)
              </Label>
              <Input
                id="transferAmount"
                type="number"
                min={1}
                max={50}
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Enter amount"
              />
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label htmlFor="transferReason" className="font-semibold text-sm">
                Reason / Note for Recipient
              </Label>
              <Textarea
                id="transferReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Great answer on React performance tuning..."
                className="min-h-20 text-sm"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="bg-white">
                Cancel
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1">
                Next: Review Transfer <ArrowRight className="w-4 h-4" />
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-3">
            <div className="border border-orange-200 bg-orange-50/50 rounded-lg p-4 space-y-3">
              <h4 className="font-bold text-orange-900 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-orange-600" /> Confirm Reputation Transfer
              </h4>

              <div className="space-y-2 text-sm text-gray-700 border-t border-orange-200 pt-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Recipient:</span>
                  <span className="font-semibold text-gray-900">{selectedUser?.name} ({selectedUser?.email})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transfer Amount:</span>
                  <span className="font-bold text-orange-600">{amount} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Reason:</span>
                  <span className="font-medium text-gray-800 italic">"{reason}"</span>
                </div>
                <div className="flex justify-between border-t border-orange-200 pt-2 font-semibold">
                  <span className="text-gray-600">Remaining Balance After:</span>
                  <span className="text-green-700">{currentUserReputation - Number(amount)} pts</span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setStep("form")} disabled={submitting}>
                Back to Edit
              </Button>
              <Button
                onClick={handleExecuteTransfer}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> Confirm & Send Transfer
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
