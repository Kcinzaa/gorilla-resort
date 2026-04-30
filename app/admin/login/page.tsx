"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BedDouble,
  Eye,
  EyeOff,
  Hotel,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!username.trim()) {
      setError("กรุณากรอกชื่อผู้ใช้");
      return;
    }

    if (!password.trim()) {
      setError("กรุณากรอกรหัสผ่าน");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-3 py-6 sm:px-6 lg:px-8">
        <div className="grid w-full gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-300 sm:rounded-[3rem] sm:p-8 lg:p-10">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute -left-28 top-8 h-80 w-80 rounded-full bg-emerald-500 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500 blur-3xl" />
            </div>

            <div className="relative z-10 flex min-h-[720px] flex-col justify-between">
              <div>
                <Link
                  href="/rooms"
                  className="mb-10 inline-flex items-center gap-3 rounded-[2rem] bg-white/10 px-4 py-3 ring-1 ring-white/10 transition hover:bg-white/15"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
                    <Hotel size={25} className="text-slate-950" />
                  </div>

                  <div>
                    <p className="font-black text-white">Resort Booking</p>
                    <p className="text-sm text-slate-300">
                      Admin Management
                    </p>
                  </div>
                </Link>

                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-200 ring-1 ring-emerald-400/20">
                  <ShieldCheck size={17} className="text-emerald-200" />
                  <span className="text-emerald-200">Admin Secure Login</span>
                </div>

                <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
                  เข้าสู่ระบบหลังบ้านสำหรับจัดการรีสอร์ท
                </h1>

                <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
                  จัดการรายการจอง ตรวจสอบสถานะลูกค้า เพิ่ม/แก้ไขห้องพัก
                  และควบคุมข้อมูลหลักของระบบ Resort Booking ได้จากที่เดียว
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[2rem] bg-white/10 p-4 ring-1 ring-white/10">
                    <BedDouble size={26} className="text-slate-300" />
                    <p className="mt-4 text-3xl font-black text-white">
                      Rooms
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      จัดการห้องพัก
                    </p>
                  </div>

                  <div className="rounded-[2rem] bg-white/10 p-4 ring-1 ring-white/10">
                    <ShieldCheck size={26} className="text-slate-300" />
                    <p className="mt-4 text-3xl font-black text-white">
                      Admin
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      ระบบหลังบ้าน
                    </p>
                  </div>

                  <div className="rounded-[2rem] bg-white/10 p-4 ring-1 ring-white/10">
                    <Sparkles size={26} className="text-slate-300" />
                    <p className="mt-4 text-3xl font-black text-white">
                      Easy
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      ใช้งานง่าย
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/10">
                <p className="text-sm font-bold text-slate-300">
                  Production Credentials
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs text-slate-400">Username</p>
                    <p className="mt-1 font-black text-white">ADMIN_USERNAME</p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs text-slate-400">Password</p>
                    <p className="mt-1 font-black text-white">ADMIN_PASSWORD</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="flex items-center">
            <div className="w-full rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-300 ring-1 ring-slate-200 sm:rounded-[3rem] sm:p-8 lg:p-10">
              <div className="mb-8">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[2rem] bg-slate-950 text-white">
                  <LockKeyhole size={32} className="text-white" />
                </div>

                <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
                  Admin Login
                </p>

                <h2 className="mt-2 text-4xl font-black text-slate-950">
                  เข้าสู่ระบบ
                </h2>

                <p className="mt-3 text-sm leading-7 text-slate-500">
                  กรอกชื่อผู้ใช้และรหัสผ่านเพื่อเข้าสู่ระบบจัดการหลังบ้านของรีสอร์ท
                </p>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  <AlertCircle
                    size={20}
                    className="mt-0.5 shrink-0 text-red-600"
                  />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Username
                  </label>

                  <div className="relative">
                    <User
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="Username"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Password
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Password"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-14 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      {showPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex h-16 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={22} className="animate-spin text-white" />
                      <span className="text-white">กำลังเข้าสู่ระบบ...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-white">เข้าสู่ระบบแอดมิน</span>
                      <ArrowRight size={20} className="text-white" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 rounded-[2rem] bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={22} className="text-emerald-600" />
                  </div>

                  <div>
                    <p className="font-black text-slate-950">
                      สำหรับผู้ดูแลระบบเท่านั้น
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      หน้านี้ใช้สำหรับจัดการข้อมูลหลังบ้าน เช่น รายการจองและห้องพัก
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/rooms"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                <span className="text-slate-700">ไปหน้าห้องพัก</span>
                <ArrowRight size={18} className="text-slate-700" />
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
