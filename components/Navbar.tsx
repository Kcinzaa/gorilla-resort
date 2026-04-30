"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLineProfile } from "@/lib/useLineProfile";
import {
  BedDouble,
  CalendarCheck,
  Home,
  Hotel,
  LayoutDashboard,
  Loader2,
  Menu,
  SearchCheck,
  User,
  X,
} from "lucide-react";

type NavbarProps = {
  onOpenProfile?: () => void;
  showProfile?: boolean;
};

const navItems = [
  {
    label: "หน้าแรก",
    href: "/home",
    icon: Home,
  },
  {
    label: "เมนูจอง",
    href: "/booking-menu",
    icon: Hotel,
  },
  {
    label: "เช็คห้องว่าง",
    href: "/availability",
    icon: SearchCheck,
  },
  {
    label: "ห้องพัก",
    href: "/rooms",
    icon: BedDouble,
  },
  {
    label: "การจองของฉัน",
    href: "/my-bookings",
    icon: CalendarCheck,
  },
];

export default function Navbar({
  onOpenProfile,
  showProfile = true,
}: NavbarProps) {
  const pathname = usePathname();
  const { profile, loading, error, isDevMode } = useLineProfile();

  const [openMenu, setOpenMenu] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);

  const isAdmin = profile?.isAdmin === true;

  function isActivePath(href: string) {
    if (href === "/home") {
      return pathname === "/home" || pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function handleOpenProfile() {
    if (onOpenProfile) {
      onOpenProfile();
      return;
    }

    setOpenProfile(true);
  }

  return (
    <>
      <header className="sticky top-3 z-40 mb-5 rounded-[1.5rem] bg-white/95 px-4 py-3 shadow-sm ring-1 ring-slate-200 backdrop-blur-xl sm:top-4 sm:rounded-[2rem] sm:px-5 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/home" className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 ring-1 ring-slate-200">
              <img
                src="/images/logo/logo.jpg"
                alt="Gorilla Resort Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="hidden min-w-0 sm:block">
              <h1 className="truncate text-lg font-black text-slate-950">
                Gorilla Resort
              </h1>
              <p className="truncate text-sm font-semibold text-slate-500">
                Nature Stay & Private Retreat
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const active = isActivePath(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-2xl px-4 py-3 text-sm font-black transition",
                    active
                      ? "bg-slate-950 text-white"
                      : "text-slate-800 hover:bg-slate-100",
                  ].join(" ")}
                >
                  <span className={active ? "text-white" : "text-slate-800"}>
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className={[
                  "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition",
                  pathname.startsWith("/admin")
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-950 text-white hover:bg-slate-800",
                ].join(" ")}
              >
                <LayoutDashboard size={17} className="text-white" />
                <span className="text-white">Admin</span>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="hidden items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 md:inline-flex lg:hidden"
              >
                <LayoutDashboard size={17} className="text-white" />
                <span className="text-white">Admin</span>
              </Link>
            )}

            {showProfile && (
              <button
                type="button"
                onClick={handleOpenProfile}
                className="inline-flex max-w-[210px] items-center gap-3 rounded-2xl bg-slate-100 px-3 py-3 text-left transition hover:bg-slate-200 sm:max-w-[260px] sm:px-4"
              >
                <ProfileAvatar loading={loading} profile={profile} />

                <div className="hidden min-w-0 sm:block">
                  <p className="truncate text-sm font-black text-slate-700">
                    {loading
                      ? "กำลังโหลด..."
                      : profile?.displayName || "Test Customer"}
                  </p>
                  <p className="truncate text-xs font-semibold text-slate-400">
                    {isAdmin ? "Admin Mode" : "กดดูโปรไฟล์"}
                  </p>
                </div>
              </button>
            )}

            <button
              type="button"
              onClick={() => setOpenMenu(true)}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white lg:hidden"
            >
              <Menu size={22} className="text-white" />
            </button>
          </div>
        </div>
      </header>

      {openMenu && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 p-3 backdrop-blur-sm lg:hidden">
          <div className="ml-auto flex h-full w-full max-w-sm flex-col rounded-[2rem] bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 ring-1 ring-slate-200">
                  <img
                    src="/images/logo/logo.jpg"
                    alt="Gorilla Resort Logo"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <p className="font-black text-slate-950">Gorilla Resort</p>
                  <p className="text-sm text-slate-500">Resort Booking</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpenMenu(false)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
              >
                <X size={22} />
              </button>
            </div>

            <div className="grid gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpenMenu(false)}
                    className={[
                      "flex items-center gap-3 rounded-2xl px-4 py-4 text-sm font-black transition",
                      active
                        ? "bg-slate-950 text-white"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    <Icon
                      size={20}
                      className={active ? "text-white" : "text-slate-600"}
                    />
                    <span className={active ? "text-white" : "text-slate-700"}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}

              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setOpenMenu(false)}
                  className={[
                    "flex items-center gap-3 rounded-2xl px-4 py-4 text-sm font-black transition",
                    pathname.startsWith("/admin")
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-950 text-white hover:bg-slate-800",
                  ].join(" ")}
                >
                  <LayoutDashboard size={20} className="text-white" />
                  <span className="text-white">Admin Dashboard</span>
                </Link>
              )}
            </div>

            {showProfile && (
              <button
                type="button"
                onClick={() => {
                  setOpenMenu(false);
                  handleOpenProfile();
                }}
                className="mt-auto flex items-center gap-3 rounded-2xl bg-slate-100 p-4 text-left transition hover:bg-slate-200"
              >
                <ProfileAvatar loading={loading} profile={profile} />

                <div className="min-w-0">
                  <p className="truncate font-black text-slate-950">
                    {loading
                      ? "กำลังโหลด..."
                      : profile?.displayName || "Test Customer"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {isAdmin ? "Admin Mode" : "กดดูโปรไฟล์ LINE"}
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {showProfile && openProfile && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="bg-slate-950 px-6 py-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-300">
                    LINE Profile
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-white">
                    ข้อมูลลูกค้า
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenProfile(false)}
                  className="rounded-full bg-white/10 p-2 transition hover:bg-white/20"
                >
                  <X size={22} className="text-white" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex min-h-64 flex-col items-center justify-center text-center">
                  <Loader2 size={36} className="animate-spin text-slate-500" />
                  <h3 className="mt-5 text-2xl font-black text-slate-950">
                    กำลังโหลดโปรไฟล์
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">กรุณารอสักครู่</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4">
                      <ProfileAvatar loading={false} profile={profile} large />
                    </div>

                    <h3 className="text-2xl font-black text-slate-950">
                      {profile?.displayName || "Test Customer"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {isAdmin
                        ? "Admin Mode"
                        : isDevMode
                          ? "Development Mode"
                          : "LINE LIFF User"}
                    </p>
                  </div>

                  {error && (
                    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                      {error}
                    </div>
                  )}

                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setOpenProfile(false)}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
                    >
                      <LayoutDashboard size={18} className="text-white" />
                      <span className="text-white">ไปหน้า Admin Dashboard</span>
                    </Link>
                  )}

                  <div className="mt-6 grid gap-3">
                    <InfoRow
                      label="LINE User ID"
                      value={profile?.userId || "test-line-user-001"}
                    />
                    <InfoRow
                      label="Display Name"
                      value={profile?.displayName || "Test Customer"}
                    />
                    <InfoRow
                      label="Role"
                      value={isAdmin ? "ADMIN" : "CUSTOMER"}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpenProfile(false)}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    <span className="text-white">ปิด</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProfileAvatar({
  loading,
  profile,
  large = false,
}: {
  loading: boolean;
  profile: ReturnType<typeof useLineProfile>["profile"];
  large?: boolean;
}) {
  return (
    <div
      className={[
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-slate-400 ring-1 ring-slate-200",
        large ? "h-24 w-24" : "h-10 w-10",
      ].join(" ")}
    >
      {loading ? (
        <Loader2
          size={large ? 34 : 20}
          className="animate-spin text-slate-400"
        />
      ) : profile?.pictureUrl ? (
        <img
          src={profile.pictureUrl}
          alt={profile.displayName}
          className="h-full w-full object-cover"
        />
      ) : (
        <User size={large ? 42 : 20} className="text-slate-400" />
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-all text-sm font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}