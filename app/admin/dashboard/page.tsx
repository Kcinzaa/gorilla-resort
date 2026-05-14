"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
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
  Loader2,
  ReceiptText,
  RefreshCcw,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
type PaymentStatus = "UNPAID" | "PENDING" | "PAID" | "REJECTED";

type BookingItem = {
  id: number | string;
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
  source?: "gorilla" | "rhino";

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
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [availabilityByDate, setAvailabilityByDate] = useState<AvailabilityByDate>({});

  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState("");

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [selectedCalendarDay, setSelectedCalendarDay] = useState<CalendarDaySummary | null>(null);

  const pendingBookings = useMemo(() => bookings.filter((b) => b.status === "PENDING"), [bookings]);
  const confirmedBookings = useMemo(() => bookings.filter((b) => b.status === "CONFIRMED"), [bookings]);
  const cancelledBookings = useMemo(() => bookings.filter((b) => b.status === "CANCELLED"), [bookings]);
  const paymentPendingBookings = useMemo(() => bookings.filter((b) => b.paymentStatus === "PENDING"), [bookings]);
  const unpaidBookings = useMemo(() => bookings.filter((b) => !b.paymentStatus || b.paymentStatus === "UNPAID"), [bookings]);

  const activeRooms = useMemo(() => rooms.filter((r) => r.isActive !== false), [rooms]);

  const totalRoomCount = useMemo(
    () => activeRooms.reduce((sum, room) => sum + Number(room.totalRooms ?? 1), 0),
    [activeRooms],
  );

  const estimatedRevenue = useMemo(
    () => confirmedBookings.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0),
    [confirmedBookings],
  );

  const pendingDepositTotal = useMemo(
    () => paymentPendingBookings.reduce((sum, b) => sum + Number(b.depositAmount || 0), 0),
    [paymentPendingBookings],
  );

  const latestBookings = useMemo(
    () =>
      [...bookings]
        .sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime())
        .slice(0, 10),
    [bookings],
  );

  const scheduleDates = useMemo(() => {
    const start = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const end = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    return Array.from({ length: end.getDate() }, (_, i) => addDays(start, i));
  }, [calendarMonth]);

  const calendarLeadingDays = useMemo(
    () => new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay(),
    [calendarMonth],
  );

  const calendarMonthLabel = useMemo(() => formatMonthLabel(calendarMonth), [calendarMonth]);

  const activeScheduleBookings = useMemo(
    () => bookings.filter((b) => b.status !== "CANCELLED"),
    [bookings],
  );

  const monthlyCalendarDays = useMemo<CalendarDaySummary[]>(() => {
    return scheduleDates.map((date) => {
      const dateKey = formatInputDate(date);
      const dayAvailability = availabilityByDate[dateKey] || {};

      const roomSummaries = activeRooms.map((room) => {
        const roomBookings = activeScheduleBookings.filter(
          (b) => b.roomType?.id === room.id && isDateInBooking(date, b),
        );

        const localBookedFromBookings = roomBookings
          .filter((b) => b.source !== "rhino")
          .reduce((sum, b) => sum + Math.max(Number(b.roomCount || 1), 1), 0);

        const apiRoom = dayAvailability[room.id];
        const totalRooms = Number(apiRoom?.totalRooms ?? room.totalRooms ?? 1);
        const reservedRooms = Math.min(Math.max(Number(apiRoom?.reservedRooms ?? room.reservedRooms ?? 0), 0), totalRooms);
        const localBookedCount = Number(apiRoom?.localBookedRooms ?? localBookedFromBookings);

        const rhinoBookedFromBookings = roomBookings
          .filter((b) => b.source === "rhino")
          .reduce((sum, b) => sum + Math.max(Number(b.roomCount || 1), 1), 0);

        const centralRhinoBookedCount = Math.max(Number(apiRoom?.centralRhinoBookedRooms ?? 0), rhinoBookedFromBookings);
        const realBookedCount = Number(apiRoom?.realBookedRooms ?? localBookedCount + centralRhinoBookedCount);
        const bookedCount = Math.max(Number(apiRoom?.bookedRooms ?? 0), reservedRooms + realBookedCount);
        const availableCount = Math.max(Number(apiRoom?.availableRooms ?? totalRooms - bookedCount), 0);

        return { room, bookings: roomBookings, totalRooms, reservedRooms, localBookedCount, centralRhinoBookedCount, realBookedCount, bookedCount, availableCount };
      });

      const totalRooms = roomSummaries.reduce((s, i) => s + i.totalRooms, 0);
      const totalAvailable = roomSummaries.reduce((s, i) => s + i.availableCount, 0);
      const totalBooked = roomSummaries.reduce((s, i) => s + i.bookedCount, 0);
      const totalCustomerBooked = roomSummaries.reduce((s, i) => s + i.realBookedCount, 0);
      const totalLocalCustomerBooked = roomSummaries.reduce((s, i) => s + i.localBookedCount, 0);
      const totalCentralRhinoBooked = roomSummaries.reduce((s, i) => s + i.centralRhinoBookedCount, 0);
      const totalReserved = roomSummaries.reduce((s, i) => s + i.reservedRooms, 0);

      return {
        date,
        rooms: roomSummaries,
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

  const dashboardSummaryDay = useMemo(() => {
    if (selectedCalendarDay) return selectedCalendarDay;
    const todayKey = formatInputDate(new Date());
    return monthlyCalendarDays.find((d) => formatInputDate(d.date) === todayKey) ?? monthlyCalendarDays[0] ?? null;
  }, [monthlyCalendarDays, selectedCalendarDay]);

  const dashboardSummaryLabel = useMemo(() => {
    if (!dashboardSummaryDay) return "วันที่เลือก";
    if (selectedCalendarDay) return `วันที่เลือก ${formatDateOnly(selectedCalendarDay.date)}`;
    const todayKey = formatInputDate(new Date());
    const summaryKey = formatInputDate(dashboardSummaryDay.date);
    if (summaryKey === todayKey) return "วันนี้";
    return `${formatDateOnly(dashboardSummaryDay.date)} (วันแรกของเดือนที่เปิดอยู่)`;
  }, [dashboardSummaryDay, selectedCalendarDay]);

  const dashboardSummary = useMemo(
    () => ({
      totalAvailable: dashboardSummaryDay?.totalAvailable ?? 0,
      totalBooked: dashboardSummaryDay?.totalBooked ?? 0,
      totalReserved: dashboardSummaryDay?.totalReserved ?? 0,
      totalCentralRhinoBooked: dashboardSummaryDay?.totalCentralRhinoBooked ?? 0,
      totalLocalCustomerBooked: dashboardSummaryDay?.totalLocalCustomerBooked ?? 0,
    }),
    [dashboardSummaryDay],
  );

  function goToPreviousMonth() {
    setSelectedCalendarDay(null);
    setCalendarMonth((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setSelectedCalendarDay(null);
    setCalendarMonth((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  }

  function goToCurrentMonth() {
    setSelectedCalendarDay(null);
    const today = new Date();
    setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  function exportBookingsCsv() {
    const headers = ["Booking Code", "Customer", "Phone", "Room", "Check In", "Check Out", "Room Count", "Total Price", "Booking Status", "Payment Status", "Payment Method", "Payment Slip URL", "Created At"];
    const rows = bookings.map((b) => [
      b.bookingCode || `BOOKING-${b.id}`,
      b.displayName || "",
      b.phone || "",
      b.roomType?.name || "",
      b.checkIn || "",
      b.checkOut || "",
      Math.max(Number(b.roomCount || 1), 1),
      b.totalPrice || 0,
      b.status || "",
      b.paymentStatus || "",
      b.paymentMethod || "",
      b.paymentSlipUrl || "",
      b.createdAt || "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
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
        const response = await fetch(url, { method: "GET", cache: "no-store", credentials: "include" });
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) { await response.text(); continue; }
        const result = await response.json();
        if (response.ok) return result;
      } catch (err) {
        console.warn(`โหลดข้อมูลจาก ${url} ไม่สำเร็จ`, err);
      }
    }
    return { success: true, data: [], message: "ไม่พบข้อมูลจาก API" };
  }

  async function loadMonthAvailability(month: Date, options?: { silent?: boolean }) {
    try {
      if (!options?.silent) setAvailabilityLoading(true);
      const start = new Date(month.getFullYear(), month.getMonth(), 1);
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      const dates = Array.from({ length: end.getDate() }, (_, i) => addDays(start, i));

      const entries = await Promise.all(
        dates.map(async (date) => {
          const checkIn = formatInputDate(date);
          const checkOut = formatInputDate(addDays(date, 1));
          try {
            const response = await fetch(
              `/api/rooms?adminOwnOnly=1&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`,
              { cache: "no-store", credentials: "include" },
            );
            const result = await response.json().catch(() => ({}));
            if (!response.ok || result.success === false) return [checkIn, {}] as const;
            const apiRooms = toArray<AvailabilityApiRoom>(result);
            const mapByRoomId: Record<number, AvailabilityApiRoom> = {};
            apiRooms.forEach((room) => { mapByRoomId[Number(room.id)] = room; });
            return [checkIn, mapByRoomId] as const;
          } catch {
            return [checkIn, {}] as const;
          }
        }),
      );

      setAvailabilityByDate(Object.fromEntries(entries));
    } finally {
      if (!options?.silent) setAvailabilityLoading(false);
    }
  }

  async function loadDashboard(options?: { silent?: boolean }) {
    try {
      if (!options?.silent) setLoading(true);
      setError("");

      const [bookingResult, roomResult] = await Promise.all([
        fetchJsonWithFallback(["/api/admin/bookings"]),
        fetchJsonWithFallback(["/api/admin/rooms", "/api/rooms"]),
      ]);

      setBookings(toArray<BookingItem>(bookingResult));
      setRooms(toArray<RoomItem>(roomResult));
    } catch (err) {
      console.warn("Dashboard load failed:", err);
      if (!options?.silent) setError("เกิดข้อผิดพลาดในการโหลดข้อมูล Dashboard");
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    loadMonthAvailability(calendarMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadMonthAvailability(calendarMonth);
  }, [calendarMonth]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="รายการจองทั้งหมด"
          value={bookings.length}
          icon={<CalendarCheck size={24} className="text-slate-700" />}
          iconBg="bg-slate-100 ring-slate-200"
        />
        <StatCard
          title="รอตรวจสอบ"
          value={pendingBookings.length}
          icon={<Clock3 size={24} className="text-amber-600" />}
          iconBg="bg-amber-50 ring-amber-100"
        />
        <StatCard
          title="ยืนยันแล้ว"
          value={confirmedBookings.length}
          icon={<CheckCircle2 size={24} className="text-emerald-600" />}
          iconBg="bg-emerald-50 ring-emerald-100"
        />
        <StatCard
          title="รายได้ที่ยืนยัน"
          value={formatCurrency(estimatedRevenue)}
          icon={<Wallet size={24} className="text-blue-600" />}
          iconBg="bg-blue-50 ring-blue-100"
        />
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/bookings"
          className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div>
            <p className="font-black text-slate-900">จัดการการจอง</p>
            <p className="mt-1 text-sm text-slate-500">ดู / ยืนยัน / ยกเลิก</p>
          </div>
          <CalendarCheck size={22} className="text-emerald-600" />
        </Link>

        <Link
          href="/admin/rooms"
          className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div>
            <p className="font-black text-slate-900">จัดการห้องพัก</p>
            <p className="mt-1 text-sm text-slate-500">เพิ่ม / แก้ไข ห้อง</p>
          </div>
          <BedDouble size={22} className="text-emerald-600" />
        </Link>

        <div className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div>
            <p className="font-black text-slate-900">ห้องว่างวันนี้</p>
            <p className="mt-1 text-sm text-slate-500">อิง {dashboardSummaryLabel}</p>
          </div>
          <span className="text-3xl font-black text-emerald-600">{dashboardSummary.totalAvailable}</span>
        </div>
      </div>

      {/* Error */}
      {!loading && error && (
        <div className="mt-6 flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertCircle size={24} />
          </div>
          <div className="flex-1">
            <p className="font-black text-red-700">โหลด Dashboard ไม่สำเร็จ</p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => { loadDashboard(); loadMonthAvailability(calendarMonth); }}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
          >
            <RefreshCcw size={16} />
            โหลดใหม่
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <Loader2 size={36} className="animate-spin text-emerald-600" />
          <p className="mt-4 font-bold text-slate-600">กำลังโหลดข้อมูล Dashboard...</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Calendar section */}
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-600">Monthly Calendar</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">ปฏิทินการจองห้องพัก</h2>
                {availabilityLoading && (
                  <p className="mt-1 flex items-center gap-2 text-sm font-bold text-amber-600">
                    <Loader2 size={14} className="animate-spin" />
                    กำลังอัปเดตห้องว่าง...
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                  <button type="button" onClick={goToPreviousMonth} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="min-w-36 text-center text-sm font-black text-slate-900">{calendarMonthLabel}</span>
                  <button type="button" onClick={goToNextMonth} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50">
                    <ChevronRight size={18} />
                  </button>
                </div>

                <button type="button" onClick={goToCurrentMonth} className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50">
                  เดือนนี้
                </button>

                <button type="button" onClick={() => loadMonthAvailability(calendarMonth)} className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-700">
                  <RefreshCcw size={15} />
                  รีเฟรช
                </button>

                <button type="button" onClick={exportBookingsCsv} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-700">
                  <Download size={15} />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Calendar legend */}
            <div className="mb-4 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-lg bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100">ว่าง</span>
              <span className="rounded-lg bg-amber-50 px-3 py-1 text-amber-700 ring-1 ring-amber-100">มีจอง</span>
              <span className="rounded-lg bg-red-50 px-3 py-1 text-red-700 ring-1 ring-red-100">เต็ม</span>
            </div>

            {/* Calendar grid */}
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-7 bg-slate-900 text-center text-xs font-black text-white">
                {["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."].map((d) => (
                  <div key={d} className="border-l border-slate-700 px-1 py-3 first:border-l-0">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px bg-slate-200">
                {Array.from({ length: calendarLeadingDays }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-24 bg-slate-50" />
                ))}

                {monthlyCalendarDays.map((day) => {
                  const isToday = isSameCalendarDate(day.date, new Date());
                  return (
                    <button
                      type="button"
                      key={day.date.toISOString()}
                      onClick={() => setSelectedCalendarDay(day)}
                      className={[
                        "min-h-24 bg-white p-2 text-left transition hover:bg-slate-50",
                        day.isFull ? "border-t-2 border-red-400" : day.hasBooking ? "border-t-2 border-amber-400" : "border-t-2 border-emerald-400",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between">
                        <span className={["inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm font-black", isToday ? "bg-slate-900 text-white" : "text-slate-900"].join(" ")}>
                          {day.date.getDate()}
                        </span>
                        <span className={["text-xs font-black", day.isFull ? "text-red-600" : day.hasBooking ? "text-amber-600" : "text-emerald-600"].join(" ")}>
                          {day.totalAvailable}
                        </span>
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-1">
                        <div className="rounded bg-slate-100 px-1 py-0.5 text-center text-[10px] font-bold text-slate-600">
                          จอง {day.totalLocalCustomerBooked}
                        </div>
                        <div className="rounded bg-slate-100 px-1 py-0.5 text-center text-[10px] font-bold text-slate-600">
                          ล็อก {day.totalReserved}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Calendar day detail modal */}
          {selectedCalendarDay && (
            <CalendarDayModal
              selectedCalendarDay={selectedCalendarDay}
              onClose={() => setSelectedCalendarDay(null)}
            />
          )}

          {/* Latest bookings */}
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-600">Latest Bookings</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">รายการจองล่าสุด</h2>
              </div>
              <Link href="/admin/bookings" className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700">
                ดูทั้งหมด <ArrowRight size={16} />
              </Link>
            </div>

            {latestBookings.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-xl bg-slate-50 text-center ring-1 ring-slate-200">
                <CalendarCheck size={36} className="text-slate-300" />
                <p className="mt-3 font-bold text-slate-500">ยังไม่มีรายการจอง</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {latestBookings.map((booking) => {
                  const statusInfo = getStatusInfo(booking.status);
                  const paymentInfo = getPaymentStatusInfo(booking.paymentStatus);
                  const StatusIcon = statusInfo.icon;
                  const PaymentIcon = paymentInfo.icon;

                  return (
                    <div key={booking.id} className="flex items-center gap-4 py-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
                        {booking.pictureUrl ? (
                          <img src={booking.pictureUrl} alt={booking.displayName || "customer"} className="h-full w-full object-cover" />
                        ) : (
                          <Users size={20} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-900">{booking.displayName || "ลูกค้า"}</p>
                        <p className="truncate text-sm text-slate-500">
                          {booking.roomType?.name || "ห้องพัก"} · {formatDateTime(booking.createdAt)}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <span className={["inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-black ring-1", statusInfo.className].join(" ")}>
                          <StatusIcon size={13} className={statusInfo.iconClass} />
                          {statusInfo.label}
                        </span>
                        <span className={["inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-black ring-1", paymentInfo.className].join(" ")}>
                          <PaymentIcon size={13} className={paymentInfo.iconClass} />
                          {paymentInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  iconBg,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBg: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className={["flex h-12 w-12 items-center justify-center rounded-xl ring-1", iconBg].join(" ")}>
        {icon}
      </div>
      <p className="mt-4 text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function CalendarDayModal({
  selectedCalendarDay,
  onClose,
}: {
  selectedCalendarDay: CalendarDaySummary;
  onClose: () => void;
}) {
  function getStatusInfo(status?: string) {
    if (status === "CONFIRMED") return { label: "ยืนยันแล้ว", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 ring-emerald-100", iconClass: "text-emerald-600" };
    if (status === "CANCELLED") return { label: "ยกเลิกแล้ว", icon: XCircle, className: "bg-red-50 text-red-700 ring-red-100", iconClass: "text-red-600" };
    return { label: "รอตรวจสอบ", icon: Clock3, className: "bg-amber-50 text-amber-700 ring-amber-100", iconClass: "text-amber-600" };
  }

  function getPaymentStatusInfo(status?: string | null) {
    if (status === "PAID") return { label: "ชำระแล้ว", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 ring-emerald-100", iconClass: "text-emerald-600" };
    if (status === "REJECTED") return { label: "ปฏิเสธสลิป", icon: XCircle, className: "bg-red-50 text-red-700 ring-red-100", iconClass: "text-red-600" };
    if (status === "PENDING") return { label: "รอตรวจสลิป", icon: Clock3, className: "bg-amber-50 text-amber-700 ring-amber-100", iconClass: "text-amber-600" };
    return { label: "ยังไม่ชำระ", icon: ReceiptText, className: "bg-slate-100 text-slate-700 ring-slate-200", iconClass: "text-slate-500" };
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-600">Booking Details</p>
            <h3 className="mt-1 text-2xl font-black text-slate-900">
              {formatDateOnly(selectedCalendarDay.date)} · {formatWeekday(selectedCalendarDay.date)}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-600 transition hover:bg-slate-300"
          >
            <XCircle size={20} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-5">
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "ว่างรวม", value: selectedCalendarDay.totalAvailable },
              { label: "Gorilla จอง", value: selectedCalendarDay.totalLocalCustomerBooked },
              { label: "รอตรวจ", value: selectedCalendarDay.totalBooked },
              { label: "ล็อกไว้", value: selectedCalendarDay.totalReserved },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 text-center">
                <p className="text-xs font-bold text-slate-500">{item.label}</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4">
            {selectedCalendarDay.rooms.map((roomDay) => {
              const roomIsFull = roomDay.availableCount <= 0;
              const roomHasBooking = roomDay.bookedCount > 0;

              return (
                <div
                  key={roomDay.room.id}
                  className={[
                    "rounded-xl p-4 ring-1",
                    roomIsFull ? "bg-red-50 ring-red-100" : roomHasBooking ? "bg-amber-50 ring-amber-100" : "bg-emerald-50 ring-emerald-100",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-black text-slate-900">{roomDay.room.name}</h4>
                      <p className="mt-0.5 text-sm text-slate-500">
                        ทั้งหมด {roomDay.totalRooms} · ว่าง {roomDay.availableCount} · จอง {roomDay.localBookedCount} · ล็อก {roomDay.reservedRooms}
                      </p>
                    </div>
                    <span className={["rounded-lg px-3 py-1 text-xs font-black ring-1", roomIsFull ? "bg-red-100 text-red-700 ring-red-200" : roomHasBooking ? "bg-amber-100 text-amber-700 ring-amber-200" : "bg-emerald-100 text-emerald-700 ring-emerald-200"].join(" ")}>
                      {roomIsFull ? "ห้องเต็ม" : `เหลือ ${roomDay.availableCount} ห้อง`}
                    </span>
                  </div>

                  {roomDay.bookings.length > 0 && (
                    <div className="mt-3 grid gap-2">
                      {roomDay.bookings.map((booking) => {
                        const statusInfo = getStatusInfo(booking.status);
                        const paymentInfo = getPaymentStatusInfo(booking.paymentStatus);
                        const StatusIcon = statusInfo.icon;
                        const PaymentIcon = paymentInfo.icon;

                        return (
                          <Link
                            key={booking.id}
                            href={booking.source === "rhino" ? "https://rhino-camp.vercel.app/admin/login" : `/admin/bookings/${booking.id}`}
                            target={booking.source === "rhino" ? "_blank" : undefined}
                            className="block rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-bold text-slate-900">{booking.displayName || "ลูกค้า"}</p>
                                <p className="truncate text-sm text-slate-500">{booking.bookingCode || `#${booking.id}`} · {Math.max(Number(booking.roomCount || 1), 1)} ห้อง</p>
                              </div>
                              <div className="flex gap-2">
                                <span className={["inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-black ring-1", statusInfo.className].join(" ")}>
                                  <StatusIcon size={12} className={statusInfo.iconClass} />
                                  {statusInfo.label}
                                </span>
                                <span className={["inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-black ring-1", paymentInfo.className].join(" ")}>
                                  <PaymentIcon size={12} className={paymentInfo.iconClass} />
                                  {paymentInfo.label}
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {roomDay.bookings.length === 0 && (
                    <p className="mt-3 rounded-lg bg-white/70 py-3 text-center text-sm font-bold text-slate-500 ring-1 ring-white">
                      ไม่มีลูกค้าจองจาก Gorilla วันนี้
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDateOnly(date: Date) {
  return new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "short" }).format(date);
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("th-TH", { weekday: "short" }).format(date);
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" }).format(date);
}

function isSameCalendarDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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
