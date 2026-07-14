import { useRouter } from "next/router";
import { useEffect } from "react";

export default function BookmarksRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/saves");
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
    </div>
  );
}
