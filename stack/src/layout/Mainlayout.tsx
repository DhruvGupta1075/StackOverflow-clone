import Navbar from "@/components/Navbar";
import RightSideBar from "@/components/RightSideBar";
import Sidebar from "@/components/Sidebar";
import React, { ReactNode, useCallback, useEffect, useState } from "react";
interface MainlayoutProps {
  children: ReactNode;
}
const Mainlayout = ({ children }: MainlayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, []);

  const handleslidein = () => {
    setSidebarOpen((state) => !state);
  };

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="bg-[#f8f9fa] text-[#3a3a3a] min-h-screen">
      <Navbar handleslidein={handleslidein} />
      <div className="flex max-w-full py-1">
        <Sidebar isopen={sidebarOpen} onClose={handleCloseSidebar} />
        <main className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6 bg-white">{children}</main>
        <div className="hidden lg:block border-1 borde-gray-200">
          <RightSideBar />
        </div>
      </div>
    </div>
  );
};

export default Mainlayout;
