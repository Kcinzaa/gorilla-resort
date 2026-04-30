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
  Hotel,
  Loader2,
  ReceiptText,
  RefreshCcw,
  SearchCheck,
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
      label: "ยืนยันไม่สำเร็จ",
      description: "รีสอร์ทไม่สามารถยืนยันห้องนี้ได้ และคืนห้องว่างเข้าระบบแล้ว",
      icon: XCircle,
      badgeClass: "bg-red-50 text-red-700 ring-red-100",
      iconClass: "text-red-600",
      cardClass: "border-red-200",
    };
  }

  return {
    label: "In process",
    description: "ส่งคำขอจองแล้ว ระบบกันห้องไว้ให้ รอแอดมินยืนยันห้อง",
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
      label: "แจ้งชำระแล้ว",
      description: "ลูกค้าแนบสลิปแล้ว",
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

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
                <CalendarCheck size={16} className="text-slate-600" />
                <span className="text-slate-600">My Reservations</span>
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
                การจองของฉัน
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                ตรวจสอบรายการจองล่าสุด ดูสถานะการยืนยัน รายละเอียดห้องพัก
                วันที่เข้าพัก และสถานะการชำระเงิน
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/rooms"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  <span className="text-white">ดูห้องพัก</span>
                  <BedDouble size={18} className="text-white" />
                </Link>
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
                  <span className="text-white">เช็คห้องว่าง</span>
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
            <section className="mt-5 grid gap-4">
              <div className="grid gap-3">
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

                  const estimatedTotal =
                    booking.totalPrice ||
                    (nights > 0
                      ? nights * (booking.roomType?.pricePerNight || 0)
                      : 0);

                  return (
                    <article
                      key={booking.id}
                      className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-slate-200"
                    >
                      <div className="grid grid-cols-[112px_1fr] gap-0 sm:grid-cols-[160px_1fr]">
                        <div className="relative min-h-36 overflow-hidden bg-slate-200">
                          {booking.roomType?.imageUrl ? (
                            <img
                              src={booking.roomType.imageUrl}
                              alt={booking.roomType.name}
                              className="h-full min-h-36 w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full min-h-36 w-full items-center justify-center text-slate-400">
                              <Hotel size={44} />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-lg font-black text-slate-950">
                                {booking.roomType?.name || "ห้องพัก"}
                              </p>
                              <p className="mt-1 truncate text-xs font-bold text-slate-500">
                                {booking.bookingCode || `BOOKING-${booking.id}`}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span
                              className={[
                                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ring-1",
                                statusInfo.badgeClass,
                              ].join(" ")}
                            >
                              <StatusIcon size={14} />
                              {statusInfo.label}
                            </span>
                            <span
                              className={[
                                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ring-1",
                                paymentInfo.badgeClass,
                              ].join(" ")}
                            >
                              <PaymentIcon size={14} />
                              {paymentInfo.label}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-1 text-sm text-slate-600">
                            <p>
                              <span className="font-bold text-slate-500">
                                เข้าพัก:
                              </span>{" "}
                              {formatDate(booking.checkIn)}
                            </p>
                            <p>
                              <span className="font-bold text-slate-500">
                                ออก:
                              </span>{" "}
                              {formatDate(booking.checkOut)}
                            </p>
                            <p className="font-black text-slate-950">
                              {estimatedTotal > 0
                                ? formatCurrency(estimatedTotal)
                                : "-"}
                            </p>
                          </div>

                          <Link
                            href={`/my-bookings/${booking.id}`}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                          >
                            <span className="text-white">ดูรายละเอียดการจอง</span>
                            <ArrowRight size={17} className="text-white" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

            </section>
          )}
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
