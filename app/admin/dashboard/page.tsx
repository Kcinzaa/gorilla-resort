"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Download,
  Hotel,
  LayoutDashboard,
  Loader2,
  LogOut,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
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
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  roomCount?: number | null;
  totalPrice?: number | null;
  status?: BookingStatus | string;
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
    pricePerNight?: number;
    imageUrl?: string | null;
  } | null;
};

type RoomItem = {
  id: number;
  name: string;
  description?: string | null;
  pricePerNight: number;
  capacity: number;
  totalRooms?: number | null;
  reservedRooms?: number | null;
  imageUrl?: string | null;
  isActive?: boolean;
};

type FetchResult = {
  success: boolean;
  data: unknown[];
  message?: string;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(dateString?: string) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusInfo(status?: string) {
  if (status === "CONFIRMED") {
    return {
      label: "ยืนยันแล้ว",
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      iconClass: "text-emerald-600",
    };
  }

  if (status === "CANCELLED") {
    return {
      label: "ยกเลิกแล้ว",
      icon: XCircle,
      className: "bg-red-50 text-red-700 ring-red-100",
      iconClass: "text-red-600",
    };
  }

  return {
    label: "รอตรวจสอบ",
    icon: Clock3,
    className: "bg-amber-50 text-amber-700 ring-amber-100",
    iconClass: "text-amber-600",
  };
}

function getPaymentStatusInfo(status?: string | null) {
  if (status === "PAID") {
    return {
      label: "ชำระแล้ว",
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      iconClass: "text-emerald-600",
    };
  }

  if (status === "REJECTED") {
    return {
      label: "ปฏิเสธสลิป",
      icon: XCircle,
      className: "bg-red-50 text-red-700 ring-red-100",
      iconClass: "text-red-600",
    };
  }

  if (status === "PENDING") {
    return {
      label: "รอตรวจสลิป",
      icon: Clock3,
      className: "bg-amber-50 text-amber-700 ring-amber-100",
      iconClass: "text-amber-600",
    };
  }

  return {
    label: "ยังไม่ชำระ",
    icon: ReceiptText,
    className: "bg-slate-100 text-slate-700 ring-slate-200",
    iconClass: "text-slate-500",
  };
}

function toArray<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.bookings)) return payload.data.bookings;
  if (Array.isArray(payload?.data?.rooms)) return payload.data.rooms;
  if (Array.isArray(payload?.bookings)) return payload.bookings;
  if (Array.isArray(payload?.rooms)) return payload.rooms;

  return [];
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [rooms, setRooms] = useState<RoomItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pendingBookings = useMemo(() => {
    return bookings.filter((booking) => booking.status === "PENDING");
  }, [bookings]);

  const confirmedBookings = useMemo(() => {
    return bookings.filter((booking) => booking.status === "CONFIRMED");
  }, [bookings]);

  const cancelledBookings = useMemo(() => {
    return bookings.filter((booking) => booking.status === "CANCELLED");
  }, [bookings]);

  const paymentPendingBookings = useMemo(() => {
    return bookings.filter((booking) => booking.paymentStatus === "PENDING");
  }, [bookings]);

  const rejectedPaymentBookings = useMemo(() => {
    return bookings.filter((booking) => booking.paymentStatus === "REJECTED");
  }, [bookings]);

  const unpaidBookings = useMemo(() => {
    return bookings.filter(
      (booking) => !booking.paymentStatus || booking.paymentStatus === "UNPAID"
    );
  }, [bookings]);

  const activeRooms = useMemo(() => {
    return rooms.filter((room) => room.isActive !== false);
  }, [rooms]);

  const inactiveRooms = useMemo(() => {
    return rooms.filter((room) => room.isActive === false);
  }, [rooms]);

  const totalRoomCount = useMemo(() => {
    return activeRooms.reduce((sum, room) => sum + (room.totalRooms ?? 1), 0);
  }, [activeRooms]);

  const estimatedRevenue = useMemo(() => {
    return confirmedBookings.reduce((sum, booking) => {
      return sum + (booking.totalPrice || 0);
    }, 0);
  }, [confirmedBookings]);

  const pendingDepositTotal = useMemo(() => {
    return paymentPendingBookings.reduce((sum, booking) => {
      return sum + (booking.depositAmount || 0);
    }, 0);
  }, [paymentPendingBookings]);

  const latestBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || "").getTime();
        const bTime = new Date(b.createdAt || "").getTime();

        return bTime - aTime;
      })
      .slice(0, 5);
  }, [bookings]);

  const latestPaymentBookings = useMemo(() => {
    return [...bookings]
      .filter(
        (booking) =>
          booking.paymentStatus === "PENDING" ||
          booking.paymentStatus === "PAID" ||
          booking.paymentStatus === "REJECTED"
      )
      .sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt || "").getTime();
        const bTime = new Date(b.updatedAt || b.createdAt || "").getTime();

        return bTime - aTime;
      })
      .slice(0, 5);
  }, [bookings]);

  const scheduleDates = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, []);

  const activeScheduleBookings = useMemo(() => {
    return bookings.filter((booking) => {
      return booking.status !== "CANCELLED";
    });
  }, [bookings]);

  const occupancyRows = useMemo(() => {
    return activeRooms.map((room) => {
      const roomBookings = activeScheduleBookings.filter(
        (booking) => booking.roomType?.id === room.id
      );

      const days = scheduleDates.map((date) => {
        const dayBookings = roomBookings.filter((booking) =>
          isDateInBooking(date, booking)
        );
        const realBookedCount = dayBookings.reduce(
          (sum, booking) => sum + Math.max(Number(booking.roomCount || 1), 1),
          0
        );
        const totalRooms = room.totalRooms ?? 1;
        const reservedRooms = Math.min(
          Math.max(Number(room.reservedRooms || 0), 0),
          totalRooms
        );
        const heldCount = reservedRooms + realBookedCount;

        return {
          date,
          bookedCount: heldCount,
          realBookedCount,
          reservedRooms,
          availableCount: Math.max(totalRooms - heldCount, 0),
          bookings: dayBookings,
        };
      });

      return {
        room,
        days,
      };
    });
  }, [activeRooms, activeScheduleBookings, scheduleDates]);

  function exportBookingsCsv() {
    const headers = [
      "Booking Code",
      "Customer",
      "Phone",
      "Room",
      "Check In",
      "Check Out",
      "Room Count",
      "Total Price",
      "Booking Status",
      "Payment Status",
      "Payment Method",
      "Payment Slip URL",
      "Created At",
    ];

    const rows = bookings.map((booking) => [
      booking.bookingCode || `BOOKING-${booking.id}`,
      booking.displayName || "",
      booking.phone || "",
      booking.roomType?.name || "",
      booking.checkIn || "",
      booking.checkOut || "",
      Math.max(Number(booking.roomCount || 1), 1),
      booking.totalPrice || 0,
      booking.status || "",
      booking.paymentStatus || "",
      booking.paymentMethod || "",
      booking.paymentSlipUrl || "",
      booking.createdAt || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `resort-bookings-${formatInputDate(new Date())}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function fetchJsonWithFallback(urls: string[]): Promise<FetchResult> {
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          await response.text();
          console.warn(`API ${url} ไม่ได้ส่ง JSON กลับมา หรือ API ยังไม่มีอยู่`);
          continue;
        }

        const result = await response.json();

        if (response.ok) {
          return result;
        }

        console.warn(result.message || `โหลดข้อมูลจาก ${url} ไม่สำเร็จ`);
      } catch (err) {
        console.warn(`โหลดข้อมูลจาก ${url} ไม่สำเร็จ`, err);
      }
    }

    return {
      success: true,
      data: [],
      message: "ไม่พบข้อมูลจาก API",
    };
  }

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const authResponse = await fetch("/api/admin/me", {
        cache: "no-store",
        credentials: "include",
      });
      const authResult = await authResponse.json();

      if (!authResponse.ok || !authResult.loggedIn) {
        router.push("/admin/login");
        return;
      }

      const [bookingResult, roomResult] = await Promise.all([
        fetchJsonWithFallback(["/api/admin/bookings"]),
        fetchJsonWithFallback(["/api/admin/rooms"]),
      ]);

      setBookings(toArray<BookingItem>(bookingResult));
      setRooms(toArray<RoomItem>(roomResult));
    } catch (err) {
      console.warn("Dashboard load failed:", err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล Dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });

    router.push("/admin/login");
    router.refresh();
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
        <header className="sticky top-3 z-40 mb-5 rounded-[1.5rem] bg-white/95 px-4 py-3 shadow-sm ring-1 ring-slate-200 backdrop-blur-xl sm:top-4 sm:rounded-[2rem] sm:px-5 sm:py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <ShieldCheck size={25} className="text-white" />
              </div>

              <div>
                <h1 className="text-lg font-black text-slate-950">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-slate-500">
                  Resort Booking Management
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap gap-2">
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                <LayoutDashboard size={17} className="text-white" />
                <span className="text-white">Dashboard</span>
              </Link>

              <Link
                href="/admin/bookings"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                <CalendarCheck size={17} className="text-slate-700" />
                <span className="text-slate-700">Bookings</span>
              </Link>

              <Link
                href="/admin/rooms"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                <BedDouble size={17} className="text-slate-700" />
                <span className="text-slate-700">Rooms</span>
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

        <section className="hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-emerald-500 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500 blur-3xl" />
            <div className="absolute right-1/3 top-1/3 h-72 w-72 rounded-full bg-amber-400 blur-3xl" />
          </div>

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-200 ring-1 ring-white/10">
                <Sparkles size={16} className="text-slate-200" />
                <span className="text-slate-200">Payment Overview</span>
              </div>

              <h2 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                ภาพรวมระบบจองและชำระมัดจำ
              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                ตรวจสอบรายการจอง รอตรวจสลิป และสถานะห้องพักทั้งหมดในหน้าเดียว
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/admin/bookings"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  <span className="text-white">ตรวจรายการจอง/สลิป</span>
                  <CalendarCheck size={18} className="text-white" />
                </Link>

                <Link
                  href="/admin/rooms"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                >
                  <span className="text-slate-950">จัดการห้องพัก</span>
                  <BedDouble size={18} className="text-slate-950" />
                </Link>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/10">
                <ReceiptText size={28} className="text-amber-300" />
                <p className="mt-4 text-4xl font-black text-white">
                  {paymentPendingBookings.length}
                </p>
                <p className="mt-1 text-sm text-slate-300">รายการรอตรวจสลิป</p>
              </div>
            </div>
          </div>
        </section>

        {loading && (
          <section className="mt-5 flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
              <Loader2 size={38} className="animate-spin" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              กำลังโหลดข้อมูล Dashboard
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              กรุณารอสักครู่ ระบบกำลังดึงข้อมูลรายการจอง ห้องพัก และการชำระเงิน
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
                    โหลด Dashboard ไม่สำเร็จ
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-red-600">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadDashboard}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
              >
                <RefreshCcw size={18} className="text-white" />
                <span className="text-white">โหลดใหม่</span>
              </button>
            </div>
          </section>
        )}

        {!loading && !error && (
          <>
            <section className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200 sm:p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <CalendarCheck size={28} className="text-white" />
                </div>

                <p className="mt-5 text-sm font-bold text-slate-500">
                  รายการจองทั้งหมด
                </p>
                <p className="mt-2 text-4xl font-black text-slate-950">
                  {bookings.length}
                </p>
              </div>

              {pendingBookings.length > 0 && (
                <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200 sm:p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                  <Clock3 size={28} className="text-amber-600" />
                </div>

                <p className="mt-5 text-sm font-bold text-slate-500">
                  รอตรวจสอบการจอง
                </p>
                <p className="mt-2 text-4xl font-black text-slate-950">
                  {pendingBookings.length}
                </p>
                </div>
              )}

              {confirmedBookings.length > 0 && (
                <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200 sm:p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <CheckCircle2 size={28} className="text-emerald-600" />
                </div>

                <p className="mt-5 text-sm font-bold text-slate-500">
                  ยืนยันการจองแล้ว
                </p>
                <p className="mt-2 text-4xl font-black text-slate-950">
                  {confirmedBookings.length}
                </p>
                </div>
              )}

              <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200 sm:p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <Wallet size={28} className="text-blue-600" />
                </div>

                <p className="mt-5 text-sm font-bold text-slate-500">
                  รายได้ที่ยืนยันแล้ว
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {formatCurrency(estimatedRevenue)}
                </p>
              </div>
            </section>

            {(paymentPendingBookings.length > 0 ||
              unpaidBookings.length > 0) && (
              <section className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {paymentPendingBookings.length > 0 && (
                <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200 sm:p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                  <ReceiptText size={28} className="text-amber-600" />
                </div>

                <p className="mt-5 text-sm font-bold text-slate-500">
                  รอตรวจสลิป
                </p>
                <p className="mt-2 text-4xl font-black text-slate-950">
                  {paymentPendingBookings.length}
                </p>
                <p className="mt-2 text-sm font-bold text-amber-700">
                  {formatCurrency(pendingDepositTotal)}
                </p>
                </div>
              )}

              {unpaidBookings.length > 0 && (
                <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200 sm:p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                  <ReceiptText size={28} className="text-slate-600" />
                </div>

                <p className="mt-5 text-sm font-bold text-slate-500">
                  ยังไม่แจ้งชำระ
                </p>
                <p className="mt-2 text-4xl font-black text-slate-950">
                  {unpaidBookings.length}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  UNPAID
                </p>
                </div>
              )}
              </section>
            )}

            <section className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
                    Room Schedule
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">
                    ตารางการจองห้องพัก
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    ดูสถานะ 7 วันข้างหน้าแบบข้อมูลจริง รวมรายการจองล่าสุดและห้องที่ล็อกไว้รายเดือน
                    เพื่อดูทันทีว่าแต่ละวันเหลือห้องกี่ห้อง
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={exportBookingsCsv}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                  >
                    <Download size={18} className="text-white" />
                    <span className="text-white">ส่งออก Excel</span>
                  </button>

                  <Link
                    href="/admin/bookings"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    <span className="text-white">ดูรายการจองทั้งหมด</span>
                    <ArrowRight size={18} className="text-white" />
                  </Link>
                </div>
              </div>

              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                    สีเขียว
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-950">
                    ยังมีห้องว่าง
                  </p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
                  <p className="text-xs font-black uppercase tracking-wide text-amber-700">
                    สีเหลือง
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-950">
                    มีจองหรือล็อกไว้
                  </p>
                </div>
                <div className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
                  <p className="text-xs font-black uppercase tracking-wide text-red-700">
                    สีแดง
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-950">
                    ห้องเต็ม
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                <table className="min-w-[1320px] w-full border-separate border-spacing-0 text-left">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-20 min-w-72 bg-slate-950 px-5 py-5 text-sm font-black text-white">
                        ห้องพัก
                      </th>
                      {scheduleDates.map((date) => (
                        <th
                          key={date.toISOString()}
                          className="min-w-[150px] border-l border-slate-800 bg-slate-950 px-4 py-5 text-center text-sm font-black text-white"
                        >
                          <span className="block text-xs font-bold text-slate-400">
                            {formatWeekday(date)}
                          </span>
                          <span className="mt-1 block text-base font-black text-white">
                            {formatDateOnly(date)}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {occupancyRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={scheduleDates.length + 1}
                          className="px-5 py-10 text-center text-sm font-bold text-slate-500"
                        >
                          ยังไม่มีข้อมูลห้องพัก
                        </td>
                      </tr>
                    ) : (
                      occupancyRows.map(({ room, days }) => (
                        <tr key={room.id}>
                          <td className="sticky left-0 z-10 border-t border-slate-200 bg-white px-5 py-5 shadow-[8px_0_16px_rgba(15,23,42,0.05)]">
                            <p className="text-xl font-black text-slate-950">
                              {room.name}
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                              <div className="rounded-2xl bg-slate-100 px-3 py-2">
                                <p className="text-[11px] font-bold text-slate-500">
                                  ทั้งหมด
                                </p>
                                <p className="text-lg font-black text-slate-950">
                                  {room.totalRooms ?? 1}
                                </p>
                              </div>
                              <div className="rounded-2xl bg-amber-50 px-3 py-2 ring-1 ring-amber-100">
                                <p className="text-[11px] font-bold text-amber-700">
                                  ล็อก
                                </p>
                                <p className="text-lg font-black text-slate-950">
                                  {room.reservedRooms ?? 0}
                                </p>
                              </div>
                            </div>
                          </td>

                          {days.map((day) => {
                            const isFull = day.availableCount <= 0;
                            const hasBooking = day.bookedCount > 0;
                            const totalRooms = Number(room.totalRooms ?? 1);
                            const availabilityPercent =
                              totalRooms > 0
                                ? Math.max(
                                    0,
                                    Math.min(100, (day.availableCount / totalRooms) * 100)
                                  )
                                : 0;

                            return (
                              <td
                                key={`${room.id}-${day.date.toISOString()}`}
                                className="border-l border-t border-slate-200 bg-slate-50 px-3 py-3 align-top"
                              >
                                <div
                                  className={[
                                    "min-h-[250px] rounded-[1.35rem] border bg-white p-3 shadow-sm",
                                    isFull
                                      ? "border-red-200"
                                      : hasBooking
                                        ? "border-amber-200"
                                        : "border-emerald-200",
                                  ].join(" ")}
                                >
                                  <div
                                    className={[
                                      "rounded-[1.1rem] px-3 py-3 text-center",
                                      isFull
                                        ? "bg-red-50"
                                        : hasBooking
                                          ? "bg-amber-50"
                                          : "bg-emerald-50",
                                    ].join(" ")}
                                  >
                                    <p
                                      className={[
                                        "text-xs font-black uppercase tracking-wide",
                                        isFull
                                          ? "text-red-700"
                                          : hasBooking
                                            ? "text-amber-700"
                                            : "text-emerald-700",
                                      ].join(" ")}
                                    >
                                      {isFull ? "เต็มแล้ว" : "เหลือ"}
                                    </p>
                                    <p className="mt-1 text-5xl font-black leading-none text-slate-950">
                                      {day.availableCount}
                                    </p>
                                    <p className="mt-1 text-xs font-bold text-slate-500">
                                      ห้องว่าง
                                    </p>
                                  </div>

                                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className={[
                                        "h-full rounded-full",
                                        isFull
                                          ? "bg-red-500"
                                          : hasBooking
                                            ? "bg-amber-500"
                                            : "bg-emerald-500",
                                      ].join(" ")}
                                      style={{ width: `${availabilityPercent}%` }}
                                    />
                                  </div>

                                  <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
                                    <SmallScheduleMetric label="จอง" value={day.realBookedCount} />
                                    <SmallScheduleMetric label="ล็อก" value={day.reservedRooms} />
                                    <SmallScheduleMetric label="รวม" value={day.bookedCount} />
                                  </div>

                                  <div className="mt-3 grid gap-2">
                                    {day.bookings.length === 0 ? (
                                      <div className="rounded-2xl border border-dashed border-slate-200 px-3 py-3 text-center text-xs font-bold text-slate-400">
                                        ไม่มีรายการจอง
                                      </div>
                                    ) : (
                                      day.bookings.slice(0, 2).map((booking) => (
                                        <Link
                                          key={booking.id}
                                          href={`/admin/bookings/${booking.id}`}
                                          className="rounded-2xl bg-slate-50 px-3 py-2 text-xs ring-1 ring-slate-200 transition hover:bg-white hover:shadow-sm"
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <p className="truncate font-black text-slate-950">
                                              {booking.displayName || "ลูกค้า"}
                                            </p>
                                            <span
                                              className={[
                                                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black",
                                                booking.status === "CONFIRMED"
                                                  ? "bg-emerald-50 text-emerald-700"
                                                  : "bg-amber-50 text-amber-700",
                                              ].join(" ")}
                                            >
                                              {Math.max(Number(booking.roomCount || 1), 1)} ห้อง
                                            </span>
                                          </div>
                                          <p className="mt-1 truncate text-[11px] font-bold text-slate-500">
                                            {booking.bookingCode || `#${booking.id}`}
                                          </p>
                                        </Link>
                                      ))
                                    )}

                                    {day.bookings.length > 2 && (
                                      <p className="text-center text-xs font-black text-slate-500">
                                        +{day.bookings.length - 2} รายการ
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </section>

            <section className="mt-5">
              <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
                      Latest Bookings
                    </p>

                    <h2 className="mt-2 text-3xl font-black text-slate-950">
                      รายการจองล่าสุด
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      รายการล่าสุดที่ลูกค้าส่งเข้ามาในระบบ
                    </p>
                  </div>

                  <Link
                    href="/admin/bookings"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    <span className="text-white">ดูทั้งหมด</span>
                    <ArrowRight size={18} className="text-white" />
                  </Link>
                </div>

                {latestBookings.length === 0 ? (
                  <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[2rem] bg-slate-50 p-8 text-center ring-1 ring-slate-200">
                    <CalendarCheck size={42} className="text-slate-400" />
                    <h3 className="mt-5 text-2xl font-black text-slate-950">
                      ยังไม่มีรายการจอง
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      เมื่อลูกค้าส่งคำขอจอง รายการจะแสดงที่นี่
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {latestBookings.map((booking) => {
                      const statusInfo = getStatusInfo(booking.status);
                      const paymentInfo = getPaymentStatusInfo(
                        booking.paymentStatus
                      );
                      const StatusIcon = statusInfo.icon;
                      const PaymentIcon = paymentInfo.icon;

                      return (
                        <div
                          key={booking.id}
                          className="rounded-[2rem] bg-slate-50 p-4 ring-1 ring-slate-200 transition hover:bg-white hover:shadow-sm"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
                                {booking.pictureUrl ? (
                                  <img
                                    src={booking.pictureUrl}
                                    alt={booking.displayName || "customer"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Users size={26} />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-black text-slate-950">
                                  {booking.displayName || "ลูกค้า"}
                                </p>
                                <p className="truncate text-sm text-slate-500">
                                  {booking.roomType?.name || "ห้องพัก"} •{" "}
                                  {formatDateTime(booking.createdAt)}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 sm:justify-end">
                              <div
                                className={[
                                  "inline-flex w-fit items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1",
                                  statusInfo.className,
                                ].join(" ")}
                              >
                                <StatusIcon
                                  size={17}
                                  className={statusInfo.iconClass}
                                />
                                {statusInfo.label}
                              </div>

                              {booking.paymentStatus !== "REJECTED" && (
                                <div
                                  className={[
                                    "inline-flex w-fit items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1",
                                    paymentInfo.className,
                                  ].join(" ")}
                                >
                                  <PaymentIcon
                                    size={17}
                                    className={paymentInfo.iconClass}
                                  />
                                  {paymentInfo.label}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <aside className="hidden">
                <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
                  <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
                    Payment Queue
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-slate-950">
                    คิวตรวจสลิปล่าสุด
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    รายการที่มีสถานะการชำระเงินล่าสุด
                  </p>

                  <div className="mt-6 grid gap-3">
                    {latestPaymentBookings.length === 0 ? (
                      <div className="rounded-2xl bg-slate-50 p-5 text-center ring-1 ring-slate-200">
                        <ReceiptText
                          size={34}
                          className="mx-auto text-slate-400"
                        />
                        <p className="mt-3 font-black text-slate-950">
                          ยังไม่มีรายการชำระเงิน
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          เมื่อมีการแนบสลิปจะแสดงที่นี่
                        </p>
                      </div>
                    ) : (
                      latestPaymentBookings.map((booking) => {
                        const paymentInfo = getPaymentStatusInfo(
                          booking.paymentStatus
                        );
                        const PaymentIcon = paymentInfo.icon;

                        return (
                          <Link
                            key={booking.id}
                            href="/admin/bookings"
                            className="block rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 transition hover:bg-white hover:shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-black text-slate-950">
                                  {booking.displayName || "ลูกค้า"}
                                </p>
                                <p className="mt-1 truncate text-sm text-slate-500">
                                  {booking.bookingCode ||
                                    `BOOKING-${booking.id}`}
                                </p>
                                <p className="mt-2 text-sm font-black text-emerald-700">
                                  {formatCurrency(booking.depositAmount || 0)}
                                </p>
                              </div>

                              <div
                                className={[
                                  "inline-flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black ring-1",
                                  paymentInfo.className,
                                ].join(" ")}
                              >
                                <PaymentIcon
                                  size={15}
                                  className={paymentInfo.iconClass}
                                />
                                {paymentInfo.label}
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>

                  <Link
                    href="/admin/bookings"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
                  >
                    <span className="text-white">ไปตรวจสลิปทั้งหมด</span>
                    <ArrowRight size={18} className="text-white" />
                  </Link>
                </div>

                <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
                  <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
                    Room Summary
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-slate-950">
                    สรุปห้องพัก
                  </h2>

                  <div className="mt-6 grid gap-3">
                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Active Room Types
                          </p>
                          <p className="mt-1 text-3xl font-black text-slate-950">
                            {activeRooms.length}
                          </p>
                        </div>
                        <BedDouble size={30} className="text-slate-400" />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-950 p-4 text-white">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Total Rooms
                          </p>
                          <p className="mt-1 text-3xl font-black text-white">
                            {totalRoomCount}
                          </p>
                        </div>
                        <Hotel size={30} className="text-white" />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-red-600">
                            Disabled Types
                          </p>
                          <p className="mt-1 text-3xl font-black text-red-700">
                            {inactiveRooms.length}
                          </p>
                        </div>
                        <XCircle size={30} className="text-red-600" />
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/admin/rooms"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    <span className="text-white">จัดการห้องพัก</span>
                    <ArrowRight size={18} className="text-white" />
                  </Link>
                </div>

                <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-300 sm:rounded-[2.5rem] sm:p-8">
                  <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />

                  <div className="relative z-10">
                    <ShieldCheck size={34} className="text-emerald-300" />

                    <h2 className="mt-5 text-3xl font-black text-white">
                      งานที่ควรทำต่อ
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      ตรวจสอบรายการรอตรวจสลิป กดยืนยันชำระเงินหรือปฏิเสธสลิป
                      เพื่อให้สถานะในหน้าลูกค้าอัปเดตล่าสุด
                    </p>

                    <Link
                      href="/admin/bookings"
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                    >
                      <span className="text-slate-950">
                        ไปจัดการรายการจอง
                      </span>
                      <ArrowRight size={18} className="text-slate-950" />
                    </Link>
                  </div>
                </div>
              </aside>
            </section>
          </>
        )}

      </section>
    </main>
  );
}

function formatDateOnly(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    weekday: "short",
  }).format(date);
}

function SmallScheduleMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-slate-100 px-2 py-2">
      <p className="text-[10px] font-bold text-slate-500">{label}</p>
      <p className="text-base font-black text-slate-950">{value}</p>
    </div>
  );
}

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateOnly(value?: string) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isDateInBooking(date: Date, booking: BookingItem) {
  const checkIn = parseDateOnly(booking.checkIn);
  const checkOut = parseDateOnly(booking.checkOut);

  if (!checkIn || !checkOut) return false;

  return date >= checkIn && date < checkOut;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}
