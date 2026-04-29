"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  BedDouble,
  LogOut,
  Hotel,
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Bookings",
    href: "/admin/bookings",
    icon: CalendarCheck,
  },
  {
    label: "Rooms",
    href: "/admin/rooms",
    icon: BedDouble,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", {
      method: "POST",
    });

    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
              <Hotel size={24} />
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Resort Admin
              </h1>
              <p className="text-sm text-slate-500">Booking Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "flex w-full items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200"
                    : "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                }
              >
                <Icon
                  size={20}
                  strokeWidth={2}
                  className={active ? "text-white" : "text-slate-700"}
                />

                <span className={active ? "text-white" : "text-slate-700"}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={20} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </aside>
  );
}