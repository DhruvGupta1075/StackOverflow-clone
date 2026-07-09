import { useAuth } from "@/lib/AuthContext";
import { Menu, Search, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const Navbar = ({ handleslidein }: any) => {
  const { user, Logout } = useAuth();
  const router = useRouter();
  const [searchVal, setSearchVal] = useState("");
  const [hasMounted, setHasMounted] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (router.query.search) {
      setSearchVal(router.query.search as string);
    }
  }, [router.query.search]);

  const handlelogout = () => {
    Logout();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/?search=${encodeURIComponent(searchVal.trim())}`);
    } else {
      router.push("/");
    }
    setMobileSearchOpen(false);
  };

  return (
    <div className="sticky top-0 z-30 w-full bg-white border-t-[3px] border-[#ef8236] shadow-[0_1px_5px_#00000033]">
      {/* Main navbar row */}
      <div className="min-h-[53px] flex items-center justify-center">
        <div className="w-[95%] sm:w-[90%] max-w-[1440px] flex items-center justify-between mx-auto py-1">
          <button
            aria-label="Toggle sidebar"
            className="md:hidden p-2 rounded hover:bg-gray-100 transition flex-shrink-0"
            onClick={handleslidein}
          >
            <Menu className="w-5 h-5 text-gray-800" />
          </button>
          <div className="flex items-center gap-1 sm:gap-2 flex-grow min-w-0">
            <Link href="/" className="px-2 sm:px-3 py-1 flex-shrink-0">
              <img src="/logo.png" alt="Logo" className="h-5 sm:h-6 w-auto" />
            </Link>

            <div className="hidden sm:flex gap-1">
              <Link
                href="/upgrade"
                className="text-sm text-orange-600 font-bold px-2 lg:px-4 py-2 rounded hover:bg-orange-50 transition flex items-center gap-1 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 animate-pulse" /> Pricing Plans
              </Link>
              {["About", "Products"].map((item) => (
                <Link
                  key={item}
                  href="/"
                  className="hidden lg:block text-sm text-[#454545] font-medium px-4 py-2 rounded hover:bg-gray-200 transition"
                >
                  {item}
                </Link>
              ))}
            </div>
            {/* Desktop/Tablet search */}
            <form onSubmit={handleSearchSubmit} className="hidden md:block flex-grow relative px-2 lg:px-3">
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search questions..."
                className="w-full max-w-[600px] pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <button type="submit" className="absolute left-3 md:left-4 top-2.5">
                <Search className="h-4 w-4 text-gray-600 hover:text-orange-500" />
              </button>
            </form>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Mobile search toggle */}
            <button
              aria-label="Toggle search"
              className="md:hidden p-2 rounded hover:bg-gray-100 transition"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            >
              {mobileSearchOpen ? (
                <X className="w-5 h-5 text-gray-800" />
              ) : (
                <Search className="w-5 h-5 text-gray-800" />
              )}
            </button>

             {!hasMounted ? null : !user ? (
              <Link
                href="/auth"
                className="text-xs sm:text-sm font-medium text-[#454545] bg-[#e7f8fe] hover:bg-[#d3e4eb] border border-blue-500 px-3 sm:px-4 py-1.5 rounded transition whitespace-nowrap"
              >
                Log in
              </Link>
            ) : (
              <>
                <Link
                  href={`/users/${user._id}`}
                  title={`${user.plan || "Free"} Plan`}
                  className="flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold w-8 h-8 sm:w-9 sm:h-9 rounded-full relative flex-shrink-0"
                >
                  {user.name?.charAt(0).toUpperCase()}
                  {user.plan && user.plan !== "Free" && (
                    <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-[6px] sm:text-[7px] font-extrabold border text-white shadow ${
                      user.plan === "Gold" ? "bg-gradient-to-r from-yellow-500 to-amber-500 border-yellow-600" :
                      user.plan === "Silver" ? "bg-slate-500 border-slate-600" :
                      "bg-amber-600 border-amber-700"
                    }`}>
                      {user.plan[0]}
                    </span>
                  )}
                </Link>

                <button
                  onClick={handlelogout}
                  className="text-xs sm:text-sm font-medium text-[#454545] bg-[#e7f8fe] hover:bg-[#d3e4eb] border border-blue-500 px-3 sm:px-4 py-1.5 rounded transition whitespace-nowrap"
                >
                  Log out
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search row - expandable */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t border-gray-200 px-3 py-2 bg-white">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search questions..."
              autoFocus
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button type="submit" className="absolute left-2.5 top-2.5">
              <Search className="h-4 w-4 text-gray-600 hover:text-orange-500" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Navbar;
