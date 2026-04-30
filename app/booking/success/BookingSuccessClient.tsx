"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  CreditCard,
  Home,
  Loader2,
  MessageCircle,
  ReceiptText,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

type SuccessInfo = {
  bookingCode: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  totalPrice: string;
  depositAmount: string;
  paymentStatus: string;
  bookingStatus: string;
};

function formatDate(dateText: string) {
  if (!dateText) return "-";

  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) {
    return dateText;
  }

  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatCurrencyFromText(value: string) {
  const amount = Number(value);

  if (!value || Number.isNaN(amount)) {
    return "-";
  }

  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;

  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diff = end.getTime() - start.getTime();

  if (diff <= 0) return 0;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getPaymentLabel(status: string) {
  if (status === "PAID") return "ชำระแล้ว";
  if (status === "REJECTED") return "สลิปไม่ผ่าน";
  if (status === "PENDING") return "รอตรวจสลิป";
  return "รอตรวจสอบ";
}

function getBookingLabel(status: string) {
  if (status === "CONFIRMED") return "ยืนยันแล้ว";
  if (status === "CANCELLED") return "ยกเลิกแล้ว";
  return "รอแอดมินยืนยัน";
}

export default function BookingSuccessClient() {
  const [info, setInfo] = useState<SuccessInfo>({
    bookingCode: "",
    roomName: "",
    checkIn: "",
    checkOut: "",
    guests: "",
    totalPrice: "",
    depositAmount: "",
    paymentStatus: "",
    bookingStatus: "",
  });

  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setInfo({
      bookingCode: params.get("bookingCode") || params.get("code") || "",
      roomName: params.get("roomName") || params.get("room") || "",
      checkIn: params.get("checkIn") || "",
      checkOut: params.get("checkOut") || "",
      guests: params.get("guests") || "",
      totalPrice: params.get("totalPrice") || "",
      depositAmount: params.get("depositAmount") || "",
      paymentStatus: params.get("paymentStatus") || "PENDING",
      bookingStatus: params.get("status") || "PENDING",
    });

    setMounted(true);
  }, []);

  const nights = useMemo(() => {
    return calculateNights(info.checkIn, info.checkOut);
  }, [info.checkIn, info.checkOut]);

  async function copyBookingCode() {
    if (!info.bookingCode) return;

    try {
      await navigator.clipboard.writeText(info.bookingCode);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch (error) {
      console.warn(error);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-4 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-300 sm:rounded-[3rem] sm:p-8 lg:p-10">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-500 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500 blur-3xl" />
            <div className="absolute right-1/3 top-1/3 h-72 w-72 rounded-full bg-amber-400 blur-3xl" />
          </div>

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-black text-emerald-200 ring-1 ring-emerald-300/20">
                <CheckCircle2 size={18} className="text-emerald-200" />
                <span className="text-emerald-200">Booking Request Sent</span>
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                ส่งคำขอจองสำเร็จ
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                ระบบได้รับคำขอจองของคุณเรียบร้อยแล้ว กรุณารอแอดมินตรวจสอบข้อมูล
                ยืนยันห้องพัก และตรวจสอบการชำระค่ามัดจำ
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/my-bookings"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl"
                >
                  <span className="text-white">ดูการจองของฉัน</span>
                  <ArrowRight size={18} className="text-white" />
                </Link>

                <Link
                  href="/home"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-xl"
                >
                  <Home size={18} className="text-slate-950" />
                  <span className="text-slate-950">กลับหน้าแรก</span>
                </Link>

                <Link
                  href="/rooms"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-4 text-sm font-black text-white ring-1 ring-white/15 transition hover:-translate-y-0.5 hover:bg-white/20"
                >
                  <BedDouble size={18} className="text-white" />
                  <span className="text-white">ดูห้องพักเพิ่ม</span>
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur sm:p-5">
              <div className="rounded-[1.5rem] bg-white p-5 text-slate-950 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Booking Code
                    </p>

                    <p className="mt-2 break-all text-3xl font-black text-slate-950">
                      {mounted ? info.bookingCode || "-" : "-"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={copyBookingCode}
                    disabled={!info.bookingCode}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="copy booking code"
                  >
                    {copied ? (
                      <CheckCircle2 size={22} className="text-white" />
                    ) : (
                      <Copy size={22} className="text-white" />
                    )}
                  </button>
                </div>

                <div className="mt-5 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                  <div className="flex items-center gap-3">
                    <BadgeCheck size={24} className="text-emerald-600" />
                    <div>
                      <p className="font-black text-emerald-700">
                        {copied ? "คัดลอกรหัสแล้ว" : "เก็บรหัสนี้ไว้เพื่อตรวจสอบ"}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-emerald-700">
                        ใช้รหัสนี้เมื่อติดต่อรีสอร์ทหรือเช็กสถานะการจอง
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <span className="text-sm font-bold text-slate-500">
                      สถานะการจอง
                    </span>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-black text-amber-700 ring-1 ring-amber-100">
                      {getBookingLabel(info.bookingStatus)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <span className="text-sm font-bold text-slate-500">
                      สถานะชำระเงิน
                    </span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-black text-blue-700 ring-1 ring-blue-100">
                      {getPaymentLabel(info.paymentStatus)}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-5">
            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-7">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
                    Reservation Summary
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">
                    สรุปรายละเอียดการจอง
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    ตรวจสอบข้อมูลเบื้องต้นของรายการจองก่อนรอแอดมินยืนยัน
                  </p>
                </div>

                {!mounted && (
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-500">
                    <Loader2 size={18} className="animate-spin" />
                    กำลังโหลด...
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1.5rem] bg-slate-50 p-5 ring-1 ring-slate-200">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                    <BedDouble size={24} className="text-blue-600" />
                  </div>
                  <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-500">
                    ห้องพัก
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-950">
                    {info.roomName || "-"}
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-slate-50 p-5 ring-1 ring-slate-200">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                    <CalendarCheck size={24} className="text-emerald-600" />
                  </div>
                  <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-500">
                    วันที่เข้าพัก
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-950">
                    {formatDate(info.checkIn)}
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-slate-50 p-5 ring-1 ring-slate-200">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                    <Clock3 size={24} className="text-amber-600" />
                  </div>
                  <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-500">
                    วันที่ออก
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-950">
                    {formatDate(info.checkOut)}
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-slate-50 p-5 ring-1 ring-slate-200">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                    <Sparkles size={24} className="text-violet-600" />
                  </div>
                  <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-500">
                    จำนวนคืน
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-950">
                    {nights > 0 ? `${nights} คืน` : "-"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        ยอดรวม
                      </p>
                      <p className="mt-2 text-2xl font-black text-white">
                        {formatCurrencyFromText(info.totalPrice)}
                      </p>
                    </div>
                    <Wallet size={26} className="text-white" />
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-emerald-50 p-5 ring-1 ring-emerald-100">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                        ค่ามัดจำ
                      </p>
                      <p className="mt-2 text-2xl font-black text-emerald-700">
                        {formatCurrencyFromText(info.depositAmount)}
                      </p>
                    </div>
                    <CreditCard size={26} className="text-emerald-600" />
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-slate-50 p-5 ring-1 ring-slate-200">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                        ผู้เข้าพัก
                      </p>
                      <p className="mt-2 text-2xl font-black text-slate-950">
                        {info.guests ? `${info.guests} คน` : "-"}
                      </p>
                    </div>
                    <BedDouble size={26} className="text-slate-500" />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-7">
              <div className="mb-6">
                <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
                  Next Steps
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  ขั้นตอนถัดไป
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  หลังจากส่งคำขอจองแล้ว ระบบจะเข้าสู่ขั้นตอนตรวจสอบโดยแอดมิน
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 ring-1 ring-emerald-100">
                    <CheckCircle2 size={24} className="text-emerald-600" />
                  </div>
                  <h3 className="mt-4 font-black text-slate-950">
                    1. รับคำขอแล้ว
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    ระบบบันทึกข้อมูลการจองและหลักฐานการชำระเงินเรียบร้อย
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-amber-600 ring-1 ring-amber-100">
                    <ShieldCheck size={24} className="text-amber-600" />
                  </div>
                  <h3 className="mt-4 font-black text-slate-950">
                    2. แอดมินตรวจสอบ
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    แอดมินจะตรวจสอบห้องว่าง สลิป และรายละเอียดการเข้าพัก
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 ring-1 ring-blue-100">
                    <MessageCircle size={24} className="text-blue-600" />
                  </div>
                  <h3 className="mt-4 font-black text-slate-950">
                    3. แจ้งผลยืนยัน
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    ลูกค้าสามารถเข้าหน้า “การจองของฉัน” เพื่อติดตามสถานะล่าสุด
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-6 lg:sticky lg:top-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-white">
              <ReceiptText size={30} className="text-white" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              เมนูลัด
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              เลือกเมนูที่ต้องการทำต่อหลังส่งคำขอจอง
            </p>

            <div className="mt-5 grid gap-3">
              <Link
                href="/my-bookings"
                className="group flex items-center justify-between gap-3 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800"
              >
                <span className="text-white">ดูการจองของฉัน</span>
                <ChevronRight
                  size={18}
                  className="text-white transition group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/availability"
                className="group flex items-center justify-between gap-3 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
              >
                <span className="text-white">เช็กห้องว่างเพิ่ม</span>
                <SearchCheck
                  size={18}
                  className="text-white transition group-hover:scale-110"
                />
              </Link>

              <Link
                href="/rooms"
                className="group flex items-center justify-between gap-3 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                <span className="text-slate-700">ดูห้องพักทั้งหมด</span>
                <BedDouble
                  size={18}
                  className="text-slate-700 transition group-hover:scale-110"
                />
              </Link>

              <Link
                href="/home"
                className="group flex items-center justify-between gap-3 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                <span className="text-slate-700">กลับหน้าแรก</span>
                <Home
                  size={18}
                  className="text-slate-700 transition group-hover:scale-110"
                />
              </Link>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-amber-50 p-5 ring-1 ring-amber-100">
              <div className="flex items-start gap-3">
                <Clock3 size={24} className="text-amber-600" />
                <div>
                  <p className="font-black text-amber-700">
                    รอการยืนยันจากแอดมิน
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-700">
                    รายการนี้ยังไม่ถือว่ายืนยันสมบูรณ์จนกว่าแอดมินจะตรวจสอบและอัปเดตสถานะ
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <footer className="mt-5 rounded-[2rem] bg-white px-6 py-5 text-center text-sm font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
          Booking Success • Resort Booking System
        </footer>
      </section>
    </main>
  );
}
