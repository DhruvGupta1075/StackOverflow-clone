import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/AuthContext";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

export default function GitHubCallback() {
  const router = useRouter();
  const { SocialLogin } = useAuth();
  const [status, setStatus] = useState("Authenticating with GitHub...");

  useEffect(() => {
    if (!router.isReady) return;

    const code = router.query.code;
    const error = router.query.error;

    if (error) {
      console.error("GitHub Auth Error:", error);
      toast.error(router.query.error_description as string || "GitHub login was cancelled or failed.");
      router.push("/auth");
      return;
    }

    if (!code) {
      toast.error("No authorization code received from GitHub.");
      router.push("/auth");
      return;
    }

    const exchangeCode = async () => {
      try {
        setStatus("Exchanging authorization code...");
        const success = await SocialLogin("github", code as string);
        if (success) {
          router.push("/");
        } else {
          router.push("/auth");
        }
      } catch (err) {
        console.error("Callback Exchange Error:", err);
        toast.error("Failed to complete GitHub authentication.");
        router.push("/auth");
      }
    };

    exchangeCode();
  }, [router.isReady, router.query]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 flex flex-col items-center gap-4 max-w-sm w-full text-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        <h2 className="text-xl font-bold text-gray-800">Completing Sign In</h2>
        <p className="text-sm text-gray-500">{status}</p>
        <p className="text-xs text-gray-400">Please do not close this window.</p>
      </div>
    </div>
  );
}
