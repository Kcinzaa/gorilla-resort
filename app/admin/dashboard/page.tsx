"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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

type AvailabilityApiRoom = {
  id: number;
  name: string;
  totalRooms?: number | null;
  reservedRooms?: number | null;
  realBookedRooms?: number | null;
  localBookedRooms?: number | null;
  centralRhinoBookedRooms?: number | null;
  bookedRooms?: number | null;
  availableRooms?: number | null;
  isAvailable?: boolean;
};

type CalendarRoomSummary = {
  room: RoomItem;
  bookings: BookingItem[];
  totalRooms: number;
  reservedRooms: number;
  localBookedCount: number;
  centralRhinoBookedCount: number;
  realBookedCount: number;
  bookedCount: number;
  availableCount: number;
};

type CalendarDaySummary = {
  date: Date;
  rooms: CalendarRoomSummary[];
  totalRooms: number;
  totalAvailable: number;
  totalBooked: number;
  totalCustomerBooked: number;
  totalLocalCustomerBooked: number;
  totalCentralRhinoBooked: number;
  totalReserved: number;
  isFull: boolean;
  hasBooking: boolean;
};

type FetchResult = {
  success: boolean;
  data: unknown[];
  message?: string;
};

type AvailabilityByDate = Record<string, Record<number, AvailabilityApiRoom>>;

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
  const [availabilityByDate, setAvailabilityByDate] =
    useState<AvailabilityByDate>({});

  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState("");

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [newBookingNotice, setNewBookingNotice] = useState<BookingItem | null>(
    null,
  );

  const [selectedCalendarDay, setSelectedCalendarDay] =
    useState<CalendarDaySummary | null>(null);

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

  const unpaidBookings = useMemo(() => {
    return bookings.filter(
      (booking) => !booking.paymentStatus || booking.paymentStatus === "UNPAID",
    );
  }, [bookings]);

  const activeRooms = useMemo(() => {
    return rooms.filter((room) => room.isActive !== false);
  }, [rooms]);

  const inactiveRooms = useMemo(() => {
    return rooms.filter((room) => room.isActive === false);
  }, [rooms]);

  const totalRoomCount = useMemo(() => {
    return activeRooms.reduce((sum, room) => sum + Number(room.totalRooms ?? 1), 0);
  }, [activeRooms]);

  const estimatedRevenue = useMemo(() => {
    return confirmedBookings.reduce((sum, booking) => {
      return sum + Number(booking.totalPrice || 0);
    }, 0);
  }, [confirmedBookings]);

  const pendingDepositTotal = useMemo(() => {
    return paymentPendingBookings.reduce((sum, booking) => {
      return sum + Number(booking.depositAmount || 0);
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

  const scheduleDates = useMemo(() => {
    const start = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1,
    );
    const end = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() + 1,
      0,
    );

    return Array.from({ length: end.getDate() }, (_, index) =>
      addDays(start, index),
    );
  }, [calendarMonth]);

  const calendarLeadingDays = useMemo(() => {
    return new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1,
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

  const monthlyCalendarDays = useMemo<CalendarDaySummary[]>(() => {
    return scheduleDates.map((date) => {
      const dateKey = formatInputDate(date);
      const dayAvailability = availabilityByDate[dateKey] || {};

      const rooms = activeRooms.map((room) => {
        const roomBookings = activeScheduleBookings.filter(
          (booking) =>
            booking.roomType?.id === room.id && isDateInBooking(date, booking),
        );

        const localBookedFromBookings = roomBookings.reduce(
          (sum, booking) => sum + Math.max(Number(booking.roomCount || 1), 1),
          0,
        );

        const apiRoom = dayAvailability[room.id];

        const totalRooms = Number(
          apiRoom?.totalRooms ?? room.totalRooms ?? 1,
        );

        const reservedRooms = Math.min(
          Math.max(Number(apiRoom?.reservedRooms ?? room.reservedRooms ?? 0), 0),
          totalRooms,
        );

        const localBookedCount = Number(
          apiRoom?.localBookedRooms ?? localBookedFromBookings,
        );

        const centralRhinoBookedCount = Number(
          apiRoom?.centralRhinoBookedRooms ?? 0,
        );

        const realBookedCount = Number(
          apiRoom?.realBookedRooms ??
            localBookedCount + centralRhinoBookedCount,
        );

        const bookedCount = Number(
          apiRoom?.bookedRooms ?? reservedRooms + realBookedCount,
        );

        const availableCount = Math.max(
          Number(apiRoom?.availableRooms ?? totalRooms - bookedCount),
          0,
        );

        return {
          room,
          bookings: roomBookings,
          totalRooms,
          reservedRooms,
          localBookedCount,
          centralRhinoBookedCount,
          realBookedCount,
          bookedCount,
          availableCount,
        };
      });

      const totalRooms = rooms.reduce((sum, item) => sum + item.totalRooms, 0);

      const totalAvailable = rooms.reduce(
        (sum, item) => sum + item.availableCount,
        0,
      );

      const totalBooked = rooms.reduce((sum, item) => sum + item.bookedCount, 0);

      const totalCustomerBooked = rooms.reduce(
        (sum, item) => sum + item.realBookedCount,
        0,
      );

      const totalLocalCustomerBooked = rooms.reduce(
        (sum, item) => sum + item.localBookedCount,
        0,
      );

      const totalCentralRhinoBooked = rooms.reduce(
        (sum, item) => sum + item.centralRhinoBookedCount,
        0,
      );

      const totalReserved = rooms.reduce(
        (sum, item) => sum + item.reservedRooms,
        0,
      );

      return {
        date,
        rooms,
        totalRooms,
        totalAvailable,
        totalBooked,
        totalCustomerBooked,
        totalLocalCustomerBooked,
        totalCentralRhinoBooked,
        totalReserved,
        isFull: totalRooms > 0 && totalAvailable <= 0,
        hasBooking: totalBooked > 0,
      };
    });
  }, [activeRooms, activeScheduleBookings, availabilityByDate, scheduleDates]);

  const todaySummary = useMemo(() => {
    const todayKey = formatInputDate(new Date());
    const day = monthlyCalendarDays.find((item) => {
      return formatInputDate(item.date) === todayKey;
    });

    return {
      totalAvailable: day?.totalAvailable ?? 0,
      totalBooked: day?.totalBooked ?? 0,
      totalReserved: day?.totalReserved ?? 0,
      totalCentralRhinoBooked: day?.totalCentralRhinoBooked ?? 0,
      totalLocalCustomerBooked: day?.totalLocalCustomerBooked ?? 0,
    };
  }, [monthlyCalendarDays]);

  function goToPreviousMonth() {
    setSelectedCalendarDay(null);
    setCalendarMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  }

  function goToNextMonth() {
    setSelectedCalendarDay(null);
    setCalendarMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  }

  function goToCurrentMonth() {
    setSelectedCalendarDay(null);
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

  async function loadMonthAvailability(
    month: Date,
    options?: { silent?: boolean },
  ) {
    try {
      if (!options?.silent) {
        setAvailabilityLoading(true);
      }

      const start = new Date(month.getFullYear(), month.getMonth(), 1);
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const dates = Array.from({ length: end.getDate() }, (_, index) =>
        addDays(start, index),
      );

      const entries = await Promise.all(
        dates.map(async (date) => {
          const checkIn = formatInputDate(date);
          const checkOut = formatInputDate(addDays(date, 1));

          try {
            const response = await fetch(
              `/api/rooms/availability?checkIn=${encodeURIComponent(
                checkIn,
              )}&checkOut=${encodeURIComponent(checkOut)}`,
              {
                cache: "no-store",
                credentials: "include",
              },
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok || result.success === false) {
              console.warn("LOAD_DAY_AVAILABILITY_FAILED", {
                checkIn,
                checkOut,
                result,
              });

              return [checkIn, {}] as const;
            }

            const apiRooms = toArray<AvailabilityApiRoom>(result);
            const mapByRoomId: Record<number, AvailabilityApiRoom> = {};

            apiRooms.forEach((room) => {
              mapByRoomId[Number(room.id)] = room;
            });

            return [checkIn, mapByRoomId] as const;
          } catch (error) {
            console.warn("LOAD_DAY_AVAILABILITY_ERROR", {
              checkIn,
              checkOut,
              error,
            });

            return [checkIn, {}] as const;
          }
        }),
      );

      setAvailabilityByDate(Object.fromEntries(entries));
    } finally {
      if (!options?.silent) {
        setAvailabilityLoading(false);
      }
    }
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
      gain.gain.exponentialRampToValueAtTime(
        0.16,
        audioContext.currentTime + 0.02,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.32,
      );
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
      (booking) => !previousIds.has(booking.id),
    );

    knownBookingIdsRef.current = new Set(
      nextBookings.map((booking) => booking.id),
    );

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
        Boolean(options?.notify),
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
    loadMonthAvailability(calendarMonth);

    const intervalId = window.setInterval(() => {
      loadDashboard({ silent: true, notify: true });
      loadMonthAvailability(calendarMonth, { silent: true });
    }, 15000);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadMonthAvailability(calendarMonth);
  }, [calendarMonth]);

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
                  Gorilla Resort Booking Management
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

        {loading && (
          <section className="mt-5 flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
              <Loader2 size={38} className="animate-spin" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              กำลังโหลดข้อมูล Dashboard
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              ระบบกำลังดึงรายการจอง ห้องพัก และจำนวนห้องว่างจาก Gorilla + Rhino
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
                onClick={() => {
                  loadDashboard();
                  loadMonthAvailability(calendarMonth);
                }}
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
              <DashboardStatCard
                title="รายการจองทั้งหมด"
                value={bookings.length}
                icon={<CalendarCheck size={28} className="text-white" />}
                tone="black"
              />

              <DashboardStatCard
                title="ยืนยันการจองแล้ว"
                value={confirmedBookings.length}
                icon={<CheckCircle2 size={28} className="text-emerald-600" />}
                tone="green"
              />

              <DashboardStatCard
                title="จองจาก Rhino วันนี้"
                value={todaySummary.totalCentralRhinoBooked}
                icon={<Hotel size={28} className="text-orange-600" />}
                tone="orange"
              />

              <DashboardStatCard
                title="รายได้ที่ยืนยันแล้ว"
                value={formatCurrency(estimatedRevenue)}
                icon={<Wallet size={28} className="text-blue-600" />}
                tone="blue"
              />
            </section>

            <section className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              <MiniSummaryCard
                title="ห้องจริงทั้งหมด"
                value={totalRoomCount}
                detail={`${activeRooms.length} ประเภทห้องที่เปิดใช้งาน`}
              />

              <MiniSummaryCard
                title="ว่างวันนี้"
                value={todaySummary.totalAvailable}
                detail="หลังหักล็อก + Gorilla + Rhino"
                green
              />

              <MiniSummaryCard
                title="จองใน Gorilla วันนี้"
                value={todaySummary.totalLocalCustomerBooked}
                detail="นับจากรายการจองฝั่ง Gorilla"
              />

              <MiniSummaryCard
                title="จองจาก Rhino วันนี้"
                value={todaySummary.totalCentralRhinoBooked}
                detail="ดึงจาก /api/rooms/availability"
                orange
              />

              <MiniSummaryCard
                title="ล็อกไว้"
                value={todaySummary.totalReserved}
                detail="reservedRooms"
                red
              />
            </section>

            {(paymentPendingBookings.length > 0 ||
              unpaidBookings.length > 0 ||
              pendingBookings.length > 0) && (
              <section className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {pendingBookings.length > 0 && (
                  <DashboardStatCard
                    title="รอตรวจสอบการจอง"
                    value={pendingBookings.length}
                    icon={<Clock3 size={28} className="text-amber-600" />}
                    tone="amber"
                  />
                )}

                {paymentPendingBookings.length > 0 && (
                  <DashboardStatCard
                    title="รอตรวจสลิป"
                    value={paymentPendingBookings.length}
                    detail={formatCurrency(pendingDepositTotal)}
                    icon={<ReceiptText size={28} className="text-amber-600" />}
                    tone="amber"
                  />
                )}

                {unpaidBookings.length > 0 && (
                  <DashboardStatCard
                    title="ยังไม่แจ้งชำระ"
                    value={unpaidBookings.length}
                    detail="UNPAID"
                    icon={<ReceiptText size={28} className="text-slate-600" />}
                    tone="slate"
                  />
                )}

                {cancelledBookings.length > 0 && (
                  <DashboardStatCard
                    title="ยกเลิกแล้ว"
                    value={cancelledBookings.length}
                    icon={<XCircle size={28} className="text-red-600" />}
                    tone="red"
                  />
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
                    ปฏิทินนี้รวมจำนวนห้องที่จองจาก Gorilla และจำนวนที่จองผ่าน
                    Rhino แล้ว เพื่อให้ห้องว่างตรงกันทั้งสองเว็บ
                  </p>

                  {availabilityLoading && (
                    <p className="mt-2 inline-flex items-center gap-2 text-sm font-black text-orange-600">
                      <Loader2 size={16} className="animate-spin" />
                      กำลังอัปเดตจำนวนห้องว่างจาก API
                    </p>
                  )}
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
                      onClick={() => loadMonthAvailability(calendarMonth)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                    >
                      <RefreshCcw size={18} className="text-white" />
                      รีเฟรชห้องว่าง
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

              <div className="mb-4 grid gap-3 sm:grid-cols-5">
                <CalendarLegendCard
                  tone="green"
                  label="ว่าง"
                  detail="ยังมีห้องให้จอง"
                />
                <CalendarLegendCard
                  tone="amber"
                  label="มีจอง"
                  detail="มีลูกค้าหรือล็อกไว้"
                />
                <CalendarLegendCard
                  tone="orange"
                  label="Rhino"
                  detail="จองจากเว็บ Rhino"
                />
                <CalendarLegendCard
                  tone="red"
                  label="เต็ม"
                  detail="ไม่มีห้องว่าง"
                />
                <CalendarLegendCard
                  tone="slate"
                  label="รายละเอียด"
                  detail="กดเพื่อเปิด popup"
                />
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 shadow-sm">
                <div className="grid grid-cols-7 bg-slate-950 text-center text-xs font-black text-white">
                  {["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."].map(
                    (dayName) => (
                      <div
                        key={dayName}
                        className="border-l border-slate-800 px-2 py-3 first:border-l-0"
                      >
                        {dayName}
                      </div>
                    ),
                  )}
                </div>

                <div className="grid grid-cols-7 gap-px bg-slate-200">
                  {Array.from({ length: calendarLeadingDays }).map(
                    (_, index) => (
                      <div
                        key={`empty-${index}`}
                        className="min-h-[210px] bg-slate-50"
                      />
                    ),
                  )}

                  {monthlyCalendarDays.map((day) => {
                    const isToday = isSameCalendarDate(day.date, new Date());

                    return (
                      <button
                        type="button"
                        key={day.date.toISOString()}
                        onClick={() => setSelectedCalendarDay(day)}
                        className={[
                          "min-h-[178px] bg-white p-3 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-emerald-100",
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

                        <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                          <SmallScheduleMetric
                            label="จอง"
                            value={day.totalLocalCustomerBooked}
                          />
                          <SmallScheduleMetric
                            label="Rhino"
                            value={day.totalCentralRhinoBooked}
                          />
                          <SmallScheduleMetric
                            label="ล็อก"
                            value={day.totalReserved}
                          />
                          <SmallScheduleMetric
                            label="รวม"
                            value={day.totalBooked}
                          />
                        </div>

                        <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-center text-[11px] font-black text-slate-500 ring-1 ring-slate-200">
                          ดูรายละเอียด
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {selectedCalendarDay && (
              <CalendarDayModal
                selectedCalendarDay={selectedCalendarDay}
                onClose={() => setSelectedCalendarDay(null)}
              />
            )}

            <LatestBookingsSection latestBookings={latestBookings} />
          </>
        )}
      </section>
    </main>
  );
}

function DashboardStatCard({
  title,
  value,
  detail,
  icon,
  tone,
}: {
  title: string;
  value: string | number;
  detail?: string;
  icon: ReactNode;
  tone: "black" | "green" | "orange" | "blue" | "amber" | "slate" | "red";
}) {
  const toneClass = getDashboardToneClass(tone);

  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200 sm:p-6">
      <div
        className={[
          "flex h-14 w-14 items-center justify-center rounded-2xl ring-1",
          toneClass.icon,
        ].join(" ")}
      >
        {icon}
      </div>

      <p className="mt-5 text-sm font-bold text-slate-500">{title}</p>

      <p className="mt-2 text-4xl font-black text-slate-950">{value}</p>

      {detail && <p className="mt-2 text-sm font-bold text-slate-500">{detail}</p>}
    </div>
  );
}

function MiniSummaryCard({
  title,
  value,
  detail,
  green,
  orange,
  red,
}: {
  title: string;
  value: string | number;
  detail: string;
  green?: boolean;
  orange?: boolean;
  red?: boolean;
}) {
  const valueClass = green
    ? "text-emerald-600"
    : orange
      ? "text-orange-600"
      : red
        ? "text-red-600"
        : "text-slate-950";

  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className={["mt-2 text-4xl font-black", valueClass].join(" ")}>
        {value}
      </p>
      <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function getDashboardToneClass(
  tone: "black" | "green" | "orange" | "blue" | "amber" | "slate" | "red",
) {
  if (tone === "green") {
    return {
      icon: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    };
  }

  if (tone === "orange") {
    return {
      icon: "bg-orange-50 text-orange-600 ring-orange-100",
    };
  }

  if (tone === "blue") {
    return {
      icon: "bg-blue-50 text-blue-600 ring-blue-100",
    };
  }

  if (tone === "amber") {
    return {
      icon: "bg-amber-50 text-amber-600 ring-amber-100",
    };
  }

  if (tone === "red") {
    return {
      icon: "bg-red-50 text-red-600 ring-red-100",
    };
  }

  if (tone === "slate") {
    return {
      icon: "bg-slate-100 text-slate-600 ring-slate-200",
    };
  }

  return {
    icon: "bg-slate-950 text-white ring-slate-950",
  };
}

function CalendarDayModal({
  selectedCalendarDay,
  onClose,
}: {
  selectedCalendarDay: CalendarDaySummary;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
              Booking Details
            </p>

            <h3 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
              {formatDateOnly(selectedCalendarDay.date)} ·{" "}
              {formatWeekday(selectedCalendarDay.date)}
            </h3>

            <p className="mt-2 text-sm font-bold text-slate-500">
              รายละเอียดห้องว่าง ห้องที่จองจาก Gorilla, Rhino และห้องที่ล็อกไว้
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
          >
            <XCircle size={18} className="text-white" />
            <span className="text-white">ปิด</span>
          </button>
        </div>

        <div className="max-h-[calc(88vh-120px)] overflow-y-auto p-5 sm:p-6">
          <div className="mb-5 grid gap-3 sm:grid-cols-5">
            <SmallScheduleMetric
              label="ว่างรวม"
              value={selectedCalendarDay.totalAvailable}
            />
            <SmallScheduleMetric
              label="Gorilla"
              value={selectedCalendarDay.totalLocalCustomerBooked}
            />
            <SmallScheduleMetric
              label="Rhino"
              value={selectedCalendarDay.totalCentralRhinoBooked}
            />
            <SmallScheduleMetric
              label="ล็อกไว้"
              value={selectedCalendarDay.totalReserved}
            />
            <SmallScheduleMetric
              label="รวมใช้ไป"
              value={selectedCalendarDay.totalBooked}
            />
          </div>

          <div className="grid gap-4">
            {selectedCalendarDay.rooms.map((roomDay) => {
              const roomIsFull = roomDay.availableCount <= 0;
              const roomHasBooking = roomDay.bookedCount > 0;

              return (
                <section
                  key={roomDay.room.id}
                  className={[
                    "rounded-[1.75rem] p-4 ring-1 sm:p-5",
                    roomIsFull
                      ? "bg-red-50 ring-red-100"
                      : roomHasBooking
                        ? "bg-amber-50 ring-amber-100"
                        : "bg-emerald-50 ring-emerald-100",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h4 className="text-xl font-black text-slate-950">
                        {roomDay.room.name}
                      </h4>

                      <p className="mt-1 text-sm font-bold text-slate-500">
                        ทั้งหมด {roomDay.totalRooms} ห้อง · ว่าง{" "}
                        {roomDay.availableCount} ห้อง · Gorilla จอง{" "}
                        {roomDay.localBookedCount} ห้อง · Rhino จอง{" "}
                        {roomDay.centralRhinoBookedCount} ห้อง · ล็อก{" "}
                        {roomDay.reservedRooms} ห้อง
                      </p>
                    </div>

                    <span
                      className={[
                        "inline-flex w-fit rounded-2xl px-4 py-2 text-sm font-black ring-1",
                        roomIsFull
                          ? "bg-red-100 text-red-700 ring-red-200"
                          : roomHasBooking
                            ? "bg-amber-100 text-amber-700 ring-amber-200"
                            : "bg-emerald-100 text-emerald-700 ring-emerald-200",
                      ].join(" ")}
                    >
                      {roomIsFull
                        ? "ห้องเต็ม"
                        : `เหลือ ${roomDay.availableCount} ห้อง`}
                    </span>
                  </div>

                  {roomDay.centralRhinoBookedCount > 0 && (
                    <div className="mt-4 rounded-2xl bg-orange-100 p-4 text-sm font-black text-orange-700 ring-1 ring-orange-200">
                      มีรายการจองจาก Rhino จำนวน {roomDay.centralRhinoBookedCount}{" "}
                      ห้อง ระบบนำมาหักจำนวนห้องว่างของ Gorilla แล้ว
                    </div>
                  )}

                  {roomDay.bookings.length === 0 ? (
                    <div className="mt-4 rounded-2xl bg-white/70 p-4 text-center text-sm font-black text-slate-500 ring-1 ring-white">
                      ไม่มีลูกค้าจองจาก Gorilla ในห้องประเภทนี้วันนี้
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-3">
                      {roomDay.bookings.map((booking) => {
                        const statusInfo = getStatusInfo(booking.status);
                        const paymentInfo = getPaymentStatusInfo(
                          booking.paymentStatus,
                        );
                        const StatusIcon = statusInfo.icon;
                        const PaymentIcon = paymentInfo.icon;

                        return (
                          <Link
                            key={booking.id}
                            href={`/admin/bookings/${booking.id}`}
                            className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                              <div className="min-w-0">
                                <p className="truncate text-lg font-black text-slate-950">
                                  {booking.displayName || "ลูกค้า"}
                                </p>

                                <p className="mt-1 truncate text-sm font-bold text-slate-500">
                                  {booking.bookingCode || `#${booking.id}`} ·{" "}
                                  {Math.max(Number(booking.roomCount || 1), 1)}{" "}
                                  ห้อง · โทร {booking.phone || "-"}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2 lg:justify-end">
                                <span
                                  className={[
                                    "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black ring-1",
                                    statusInfo.className,
                                  ].join(" ")}
                                >
                                  <StatusIcon
                                    size={15}
                                    className={statusInfo.iconClass}
                                  />
                                  {statusInfo.label}
                                </span>

                                {booking.paymentStatus !== "REJECTED" && (
                                  <span
                                    className={[
                                      "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black ring-1",
                                      paymentInfo.className,
                                    ].join(" ")}
                                  >
                                    <PaymentIcon
                                      size={15}
                                      className={paymentInfo.iconClass}
                                    />
                                    {paymentInfo.label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function LatestBookingsSection({
  latestBookings,
}: {
  latestBookings: BookingItem[];
}) {
  return (
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
              รายการล่าสุดที่ลูกค้าส่งเข้ามาในระบบจอง Gorilla
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
              const paymentInfo = getPaymentStatusInfo(booking.paymentStatus);
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
    </section>
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
  tone: "green" | "amber" | "orange" | "red" | "slate";
  label: string;
  detail: string;
}) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 ring-emerald-100 text-emerald-700"
      : tone === "amber"
        ? "bg-amber-50 ring-amber-100 text-amber-700"
        : tone === "orange"
          ? "bg-orange-50 ring-orange-100 text-orange-700"
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
  const valueClass =
    label === "Rhino" && value > 0
      ? "text-orange-600"
      : label === "จอง" && value > 0
        ? "text-red-600"
        : label === "Gorilla" && value > 0
          ? "text-red-600"
          : "text-slate-950";

  return (
    <div className="rounded-xl bg-slate-100 px-2 py-2">
      <p className="text-[10px] font-bold text-slate-500">{label}</p>
      <p className={["text-base font-black", valueClass].join(" ")}>
        {value}
      </p>
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