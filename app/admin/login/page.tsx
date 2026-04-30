"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
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
      <section className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-3 py-6 sm:px-6 lg:px-8">
            <div className="w-full rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-300 ring-1 ring-slate-200 sm:rounded-[3rem] sm:p-8">
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

              <Link
                href="/rooms"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                <span className="text-slate-700">ไปหน้าห้องพัก</span>
                <ArrowRight size={18} className="text-slate-700" />
              </Link>
            </div>
      </section>
    </main>
  );
}
