"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
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
  Search,
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

function getStatusInfo(status?: string) {
  if (status === "CONFIRMED") {
    return {
      label: "ยืนยันแล้ว",
      icon: CheckCircle2,
      badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      iconClass: "text-emerald-600",
      cardClass: "border-emerald-200",
    };
  }

  if (status === "CANCELLED") {
    return {
      label: "ยกเลิกแล้ว",
      icon: XCircle,
      badgeClass: "bg-red-50 text-red-700 ring-red-100",
      iconClass: "text-red-600",
      cardClass: "border-red-200",
    };
  }

  return {
    label: "รอตรวจสอบ",
    icon: Clock3,
    badgeClass: "bg-amber-50 text-amber-700 ring-amber-100",
    iconClass: "text-amber-600",
    cardClass: "border-amber-200",
  };
}

function getPaymentStatusInfo(status?: string | null) {
  if (status === "PAID") {
    return {
      label: "ชำระแล้ว",
      description: "แอดมินตรวจสอบและยืนยันการชำระเงินแล้ว",
      icon: CheckCircle2,
      badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      iconClass: "text-emerald-600",
      cardClass: "border-emerald-200 bg-emerald-50",
    };
  }

  if (status === "REJECTED") {
    return {
      label: "ปฏิเสธสลิป",
      description: "ข้อมูลสลิปไม่ถูกต้อง",
      icon: XCircle,
      badgeClass: "bg-red-50 text-red-700 ring-red-100",
      iconClass: "text-red-600",
      cardClass: "border-red-200 bg-red-50",
    };
  }

  if (status === "PENDING") {
    return {
      label: "แจ้งชำระแล้ว",
      description: "ลูกค้าแนบสลิปแล้ว ใช้ปุ่มยืนยันห้องหรือไม่ยืนยันห้อง",
      icon: Clock3,
      badgeClass: "bg-amber-50 text-amber-700 ring-amber-100",
      iconClass: "text-amber-600",
      cardClass: "border-amber-200 bg-amber-50",
    };
  }

  return {
    label: "ยังไม่ชำระ",
    description: "ยังไม่มีข้อมูลการชำระเงิน",
    icon: CreditCard,
    badgeClass: "bg-slate-100 text-slate-700 ring-slate-200",
    iconClass: "text-slate-600",
    cardClass: "border-slate-200 bg-slate-50",
  };
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

function AdminStatCard({
  icon: Icon,
  iconClass,
  label,
  value,
}: {
  icon: typeof Clock3;
  iconClass: string;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div
        className={[
          "flex h-14 w-14 items-center justify-center rounded-2xl ring-1",
          iconClass,
        ].join(" ")}
      >
        <Icon size={26} />
      </div>
      <p className="mt-5 text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-black text-slate-950">{value}</p>
    </div>
  );
}

export default function AdminBookingsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [newBookingNotice, setNewBookingNotice] = useState<BookingItem | null>(
    null
  );
  const knownBookingIdsRef = useRef<Set<number>>(new Set());
  const hasLoadedBookingsRef = useRef(false);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | BookingStatus>(
    "ALL"
  );
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | PaymentStatus>(
    "ALL"
  );

  const pendingCount = useMemo(() => {
    return bookings.filter((booking) => booking.status === "PENDING").length;
  }, [bookings]);

  const confirmedCount = useMemo(() => {
    return bookings.filter((booking) => booking.status === "CONFIRMED").length;
  }, [bookings]);

  const cancelledCount = useMemo(() => {
    return bookings.filter((booking) => booking.status === "CANCELLED").length;
  }, [bookings]);

  const paymentPendingCount = useMemo(() => {
    return bookings.filter((booking) => booking.paymentStatus === "PENDING")
      .length;
  }, [bookings]);

  const paidCount = useMemo(() => {
    return bookings.filter((booking) => booking.paymentStatus === "PAID").length;
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchStatus =
        statusFilter === "ALL" || booking.status === statusFilter;

      const matchPayment =
        paymentFilter === "ALL" || booking.paymentStatus === paymentFilter;

      const searchableText = [
        booking.bookingCode,
        booking.displayName,
        booking.phone,
        booking.roomType?.name,
        booking.status,
        booking.paymentStatus,
        booking.paymentMethod,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchKeyword =
        !normalizedKeyword || searchableText.includes(normalizedKeyword);

      return matchStatus && matchPayment && matchKeyword;
    });
  }, [bookings, keyword, statusFilter, paymentFilter]);

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

  async function fetchBookings(options?: { silent?: boolean; notify?: boolean }) {
    try {
      if (!options?.silent) setLoading(true);
      setError("");

      const response = await fetch("/api/admin/bookings", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

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

      applyBookingsUpdate(toArray<BookingItem>(result), Boolean(options?.notify));
    } catch (err) {
      console.warn(err);
      if (!options?.silent) {
        setError("เกิดข้อผิดพลาดในการโหลดรายการจอง");
      }
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "ไม่สามารถอัปเดตสถานะได้");
        return;
      }

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === id
            ? {
                ...booking,
                status,
                updatedAt: new Date().toISOString(),
              }
            : booking
        )
      );
    } catch (err) {
      console.warn(err);
      setError("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    } finally {
      setUpdatingId(null);
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
    fetchBookings();

    const intervalId = window.setInterval(() => {
      fetchBookings({ silent: true, notify: true });
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
                <CalendarCheck size={25} className="text-white" />
              </div>

              <div>
                <h1 className="text-lg font-black text-slate-950">
                  Admin Bookings
                </h1>
                <p className="text-sm text-slate-500">
                  จัดการรายการจองและตรวจสอบการชำระเงิน
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap gap-2">
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                <LayoutDashboard size={17} className="text-slate-700" />
                <span className="text-slate-700">Dashboard</span>
              </Link>

              <Link
                href="/admin/bookings"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                <CalendarCheck size={17} className="text-white" />
                <span className="text-white">Bookings</span>
              </Link>

              <Link
                href="/admin/rooms"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                <BedDouble size={17} className="text-slate-700" />
                <span className="text-slate-700">Rooms</span>
              </Link>

              <Link
                href="/rooms"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                <Home size={17} className="text-slate-700" />
                <span className="text-slate-700">ไปหน้าห้องพัก</span>
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <AdminStatCard
            icon={Clock3}
            iconClass="bg-amber-50 text-amber-600 ring-amber-100"
            label="รอตรวจสอบการจอง"
            value={pendingCount}
          />
          <AdminStatCard
            icon={CheckCircle2}
            iconClass="bg-emerald-50 text-emerald-600 ring-emerald-100"
            label="ยืนยันแล้ว"
            value={confirmedCount}
          />
          <AdminStatCard
            icon={XCircle}
            iconClass="bg-red-50 text-red-600 ring-red-100"
            label="ยกเลิก"
            value={cancelledCount}
          />
          <AdminStatCard
            icon={Banknote}
            iconClass="bg-emerald-50 text-emerald-600 ring-emerald-100"
            label="ชำระแล้ว"
            value={paidCount}
          />
        </section>

        <section className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-6">
          <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto_auto] xl:items-center">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, รหัสจอง, ห้องพัก..."
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "ALL" | BookingStatus)
              }
              className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
            >
              <option value="ALL">ทุกสถานะจอง</option>
              <option value="PENDING">รอตรวจสอบ</option>
              <option value="CONFIRMED">ยืนยันแล้ว</option>
              <option value="CANCELLED">ยกเลิกแล้ว</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(event) =>
                setPaymentFilter(event.target.value as "ALL" | PaymentStatus)
              }
              className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
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
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <RefreshCcw size={18} className="text-white" />
              <span className="text-white">โหลดใหม่</span>
            </button>
          </div>
        </section>

        {error && (
          <section className="mt-5 rounded-[2rem] border border-red-200 bg-red-50 p-5 shadow-sm sm:rounded-[2.5rem]">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <AlertCircle size={28} />
              </div>

              <div>
                <h2 className="text-xl font-black text-red-700">
                  เกิดข้อผิดพลาด
                </h2>
                <p className="mt-2 text-sm leading-6 text-red-600">{error}</p>
              </div>
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

        {loading && (
          <section className="mt-5 flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
              <Loader2 size={38} className="animate-spin" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              กำลังโหลดรายการจอง
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              กรุณารอสักครู่ ระบบกำลังดึงข้อมูลรายการจองทั้งหมด
            </p>
          </section>
        )}

        {!loading && filteredBookings.length === 0 && (
          <section className="mt-5 flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
              <CalendarCheck size={38} />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              ไม่พบรายการจอง
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              ยังไม่มีรายการจอง หรือไม่มีรายการที่ตรงกับเงื่อนไขการค้นหา
            </p>
          </section>
        )}

        {!loading && filteredBookings.length > 0 && (
          <section className="mt-5 grid gap-5">
            {filteredBookings.map((booking) => {
              const statusInfo = getStatusInfo(booking.status);
              const paymentInfo = getPaymentStatusInfo(booking.paymentStatus);
              const StatusIcon = statusInfo.icon;
              const PaymentIcon = paymentInfo.icon;

              const nights = calculateNights(booking.checkIn, booking.checkOut);

              const estimatedTotal =
                booking.totalPrice ||
                (booking.roomType?.pricePerNight || 0) *
                  nights *
                  Math.max(Number(booking.roomCount || 1), 1);

              return (
                <article
                  key={booking.id}
                  className={[
                    "overflow-hidden rounded-[2rem] border bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200 sm:rounded-[2.5rem]",
                    statusInfo.cardClass,
                  ].join(" ")}
                >
                  <div className="grid lg:grid-cols-[320px_1fr]">
                    <div className="relative min-h-64 overflow-hidden bg-slate-200">
                      {booking.roomType?.imageUrl ? (
                        <img
                          src={booking.roomType.imageUrl}
                          alt={booking.roomType.name}
                          className="h-full min-h-64 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full min-h-64 w-full items-center justify-center text-slate-400">
                          <Hotel size={44} />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

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
                        <p className="text-2xl font-black text-white">
                          {booking.roomType?.name || "ห้องพัก"}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-200">
                          สร้างเมื่อ {formatDateTime(booking.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Booking Code
                          </p>
                          <h2 className="mt-1 break-all text-2xl font-black text-slate-950">
                            {booking.bookingCode || `BOOKING-${booking.id}`}
                          </h2>

                          <div className="mt-4 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-400">
                              {booking.pictureUrl ? (
                                <img
                                  src={booking.pictureUrl}
                                  alt={booking.displayName || "customer"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Users size={24} />
                              )}
                            </div>

                            <div>
                              <p className="font-black text-slate-950">
                                {booking.displayName || "ลูกค้า"}
                              </p>
                              <p className="text-sm text-slate-500">
                                LINE Customer
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 xl:items-end">
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

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                            จำนวนห้อง
                          </p>
                          <p className="mt-1 font-black text-slate-950">
                            {Math.max(Number(booking.roomCount || 1), 1)} ห้อง
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
                      </div>

                      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr]">
                        <div className="rounded-[1.5rem] bg-slate-950 p-4 text-white">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                ราคารวมโดยประมาณ
                              </p>
                              <p className="mt-1 text-2xl font-black text-white">
                                {estimatedTotal > 0
                                  ? formatCurrency(estimatedTotal)
                                  : "-"}
                              </p>
                            </div>

                            <Wallet size={26} className="text-white" />
                          </div>
                        </div>

                        <div className="rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                          <div className="flex items-center gap-2 text-slate-500">
                            <Phone size={18} className="text-slate-500" />
                            <span className="text-sm font-bold text-slate-500">
                              เบอร์โทร
                            </span>
                          </div>
                          <p className="mt-2 font-black text-slate-950">
                            {booking.phone || "-"}
                          </p>
                        </div>
                      </div>

                      <div
                        className={[
                          "mt-5 rounded-[1.5rem] border p-4",
                          paymentInfo.cardClass,
                        ].join(" ")}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Full Payment
                            </p>
                            <p className="mt-1 text-2xl font-black text-slate-950">
                              {estimatedTotal > 0
                                ? formatCurrency(estimatedTotal)
                                : "-"}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {paymentInfo.description}
                            </p>
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

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              ยอดชำระเต็มจำนวน
                            </p>
                            <p className="mt-1 font-black text-slate-950">
                              {estimatedTotal > 0
                                ? formatCurrency(estimatedTotal)
                                : "-"}
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
                              Paid At
                            </p>
                            <p className="mt-1 font-black text-slate-950">
                              {formatDateTime(
                                booking.paidAt ||
                                  booking.createdAt ||
                                  booking.updatedAt
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-3">
                          {booking.paymentSlipUrl ? (
  <div className="grid gap-3">
    <div className="overflow-hidden rounded-2xl bg-white p-3 ring-1 ring-slate-200">
      <p className="mb-3 text-sm font-black text-slate-700">
        รูปสลิปที่ลูกค้าแนบ
      </p>

      <img
        src={booking.paymentSlipUrl}
        alt="Payment slip"
        className="max-h-56 w-full rounded-xl object-contain"
      />

      <p className="mt-3 break-all text-xs font-semibold text-slate-500">
        {booking.paymentSlipUrl}
      </p>
    </div>

    <a
      href={booking.paymentSlipUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800"
    >
      <span className="text-white">เปิดดูสลิปแบบเต็ม</span>
    </a>
  </div>
) : (
  <div className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-500">
    ไม่มีลิงก์สลิป
  </div>
)}
                        </div>

                      </div>

                      {booking.note && (
                        <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            หมายเหตุ
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {booking.note}
                          </p>
                        </div>
                      )}

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <button
                          type="button"
                          disabled={
                            updatingId === booking.id ||
                            booking.status === "CONFIRMED"
                          }
                          onClick={() =>
                            updateBookingStatus(booking.id, "CONFIRMED")
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingId === booking.id ? (
                            <Loader2
                              size={18}
                              className="animate-spin text-white"
                            />
                          ) : (
                            <CheckCircle2 size={18} className="text-white" />
                          )}
                          <span className="text-white">ยืนยันการจอง</span>
                        </button>

                        

                        <button
                          type="button"
                          disabled={
                            updatingId === booking.id ||
                            booking.status === "CANCELLED"
                          }
                          onClick={() =>
                            updateBookingStatus(booking.id, "CANCELLED")
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingId === booking.id ? (
                            <Loader2
                              size={18}
                              className="animate-spin text-white"
                            />
                          ) : (
                            <XCircle size={18} className="text-white" />
                          )}
                          <span className="text-white">ไม่ยืนยันห้อง</span>
                        </button>

                        <Link
  href={`/admin/bookings/${booking.id}`}
  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800"
>
  <span className="text-white">ดูรายละเอียด</span>
</Link>

                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

      </section>
    </main>
  );
}
