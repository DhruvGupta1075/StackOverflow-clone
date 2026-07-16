import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "react-toastify";
import { useAuth } from "@/lib/AuthContext";
import i18n from "i18next";
import { Loader2, ShieldCheck, RefreshCw, X } from "lucide-react";
import { useTranslation } from "@/lib/useTranslationSafe";

interface LanguageOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLanguage: string;
  targetLanguageName: string;
  onSuccess: () => void;
}

export default function LanguageOtpModal({
  isOpen,
  onClose,
  targetLanguage,
  targetLanguageName,
  onSuccess
}: LanguageOtpModalProps) {
  const { updateUser } = useAuth();
  const { t } = useTranslation();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setOtp("");
      setTimer(60);
      startCountdown();
    } else {
      stopCountdown();
    }
    return () => stopCountdown();
  }, [isOpen]);

  const startCountdown = () => {
    stopCountdown();
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
    setResending(true);
    try {
      const res = await axiosInstance.post("/api/language/request-change", {
        language: targetLanguage
      });
      if (res.data.success) {
        toast.success(res.data.message || t("messages.mobile_otp_sent", "OTP sent successfully."));
        setTimer(60);
        startCountdown();
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Failed to resend OTP.";
      toast.error(errMsg);
      // Close modal if locked out
      if (err.response?.status === 429) {
        onClose();
      }
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || loading) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/language/verify-otp", {
        otp,
        language: targetLanguage
      });
      if (res.data.success) {
        toast.success(t("messages.success_change", "Language changed successfully."));
        
        // Update user state globally
        if (res.data.user) {
          updateUser(res.data.user);
        }
        
        // Update local storage and app language
        localStorage.setItem("i18nextLng", targetLanguage);
        await i18n.changeLanguage(targetLanguage);
        
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || t("messages.invalid_otp", "Incorrect OTP.");
      toast.error(errMsg);
      // If locked out, close the modal immediately
      if (err.response?.status === 429) {
        onClose();
      }
    } finally {
      setLoading(false);
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
              {t("modal.verify_lang_title", "Verify Language Change")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-orange-100 cursor-pointer border-0 bg-transparent"
            title={t("modal.cancel_btn", "Cancel")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleVerify} className="p-6 flex flex-col gap-4">
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            {t("modal.verify_lang_msg", "Enter the OTP sent to your registered email/mobile number.")}
          </p>
          
          <div className="text-center font-semibold text-orange-600 text-sm bg-orange-50/50 py-1.5 px-3 rounded-lg border border-dashed border-orange-200">
            {t("profile.preferred_lang", "Target Language")}: {targetLanguageName} ({targetLanguage.toUpperCase()})
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder={t("modal.otp_input_placeholder", "Enter 6-digit OTP")}
              className="w-full tracking-[0.5em] text-center text-xl font-bold py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500 transition placeholder:tracking-normal placeholder:font-normal placeholder:text-sm text-gray-800"
              autoFocus
            />
          </div>

          {/* Countdown & Resend */}
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <div>
              {timer > 0 ? (
                <span>
                  Resend OTP in <strong className="text-orange-600">{timer}</strong> {t("modal.timer_seconds", "seconds")}
                </span>
              ) : (
                <span className="text-green-600 font-semibold">Ready to resend</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleResend}
              disabled={timer > 0 || resending}
              className={`flex items-center gap-1 font-bold text-orange-600 hover:text-orange-700 transition disabled:text-gray-400 disabled:no-underline hover:underline cursor-pointer border-0 bg-transparent ${timer > 0 ? 'cursor-not-allowed' : ''}`}
            >
              {resending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {t("modal.resend_otp", "Resend OTP")}
            </button>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-4 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-lg transition cursor-pointer border-0"
            >
              {t("modal.cancel_btn", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={otp.length !== 6 || loading}
              className="flex-1 flex justify-center items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-2.5 rounded-lg shadow transition disabled:bg-orange-300 disabled:cursor-not-allowed cursor-pointer border-0"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t("modal.verifying", "Verifying...") : t("modal.verify_btn", "Verify")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
