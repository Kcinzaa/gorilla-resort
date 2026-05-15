"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Banknote,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  Hotel,
  Loader2,
  Phone,
  ReceiptText,
  RefreshCcw,
  Search,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1MztrFvab7qaRd4jB3jaLAWGhlWd8s6Bhgew1xYQqdkY/edit?usp=sharing";
const GOOGLE_APPS_SCRIPT_WEBHOOK = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL || GOOGLE_SHEET_URL;

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
type PaymentStatus = "UNPAID" | "PENDING" | "PAID" | "REJECTED";

type BookingItem = {
  id: number;
  bookingCode?: string | null;
  lineUserId?: string;
  displayName?: string | null;
  pictureUrl?: string | null;
  phone?: string | null;
  note?: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  roomCount?: number | null;
  totalPrice?: number | null;
  status: BookingStatus | string;
  createdAt?: string;
  updatedAt?: string;

  paymentStatus?: PaymentStatus | string | null;
  paymentMethod?: string | null;
  paymentSlipUrl?: string | null;
  paidAt?: string | null;

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

function formatDate(dateString?: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

function formatDateTime(dateString?: string | null) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function calculateNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diff = end.getTime() - start.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getStatusInfo(status?: string) {
  if (status === "CONFIRMED") {
    return { label: "ยืนยันแล้ว", icon: CheckCircle2, badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-100", iconClass: "text-emerald-600", cardClass: "border-emerald-200" };
  }
  if (status === "CANCELLED") {
    return { label: "ยกเลิกแล้ว", icon: XCircle, badgeClass: "bg-red-50 text-red-700 ring-red-100", iconClass: "text-red-600", cardClass: "border-red-200" };
  }
  return { label: "รอตรวจสอบ", icon: Clock3, badgeClass: "bg-amber-50 text-amber-700 ring-amber-100", iconClass: "text-amber-600", cardClass: "border-amber-200" };
}

function getPaymentStatusInfo(status?: string | null) {
  if (status === "PAID") {
    return { label: "ชำระแล้ว", description: "แอดมินตรวจสอบและยืนยันการชำระเงินแล้ว", icon: CheckCircle2, badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-100", iconClass: "text-emerald-600", cardClass: "border-emerald-200 bg-emerald-50" };
  }
  if (status === "REJECTED") {
    return { label: "ปฏิเสธสลิป", description: "ข้อมูลสลิปไม่ถูกต้อง", icon: XCircle, badgeClass: "bg-red-50 text-red-700 ring-red-100", iconClass: "text-red-600", cardClass: "border-red-200 bg-red-50" };
  }
  if (status === "PENDING") {
    return { label: "แจ้งชำระแล้ว", description: "ลูกค้าแนบสลิปแล้ว ใช้ปุ่มยืนยันห้องหรือไม่ยืนยันห้อง", icon: Clock3, badgeClass: "bg-amber-50 text-amber-700 ring-amber-100", iconClass: "text-amber-600", cardClass: "border-amber-200 bg-amber-50" };
  }
  return { label: "ยังไม่ชำระ", description: "ยังไม่มีข้อมูลการชำระเงิน", icon: CreditCard, badgeClass: "bg-slate-100 text-slate-700 ring-slate-200", iconClass: "text-slate-600", cardClass: "border-slate-200 bg-slate-50" };
}

function getPaymentMethodLabel(method?: string | null) {
  if (method === "BANK_TRANSFER") return "โอนผ่านธนาคาร";
  if (method === "PROMPTPAY") return "พร้อมเพย์";
  if (method === "OTHER") return "อื่น ๆ";
  return method || "-";
}

function toArray<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.bookings)) return payload.bookings;
  if (Array.isArray(payload?.data?.bookings)) return payload.data.bookings;
  return [];
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | BookingStatus>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | PaymentStatus>("ALL");
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const pendingCount = useMemo(() => bookings.filter((b) => b.status === "PENDING").length, [bookings]);
  const confirmedCount = useMemo(() => bookings.filter((b) => b.status === "CONFIRMED").length, [bookings]);
  const cancelledCount = useMemo(() => bookings.filter((b) => b.status === "CANCELLED").length, [bookings]);
  const paymentPendingCount = useMemo(() => bookings.filter((b) => b.paymentStatus === "PENDING").length, [bookings]);
  const paidCount = useMemo(() => bookings.filter((b) => b.paymentStatus === "PAID").length, [bookings]);

  const filteredBookings = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchStatus = statusFilter === "ALL" || booking.status === statusFilter;
      const matchPayment = paymentFilter === "ALL" || booking.paymentStatus === paymentFilter;
      const searchableText = [booking.bookingCode, booking.displayName, booking.phone, booking.roomType?.name, booking.status, booking.paymentStatus, booking.paymentMethod]
        .filter(Boolean).join(" ").toLowerCase();
      const matchKeyword = !normalizedKeyword || searchableText.includes(normalizedKeyword);
      return matchStatus && matchPayment && matchKeyword;
    });
  }, [bookings, keyword, statusFilter, paymentFilter]);

  function applyBookingsUpdate(nextBookings: BookingItem[]) {
    setBookings(nextBookings);
  }

  async function fetchBookings(options?: { silent?: boolean }) {
    try {
      if (!options?.silent) setLoading(true);
      setError("");

      const response = await fetch("/api/admin/bookings", { method: "GET", cache: "no-store", credentials: "include" });
      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        setError("API /api/admin/bookings ยังไม่ส่ง JSON กลับมา");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "ไม่สามารถโหลดรายการจองได้");
        return;
      }

      applyBookingsUpdate(toArray<BookingItem>(result));
    } catch (err) {
      console.warn(err);
      if (!options?.silent) setError("เกิดข้อผิดพลาดในการโหลดรายการจอง");
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }

  async function updateBookingStatus(id: number, status: BookingStatus) {
    try {
      setUpdatingId(id);
      setError("");

      const response = await fetch("/api/admin/bookings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "ไม่สามารถอัปเดตสถานะได้");
        return;
      }

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === id ? { ...booking, status, updatedAt: new Date().toISOString() } : booking,
        ),
      );
    } catch (err) {
      console.warn(err);
      setError("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    } finally {
      setUpdatingId(null);
    }
  }

  async function syncToSheets(options?: { silent?: boolean }) {
    try {
      if (!options?.silent) setSyncingSheets(true);
      setSyncMessage("");
      const res = await fetch("/api/admin/sync-google-sheets", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      const result = await res.json();
      if (!options?.silent) {
        if (result.ok) {
          setSyncMessage(`✓ ซิงก์สำเร็จ ${result.count ?? ""} รายการ`);
        } else {
          setSyncMessage(`✗ ${result.message || "ซิงก์ไม่สำเร็จ"}`);
        }
      }
    } catch {
      if (!options?.silent) setSyncMessage("✗ เกิดข้อผิดพลาด");
    } finally {
      if (!options?.silent) {
        setSyncingSheets(false);
        setTimeout(() => setSyncMessage(""), 5000);
      }
    }
  }

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-sync Google Sheets ทุก 60 วินาที (silent — ไม่แสดง UI)
  useEffect(() => {
    syncToSheets({ silent: true });
    const timer = window.setInterval(() => {
      syncToSheets({ silent: true });
    }, 60000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-slate-900">รายการจอง</h1>
        <div className="flex flex-wrap items-center gap-2">
          {syncMessage && (
            <span className={`text-sm font-bold ${syncMessage.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}>
              {syncMessage}
            </span>
          )}
          <button
            onClick={syncToSheets}
            disabled={syncingSheets}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60 active:scale-95"
          >
            {syncingSheets ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCcw size={16} />
            )}
            {syncingSheets ? "กำลังซิงก์..." : "Sync Google Sheet"}
          </button>
          <a
            href={GOOGLE_SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
          >
            <ExternalLink size={16} />
            เปิด Sheet
          </a>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 ring-1 ring-amber-100">
            <Clock3 size={22} className="text-amber-600" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-500">รอตรวจสอบการจอง</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{pendingCount}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
            <CheckCircle2 size={22} className="text-emerald-600" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-500">ยืนยันแล้ว</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{confirmedCount}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 ring-1 ring-red-100">
            <XCircle size={22} className="text-red-600" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-500">ยกเลิก</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{cancelledCount}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
            <Banknote size={22} className="text-emerald-600" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-500">ชำระแล้ว</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{paidCount}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 ring-1 ring-amber-100">
            <ReceiptText size={22} className="text-amber-600" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-500">รอตรวจสลิป</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{paymentPendingCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto_auto] xl:items-center">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, รหัสจอง, ห้องพัก..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | BookingStatus)}
            className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
          >
            <option value="ALL">ทุกสถานะจอง</option>
            <option value="PENDING">รอตรวจสอบ</option>
            <option value="CONFIRMED">ยืนยันแล้ว</option>
            <option value="CANCELLED">ยกเลิกแล้ว</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as "ALL" | PaymentStatus)}
            className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
          >
            <option value="ALL">ทุกสถานะชำระเงิน</option>
            <option value="UNPAID">ยังไม่ชำระ</option>
            <option value="PENDING">แจ้งชำระแล้ว</option>
            <option value="PAID">ชำระแล้ว</option>
            <option value="REJECTED">ปฏิเสธสลิป</option>
          </select>

          <button
            type="button"
            onClick={() => fetchBookings()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <RefreshCcw size={16} />
            โหลดใหม่
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-5 flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="font-black text-red-700">เกิดข้อผิดพลาด</p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <Loader2 size={36} className="animate-spin text-emerald-600" />
          <p className="mt-4 font-bold text-slate-600">กำลังโหลดรายการจอง...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && filteredBookings.length === 0 && (
        <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <CalendarCheck size={40} className="text-slate-300" />
          <p className="mt-4 font-black text-slate-700">ไม่พบรายการจอง</p>
          <p className="mt-1 text-sm text-slate-500">ยังไม่มีรายการจอง หรือไม่มีรายการที่ตรงกับเงื่อนไขการค้นหา</p>
        </div>
      )}

      {/* Booking list */}
      {!loading && filteredBookings.length > 0 && (
        <div className="mt-6 grid gap-5">
          {filteredBookings.map((booking) => {
            const statusInfo = getStatusInfo(booking.status);
            const paymentInfo = getPaymentStatusInfo(booking.paymentStatus);
            const StatusIcon = statusInfo.icon;
            const PaymentIcon = paymentInfo.icon;
            const nights = calculateNights(booking.checkIn, booking.checkOut);
            const estimatedTotal =
              booking.totalPrice ||
              (booking.roomType?.pricePerNight || 0) * nights * Math.max(Number(booking.roomCount || 1), 1);

            return (
              <article
                key={booking.id}
                className={["overflow-hidden rounded-2xl border bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md", statusInfo.cardClass].join(" ")}
              >
                <div className="grid lg:grid-cols-[300px_1fr]">
                  {/* Room image */}
                  <div className="relative min-h-56 overflow-hidden bg-slate-200">
                    {booking.roomType?.imageUrl ? (
                      <img src={booking.roomType.imageUrl} alt={booking.roomType.name} className="h-full min-h-56 w-full object-cover" />
                    ) : (
                      <div className="flex h-full min-h-56 w-full items-center justify-center text-slate-400">
                        <Hotel size={40} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                    <div className={["absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black shadow-sm ring-1", statusInfo.badgeClass].join(" ")}>
                      <StatusIcon size={14} className={statusInfo.iconClass} />
                      {statusInfo.label}
                    </div>

                    <div className={["absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black shadow-sm ring-1", paymentInfo.badgeClass].join(" ")}>
                      <PaymentIcon size={14} className={paymentInfo.iconClass} />
                      {paymentInfo.label}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-xl font-black text-white">{booking.roomType?.name || "ห้องพัก"}</p>
                      <p className="mt-0.5 text-sm text-slate-300">สร้างเมื่อ {formatDateTime(booking.createdAt)}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Booking Code</p>
                        <h2 className="mt-0.5 break-all text-xl font-black text-slate-900">
                          {booking.bookingCode || `BOOKING-${booking.id}`}
                        </h2>

                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
                            {booking.pictureUrl ? (
                              <img src={booking.pictureUrl} alt={booking.displayName || "customer"} className="h-full w-full object-cover" />
                            ) : (
                              <Users size={20} />
                            )}
                          </div>
                          <div>
                            <p className="font-black text-slate-900">{booking.displayName || "ลูกค้า"}</p>
                            <p className="text-sm text-slate-500">LINE Customer</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:items-end">
                        <div className={["inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-black ring-1", statusInfo.badgeClass].join(" ")}>
                          <StatusIcon size={16} className={statusInfo.iconClass} />
                          {statusInfo.label}
                        </div>
                        <div className={["inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-black ring-1", paymentInfo.badgeClass].join(" ")}>
                          <PaymentIcon size={16} className={paymentInfo.iconClass} />
                          {paymentInfo.label}
                        </div>
                      </div>
                    </div>

                    {/* Date/count grid */}
                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      {[
                        { label: "Check-in", value: formatDate(booking.checkIn) },
                        { label: "Check-out", value: formatDate(booking.checkOut) },
                        { label: "จำนวนห้อง", value: `${Math.max(Number(booking.roomCount || 1), 1)} ห้อง` },
                        { label: "Nights", value: `${nights} คืน` },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</p>
                          <p className="mt-1 font-black text-slate-900">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Price + phone */}
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center justify-between rounded-xl bg-slate-900 p-4 text-white">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">ราคารวม</p>
                          <p className="mt-0.5 text-2xl font-black">{estimatedTotal > 0 ? formatCurrency(estimatedTotal) : "-"}</p>
                        </div>
                        <Wallet size={24} className="text-slate-400" />
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Phone size={16} />
                          <span className="text-xs font-bold uppercase tracking-wide">เบอร์โทร</span>
                        </div>
                        <p className="mt-2 font-black text-slate-900">{booking.phone || "-"}</p>
                      </div>
                    </div>

                    {/* Payment section */}
                    <div className={["mt-4 rounded-xl border p-4", paymentInfo.cardClass].join(" ")}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Full Payment</p>
                          <p className="mt-0.5 text-xl font-black text-slate-900">{estimatedTotal > 0 ? formatCurrency(estimatedTotal) : "-"}</p>
                          <p className="mt-0.5 text-sm text-slate-600">{paymentInfo.description}</p>
                        </div>
                        <div className={["inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-black ring-1", paymentInfo.badgeClass].join(" ")}>
                          <PaymentIcon size={16} className={paymentInfo.iconClass} />
                          {paymentInfo.label}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {[
                          { label: "ยอดชำระ", value: estimatedTotal > 0 ? formatCurrency(estimatedTotal) : "-" },
                          { label: "วิธีชำระเงิน", value: getPaymentMethodLabel(booking.paymentMethod) },
                          { label: "Paid At", value: formatDateTime(booking.paidAt || booking.createdAt || booking.updatedAt) },
                        ].map((item) => (
                          <div key={item.label} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</p>
                            <p className="mt-1 font-bold text-slate-900">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Payment slip */}
                      <div className="mt-4">
                        {booking.paymentSlipUrl ? (
                          <div className="grid gap-3">
                            <div className="overflow-hidden rounded-xl bg-white p-3 ring-1 ring-slate-200">
                              <p className="mb-3 text-sm font-black text-slate-700">รูปสลิปที่ลูกค้าแนบ</p>
                              <img src={booking.paymentSlipUrl} alt="Payment slip" className="max-h-52 w-full rounded-lg object-contain" />
                              <p className="mt-2 break-all text-xs text-slate-500">{booking.paymentSlipUrl}</p>
                            </div>
                            <a href={booking.paymentSlipUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-700">
                              เปิดดูสลิปแบบเต็ม
                            </a>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center rounded-xl bg-slate-100 py-4 text-sm font-bold text-slate-500">
                            ไม่มีลิงก์สลิป
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Note */}
                    {booking.note && (
                      <div className="mt-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">หมายเหตุ</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{booking.note}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={updatingId === booking.id || booking.status === "CONFIRMED"}
                        onClick={() => updateBookingStatus(booking.id, "CONFIRMED")}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingId === booking.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        ยืนยันการจอง
                      </button>

                      <button
                        type="button"
                        disabled={updatingId === booking.id || booking.status === "CANCELLED"}
                        onClick={() => updateBookingStatus(booking.id, "CANCELLED")}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingId === booking.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                        ไม่ยืนยันห้อง
                      </button>

                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-700"
                      >
                        ดูรายละเอียด
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
