import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, ShieldCheck, RefreshCw, X } from "lucide-react";
import { toast } from "react-toastify";

interface SecurityOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  tempToken: string;
  onSuccess: () => void;
}

export default function SecurityOtpModal({
  isOpen,
  onClose,
  tempToken,
  onSuccess,
}: SecurityOtpModalProps) {
  const { VerifyOtp, ResendOtp } = useAuth();
  const [otp, setOtp] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [resendCount, setResendCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setOtp("");
      setTrustDevice(false);
      setTimer(60);
      setResendCount(0);
      startCountdown();
    } else {
      stopCountdown();
    }
    return () => stopCountdown();
  }, [isOpen]);

  const startCountdown = () => {
    stopCountdown();
    setTimer(60);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          stopCountdown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopCountdown = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  if (!isOpen) return null;

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    if (resendCount >= 3) {
      toast.error("Maximum resend attempts reached. Please try logging in again later.");
      return;
    }

    setResending(true);
    const result = await ResendOtp(tempToken);
    setResending(false);

    if (result.success) {
      setResendCount((prev) => prev + 1);
      startCountdown();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || loading) return;

    setLoading(true);
    const result = await VerifyOtp(tempToken, otp, trustDevice);
    setLoading(false);

    if (result.success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4 transition-opacity">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-gray-800 text-lg">
              New Device Verification
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-orange-100 cursor-pointer border-0 bg-transparent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleVerify} className="p-6 flex flex-col gap-4">
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            We detected that you are logging in from an unrecognized device. For security, an OTP has been sent to your registered email address.
          </p>

          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-1">
              Enter 6-Digit OTP
            </label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full tracking-[0.5em] text-center text-2xl font-bold py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500 transition placeholder:tracking-normal placeholder:font-normal placeholder:text-sm text-gray-800"
              autoFocus
              required
            />
          </div>

          {/* Trust Device Checkbox */}
          <div className="flex items-center gap-2 mt-2 px-1">
            <input
              type="checkbox"
              id="trustDevice"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
            />
            <label htmlFor="trustDevice" className="text-sm text-gray-700 font-medium select-none cursor-pointer">
              Trust this device (skip verification next time)
            </label>
          </div>

          {/* Countdown & Resend */}
          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
            <div>
              {timer > 0 ? (
                <span>
                  Resend OTP in <strong className="text-orange-600">{timer}</strong> seconds
                </span>
              ) : (
                <span className="text-green-600 font-semibold">Ready to resend</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleResend}
              disabled={timer > 0 || resending || resendCount >= 3}
              className="flex items-center gap-1 font-bold text-orange-600 hover:text-orange-700 transition disabled:text-gray-400 disabled:no-underline hover:underline cursor-pointer border-0 bg-transparent"
            >
              {resending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Resend OTP {resendCount > 0 ? `(${3 - resendCount} left)` : ""}
            </button>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-4 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-lg transition cursor-pointer border-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={otp.length !== 6 || loading}
              className="flex-1 flex justify-center items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-2.5 rounded-lg shadow transition disabled:bg-orange-300 disabled:cursor-not-allowed cursor-pointer border-0"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Verifying..." : "Verify Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
