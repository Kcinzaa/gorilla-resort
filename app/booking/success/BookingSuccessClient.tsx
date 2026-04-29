"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Home,
  ReceiptText,
} from "lucide-react";

type SuccessInfo = {
  bookingCode: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
};

export default function BookingSuccessClient() {
  const [info, setInfo] = useState<SuccessInfo>({
    bookingCode: "",
    roomName: "",
    checkIn: "",
    checkOut: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setInfo({
      bookingCode: params.get("bookingCode") || "",
      roomName: params.get("roomName") || "",
      checkIn: params.get("checkIn") || "",
      checkOut: params.get("checkOut") || "",
    });
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950">
      <section className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200">
          <div className="bg-slate-950 px-6 py-8 text-white sm:px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500 text-white">
              <CheckCircle2 size={34} className="text-white" />
            </div>

            <h1 className="mt-6 text-3xl font-black text-white sm:text-4xl">
              ส่งคำขอจองสำเร็จ
            </h1>

            <p className="mt-3 text-sm leading-7 text-slate-300">
              ระบบได้รับคำขอจองของคุณแล้ว กรุณารอแอดมินตรวจสอบรายการจองและการชำระเงิน
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="flex items-center gap-3">
                  <ReceiptText size={24} className="text-slate-500" />
                  <p className="text-sm font-black text-slate-500">
                    Booking Code
                  </p>
                </div>

                <p className="mt-3 break-all text-2xl font-black text-slate-950">
                  {info.bookingCode || "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="flex items-center gap-3">
                  <CalendarCheck size={24} className="text-slate-500" />
                  <p className="text-sm font-black text-slate-500">
                    สถานะรายการ
                  </p>
                </div>

                <p className="mt-3 text-2xl font-black text-amber-600">
                  รอตรวจสอบ
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-sm font-black text-slate-500">
                รายละเอียดเบื้องต้น
              </p>

              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <span className="text-sm font-bold text-slate-500">
                    ห้องพัก
                  </span>
                  <span className="text-right text-sm font-black text-slate-950">
                    {info.roomName || "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <span className="text-sm font-bold text-slate-500">
                    วันที่เข้าพัก
                  </span>
                  <span className="text-right text-sm font-black text-slate-950">
                    {info.checkIn || "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <span className="text-sm font-bold text-slate-500">
                    วันที่ออก
                  </span>
                  <span className="text-right text-sm font-black text-slate-950">
                    {info.checkOut || "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Link
                href="/my-bookings"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800"
              >
                <span className="text-white">ดูการจองของฉัน</span>
                <ArrowRight size={18} className="text-white" />
              </Link>

              <Link
                href="/home"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                <Home size={18} className="text-slate-700" />
                <span className="text-slate-700">กลับหน้าแรก</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}