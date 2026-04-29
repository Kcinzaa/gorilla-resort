"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useLineProfile } from "@/lib/useLineProfile";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  Home,
  Hotel,
  Loader2,
  ReceiptText,
  RefreshCcw,
  SearchCheck,
  ShieldCheck,
  UploadCloud,
  User,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
type PaymentStatus = "UNPAID" | "PENDING" | "PAID" | "REJECTED";

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
    imageUrl?: string | null;
  } | null;
};

type ResubmitForm = {
  paymentMethod: string;
  paymentSlipUrl: string;
  paymentReference: string;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return dateString;

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

function getStatusInfo(status: string) {
  if (status === "CONFIRMED") {
    return {
      label: "ยืนยันแล้ว",
      description: "แอดมินยืนยันรายการจองแล้ว",
      icon: CheckCircle2,
      badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      iconClass: "text-emerald-600",
      cardClass: "border-emerald-200",
    };
  }

  if (status === "CANCELLED") {
    return {
      label: "ยกเลิกแล้ว",
      description: "รายการจองนี้ถูกยกเลิก",
      icon: XCircle,
      badgeClass: "bg-red-50 text-red-700 ring-red-100",
      iconClass: "text-red-600",
      cardClass: "border-red-200",
    };
  }

  return {
    label: "รอตรวจสอบ",
    description: "รอแอดมินตรวจสอบและยืนยันรายการ",
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
      label: "สลิปไม่ถูกต้อง",
      description:
        "แอดมินปฏิเสธข้อมูลการชำระเงิน กรุณาส่งสลิปหรือเลขอ้างอิงใหม่",
      icon: XCircle,
      badgeClass: "bg-red-50 text-red-700 ring-red-100",
      iconClass: "text-red-600",
      cardClass: "border-red-200 bg-red-50",
    };
  }

  if (status === "PENDING") {
    return {
      label: "รอตรวจสอบการชำระ",
      description: "ส่งข้อมูลมัดจำแล้ว รอแอดมินตรวจสอบสลิป/เลขอ้างอิง",
      icon: Clock3,
      badgeClass: "bg-amber-50 text-amber-700 ring-amber-100",
      iconClass: "text-amber-600",
      cardClass: "border-amber-200 bg-amber-50",
    };
  }

  return {
    label: "ยังไม่ชำระ",
    description: "ยังไม่มีข้อมูลการชำระเงินในรายการนี้",
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

function canResubmitPayment(booking: BookingItem) {
  if (booking.status === "CANCELLED") return false;
  if (booking.paymentStatus === "PAID") return false;
  if (booking.paymentStatus === "PENDING") return false;

  return booking.paymentStatus === "REJECTED" || booking.paymentStatus === "UNPAID" || !booking.paymentStatus;
}

export default function MyBookingsPage() {
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    isDevMode,
  } = useLineProfile();

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(
    null
  );

  const [resubmitForm, setResubmitForm] = useState<ResubmitForm>({
    paymentMethod: "PROMPTPAY",
    paymentSlipUrl: "",
    paymentReference: "",
  });

  const [resubmitLoading, setResubmitLoading] = useState(false);
  const [resubmitError, setResubmitError] = useState("");
  const [resubmitSuccess, setResubmitSuccess] = useState("");

  const [resubmitSlipUploading, setResubmitSlipUploading] = useState(false);

  const pendingCount = useMemo(() => {
    return bookings.filter((booking) => booking.status === "PENDING").length;
  }, [bookings]);

  const confirmedCount = useMemo(() => {
    return bookings.filter((booking) => booking.status === "CONFIRMED").length;
  }, [bookings]);

  const cancelledCount = useMemo(() => {
    return bookings.filter((booking) => booking.status === "CANCELLED").length;
  }, [bookings]);

  const paidCount = useMemo(() => {
    return bookings.filter((booking) => booking.paymentStatus === "PAID").length;
  }, [bookings]);

  const waitingPaymentCount = useMemo(() => {
    return bookings.filter((booking) => booking.paymentStatus === "PENDING")
      .length;
  }, [bookings]);

  const rejectedPaymentCount = useMemo(() => {
    return bookings.filter((booking) => booking.paymentStatus === "REJECTED")
      .length;
  }, [bookings]);

  async function fetchBookings(lineUserId: string) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        lineUserId,
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

      if (!response.ok) {
        setError(result.message || "ไม่สามารถโหลดรายการจองได้");
        return;
      }

      setBookings(result.data || []);
    } catch (err) {
      console.warn(err);
      setError("เกิดข้อผิดพลาดในการโหลดรายการจอง");
    } finally {
      setLoading(false);
    }
  }

  function openResubmitModal(booking: BookingItem) {
    setSelectedBooking(booking);
    setResubmitError("");
    setResubmitSuccess("");

    setResubmitForm({
      paymentMethod: booking.paymentMethod || "PROMPTPAY",
      paymentSlipUrl: booking.paymentSlipUrl || "",
      paymentReference: booking.paymentReference || "",
    });
  }

  function closeResubmitModal() {
    if (resubmitLoading) return;

    setSelectedBooking(null);
    setResubmitError("");
    setResubmitSuccess("");
    setResubmitForm({
      paymentMethod: "PROMPTPAY",
      paymentSlipUrl: "",
      paymentReference: "",
    });
  }

  async function handleResubmitSlipUpload(file?: File) {
  if (!file) return;

  try {
    setResubmitSlipUploading(true);
    setResubmitError("");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload/slip", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      setResubmitError(result.message || "อัปโหลดสลิปไม่สำเร็จ");
      return;
    }

    setResubmitForm((prev) => ({
      ...prev,
      paymentSlipUrl: result.url,
    }));
  } catch (err) {
    console.warn(err);
    setResubmitError("เกิดข้อผิดพลาดในการอัปโหลดสลิป");
  } finally {
    setResubmitSlipUploading(false);
  }
}

  async function handleResubmitPayment() {
    try {
      setResubmitLoading(true);
      setResubmitError("");
      setResubmitSuccess("");

      if (!profile?.userId) {
        setResubmitError("ไม่พบข้อมูลผู้ใช้ LINE");
        return;
      }

      if (!selectedBooking) {
        setResubmitError("ไม่พบรายการจองที่ต้องการส่งสลิปใหม่");
        return;
      }

      if (
        !resubmitForm.paymentSlipUrl.trim() &&
        !resubmitForm.paymentReference.trim()
      ) {
        setResubmitError("กรุณากรอกลิงก์สลิป หรือเลขอ้างอิงการโอน");
        return;
      }

      const response = await fetch("/api/bookings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedBooking.id,
          bookingCode: selectedBooking.bookingCode,
          lineUserId: profile.userId,
          paymentMethod: resubmitForm.paymentMethod,
          paymentSlipUrl: resubmitForm.paymentSlipUrl.trim(),
          paymentReference: resubmitForm.paymentReference.trim(),
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        setResubmitError("API /api/bookings ยังไม่ส่ง JSON กลับมา");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        setResubmitError(result.message || "ไม่สามารถส่งสลิปใหม่ได้");
        return;
      }

      setResubmitSuccess("ส่งสลิปใหม่สำเร็จ รอแอดมินตรวจสอบอีกครั้ง");

      setBookings((prev) =>
        prev.map((item) => {
          if (item.id !== selectedBooking.id) return item;

          return {
            ...item,
            paymentStatus: "PENDING",
            paymentMethod: resubmitForm.paymentMethod,
            paymentSlipUrl: resubmitForm.paymentSlipUrl.trim(),
            paymentReference: resubmitForm.paymentReference.trim(),
            paidAt: null,
          };
        })
      );

      window.setTimeout(() => {
        closeResubmitModal();

        if (profile?.userId) {
          fetchBookings(profile.userId);
        }
      }, 900);
    } catch (err) {
      console.warn(err);
      setResubmitError("เกิดข้อผิดพลาดในการส่งสลิปใหม่");
    } finally {
      setResubmitLoading(false);
    }
  }

  useEffect(() => {
    if (profile?.userId) {
      fetchBookings(profile.userId);
    }
  }, [profile?.userId]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
        <Navbar />

        {isDevMode && (
          <div className="mb-5 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700">
            DEV MODE: กำลังใช้ผู้ใช้ทดสอบ test-line-user-001 เพราะยังไม่ได้ตั้งค่า LIFF ID
          </div>
        )}

        {(error || profileError) && (
          <div className="mb-5 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error || profileError}
          </div>
        )}

        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-300 sm:rounded-[2.5rem] sm:p-8 lg:p-10">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-emerald-500 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500 blur-3xl" />
          </div>

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-200 ring-1 ring-white/10">
                <CalendarCheck size={16} className="text-slate-200" />
                <span className="text-slate-200">My Reservations</span>
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                การจองของฉัน
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                ตรวจสอบรายการจองล่าสุด ดูสถานะการยืนยัน รายละเอียดห้องพัก
                วันที่เข้าพัก และสถานะการชำระค่ามัดจำ
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/availability"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  <span className="text-white">เช็กห้องว่างเพิ่ม</span>
                  <SearchCheck size={18} className="text-white" />
                </Link>

                <Link
                  href="/rooms"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                >
                  <span className="text-slate-950">ดูห้องพัก</span>
                  <BedDouble size={18} className="text-slate-950" />
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

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/10">
                <Clock3 size={26} className="text-amber-300" />
                <p className="mt-4 text-3xl font-black text-white">
                  {pendingCount}
                </p>
                <p className="mt-1 text-sm text-slate-300">รอตรวจสอบ</p>
              </div>

              <div className="rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/10">
                <CheckCircle2 size={26} className="text-emerald-300" />
                <p className="mt-4 text-3xl font-black text-white">
                  {confirmedCount}
                </p>
                <p className="mt-1 text-sm text-slate-300">ยืนยันแล้ว</p>
              </div>

              <div className="rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/10">
                <ReceiptText size={26} className="text-blue-300" />
                <p className="mt-4 text-3xl font-black text-white">
                  {waitingPaymentCount}
                </p>
                <p className="mt-1 text-sm text-slate-300">รอตรวจสลิป</p>
              </div>

              <div className="rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/10">
                <Banknote size={26} className="text-emerald-300" />
                <p className="mt-4 text-3xl font-black text-white">
                  {paidCount}
                </p>
                <p className="mt-1 text-sm text-slate-300">ชำระแล้ว</p>
              </div>

              <div className="rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/10">
                <XCircle size={26} className="text-red-300" />
                <p className="mt-4 text-3xl font-black text-white">
                  {rejectedPaymentCount}
                </p>
                <p className="mt-1 text-sm text-slate-300">สลิปไม่ถูกต้อง</p>
              </div>
            </div>
          </div>
        </section>

        {profileLoading && (
          <section className="mt-5 flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
              <Loader2 size={38} className="animate-spin" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              กำลังโหลดข้อมูล LINE
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              ระบบกำลังตรวจสอบข้อมูลผู้ใช้เพื่อดึงรายการจองของคุณ
            </p>
          </section>
        )}

        {!profileLoading && !profile && (
          <section className="mt-5 flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-500">
              <AlertCircle size={38} />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              ไม่พบข้อมูลผู้ใช้ LINE
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              กรุณาลองโหลดหน้าใหม่อีกครั้ง หรือเปิดผ่าน LINE OA / LIFF
            </p>
          </section>
        )}

        {!profileLoading && profile && loading && (
          <section className="mt-5 flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
              <Loader2 size={38} className="animate-spin" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              กำลังโหลดรายการจอง
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              กรุณารอสักครู่ ระบบกำลังดึงข้อมูลรายการจองของคุณ
            </p>
          </section>
        )}

        {!profileLoading && profile && !loading && error && (
          <section className="mt-5 rounded-[2rem] border border-red-200 bg-red-50 p-5 shadow-sm sm:rounded-[2.5rem]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <AlertCircle size={28} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-red-700">
                    โหลดรายการจองไม่สำเร็จ
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-red-600">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchBookings(profile.userId)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
              >
                <RefreshCcw size={18} className="text-white" />
                <span className="text-white">โหลดใหม่</span>
              </button>
            </div>
          </section>
        )}

        {!profileLoading &&
          profile &&
          !loading &&
          !error &&
          bookings.length === 0 && (
            <section className="mt-5 flex min-h-[460px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
              <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-slate-100 text-slate-400">
                <CalendarCheck size={44} />
              </div>

              <h2 className="mt-6 text-3xl font-black text-slate-950">
                ยังไม่มีรายการจอง
              </h2>

              <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                เมื่อคุณส่งคำขอจองแล้ว รายการจะมาแสดงที่หน้านี้
                พร้อมสถานะการตรวจสอบจากแอดมิน
              </p>

              <div className="mt-7 grid w-full max-w-md gap-3 sm:grid-cols-2">
                <Link
                  href="/availability"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  <span className="text-white">เช็กห้องว่าง</span>
                  <SearchCheck size={18} className="text-white" />
                </Link>

                <Link
                  href="/rooms"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  <span className="text-white">ดูห้องพัก</span>
                  <BedDouble size={18} className="text-white" />
                </Link>
              </div>
            </section>
          )}

        {!profileLoading &&
          profile &&
          !loading &&
          !error &&
          bookings.length > 0 && (
            <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_340px]">
              <div className="grid gap-5">
                {bookings.map((booking) => {
                  const statusInfo = getStatusInfo(booking.status);
                  const paymentInfo = getPaymentStatusInfo(
                    booking.paymentStatus
                  );

                  const StatusIcon = statusInfo.icon;
                  const PaymentIcon = paymentInfo.icon;

                  const nights = calculateNights(
                    booking.checkIn,
                    booking.checkOut
                  );

                  const pricePerNight = booking.roomType?.pricePerNight || 0;

                  const estimatedTotal =
                    booking.totalPrice ||
                    (nights > 0 ? nights * pricePerNight : 0);

                  const depositAmount =
                    booking.depositAmount ||
                    (estimatedTotal > 0
                      ? Math.max(Math.ceil(estimatedTotal * 0.3), 500)
                      : 0);

                  const remainingAmount =
                    estimatedTotal > 0
                      ? Math.max(estimatedTotal - depositAmount, 0)
                      : 0;

                  return (
                    <article
                      key={booking.id}
                      className={[
                        "overflow-hidden rounded-[2rem] border bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200 sm:rounded-[2.5rem]",
                        statusInfo.cardClass,
                      ].join(" ")}
                    >
                      <div className="grid lg:grid-cols-[300px_1fr]">
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
                            <StatusIcon size={16} />
                            {statusInfo.label}
                          </div>

                          <div
                            className={[
                              "absolute right-4 top-4 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black shadow-sm ring-1",
                              paymentInfo.badgeClass,
                            ].join(" ")}
                          >
                            <PaymentIcon size={16} />
                            {paymentInfo.label}
                          </div>

                          <div className="absolute bottom-4 left-4 right-4">
                            <p className="text-2xl font-black text-white">
                              {booking.roomType?.name || "ห้องพัก"}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-200">
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
                            </div>

                            <div className="flex flex-col gap-2 sm:items-end">
                              <div
                                className={[
                                  "inline-flex w-fit items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1",
                                  statusInfo.badgeClass,
                                ].join(" ")}
                              >
                                <StatusIcon size={18} />
                                {statusInfo.label}
                              </div>

                              <div
                                className={[
                                  "inline-flex w-fit items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1",
                                  paymentInfo.badgeClass,
                                ].join(" ")}
                              >
                                <PaymentIcon size={18} />
                                {paymentInfo.label}
                              </div>
                            </div>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-slate-500">
                            {statusInfo.description}
                          </p>

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

                          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_0.95fr]">
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
                                  <p className="mt-1 text-xs text-slate-400">
                                    {nights > 0
                                      ? `${nights} คืน × ${formatCurrency(
                                          pricePerNight
                                        )}`
                                      : "ยังไม่สามารถคำนวณจำนวนคืนได้"}
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
                                    Deposit Payment
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

                          <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Payment Details
                                </p>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                  ข้อมูลการแจ้งโอนค่ามัดจำที่ส่งให้รีสอร์ทตรวจสอบ
                                </p>
                              </div>

                              <div
                                className={[
                                  "inline-flex w-fit items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1",
                                  paymentInfo.badgeClass,
                                ].join(" ")}
                              >
                                <PaymentIcon size={18} />
                                {paymentInfo.label}
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                  ค่ามัดจำ
                                </p>
                                <p className="mt-1 font-black text-slate-950">
                                  {formatCurrency(depositAmount)}
                                </p>
                              </div>

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
                                  {getPaymentMethodLabel(
                                    booking.paymentMethod
                                  )}
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

                            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                  เลขอ้างอิงการโอน
                                </p>
                                <p className="mt-1 break-all font-black text-slate-950">
                                  {booking.paymentReference || "-"}
                                </p>
                              </div>

                              {booking.paymentSlipUrl ? (
                                <a
                                  href={booking.paymentSlipUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800"
                                >
                                  <span className="text-white">
                                    เปิดดูสลิป
                                  </span>
                                </a>
                              ) : (
                                <div className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-500">
                                  ไม่มีลิงก์สลิป
                                </div>
                              )}
                            </div>

                            {canResubmitPayment(booking) && (
                              <div className="mt-4 rounded-[1.5rem] border border-red-200 bg-red-50 p-4">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                  <div>
                                    <p className="text-base font-black text-red-700">
                                      ต้องส่งหลักฐานการชำระเงินใหม่
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-red-600">
                                      สลิปเดิมอาจไม่ถูกต้อง หรือยังไม่ได้แจ้งชำระเงิน
                                      กรุณาส่งลิงก์สลิป/เลขอ้างอิงใหม่ให้แอดมินตรวจสอบ
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => openResubmitModal(booking)}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition hover:bg-red-700"
                                  >
                                    <UploadCloud
                                      size={18}
                                      className="text-white"
                                    />
                                    <span className="text-white">
                                      ส่งสลิปใหม่
                                    </span>
                                  </button>
                                </div>
                              </div>
                            )}
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

                          <div className="mt-5">
                            <Link
                              href="/availability"
                              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200"
                            >
                              <span className="text-slate-700">จองเพิ่ม</span>
                              <ArrowRight
                                size={18}
                                className="text-slate-700"
                              />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <aside className="h-fit rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-6 xl:sticky xl:top-28">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-white">
                  <User size={30} className="text-white" />
                </div>

                <h2 className="mt-5 text-2xl font-black text-slate-950">
                  โปรไฟล์การจอง
                </h2>

                {profile && (
                  <div className="mt-5 rounded-[2rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white text-slate-400">
                        {profile.pictureUrl ? (
                          <img
                            src={profile.pictureUrl}
                            alt={profile.displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User size={24} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-950">
                          {profile.displayName}
                        </p>
                        <p className="text-xs text-slate-500">
                          LINE Reservation
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
                          Pending
                        </p>
                        <p className="mt-1 text-2xl font-black text-amber-700">
                          {pendingCount}
                        </p>
                      </div>
                      <Clock3 size={26} className="text-amber-600" />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                          Confirmed
                        </p>
                        <p className="mt-1 text-2xl font-black text-emerald-700">
                          {confirmedCount}
                        </p>
                      </div>
                      <CheckCircle2 size={26} className="text-emerald-600" />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                          Payment Pending
                        </p>
                        <p className="mt-1 text-2xl font-black text-blue-700">
                          {waitingPaymentCount}
                        </p>
                      </div>
                      <ReceiptText size={26} className="text-blue-600" />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                          Paid
                        </p>
                        <p className="mt-1 text-2xl font-black text-emerald-700">
                          {paidCount}
                        </p>
                      </div>
                      <Banknote size={26} className="text-emerald-600" />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-red-600">
                          Slip Rejected
                        </p>
                        <p className="mt-1 text-2xl font-black text-red-700">
                          {rejectedPaymentCount}
                        </p>
                      </div>
                      <XCircle size={26} className="text-red-600" />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-red-600">
                          Cancelled
                        </p>
                        <p className="mt-1 text-2xl font-black text-red-700">
                          {cancelledCount}
                        </p>
                      </div>
                      <XCircle size={26} className="text-red-600" />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => profile && fetchBookings(profile.userId)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  <RefreshCcw size={18} className="text-white" />
                  <span className="text-white">โหลดรายการใหม่</span>
                </button>

                <Link
                  href="/availability"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  <SearchCheck size={18} className="text-white" />
                  <span className="text-white">เช็กห้องว่างเพิ่ม</span>
                </Link>
              </aside>
            </section>
          )}

        <section className="mt-5 grid gap-5 md:grid-cols-3">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <Clock3 size={30} className="text-amber-600" />
            <h3 className="mt-5 text-xl font-black text-slate-950">
              รอตรวจสอบ
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              รายการถูกส่งแล้ว และกำลังรอแอดมินตรวจสอบ
            </p>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <ReceiptText size={30} className="text-blue-600" />
            <h3 className="mt-5 text-xl font-black text-slate-950">
              รอตรวจสลิป
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              หากแจ้งชำระมัดจำแล้ว แอดมินจะตรวจสอบหลักฐานการโอน
            </p>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <ShieldCheck size={30} className="text-blue-600" />
            <h3 className="mt-5 text-xl font-black text-slate-950">
              ติดต่อรีสอร์ท
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              หากต้องการแก้ไขข้อมูล สามารถติดต่อรีสอร์ทโดยตรง
            </p>
          </div>
        </section>

        <footer className="mt-5 rounded-[2rem] bg-white px-6 py-5 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          My Reservations • Resort Booking System
        </footer>
      </section>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:items-center">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-700 ring-1 ring-red-100">
                  <UploadCloud size={16} className="text-red-600" />
                  ส่งหลักฐานใหม่
                </div>

                <h2 className="mt-4 text-3xl font-black text-slate-950">
                  ส่งสลิป/เลขอ้างอิงใหม่
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  รายการ{" "}
                  <span className="font-black text-slate-950">
                    {selectedBooking.bookingCode ||
                      `BOOKING-${selectedBooking.id}`}
                  </span>{" "}
                  จะถูกเปลี่ยนเป็นสถานะรอตรวจสลิปหลังส่งข้อมูลสำเร็จ
                </p>
              </div>

              <button
                type="button"
                onClick={closeResubmitModal}
                disabled={resubmitLoading}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
              >
                <X size={22} />
              </button>
            </div>

            <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-sm font-black text-slate-950">
                ข้อมูลการชำระเงินเดิม
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    วิธีชำระเงิน
                  </p>
                  <p className="mt-1 font-black text-slate-950">
                    {getPaymentMethodLabel(selectedBooking.paymentMethod)}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    เลขอ้างอิงเดิม
                  </p>
                  <p className="mt-1 break-all font-black text-slate-950">
                    {selectedBooking.paymentReference || "-"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    สถานะ
                  </p>
                  <p className="mt-1 font-black text-red-700">
                    {getPaymentStatusInfo(selectedBooking.paymentStatus).label}
                  </p>
                </div>
              </div>
            </div>

            {resubmitError && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {resubmitError}
              </div>
            )}

            {resubmitSuccess && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                {resubmitSuccess}
              </div>
            )}

            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  วิธีชำระเงิน
                </span>

                <select
                  value={resubmitForm.paymentMethod}
                  onChange={(event) =>
                    setResubmitForm((prev) => ({
                      ...prev,
                      paymentMethod: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-950 outline-none ring-0 transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="PROMPTPAY">พร้อมเพย์</option>
                  <option value="BANK_TRANSFER">โอนผ่านธนาคาร</option>
                  <option value="OTHER">อื่น ๆ</option>
                </select>
              </label>

<label className="block">
  <span className="text-sm font-black text-slate-700">
    แนบรูปสลิปใหม่
  </span>

  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    onChange={(event) => handleResubmitSlipUpload(event.target.files?.[0])}
    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:file:bg-slate-800"
  />

  {resubmitSlipUploading && (
    <div className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-500">
      <Loader2 size={18} className="animate-spin" />
      กำลังอัปโหลดสลิป...
    </div>
  )}

  {resubmitForm.paymentSlipUrl && (
    <div className="mt-4 overflow-hidden rounded-2xl bg-white p-3 ring-1 ring-slate-200">
      <p className="mb-3 text-sm font-black text-slate-700">
        ตัวอย่างสลิปที่อัปโหลด
      </p>

      <img
        src={resubmitForm.paymentSlipUrl}
        alt="Payment slip"
        className="max-h-80 w-full rounded-xl object-contain"
      />

      <p className="mt-3 break-all text-xs font-semibold text-slate-500">
        {resubmitForm.paymentSlipUrl}
      </p>
    </div>
  )}

  <p className="mt-2 text-xs leading-5 text-slate-500">
    รองรับไฟล์ JPG, PNG, WEBP ขนาดไม่เกิน 5MB
  </p>
</label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  เลขอ้างอิงการโอน / หมายเลขรายการ
                </span>

                <input
                  value={resubmitForm.paymentReference}
                  onChange={(event) =>
                    setResubmitForm((prev) => ({
                      ...prev,
                      paymentReference: event.target.value,
                    }))
                  }
                  placeholder="เช่น REF123456789 / เวลาโอน / ชื่อบัญชี"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-950 outline-none ring-0 transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </label>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
              <button
  type="button"
  onClick={handleResubmitPayment}
  disabled={resubmitLoading || resubmitSlipUploading}
  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
>
  {resubmitLoading || resubmitSlipUploading ? (
    <Loader2 size={18} className="animate-spin text-white" />
  ) : (
    <UploadCloud size={18} className="text-white" />
  )}

  <span className="text-white">
    {resubmitSlipUploading
      ? "กำลังอัปโหลดสลิป..."
      : resubmitLoading
        ? "กำลังส่ง..."
        : "ส่งให้แอดมินตรวจใหม่"}
  </span>
</button>

              <button
                type="button"
                onClick={closeResubmitModal}
                disabled={resubmitLoading}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}