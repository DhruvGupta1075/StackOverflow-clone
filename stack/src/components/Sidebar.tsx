import { cn } from "@/lib/utils";
import {
  Bookmark,
  Bot,
  Building,
  FileText,
  Home,
  MessageSquare,
  MessageSquareIcon,
  Sparkles,
  Tag,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { Badge } from "./ui/badge";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

const Sidebar = ({ isopen, onClose }: { isopen: boolean; onClose?: () => void }) => {
  const { user } = useAuth();
  const router = useRouter();

  const handleNavClick = () => {
    // Auto-close sidebar on mobile when a link is clicked
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isopen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed md:sticky top-[53px] left-0 w-56 lg:w-64 h-[calc(100vh-53px)] bg-white shadow-sm border-r z-50 transition-transform duration-200 ease-in-out overflow-y-auto",
          "md:translate-x-0 md:z-auto md:shadow-none",
          isopen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="p-2 lg:p-4">
          <ul className="space-y-1">
            {/* Pricing Plans — shown in sidebar on mobile only, navbar handles it on sm+ */}
            <li className="mobile-only-link">
              <Link
                href="/upgrade"
                onClick={handleNavClick}
                className="flex items-center px-2 py-2 text-orange-600 font-bold hover:bg-orange-50 rounded text-sm"
              >
                <Sparkles className="w-4 h-4 mr-2 flex-shrink-0 animate-pulse" />
                Pricing Plans
              </Link>
            </li>
            <li>
              <Link
                href="/"
                onClick={handleNavClick}
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <Home className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/"
                onClick={handleNavClick}
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <MessageSquareIcon className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
                Questions
              </Link>
            </li>
            <li>
              <Link
                href="#"
                onClick={handleNavClick}
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <Bot className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
                AI Assist
                <Badge variant="secondary" className="ml-auto text-xs">
                  Labs
                </Badge>
              </Link>
            </li>
            <li>
              <Link
                href="/tags"
                onClick={handleNavClick}
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <Tag className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
                Tags
              </Link>
            </li>
            <li>
              <Link
                href="/users"
                onClick={handleNavClick}
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <Users className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
                Users
              </Link>
            </li>
            <li>
              <button
                onClick={() => {
                  handleNavClick();
                  if (user) {
                    if (user.plan === "Silver" || user.plan === "Gold") {
                      router.push(`/users/${user._id}?tab=bookmarks`);
                    } else {
                      toast.info("Saves is a premium feature. Upgrade to Silver or Gold plan to use bookmarks.");
                      router.push("/upgrade");
                    }
                  } else {
                    toast.info("Please login to access bookmarks.");
                    router.push("/auth");
                  }
                }}
                className="w-full flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm text-left cursor-pointer border-0 bg-transparent"
              >
                <Bookmark className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
                Saves
              </button>
            </li>
            <li>
              <Link
                href="#"
                onClick={handleNavClick}
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <Trophy className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
                Challenges
                <Badge
                  variant="secondary"
                  className="ml-auto text-xs bg-orange-100 text-orange-800"
                >
                  NEW
                </Badge>
              </Link>
            </li>
            <li>
              <Link
                href="#"
                onClick={handleNavClick}
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <MessageSquare className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
                Chat
              </Link>
            </li>
            <li>
              <Link
                href="#"
                onClick={handleNavClick}
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <FileText className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
                Articles
              </Link>
            </li>

            <li>
              <Link
                href="#"
                onClick={handleNavClick}
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <Building className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
                Companies
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
