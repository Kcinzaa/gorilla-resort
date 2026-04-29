"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  Home,
  Hotel,
  LayoutDashboard,
  Loader2,
  LogOut,
  Phone,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  User,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

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
  totalPrice?: number | null;
  status: BookingStatus | string;
  createdAt?: string;
  updatedAt?: string;

  depositAmount?: number | null;
  paymentStatus?: PaymentStatus | string | null;
  paymentMethod?: string | null;
  paymentSlipUrl?: string | null;
  paymentReference?: string | null;
  paidAt?: string | null;

  roomType?: {
    id: number;
    name: string;
    description?: string | null;
    pricePerNight: number;
    capacity: number;
    totalRooms?: number | null;
    imageUrl?: string | null;
    isActive?: boolean;
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

function getStatusInfo(status?: string | null) {
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
    description: "รอแอดมินตรวจสอบและยืนยันรายการ",
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
      label: "ปฏิเสธสลิป",
      description: "ข้อมูลสลิปหรือเลขอ้างอิงไม่ถูกต้อง",
      icon: XCircle,
      badgeClass: "bg-red-50 text-red-700 ring-red-100",
      cardClass: "border-red-200 bg-red-50",
      iconClass: "text-red-600",
    };
  }

  if (status === "PENDING") {
    return {
      label: "รอตรวจสลิป",
      description: "ลูกค้าแจ้งชำระเงินแล้ว รอแอดมินตรวจสอบ",
      icon: Clock3,
      badgeClass: "bg-amber-50 text-amber-700 ring-amber-100",
      cardClass: "border-amber-200 bg-amber-50",
      iconClass: "text-amber-600",
    };
  }

  return {
    label: "ยังไม่ชำระ",
    description: "ยังไม่มีข้อมูลการชำระเงิน",
    icon: CreditCard,
    badgeClass: "bg-slate-100 text-slate-700 ring-slate-200",
    cardClass: "border-slate-200 bg-slate-50",
    iconClass: "text-slate-600",
  };
}

function getPaymentMethodLabel(method?: string | null) {
  if (method === "BANK_TRANSFER") return "โอนผ่านธนาคาร";
  if (method === "PROMPTPAY") return "พร้อมเพย์ QR";
  if (method === "OTHER") return "อื่น ๆ";
  return method || "-";
}

export default function AdminBookingDetailPage() {
  const params = useParams();
  const router = useRouter();

  const bookingId = String(params?.id || "");

  const [booking, setBooking] = useState<BookingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
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

      const token = localStorage.getItem("adminToken");

      if (!token) {
        router.push("/admin/login");
        return;
      }

      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "GET",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        setError("API รายละเอียดรายการจองยังไม่ส่ง JSON กลับมา");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "ไม่สามารถโหลดรายละเอียดรายการจองได้");
        return;
      }

      setBooking(result.data);
    } catch (err) {
      console.warn(err);
      setError("เกิดข้อผิดพลาดในการโหลดรายละเอียดรายการจอง");
    } finally {
      setLoading(false);
    }
  }

  async function updateBooking(data: {
    status?: BookingStatus;
    paymentStatus?: PaymentStatus;
  }) {
    try {
      setUpdating(true);
      setError("");

      const token = localStorage.getItem("adminToken");

      if (!token) {
        router.push("/admin/login");
        return;
      }

      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        setError("API รายละเอียดรายการจองยังไม่ส่ง JSON กลับมา");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "ไม่สามารถอัปเดตรายการจองได้");
        return;
      }

      setBooking(result.data);
    } catch (err) {
      console.warn(err);
      setError("เกิดข้อผิดพลาดในการอัปเดตรายการจอง");
    } finally {
      setUpdating(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("adminToken");
    router.push("/admin/login");
    router.refresh();
  }

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const statusInfo = getStatusInfo(booking?.status);
  const paymentInfo = getPaymentStatusInfo(booking?.paymentStatus);

  const StatusIcon = statusInfo.icon;
  const PaymentIcon = paymentInfo.icon;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
        <header className="sticky top-3 z-40 mb-5 rounded-[1.5rem] bg-white/95 px-4 py-3 shadow-sm ring-1 ring-slate-200 backdrop-blur-xl sm:top-4 sm:rounded-[2rem] sm:px-5 sm:py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <ReceiptText size={25} className="text-white" />
              </div>

              <div>
                <h1 className="text-lg font-black text-slate-950">
                  Booking Detail
                </h1>
                <p className="text-sm text-slate-500">
                  รายละเอียดรายการจองและการชำระเงิน
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap gap-2">
              <Link
                href="/admin/bookings"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                <ArrowLeft size={17} className="text-white" />
                <span className="text-white">กลับรายการจอง</span>
              </Link>

              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                <LayoutDashboard size={17} className="text-slate-700" />
                <span className="text-slate-700">Dashboard</span>
              </Link>

              <Link
                href="/admin/rooms"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                <BedDouble size={17} className="text-slate-700" />
                <span className="text-slate-700">Rooms</span>
              </Link>

              <Link
                href="/home"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                <Home size={17} className="text-slate-700" />
                <span className="text-slate-700">หน้าเว็บ</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700 ring-1 ring-red-100 transition hover:bg-red-100"
              >
                <LogOut size={17} className="text-red-700" />
                <span className="text-red-700">Logout</span>
              </button>
            </nav>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-300 sm:rounded-[2.5rem] sm:p-8 lg:p-10">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-emerald-500 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500 blur-3xl" />
            <div className="absolute right-1/3 top-1/3 h-72 w-72 rounded-full bg-amber-400 blur-3xl" />
          </div>

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-200 ring-1 ring-white/10">
                <ShieldCheck size={16} className="text-slate-200" />
                <span className="text-slate-200">Admin Review</span>
              </div>

              <h2 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                ตรวจสอบรายละเอียดรายการจอง
              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                ตรวจสอบข้อมูลลูกค้า ห้องพัก วันที่เข้าพัก ยอดชำระ
                และหลักฐานการโอนค่ามัดจำ ก่อนอัปเดตสถานะ
              </p>
            </div>

            <div className="rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/10">
              <p className="text-sm font-bold text-slate-300">Booking Code</p>
              <p className="mt-3 break-all text-3xl font-black text-white">
                {booking?.bookingCode || `BOOKING-${bookingId}`}
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                ใช้สำหรับตรวจสอบรายการจองและติดต่อกับลูกค้า
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
              กำลังโหลดรายละเอียดรายการจอง
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              กรุณารอสักครู่ ระบบกำลังดึงข้อมูลล่าสุด
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
                    เกิดข้อผิดพลาด
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
          <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
            <div className="grid gap-5">
              <article className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
                <div className="grid lg:grid-cols-[360px_1fr]">
                  <div className="relative min-h-80 overflow-hidden bg-slate-200">
                    {booking.roomType?.imageUrl ? (
                      <img
                        src={booking.roomType.imageUrl}
                        alt={booking.roomType.name}
                        className="h-full min-h-80 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full min-h-80 w-full items-center justify-center text-slate-400">
                        <Hotel size={48} />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                    <div
                      className={[
                        "absolute left-4 top-4 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black shadow-sm ring-1",
                        statusInfo.badgeClass,
                      ].join(" ")}
                    >
                      <StatusIcon size={16} className={statusInfo.iconClass} />
                      {statusInfo.label}
                    </div>

                    <div
                      className={[
                        "absolute right-4 top-4 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black shadow-sm ring-1",
                        paymentInfo.badgeClass,
                      ].join(" ")}
                    >
                      <PaymentIcon
                        size={16}
                        className={paymentInfo.iconClass}
                      />
                      {paymentInfo.label}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-3xl font-black text-white">
                        {booking.roomType?.name || "ห้องพัก"}
                      </p>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-200">
                        {booking.roomType?.description ||
                          "รายการจองห้องพักของลูกค้า"}
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
                          สร้างเมื่อ {formatDateTime(booking.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 sm:items-end">
                        <div
                          className={[
                            "inline-flex w-fit items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1",
                            statusInfo.badgeClass,
                          ].join(" ")}
                        >
                          <StatusIcon
                            size={18}
                            className={statusInfo.iconClass}
                          />
                          {statusInfo.label}
                        </div>

                        <div
                          className={[
                            "inline-flex w-fit items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1",
                            paymentInfo.badgeClass,
                          ].join(" ")}
                        >
                          <PaymentIcon
                            size={18}
                            className={paymentInfo.iconClass}
                          />
                          {paymentInfo.label}
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
                          paymentInfo.cardClass,
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
                              {paymentInfo.description}
                            </p>
                          </div>

                          <ReceiptText
                            size={26}
                            className={paymentInfo.iconClass}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-400">
                      {booking.pictureUrl ? (
                        <img
                          src={booking.pictureUrl}
                          alt={booking.displayName || "customer"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User size={28} />
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Customer
                      </p>
                      <h3 className="text-2xl font-black text-slate-950">
                        {booking.displayName || "ลูกค้า"}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <div className="flex items-center gap-2">
                        <Phone size={18} className="text-slate-500" />
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Phone
                        </p>
                      </div>
                      <p className="mt-2 font-black text-slate-950">
                        {booking.phone || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <div className="flex items-center gap-2">
                        <Users size={18} className="text-slate-500" />
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          LINE User ID
                        </p>
                      </div>
                      <p className="mt-2 break-all font-black text-slate-950">
                        {booking.lineUserId || "-"}
                      </p>
                    </div>

                    {booking.note && (
                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Note
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {booking.note}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                      <Banknote size={28} className="text-emerald-600" />
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Payment
                      </p>
                      <h3 className="text-2xl font-black text-slate-950">
                        ข้อมูลชำระมัดจำ
                      </h3>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          วิธีชำระเงิน
                        </p>
                        <p className="mt-1 font-black text-slate-950">
                          {getPaymentMethodLabel(booking.paymentMethod)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Paid At
                        </p>
                        <p className="mt-1 font-black text-slate-950">
                          {formatDateTime(booking.paidAt)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        เลขอ้างอิงการโอน
                      </p>
                      <p className="mt-1 break-all font-black text-slate-950">
                        {booking.paymentReference || "-"}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          ราคารวม
                        </p>
                        <p className="mt-1 font-black text-slate-950">
                          {formatCurrency(totalPrice)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                          ค่ามัดจำ
                        </p>
                        <p className="mt-1 font-black text-emerald-700">
                          {formatCurrency(depositAmount)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          ยอดคงเหลือ
                        </p>
                        <p className="mt-1 font-black text-slate-950">
                          {formatCurrency(remainingAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
                      Payment Slip
                    </p>
                    <h3 className="mt-2 text-3xl font-black text-slate-950">
                      หลักฐานการโอนเงิน
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      ตรวจสอบรูปสลิปและเลขอ้างอิงก่อนกดยืนยันชำระเงิน
                    </p>
                  </div>

                  {booking.paymentSlipUrl && (
                    <a
                      href={booking.paymentSlipUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800"
                    >
                      <span className="text-white">เปิดรูปเต็ม</span>
                    </a>
                  )}
                </div>

                <div className="mt-5 overflow-hidden rounded-[2rem] bg-slate-100 p-4 ring-1 ring-slate-200">
                  {booking.paymentSlipUrl ? (
                    <img
                      src={booking.paymentSlipUrl}
                      alt="Payment slip"
                      className="mx-auto max-h-[720px] w-full rounded-2xl object-contain"
                    />
                  ) : (
                    <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                      <ReceiptText size={46} className="text-slate-400" />
                      <h4 className="mt-4 text-xl font-black text-slate-950">
                        ยังไม่มีรูปสลิป
                      </h4>
                      <p className="mt-2 text-sm text-slate-500">
                        ลูกค้ายังไม่ได้แนบหลักฐานการโอนเงิน
                      </p>
                    </div>
                  )}
                </div>

                {booking.paymentSlipUrl && (
                  <p className="mt-3 break-all text-xs font-semibold text-slate-500">
                    {booking.paymentSlipUrl}
                  </p>
                )}
              </section>
            </div>

            <aside className="h-fit rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-6 xl:sticky xl:top-28">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-white">
                <ShieldCheck size={30} className="text-white" />
              </div>

              <h2 className="mt-5 text-2xl font-black text-slate-950">
                จัดการรายการนี้
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                เลือกสถานะการชำระเงินและสถานะการจองหลังตรวจสอบข้อมูลเรียบร้อย
              </p>

              <div className="mt-5 grid gap-3">
                <div
                  className={[
                    "rounded-2xl border p-4",
                    paymentInfo.cardClass,
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <PaymentIcon
                      size={24}
                      className={paymentInfo.iconClass}
                    />
                    <div>
                      <p className="font-black text-slate-950">
                        {paymentInfo.label}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {paymentInfo.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={[
                    "rounded-2xl border p-4",
                    statusInfo.cardClass,
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <StatusIcon size={24} className={statusInfo.iconClass} />
                    <div>
                      <p className="font-black text-slate-950">
                        {statusInfo.label}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {statusInfo.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  disabled={updating || booking.paymentStatus === "PAID"}
                  onClick={() => updateBooking({ paymentStatus: "PAID" })}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updating ? (
                    <Loader2 size={18} className="animate-spin text-white" />
                  ) : (
                    <CheckCircle2 size={18} className="text-white" />
                  )}
                  <span className="text-white">ยืนยันชำระแล้ว</span>
                </button>

                <button
                  type="button"
                  disabled={updating || booking.paymentStatus === "REJECTED"}
                  onClick={() => updateBooking({ paymentStatus: "REJECTED" })}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updating ? (
                    <Loader2 size={18} className="animate-spin text-white" />
                  ) : (
                    <XCircle size={18} className="text-white" />
                  )}
                  <span className="text-white">ปฏิเสธสลิป</span>
                </button>

                <button
                  type="button"
                  disabled={updating || booking.paymentStatus === "PENDING"}
                  onClick={() => updateBooking({ paymentStatus: "PENDING" })}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Clock3 size={18} className="text-slate-700" />
                  <span className="text-slate-700">กลับไปรอตรวจสลิป</span>
                </button>
              </div>

              <div className="my-6 h-px bg-slate-200" />

              <div className="grid gap-3">
                <button
                  type="button"
                  disabled={updating || booking.status === "CONFIRMED"}
                  onClick={() => updateBooking({ status: "CONFIRMED" })}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updating ? (
                    <Loader2 size={18} className="animate-spin text-white" />
                  ) : (
                    <CheckCircle2 size={18} className="text-white" />
                  )}
                  <span className="text-white">ยืนยันการจอง</span>
                </button>

                <button
                  type="button"
                  disabled={updating || booking.status === "CANCELLED"}
                  onClick={() => updateBooking({ status: "CANCELLED" })}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updating ? (
                    <Loader2 size={18} className="animate-spin text-white" />
                  ) : (
                    <XCircle size={18} className="text-white" />
                  )}
                  <span className="text-white">ยกเลิกการจอง</span>
                </button>

                <button
                  type="button"
                  disabled={updating || booking.status === "PENDING"}
                  onClick={() => updateBooking({ status: "PENDING" })}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Clock3 size={18} className="text-slate-700" />
                  <span className="text-slate-700">กลับเป็นรอตรวจสอบ</span>
                </button>
              </div>

              <div className="my-6 h-px bg-slate-200" />

              <Link
                href="/admin/bookings"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800"
              >
                <ArrowLeft size={18} className="text-white" />
                <span className="text-white">กลับรายการจองทั้งหมด</span>
              </Link>

              <button
                type="button"
                onClick={fetchBooking}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                <RefreshCcw size={18} className="text-slate-700" />
                <span className="text-slate-700">โหลดข้อมูลใหม่</span>
              </button>
            </aside>
          </section>
        )}

        <footer className="mt-5 rounded-[2rem] bg-white px-6 py-5 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          Admin Booking Detail • Resort Booking System
        </footer>
      </section>
    </main>
  );
}