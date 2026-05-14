"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { Loader2, LogOut, Menu, X } from "lucide-react";

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/admin/dashboard")) return "Dashboard";
  if (pathname.startsWith("/admin/bookings")) return "Bookings";
  if (pathname.startsWith("/admin/rooms")) return "Rooms";
  if (pathname.startsWith("/admin/login")) return "Login";
  return "Admin";
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login" || pathname.startsWith("/admin/login");

  useEffect(() => {
    if (isLoginPage) {
      setAuthChecked(true);
      return;
    }

    async function checkAuth() {
      try {
        const response = await fetch("/api/admin/me", {
          cache: "no-store",
          credentials: "include",
        });

        const result = await response.json();

        if (!response.ok || !result.loggedIn) {
          router.replace("/admin/login");
          return;
        }

        setAuthChecked(true);
      } catch {
        router.replace("/admin/login");
      }
    }

    checkAuth();
  }, [isLoginPage, router]);

  async function handleLogout() {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });

    router.push("/admin/login");
    router.refresh();
  }

  // Login page: render without layout chrome
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Auth loading state
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-10 shadow-sm ring-1 ring-slate-200">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Loader2 size={32} className="animate-spin" />
          </div>
          <p className="text-lg font-bold text-slate-700">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar (desktop fixed) */}
      <AdminSidebar />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="lg:ml-72">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
          {/* Left: hamburger (mobile) + page title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:hidden"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <h1 className="text-lg font-black text-slate-900">{pageTitle}</h1>
          </div>

          {/* Right: logout (mobile only, sidebar handles desktop) */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 lg:hidden"
          >
            <LogOut size={18} />
            <span>ออกจากระบบ</span>
          </button>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
