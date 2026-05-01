"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useLineProfile } from "@/lib/useLineProfile";
import {
  AlertCircle,
  ArrowLeft,
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
  Wallet,
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
  roomCount?: number | null;
  totalPrice?: number | null;
  status: BookingStatus | string;
  createdAt?: string;
  updatedAt?: string;
  depositAmount?: number | null;
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

function formatDate(dateString?: string | null) {
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
      description: "รีสอร์ทยืนยันรายการจองนี้แล้ว",
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
    description: "ส่งคำขอจองแล้ว ระบบกันห้องไว้ให้ระหว่างรอแอดมินยืนยันห้อง",
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
      description: "ลูกค้าแนบสลิปการชำระเงินแล้ว",
      icon: CheckCircle2,
      badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      iconClass: "text-emerald-600",
      cardClass: "border-emerald-200 bg-emerald-50",
    };
  }

  if (status === "PENDING") {
    return {
      label: "แจ้งชำระแล้ว",
      description: "แนบหลักฐานการชำระเงินแล้ว",
      icon: ReceiptText,
      badgeClass: "bg-blue-50 text-blue-700 ring-blue-100",
      iconClass: "text-blue-600",
      cardClass: "border-blue-200 bg-blue-50",
    };
  }

  if (status === "REJECTED") {
    return {
      label: "สลิปไม่ถูกต้อง",
      description: "หลักฐานการชำระเงินไม่ถูกต้อง",
      icon: XCircle,
      badgeClass: "bg-red-50 text-red-700 ring-red-100",
      iconClass: "text-red-600",
      cardClass: "border-red-200 bg-red-50",
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

export default function MyBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const bookingId = Number(params.id);

  const { profile, loading: profileLoading } = useLineProfile();
  const [booking, setBooking] = useState<BookingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const nights = useMemo(() => {
    if (!booking) return 0;
    return calculateNights(booking.checkIn, booking.checkOut);
  }, [booking]);

  const estimatedTotal = useMemo(() => {
    if (!booking) return 0;

    return (
      booking.totalPrice ||
      (nights > 0
        ? nights *
          (booking.roomType?.pricePerNight || 0) *
          Math.max(Number(booking.roomCount || 1), 1)
        : 0)
    );
  }, [booking, nights]);

  const paidAmount = booking?.depositAmount || estimatedTotal;
  const statusInfo = getStatusInfo(booking?.status);
  const paymentInfo = getPaymentStatusInfo(booking?.paymentStatus);
  const StatusIcon = statusInfo.icon;
  const PaymentIcon = paymentInfo.icon;

  async function fetchBooking(lineUserId: string) {
    try {
      setLoading(true);
      setError("");

      const searchParams = new URLSearchParams({ lineUserId });
      const response = await fetch(`/api/bookings?${searchParams.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "ไม่สามารถโหลดรายละเอียดการจองได้");
        return;
      }

      const found = (result.data || []).find(
        (item: BookingItem) => item.id === bookingId
      );

      if (!found) {
        setError("ไม่พบรายการจองนี้ หรือรายการนี้ไม่ใช่ของบัญชี LINE นี้");
        return;
      }

      setBooking(found);
    } catch (err) {
      console.warn(err);
      setError("เกิดข้อผิดพลาดในการโหลดรายละเอียดการจอง");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!profile?.userId) return;
    fetchBooking(profile.userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.userId, bookingId]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto max-w-5xl px-3 py-4 sm:px-6 lg:px-8">
        <Navbar showProfile={true} />

        <section className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
          <Link
            href="/my-bookings"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
          >
            <ArrowLeft size={18} />
            กลับไปการจองของฉัน
          </Link>

          <div className="mt-5">
            <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
              Booking Detail
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
              รายละเอียดการจอง
            </h1>
          </div>
        </section>

        {(profileLoading || loading) && (
          <section className="mt-5 flex min-h-[360px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <Loader2 size={40} className="animate-spin text-slate-400" />
            <h2 className="mt-5 text-2xl font-black text-slate-950">
              กำลังโหลดรายละเอียด
            </h2>
          </section>
        )}

        {!profileLoading && !loading && error && (
          <section className="mt-5 rounded-[2rem] border border-red-200 bg-red-50 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <AlertCircle size={28} className="text-red-600" />
              <div>
                <h2 className="font-black text-red-700">โหลดข้อมูลไม่สำเร็จ</h2>
                <p className="mt-1 text-sm leading-6 text-red-600">{error}</p>
                {profile?.userId && (
                  <button
                    type="button"
                    onClick={() => fetchBooking(profile.userId)}
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white"
                  >
                    <RefreshCcw size={17} className="text-white" />
                    โหลดใหม่
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {!profileLoading && !loading && booking && (
          <article
            className={[
              "mt-5 overflow-hidden rounded-[2rem] border bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]",
              statusInfo.cardClass,
            ].join(" ")}
          >
            <div className="relative min-h-72 overflow-hidden bg-slate-200">
              {booking.roomType?.imageUrl ? (
                <img
                  src={booking.roomType.imageUrl}
                  alt={booking.roomType.name}
                  className="h-full min-h-72 w-full object-cover"
                />
              ) : (
                <div className="flex min-h-72 items-center justify-center text-slate-400">
                  <Hotel size={48} />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-3xl font-black text-white">
                  {booking.roomType?.name || "ห้องพัก"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  {booking.roomType?.description || "รายการจองห้องพักของคุณ"}
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Booking Code
                  </p>
                  <h2 className="mt-1 break-all text-2xl font-black text-slate-950">
                    {booking.bookingCode || `BOOKING-${booking.id}`}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <span
                    className={[
                      "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1",
                      statusInfo.badgeClass,
                    ].join(" ")}
                  >
                    <StatusIcon size={18} />
                    {statusInfo.label}
                  </span>
                  <span
                    className={[
                      "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1",
                      paymentInfo.badgeClass,
                    ].join(" ")}
                  >
                    <PaymentIcon size={18} />
                    {paymentInfo.label}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {statusInfo.description}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoCard label="วันเข้าพัก" value={formatDate(booking.checkIn)} />
                <InfoCard label="วันออก" value={formatDate(booking.checkOut)} />
                <InfoCard label="จำนวนคืน" value={`${nights} คืน`} />
                <InfoCard label="ชื่อ นามสกุล" value={booking.displayName || "-"} />
                <InfoCard
                  label="จำนวนห้อง"
                  value={`${Math.max(Number(booking.roomCount || 1), 1)} ห้อง`}
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                  <Wallet size={26} className="text-white" />
                  <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                    ยอดรวม
                  </p>
                  <p className="mt-1 text-3xl font-black text-white">
                    {estimatedTotal > 0 ? formatCurrency(estimatedTotal) : "-"}
                  </p>
                </div>

                <div
                  className={[
                    "rounded-[1.5rem] border p-5",
                    paymentInfo.cardClass,
                  ].join(" ")}
                >
                  <ReceiptText size={26} className={paymentInfo.iconClass} />
                  <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Payment
                  </p>
                  <p className="mt-1 text-3xl font-black text-slate-950">
                    {paidAmount > 0 ? formatCurrency(paidAmount) : "-"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {paymentInfo.description}
                  </p>
                </div>
              </div>

              <section className="mt-5 rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-sm font-black text-slate-950">
                  ข้อมูลการชำระเงิน
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <InfoCard
                    label="วิธีชำระเงิน"
                    value={getPaymentMethodLabel(booking.paymentMethod)}
                  />
                  <InfoCard
                    label="Paid At"
                    value={formatDateTime(
                      booking.paidAt || booking.createdAt || booking.updatedAt
                    )}
                  />
                  <InfoCard
                    label="สถานะ"
                    value={paymentInfo.label}
                    icon={<Banknote size={18} className={paymentInfo.iconClass} />}
                  />
                </div>

                {booking.paymentSlipUrl ? (
                  <a
                    href={booking.paymentSlipUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    <ReceiptText size={18} className="text-white" />
                    <span className="text-white">เปิดดูสลิป</span>
                  </a>
                ) : (
                  <div className="mt-4 rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-slate-500 ring-1 ring-slate-200">
                    ไม่มีลิงก์สลิป
                  </div>
                )}
              </section>

              {booking.note && (
                <section className="mt-5 rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    หมายเหตุ
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {booking.note}
                  </p>
                </section>
              )}
            </div>
          </article>
        )}
      </section>
    </main>
  );
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 font-black text-slate-950">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}
