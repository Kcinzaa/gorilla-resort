"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BedDouble,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
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
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [newBookingNotice, setNewBookingNotice] = useState<BookingItem | null>(
    null
  );
  const knownBookingIdsRef = useRef<Set<number>>(new Set());
  const hasLoadedBookingsRef = useRef(false);

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
    const start = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1
    );
    const end = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() + 1,
      0
    );

    return Array.from({ length: end.getDate() }, (_, index) =>
      addDays(start, index)
    );
  }, [calendarMonth]);

  const calendarLeadingDays = useMemo(() => {
    return new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1
    ).getDay();
  }, [calendarMonth]);

  const calendarMonthLabel = useMemo(() => {
    return formatMonthLabel(calendarMonth);
  }, [calendarMonth]);

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

  const monthlyCalendarDays = useMemo(() => {
    return scheduleDates.map((date) => {
      const rooms = activeRooms.map((room) => {
        const roomBookings = activeScheduleBookings.filter(
          (booking) =>
            booking.roomType?.id === room.id && isDateInBooking(date, booking)
        );
        const realBookedCount = roomBookings.reduce(
          (sum, booking) => sum + Math.max(Number(booking.roomCount || 1), 1),
          0
        );
        const totalRooms = Number(room.totalRooms ?? 1);
        const reservedRooms = Math.min(
          Math.max(Number(room.reservedRooms || 0), 0),
          totalRooms
        );
        const bookedCount = reservedRooms + realBookedCount;
        const availableCount = Math.max(totalRooms - bookedCount, 0);

        return {
          room,
          bookings: roomBookings,
          totalRooms,
          reservedRooms,
          realBookedCount,
          bookedCount,
          availableCount,
        };
      });

      const totalRooms = rooms.reduce((sum, item) => sum + item.totalRooms, 0);
      const totalAvailable = rooms.reduce(
        (sum, item) => sum + item.availableCount,
        0
      );
      const totalBooked = rooms.reduce((sum, item) => sum + item.bookedCount, 0);
      const totalCustomerBooked = rooms.reduce(
        (sum, item) => sum + item.realBookedCount,
        0
      );
      const totalReserved = rooms.reduce(
        (sum, item) => sum + item.reservedRooms,
        0
      );

      return {
        date,
        rooms,
        totalRooms,
        totalAvailable,
        totalBooked,
        totalCustomerBooked,
        totalReserved,
        isFull: totalRooms > 0 && totalAvailable <= 0,
        hasBooking: totalBooked > 0,
      };
    });
  }, [activeRooms, activeScheduleBookings, scheduleDates]);

  function goToPreviousMonth() {
    setCalendarMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)
    );
  }

  function goToNextMonth() {
    setCalendarMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)
    );
  }

  function goToCurrentMonth() {
    const today = new Date();
    setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

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

  function playNewBookingSound() {
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.12);
      gain.gain.setValueAtTime(0.001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.32);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.34);
    } catch {
      // Some browsers block audio until the admin interacts with the page.
    }
  }

  function applyBookingsUpdate(nextBookings: BookingItem[], notify: boolean) {
    const previousIds = knownBookingIdsRef.current;
    const newBookings = nextBookings.filter(
      (booking) => !previousIds.has(booking.id)
    );

    knownBookingIdsRef.current = new Set(nextBookings.map((booking) => booking.id));
    setBookings(nextBookings);

    if (notify && hasLoadedBookingsRef.current && newBookings.length > 0) {
      const newestBooking = [...newBookings].sort((a, b) => {
        const aTime = new Date(a.createdAt || "").getTime();
        const bTime = new Date(b.createdAt || "").getTime();
        return bTime - aTime;
      })[0];

      setNewBookingNotice(newestBooking);
      playNewBookingSound();
    }

    hasLoadedBookingsRef.current = true;
  }

  async function loadDashboard(options?: { silent?: boolean; notify?: boolean }) {
    try {
      if (!options?.silent) setLoading(true);
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

      applyBookingsUpdate(
        toArray<BookingItem>(bookingResult),
        Boolean(options?.notify)
      );
      setRooms(toArray<RoomItem>(roomResult));
    } catch (err) {
      console.warn("Dashboard load failed:", err);
      if (!options?.silent) {
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล Dashboard");
      }
    } finally {
      if (!options?.silent) setLoading(false);
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

    const intervalId = window.setInterval(() => {
      loadDashboard({ silent: true, notify: true });
    }, 15000);

    return () => window.clearInterval(intervalId);
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
                onClick={() => loadDashboard()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
              >
                <RefreshCcw size={18} className="text-white" />
                <span className="text-white">โหลดใหม่</span>
              </button>
            </div>
          </section>
        )}

        {newBookingNotice && (
          <section className="mt-5 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm sm:rounded-[2.5rem]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <CalendarCheck size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-emerald-800">
                    มีรายการจองใหม่เข้ามา
                  </h2>
                  <p className="mt-1 text-sm font-bold text-emerald-700">
                    {newBookingNotice.displayName || "ลูกค้า"} จอง{" "}
                    {newBookingNotice.roomType?.name || "ห้องพัก"}{" "}
                    {Math.max(Number(newBookingNotice.roomCount || 1), 1)} ห้อง
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href={`/admin/bookings/${newBookingNotice.id}`}
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  เปิดดูรายการ
                </Link>
                <button
                  type="button"
                  onClick={() => setNewBookingNotice(null)}
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100"
                >
                  ปิดแจ้งเตือน
                </button>
              </div>
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
              <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
                    Monthly Calendar
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">
                    ปฏิทินการจองห้องพัก
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    ดูทั้งเดือนในมุมมองปฏิทิน เลื่อนดูเดือนก่อนหน้าหรือเดือนถัดไปได้
                    แต่ละวันสรุปห้องว่าง ห้องที่จอง ห้องที่ล็อก และรายชื่อลูกค้าจริง
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 rounded-2xl bg-slate-100 p-2 ring-1 ring-slate-200">
                    <button
                      type="button"
                      onClick={goToPreviousMonth}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                      aria-label="เดือนก่อนหน้า"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="min-w-44 text-center">
                      <p className="text-xs font-bold text-slate-500">
                        เดือนที่แสดง
                      </p>
                      <p className="text-lg font-black text-slate-950">
                        {calendarMonthLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={goToNextMonth}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                      aria-label="เดือนถัดไป"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={goToCurrentMonth}
                      className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                    >
                      กลับมาเดือนนี้
                    </button>
                  <button
                    type="button"
                    onClick={exportBookingsCsv}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                  >
                    <Download size={18} className="text-white" />
                    <span className="text-white">ส่งออก Excel</span>
                  </button>
                  </div>
                </div>
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-4">
                <CalendarLegendCard tone="green" label="ว่าง" detail="ยังมีห้องให้จอง" />
                <CalendarLegendCard tone="amber" label="มีจอง" detail="มีลูกค้าหรือล็อกไว้" />
                <CalendarLegendCard tone="red" label="เต็ม" detail="ไม่มีห้องว่าง" />
                <CalendarLegendCard tone="slate" label="รายละเอียด" detail="กดรหัสจองเพื่อเปิดดู" />
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 shadow-sm">
                <div className="grid grid-cols-7 bg-slate-950 text-center text-xs font-black text-white">
                  {["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."].map((dayName) => (
                    <div
                      key={dayName}
                      className="border-l border-slate-800 px-2 py-3 first:border-l-0"
                    >
                      {dayName}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-px bg-slate-200">
                  {Array.from({ length: calendarLeadingDays }).map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="min-h-[210px] bg-slate-50"
                    />
                  ))}

                  {monthlyCalendarDays.map((day) => {
                    const isToday = isSameCalendarDate(day.date, new Date());

                    return (
                      <article
                        key={day.date.toISOString()}
                        className={[
                          "min-h-[260px] bg-white p-3",
                          day.isFull
                            ? "border-t-4 border-red-400"
                            : day.hasBooking
                              ? "border-t-4 border-amber-400"
                              : "border-t-4 border-emerald-400",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p
                              className={[
                                "inline-flex h-9 w-9 items-center justify-center rounded-2xl text-base font-black",
                                isToday
                                  ? "bg-slate-950 text-white"
                                  : "bg-slate-100 text-slate-950",
                              ].join(" ")}
                            >
                              {day.date.getDate()}
                            </p>
                            <p className="mt-1 text-[11px] font-bold text-slate-500">
                              {formatWeekday(day.date)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p
                              className={[
                                "text-xs font-black",
                                day.isFull
                                  ? "text-red-700"
                                  : day.hasBooking
                                    ? "text-amber-700"
                                    : "text-emerald-700",
                              ].join(" ")}
                            >
                              {day.isFull ? "เต็ม" : "ว่างรวม"}
                            </p>
                            <p className="text-3xl font-black leading-none text-slate-950">
                              {day.totalAvailable}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
                          <SmallScheduleMetric label="จอง" value={day.totalCustomerBooked} />
                          <SmallScheduleMetric label="ล็อก" value={day.totalReserved} />
                          <SmallScheduleMetric label="รวม" value={day.totalBooked} />
                        </div>

                        <div className="mt-3 grid gap-2">
                          {day.rooms.map((roomDay) => {
                            const roomIsFull = roomDay.availableCount <= 0;
                            const roomHasBooking = roomDay.bookedCount > 0;

                            return (
                              <div
                                key={roomDay.room.id}
                                className={[
                                  "rounded-2xl p-2 ring-1",
                                  roomIsFull
                                    ? "bg-red-50 ring-red-100"
                                    : roomHasBooking
                                      ? "bg-amber-50 ring-amber-100"
                                      : "bg-emerald-50 ring-emerald-100",
                                ].join(" ")}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="truncate text-xs font-black text-slate-950">
                                    {roomDay.room.name}
                                  </p>
                                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-black text-slate-950 ring-1 ring-slate-200">
                                    เหลือ {roomDay.availableCount}
                                  </span>
                                </div>
                                <p className="mt-1 text-[11px] font-bold text-slate-500">
                                  จอง {roomDay.realBookedCount} • ล็อก {roomDay.reservedRooms}
                                </p>

                                {roomDay.bookings.length > 0 && (
                                  <div className="mt-2 grid gap-1">
                                    {roomDay.bookings.slice(0, 2).map((booking) => (
                                      <Link
                                        key={booking.id}
                                        href={`/admin/bookings/${booking.id}`}
                                        className="rounded-xl bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                                      >
                                        <span className="block truncate font-black text-slate-950">
                                          {booking.displayName || "ลูกค้า"} •{" "}
                                          {Math.max(Number(booking.roomCount || 1), 1)} ห้อง
                                        </span>
                                        <span className="block truncate text-slate-500">
                                          {booking.bookingCode || `#${booking.id}`}
                                        </span>
                                      </Link>
                                    ))}

                                    {roomDay.bookings.length > 2 && (
                                      <p className="text-[11px] font-black text-slate-500">
                                        +{roomDay.bookings.length - 2} รายการ
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </article>
                    );
                  })}
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

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function isSameCalendarDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function CalendarLegendCard({
  tone,
  label,
  detail,
}: {
  tone: "green" | "amber" | "red" | "slate";
  label: string;
  detail: string;
}) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 ring-emerald-100 text-emerald-700"
      : tone === "amber"
        ? "bg-amber-50 ring-amber-100 text-amber-700"
        : tone === "red"
          ? "bg-red-50 ring-red-100 text-red-700"
          : "bg-slate-50 ring-slate-200 text-slate-700";

  return (
    <div className={["rounded-2xl p-4 ring-1", toneClass].join(" ")}>
      <p className="text-sm font-black">{label}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{detail}</p>
    </div>
  );
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
