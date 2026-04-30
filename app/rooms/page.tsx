"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  AlertCircle,
  ArrowRight,
  BedDouble,
  Eye,
  ImageIcon,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCcw,
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

  async function fetchRooms() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/rooms", {
        method: "GET",
        cache: "no-store",
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        setError("API /api/rooms ไม่ได้ส่ง JSON กลับมา");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
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
                href="/booking-menu"
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
                  <Link
                    href={`/rooms/${room.id}`}
                    className="block"
                    aria-label={`ดูรายละเอียดห้อง ${room.name}`}
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

                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

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
                  </Link>

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

                    <div className="mt-5 grid gap-3">
                      <Link
                        href={`/rooms/${room.id}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-800 transition hover:bg-slate-200"
                      >
                        <Eye size={18} className="text-slate-800" />
                        <span className="text-slate-800">
                          ดูรายละเอียดห้องพัก
                        </span>
                      </Link>

                      <Link
                        href={`/booking?roomTypeId=${room.id}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800"
                      >
                        <span className="text-white">จองห้องนี้</span>
                        <ArrowRight size={18} className="text-white" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
                Contact Resort
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">
                ติดต่อรีสอร์ท
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                หากต้องการสอบถามรายละเอียดห้องพัก การเดินทาง หรือแจ้งข้อมูลเพิ่มเติมหลังจอง
                สามารถติดต่อรีสอร์ทได้ตามช่องทางด้านล่าง
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <Phone size={22} className="text-emerald-600" />
                <p className="mt-3 text-xs font-bold text-slate-500">โทร</p>
                <p className="mt-1 font-black text-slate-950">08x-xxx-xxxx</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <MessageCircle size={22} className="text-emerald-600" />
                <p className="mt-3 text-xs font-bold text-slate-500">LINE OA</p>
                <p className="mt-1 font-black text-slate-950">Gorilla Resort</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <MapPin size={22} className="text-emerald-600" />
                <p className="mt-3 text-xs font-bold text-slate-500">ที่ตั้ง</p>
                <p className="mt-1 font-black text-slate-950">ติดต่อรีสอร์ท</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-5 rounded-[2rem] bg-white px-6 py-5 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          Gorilla Resort • Resort Booking System
        </footer>
      </section>
    </main>
  );
}
