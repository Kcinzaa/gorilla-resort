"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Hotel,
  ImageIcon,
  Loader2,
  RefreshCcw,
  SearchCheck,
  ShieldCheck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

type AvailabilityRoom = {
  id: number;
  name: string;
  description?: string | null;
  pricePerNight: number;
  capacity: number;
  totalRooms: number;
  imageUrl?: string | null;
  bookedRooms: number;
  availableRooms: number;
  isAvailable: boolean;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;

  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diff = end.getTime() - start.getTime();

  if (diff <= 0) return 0;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function AvailabilityPage() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [rooms, setRooms] = useState<AvailabilityRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const nights = useMemo(() => {
    return calculateNights(checkIn, checkOut);
  }, [checkIn, checkOut]);

  const availableRooms = useMemo(() => {
    return rooms.filter((room) => room.isAvailable && room.availableRooms > 0);
  }, [rooms]);

  const unavailableRooms = useMemo(() => {
    return rooms.filter((room) => !room.isAvailable || room.availableRooms <= 0);
  }, [rooms]);

  const totalAvailableRoomCount = useMemo(() => {
    return rooms.reduce((sum, room) => sum + Number(room.availableRooms || 0), 0);
  }, [rooms]);

  async function handleSearch(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    setError("");
    setSearched(false);
    setRooms([]);

    if (!checkIn || !checkOut) {
      setError("กรุณาเลือกวันที่เข้าพักและวันที่ออก");
      return;
    }

    if (nights <= 0) {
      setError("วันที่ออกต้องมากกว่าวันที่เข้าพัก");
      return;
    }

    try {
      setLoading(true);

      const params = new URLSearchParams({
        checkIn,
        checkOut,
      });

      const response = await fetch(
        `/api/rooms/availability-all?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        setError("API ไม่ได้ส่งข้อมูล JSON กลับมา");
        setRooms([]);
        setSearched(true);
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "ไม่สามารถตรวจสอบห้องว่างได้");
        setRooms([]);
        setSearched(true);
        return;
      }

      const allRooms: AvailabilityRoom[] = Array.isArray(result.data)
        ? result.data
        : [];

      setRooms(allRooms);
      setError("");
      setSearched(true);
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการตรวจสอบห้องว่าง");
      setRooms([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  function resetResult() {
    setSearched(false);
    setRooms([]);
    setError("");
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
        <Navbar />

        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-300 sm:rounded-[2.5rem] sm:p-8 lg:p-10">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-emerald-500 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500 blur-3xl" />
          </div>

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-200 ring-1 ring-white/10">
                <SearchCheck size={16} className="text-slate-200" />
                <span className="text-slate-200">Room Availability</span>
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                เช็คห้องว่างก่อนจอง
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                เลือกวันที่เข้าพักและวันที่ออก ระบบจะแสดงจำนวนห้องว่างของแต่ละประเภท
                พร้อมคำนวณจำนวนคืนและราคารวมให้ทันที
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/rooms"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                >
                  <span className="text-slate-950">ดูห้องพักทั้งหมด</span>
                  <BedDouble size={18} className="text-slate-950" />
                </Link>

                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-4 text-sm font-black text-white ring-1 ring-white/15 transition hover:bg-white/20"
                >
                  <span className="text-white">กลับหน้าเมนูจอง</span>
                  <ArrowRight size={18} className="text-white" />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/10">
                <CalendarDays size={26} className="text-slate-300" />
                <p className="mt-4 text-3xl font-black text-white">
                  {nights > 0 ? nights : "-"}
                </p>
                <p className="mt-1 text-sm text-slate-300">จำนวนคืน</p>
              </div>

              <div className="rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/10">
                <BedDouble size={26} className="text-slate-300" />
                <p className="mt-4 text-3xl font-black text-white">
                  {searched ? totalAvailableRoomCount : "-"}
                </p>
                <p className="mt-1 text-sm text-slate-300">ห้องว่างรวม</p>
              </div>

              <div className="rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/10">
                <ShieldCheck size={26} className="text-slate-300" />
                <p className="mt-4 text-3xl font-black text-white">Admin</p>
                <p className="mt-1 text-sm text-slate-300">รอยืนยันรายการ</p>
              </div>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleSearch}
          className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-6"
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                วันที่เข้าพัก
              </label>

              <div className="relative">
                <CalendarDays
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="date"
                  value={checkIn}
                  onChange={(event) => {
                    setCheckIn(event.target.value);
                    resetResult();
                  }}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                วันที่ออก
              </label>

              <div className="relative">
                <CalendarDays
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || undefined}
                  onChange={(event) => {
                    setCheckOut(event.target.value);
                    resetResult();
                  }}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin text-white" />
                  <span className="text-white">กำลังตรวจสอบ...</span>
                </>
              ) : (
                <>
                  <SearchCheck size={20} className="text-white" />
                  <span className="text-white">ตรวจสอบห้องว่าง</span>
                </>
              )}
            </button>
          </div>

          {nights > 0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Check-in
                </p>
                <p className="mt-1 font-black text-slate-950">{checkIn}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Check-out
                </p>
                <p className="mt-1 font-black text-slate-950">{checkOut}</p>
              </div>

              <div className="rounded-2xl bg-slate-950 p-4 text-white">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Total Nights
                </p>
                <p className="mt-1 font-black text-white">{nights} คืน</p>
              </div>
            </div>
          )}
        </form>

        {error && (
          <section className="mt-5 rounded-[2rem] border border-red-200 bg-red-50 p-5 shadow-sm sm:rounded-[2.5rem]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <AlertCircle size={28} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-red-700">
                    ตรวจสอบห้องว่างไม่สำเร็จ
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-red-600">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSearch()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
              >
                <RefreshCcw size={18} className="text-white" />
                <span className="text-white">ลองใหม่</span>
              </button>
            </div>
          </section>
        )}

        {!searched && !loading && !error && (
          <section className="mt-5 flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
              <CalendarDays size={38} />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              เลือกวันที่เพื่อเริ่มตรวจสอบ
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              ระบบจะแสดงจำนวนห้องว่างของแต่ละประเภทตามช่วงวันที่คุณเลือก
            </p>
          </section>
        )}

        {loading && (
          <section className="mt-5 flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
              <Loader2 size={38} className="animate-spin" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              กำลังตรวจสอบห้องว่าง
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              กรุณารอสักครู่ ระบบกำลังตรวจสอบข้อมูลการจองในช่วงวันที่เลือก
            </p>
          </section>
        )}

        {searched && !loading && !error && rooms.length === 0 && (
          <section className="mt-5 flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
              <Hotel size={38} />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              ยังไม่มีประเภทห้องพัก
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              กรุณาติดต่อรีสอร์ท หรือกลับมาตรวจสอบอีกครั้งภายหลัง
            </p>
          </section>
        )}

        {searched && !loading && !error && rooms.length > 0 && (
          <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_320px]">
            <div className="grid gap-5 md:grid-cols-2">
              {availableRooms.map((room) => (
                <article
                  key={room.id}
                  className="group overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200 sm:rounded-[2.5rem]"
                >
                  <div className="relative h-60 overflow-hidden bg-slate-200">
                    {room.imageUrl ? (
                      <img
                        src={room.imageUrl}
                        alt={room.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ImageIcon size={44} />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                    <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                      <CheckCircle2 size={16} />
                      ว่าง {room.availableRooms} ห้อง
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
                          <p className="text-xs font-bold">ว่าง</p>
                        </div>
                        <p className="mt-2 font-black text-slate-950">
                          {room.availableRooms} ห้อง
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Wallet size={16} />
                          <p className="text-xs font-bold">รวม</p>
                        </div>
                        <p className="mt-2 font-black text-slate-950">
                          {formatCurrency(room.pricePerNight * nights)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[1.5rem] bg-slate-950 p-4 text-white">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-400">
                            ราคารวมโดยประมาณ
                          </p>
                          <p className="mt-1 text-2xl font-black text-white">
                            {formatCurrency(room.pricePerNight * nights)}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {nights} คืน × {formatCurrency(room.pricePerNight)}
                          </p>
                        </div>

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                          <Banknote size={26} className="text-white" />
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/booking?roomTypeId=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}`}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
                    >
                      <span className="text-white">จองห้องนี้</span>
                      <ArrowRight size={18} className="text-white" />
                    </Link>
                  </div>
                </article>
              ))}

              {availableRooms.length === 0 && (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] md:col-span-2">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-500">
                    <XCircle size={38} />
                  </div>

                  <h2 className="mt-5 text-2xl font-black text-slate-950">
                    ไม่มีห้องว่างในช่วงวันที่นี้
                  </h2>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    ห้องพักทุกประเภทเต็มในช่วงวันที่ที่เลือก
                    กรุณาลองเปลี่ยนวันที่เข้าพักหรือวันที่ออกใหม่อีกครั้ง
                  </p>
                </div>
              )}
            </div>

            <aside className="h-fit rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] xl:sticky xl:top-28">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-white">
                <SearchCheck size={30} className="text-white" />
              </div>

              <h2 className="mt-5 text-2xl font-black text-slate-950">
                สรุปผลการค้นหา
              </h2>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    วันที่เข้าพัก
                  </p>
                  <p className="mt-1 font-black text-slate-950">{checkIn}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    วันที่ออก
                  </p>
                  <p className="mt-1 font-black text-slate-950">{checkOut}</p>
                </div>

                <div className="rounded-2xl bg-slate-950 p-4 text-white">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    จำนวนคืน
                  </p>
                  <p className="mt-1 text-2xl font-black text-white">
                    {nights} คืน
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                    ห้องว่างรวม
                  </p>
                  <p className="mt-1 text-2xl font-black text-emerald-700">
                    {totalAvailableRoomCount} ห้อง
                  </p>
                </div>
              </div>

              {unavailableRooms.length > 0 && (
                <div className="mt-5 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
                  <p className="font-black text-amber-700">
                    ห้องเต็ม {unavailableRooms.length} ประเภท
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-600">
                    มีบางประเภทห้องที่เต็มในช่วงวันที่คุณเลือก
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setCheckIn("");
                  setCheckOut("");
                  resetResult();
                }}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                <RefreshCcw size={18} className="text-slate-700" />
                <span className="text-slate-700">เลือกวันที่ใหม่</span>
              </button>
            </aside>
          </section>
        )}

      </section>
    </main>
  );
}
