"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  AlertCircle,
  ArrowRight,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  Hotel,
  ImageIcon,
  Loader2,
  RefreshCcw,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

type RoomType = {
  id: number;
  name: string;
  description?: string | null;
  pricePerNight: number;
  capacity: number;
  totalRooms?: number;
  imageUrl?: string | null;
  isActive?: boolean;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeRooms = useMemo(() => {
    return rooms.filter((room) => room.isActive !== false);
  }, [rooms]);

  const minPrice = useMemo(() => {
    if (activeRooms.length === 0) return 0;

    return Math.min(...activeRooms.map((room) => room.pricePerNight));
  }, [activeRooms]);

  async function fetchRooms() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/rooms", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "ไม่สามารถโหลดข้อมูลห้องพักได้");
        return;
      }

      setRooms(result.data || []);
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูลห้องพัก");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
        <Navbar />

        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-300 sm:rounded-[2.5rem] sm:p-8 lg:p-10">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-emerald-500 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500 blur-3xl" />
          </div>

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-200 ring-1 ring-white/10">
                <BedDouble size={16} className="text-slate-200" />
                <span className="text-slate-200">Room Collection</span>
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                เลือกห้องพักที่เหมาะกับการพักผ่อนของคุณ
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                ดูรายละเอียดประเภทห้องพัก ราคา จำนวนผู้เข้าพัก และกดจองได้ทันที
                หรือเลือกเช็กห้องว่างตามวันที่ต้องการก่อนจองจริง
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/availability"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  <span className="text-white">เช็กห้องว่างก่อนจอง</span>
                  <SearchCheck size={18} className="text-white" />
                </Link>

                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                >
                  <span className="text-slate-950">กลับหน้าเมนูจอง</span>
                  <ArrowRight size={18} className="text-slate-950" />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/10">
                <Hotel size={26} className="text-slate-300" />
                <p className="mt-4 text-3xl font-black text-white">
                  {activeRooms.length}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  ประเภทห้องเปิดให้จอง
                </p>
              </div>

              <div className="rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/10">
                <Wallet size={26} className="text-slate-300" />
                <p className="mt-4 text-3xl font-black text-white">
                  {minPrice > 0 ? formatCurrency(minPrice) : "-"}
                </p>
                <p className="mt-1 text-sm text-slate-300">ราคาเริ่มต้น</p>
              </div>

              <div className="rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/10">
                <ShieldCheck size={26} className="text-slate-300" />
                <p className="mt-4 text-3xl font-black text-white">Admin</p>
                <p className="mt-1 text-sm text-slate-300">
                  มีแอดมินตรวจสอบ
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5">
          {loading && (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                <Loader2 size={36} className="animate-spin" />
              </div>

              <h2 className="mt-5 text-2xl font-black text-slate-950">
                กำลังโหลดรายการห้องพัก
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                กรุณารอสักครู่ ระบบกำลังดึงข้อมูลห้องพักจากฐานข้อมูล
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-sm sm:rounded-[2.5rem]">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                    <AlertCircle size={28} />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-red-700">
                      โหลดข้อมูลห้องพักไม่สำเร็จ
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-red-600">
                      {error}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fetchRooms}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
                >
                  <RefreshCcw size={18} className="text-white" />
                  <span className="text-white">โหลดใหม่</span>
                </button>
              </div>
            </div>
          )}

          {!loading && !error && activeRooms.length === 0 && (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                <BedDouble size={36} />
              </div>

              <h2 className="mt-5 text-2xl font-black text-slate-950">
                ยังไม่มีห้องพักที่เปิดให้จอง
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                ตอนนี้ยังไม่มีประเภทห้องพักที่เปิดใช้งาน กรุณาติดต่อรีสอร์ท
                หรือกลับมาตรวจสอบอีกครั้งภายหลัง
              </p>

              <Link
                href="/"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <span className="text-white">กลับหน้าเมนูจอง</span>
                <ArrowRight size={18} className="text-white" />
              </Link>
            </div>
          )}

          {!loading && !error && activeRooms.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {activeRooms.map((room) => (
                <article
                  key={room.id}
                  className="group overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200 sm:rounded-[2.5rem]"
                >
                  <div className="relative h-64 overflow-hidden bg-slate-200">
                    {room.imageUrl ? (
                      <img
                        src={room.imageUrl}
                        alt={room.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ImageIcon size={44} />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                    <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-2xl bg-white/90 px-3 py-2 text-xs font-black text-slate-700 shadow-sm backdrop-blur">
                      <BedDouble size={15} className="text-slate-700" />
                      <span>Room Type</span>
                    </div>

                    <div className="absolute right-4 top-4 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                      เปิดให้จอง
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <h2 className="text-3xl font-black text-white">
                        {room.name}
                      </h2>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-200">
                        {room.description ||
                          "ห้องพักบรรยากาศดี เหมาะสำหรับการพักผ่อน"}
                      </p>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Users size={16} />
                          <p className="text-xs font-bold">พักได้</p>
                        </div>
                        <p className="mt-2 font-black text-slate-950">
                          {room.capacity} คน
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <div className="flex items-center gap-2 text-slate-500">
                          <BedDouble size={16} />
                          <p className="text-xs font-bold">จำนวน</p>
                        </div>
                        <p className="mt-2 font-black text-slate-950">
                          {room.totalRooms ?? 1} ห้อง
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Wallet size={16} />
                          <p className="text-xs font-bold">ราคา</p>
                        </div>
                        <p className="mt-2 font-black text-slate-950">
                          {formatCurrency(room.pricePerNight)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[1.5rem] bg-slate-950 p-4 text-white">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-400">
                            ราคาเริ่มต้น
                          </p>
                          <p className="mt-1 text-2xl font-black text-white">
                            {formatCurrency(room.pricePerNight)}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">ต่อคืน</p>
                        </div>

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                          <Sparkles size={26} className="text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <Link
                        href={`/booking?roomTypeId=${room.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800"
                      >
                        <span className="text-white">จองห้องนี้</span>
                        <ArrowRight size={18} className="text-white" />
                      </Link>

                      <Link
                        href={`/availability`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
                      >
                        <span className="text-white">เช็กวันว่าง</span>
                        <SearchCheck size={18} className="text-white" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
              <Sparkles size={16} className="text-slate-600" />
              <span className="text-slate-600">Booking Tips</span>
            </div>

            <h2 className="text-3xl font-black text-slate-950">
              แนะนำก่อนจองห้องพัก
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              หากยังไม่แน่ใจว่าห้องไหนว่างในวันที่ต้องการ แนะนำให้กดเช็กห้องว่างก่อน
              ระบบจะแสดงจำนวนห้องว่างของแต่ละประเภทตามช่วงวันที่เลือก
            </p>

            <Link
              href="/availability"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
            >
              <span className="text-white">ไปหน้าเช็กห้องว่าง</span>
              <SearchCheck size={18} className="text-white" />
            </Link>
          </div>

          <div className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-300 sm:rounded-[2.5rem] sm:p-8">
            <CheckCircle2 size={32} className="text-emerald-300" />

            <h2 className="mt-5 text-3xl font-black text-white">
              ส่งคำขอจองแล้วรอแอดมินยืนยัน
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-300">
              หลังจากลูกค้ากรอกข้อมูลและส่งคำขอจอง ระบบจะบันทึกรายการเป็นสถานะรอตรวจสอบ
              จากนั้นแอดมินของรีสอร์ทสามารถยืนยันหรือเปลี่ยนสถานะได้จากหลังบ้าน
            </p>

            <Link
              href="/my-bookings"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
            >
              <span className="text-slate-950">ดูการจองของฉัน</span>
              <CalendarCheck size={18} className="text-slate-950" />
            </Link>
          </div>
        </section>

        <footer className="mt-5 rounded-[2rem] bg-white px-6 py-5 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          Room Collection • Resort Booking System
        </footer>
      </section>
    </main>
  );
}