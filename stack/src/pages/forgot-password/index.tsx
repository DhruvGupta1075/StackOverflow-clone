import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import axiosInstance from "@/lib/axiosinstance";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Mail } from "lucide-react";

const ForgotPassword = () => {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      toast.error("Registered Email or Phone Number is required");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post(
        "/api/auth/forgot-password",
        { emailOrPhone: emailOrPhone.trim() },
        { validateStatus: (status) => status < 500 }
      );

      if (response.status === 200 && response.data?.success) {
        setIsModalOpen(true);
        toast.success("Password reset request completed!");
      } else {
        const message = response.data?.message || "Failed to reset password. Please try again.";
        toast.error(message);
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      const message = error.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 lg:mb-8">
          <Link href="/" className="flex items-center justify-center mb-4">
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-orange-500 rounded mr-2 flex items-center justify-center">
              <div className="w-4 h-4 lg:w-6 lg:h-6 bg-white rounded-sm flex items-center justify-center">
                <div className="w-3 h-3 lg:w-4 lg:h-4 bg-orange-500 rounded-sm"></div>
              </div>
            </div>
            <span className="text-lg lg:text-xl font-bold text-gray-800">
              stack<span className="font-normal">overflow</span>
            </span>
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-xl lg:text-2xl">Forgot Password</CardTitle>
              <CardDescription>
                Enter your registered credentials to generate a new password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailOrPhone" className="text-sm">
                  Registered Email or Phone Number
                </Label>
                <Input
                  id="emailOrPhone"
                  type="text"
                  placeholder="Enter your registered email or phone number"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
              >
                {loading ? "Generating..." : "Generate New Password"}
              </Button>

              <div className="text-center text-sm">
                <Link href="/auth" className="text-blue-600 hover:underline">
                  Back to Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* Success Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-white border border-gray-200 sm:max-w-md" showCloseButton={false}>
          <DialogHeader className="flex flex-col items-center justify-center text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 mb-2 flex items-center justify-center">
              <Mail className="h-6 w-6" aria-hidden="true" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Password Reset Email Sent
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-2">
              We have generated a new password and sent it to your registered email address.
            </DialogDescription>
          </DialogHeader>

          <div className="text-center text-sm text-gray-500 my-4 px-2">
            Please check your inbox. You should change your password after logging in.
          </div>

          <div className="flex justify-center pt-2">
            <Button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                router.push("/auth");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full"
            >
              Go to Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ForgotPassword;
