"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Copy,
  Home,
  Hotel,
  Loader2,
  ReceiptText,
  RefreshCcw,
  SearchCheck,
  ShieldCheck,
  User,
  Wallet,
  XCircle,
} from "lucide-react";

type BookingItem = {
  id: number;
  bookingCode?: string | null;
  lineUserId: string;
  displayName?: string | null;
  pictureUrl?: string | null;
  phone?: string | null;
  note?: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice?: number | null;
  status?: string | null;

  depositAmount?: number | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  paymentSlipUrl?: string | null;
  paymentReference?: string | null;
  paidAt?: string | null;

  createdAt?: string;
  updatedAt?: string;

  roomType?: {
    id: number;
    name: string;
    description?: string | null;
    pricePerNight: number;
    capacity: number;
    imageUrl?: string | null;
  } | null;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatDateTime(dateString?: string | null) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function calculateNights(checkIn?: string, checkOut?: string) {
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

function getBookingStatusInfo(status?: string | null) {
  if (status === "CONFIRMED") {
    return {
      label: "ยืนยันแล้ว",
      description: "แอดมินยืนยันรายการจองแล้ว",
      icon: CheckCircle2,
      badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      cardClass: "border-emerald-200 bg-emerald-50",
      iconClass: "text-emerald-600",
    };
  }

  if (status === "CANCELLED") {
    return {
      label: "ยกเลิกแล้ว",
      description: "รายการจองนี้ถูกยกเลิก",
      icon: XCircle,
      badgeClass: "bg-red-50 text-red-700 ring-red-100",
      cardClass: "border-red-200 bg-red-50",
      iconClass: "text-red-600",
    };
  }

  return {
    label: "รอตรวจสอบ",
    description: "ส่งคำขอจองแล้ว รอแอดมินตรวจสอบ",
    icon: Clock3,
    badgeClass: "bg-amber-50 text-amber-700 ring-amber-100",
    cardClass: "border-amber-200 bg-amber-50",
    iconClass: "text-amber-600",
  };
}

function getPaymentStatusInfo(status?: string | null) {
  if (status === "PAID") {
    return {
      label: "ชำระแล้ว",
      description: "แอดมินตรวจสอบและยืนยันการชำระเงินแล้ว",
      icon: CheckCircle2,
      badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      cardClass: "border-emerald-200 bg-emerald-50",
      iconClass: "text-emerald-600",
    };
  }

  if (status === "REJECTED") {
    return {
      label: "สลิปไม่ถูกต้อง",
      description: "แอดมินปฏิเสธข้อมูลการชำระเงิน กรุณาติดต่อรีสอร์ท",
      icon: XCircle,
      badgeClass: "bg-red-50 text-red-700 ring-red-100",
      cardClass: "border-red-200 bg-red-50",
      iconClass: "text-red-600",
    };
  }

  if (status === "PENDING") {
    return {
      label: "รอตรวจสอบการชำระ",
      description: "แจ้งชำระค่ามัดจำแล้ว รอแอดมินตรวจสอบสลิป",
      icon: Clock3,
      badgeClass: "bg-amber-50 text-amber-700 ring-amber-100",
      cardClass: "border-amber-200 bg-amber-50",
      iconClass: "text-amber-600",
    };
  }

  return {
    label: "ยังไม่ชำระ",
    description: "ยังไม่มีข้อมูลการชำระเงิน",
    icon: ReceiptText,
    badgeClass: "bg-slate-100 text-slate-700 ring-slate-200",
    cardClass: "border-slate-200 bg-slate-50",
    iconClass: "text-slate-600",
  };
}

function getPaymentMethodLabel(method?: string | null) {
  if (method === "PROMPTPAY") return "พร้อมเพย์ QR";
  if (method === "BANK_TRANSFER") return "โอนผ่านธนาคาร";
  if (method === "OTHER") return "อื่น ๆ";
  return method || "-";
}

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const bookingCode = searchParams.get("bookingCode") || "";

  const [booking, setBooking] = useState<BookingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const nights = useMemo(() => {
    return calculateNights(booking?.checkIn, booking?.checkOut);
  }, [booking?.checkIn, booking?.checkOut]);

  const totalPrice = useMemo(() => {
    if (!booking) return 0;

    if (booking.totalPrice) return booking.totalPrice;

    return nights * (booking.roomType?.pricePerNight || 0);
  }, [booking, nights]);

  const depositAmount = useMemo(() => {
    if (!booking) return 0;

    if (booking.depositAmount) return booking.depositAmount;

    return totalPrice > 0 ? Math.max(Math.ceil(totalPrice * 0.3), 500) : 0;
  }, [booking, totalPrice]);

  const remainingAmount = Math.max(totalPrice - depositAmount, 0);

  async function fetchBooking() {
    try {
      setLoading(true);
      setError("");

      if (!bookingCode) {
        setError("ไม่พบรหัสการจอง");
        return;
      }

      const params = new URLSearchParams({
        bookingCode,
      });

      const response = await fetch(`/api/bookings?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        setError("API /api/bookings ยังไม่ส่ง JSON กลับมา");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "ไม่สามารถโหลดข้อมูลการจองได้");
        return;
      }

      const item = Array.isArray(result.data) ? result.data[0] : result.data;

      if (!item) {
        setError("ไม่พบรายการจองนี้");
        return;
      }

      setBooking(item);
    } catch (err) {
      console.warn(err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูลการจอง");
    } finally {
      setLoading(false);
    }
  }

  async function copyBookingCode() {
    try {
      await navigator.clipboard.writeText(bookingCode);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  }

  useEffect(() => {
    fetchBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingCode]);

  const bookingStatusInfo = getBookingStatusInfo(booking?.status);
  const paymentStatusInfo = getPaymentStatusInfo(booking?.paymentStatus);

  const BookingStatusIcon = bookingStatusInfo.icon;
  const PaymentStatusIcon = paymentStatusInfo.icon;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
        <Navbar />

        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-300 sm:rounded-[2.5rem] sm:p-8 lg:p-10">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-emerald-500 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500 blur-3xl" />
          </div>

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-200 ring-1 ring-white/10">
                <CheckCircle2 size={16} className="text-emerald-300" />
                <span className="text-slate-200">Booking Submitted</span>
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                ส่งคำขอจองสำเร็จ
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                ระบบได้รับคำขอจองและข้อมูลการชำระค่ามัดจำแล้ว
                แอดมินจะตรวจสอบรายการจองและสลิปการชำระเงินต่อไป
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/my-bookings"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  <span className="text-white">ดูการจองของฉัน</span>
                  <CalendarCheck size={18} className="text-white" />
                </Link>

                <Link
                  href="/availability"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                >
                  <span className="text-slate-950">เช็กห้องว่างเพิ่ม</span>
                  <SearchCheck size={18} className="text-slate-950" />
                </Link>

                <Link
                  href="/home"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-4 text-sm font-black text-white ring-1 ring-white/15 transition hover:bg-white/20"
                >
                  <span className="text-white">กลับหน้าแรก</span>
                  <Home size={18} className="text-white" />
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/10">
              <p className="text-sm font-bold text-slate-300">Booking Code</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <p className="break-all text-3xl font-black text-white">
                  {bookingCode || "-"}
                </p>

                {bookingCode && (
                  <button
                    type="button"
                    onClick={copyBookingCode}
                    className="inline-flex w-fit items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                  >
                    <Copy size={17} className="text-slate-950" />
                    <span className="text-slate-950">
                      {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                    </span>
                  </button>
                )}
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">
                เก็บรหัสนี้ไว้ใช้ตรวจสอบรายการจอง หรือติดต่อรีสอร์ท
              </p>
            </div>
          </div>
        </section>

        {loading && (
          <section className="mt-5 flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
              <Loader2 size={38} className="animate-spin" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              กำลังโหลดข้อมูลการจอง
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              กรุณารอสักครู่ ระบบกำลังดึงข้อมูลการจองล่าสุด
            </p>
          </section>
        )}

        {!loading && error && (
          <section className="mt-5 rounded-[2rem] border border-red-200 bg-red-50 p-5 shadow-sm sm:rounded-[2.5rem]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <AlertCircle size={28} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-red-700">
                    โหลดข้อมูลไม่สำเร็จ
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-red-600">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchBooking}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
              >
                <RefreshCcw size={18} className="text-white" />
                <span className="text-white">โหลดใหม่</span>
              </button>
            </div>
          </section>
        )}

        {!loading && !error && booking && (
          <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
            <div className="grid gap-5">
              <article className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
                <div className="grid lg:grid-cols-[320px_1fr]">
                  <div className="relative min-h-72 overflow-hidden bg-slate-200">
                    {booking.roomType?.imageUrl ? (
                      <img
                        src={booking.roomType.imageUrl}
                        alt={booking.roomType.name}
                        className="h-full min-h-72 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full min-h-72 w-full items-center justify-center text-slate-400">
                        <Hotel size={46} />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                    <div
                      className={[
                        "absolute left-4 top-4 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black shadow-sm ring-1",
                        bookingStatusInfo.badgeClass,
                      ].join(" ")}
                    >
                      <BookingStatusIcon
                        size={16}
                        className={bookingStatusInfo.iconClass}
                      />
                      {bookingStatusInfo.label}
                    </div>

                    <div
                      className={[
                        "absolute right-4 top-4 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black shadow-sm ring-1",
                        paymentStatusInfo.badgeClass,
                      ].join(" ")}
                    >
                      <PaymentStatusIcon
                        size={16}
                        className={paymentStatusInfo.iconClass}
                      />
                      {paymentStatusInfo.label}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-3xl font-black text-white">
                        {booking.roomType?.name || "ห้องพัก"}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-200">
                        {booking.roomType?.description ||
                          "รายการจองห้องพักของคุณ"}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Booking Code
                        </p>
                        <h2 className="mt-1 break-all text-2xl font-black text-slate-950">
                          {booking.bookingCode || `BOOKING-${booking.id}`}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                          ส่งคำขอเมื่อ {formatDateTime(booking.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 sm:items-end">
                        <div
                          className={[
                            "inline-flex w-fit items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1",
                            bookingStatusInfo.badgeClass,
                          ].join(" ")}
                        >
                          <BookingStatusIcon
                            size={18}
                            className={bookingStatusInfo.iconClass}
                          />
                          {bookingStatusInfo.label}
                        </div>

                        <div
                          className={[
                            "inline-flex w-fit items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1",
                            paymentStatusInfo.badgeClass,
                          ].join(" ")}
                        >
                          <PaymentStatusIcon
                            size={18}
                            className={paymentStatusInfo.iconClass}
                          />
                          {paymentStatusInfo.label}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Check-in
                        </p>
                        <p className="mt-1 font-black text-slate-950">
                          {formatDate(booking.checkIn)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Check-out
                        </p>
                        <p className="mt-1 font-black text-slate-950">
                          {formatDate(booking.checkOut)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Nights
                        </p>
                        <p className="mt-1 font-black text-slate-950">
                          {nights} คืน
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Guests
                        </p>
                        <p className="mt-1 font-black text-slate-950">
                          {booking.guests} คน
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr]">
                      <div className="rounded-[1.5rem] bg-slate-950 p-4 text-white">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                              ราคารวม
                            </p>
                            <p className="mt-1 text-2xl font-black text-white">
                              {formatCurrency(totalPrice)}
                            </p>
                          </div>

                          <Wallet size={26} className="text-white" />
                        </div>
                      </div>

                      <div
                        className={[
                          "rounded-[1.5rem] border p-4",
                          paymentStatusInfo.cardClass,
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              ค่ามัดจำ
                            </p>
                            <p className="mt-1 text-2xl font-black text-slate-950">
                              {formatCurrency(depositAmount)}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-600">
                              {paymentStatusInfo.description}
                            </p>
                          </div>

                          <ReceiptText
                            size={26}
                            className={paymentStatusInfo.iconClass}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Payment Details
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            ยอดคงเหลือ
                          </p>
                          <p className="mt-1 font-black text-slate-950">
                            {formatCurrency(remainingAmount)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            วิธีชำระเงิน
                          </p>
                          <p className="mt-1 font-black text-slate-950">
                            {getPaymentMethodLabel(booking.paymentMethod)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            เลขอ้างอิง
                          </p>
                          <p className="mt-1 break-all font-black text-slate-950">
                            {booking.paymentReference || "-"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Paid At
                          </p>
                          <p className="mt-1 font-black text-slate-950">
                            {formatDateTime(booking.paidAt)}
                          </p>
                        </div>
                      </div>

                      {booking.paymentSlipUrl && (
                        <a
                          href={booking.paymentSlipUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800"
                        >
                          <span className="text-white">เปิดดูสลิปที่แนบ</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <aside className="h-fit rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-6 xl:sticky xl:top-28">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-600 text-white">
                <ShieldCheck size={30} className="text-white" />
              </div>

              <h2 className="mt-5 text-2xl font-black text-slate-950">
                ขั้นตอนต่อไป
              </h2>

              <div className="mt-5 grid gap-3">
                <div
                  className={[
                    "rounded-2xl border p-4",
                    paymentStatusInfo.cardClass,
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <PaymentStatusIcon
                      size={24}
                      className={paymentStatusInfo.iconClass}
                    />
                    <div>
                      <p className="font-black text-slate-950">
                        {paymentStatusInfo.label}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {paymentStatusInfo.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={[
                    "rounded-2xl border p-4",
                    bookingStatusInfo.cardClass,
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <BookingStatusIcon
                      size={24}
                      className={bookingStatusInfo.iconClass}
                    />
                    <div>
                      <p className="font-black text-slate-950">
                        {bookingStatusInfo.label}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {bookingStatusInfo.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/my-bookings"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
              >
                <CalendarCheck size={18} className="text-white" />
                <span className="text-white">ดูการจองของฉัน</span>
              </Link>

              <Link
                href="/rooms"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800"
              >
                <BedDouble size={18} className="text-white" />
                <span className="text-white">ดูห้องพักอื่น</span>
              </Link>
            </aside>
          </section>
        )}

        <footer className="mt-5 rounded-[2rem] bg-white px-6 py-5 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          Booking Success • Resort Booking System
        </footer>
      </section>
    </main>
  );
}