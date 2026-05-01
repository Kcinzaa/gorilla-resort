"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLineProfile } from "@/lib/useLineProfile";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Phone,
  User,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

type RoomType = {
  id: number;
  name: string;
  description?: string | null;
  pricePerNight: number;
  capacity: number;
  totalRooms?: number | null;
  imageUrl?: string | null;
};

type BookingFormProps = {
  room: RoomType;
  initialCheckIn?: string;
  initialCheckOut?: string;
};

type AvailabilityResult = {
  availableRooms: number;
  bookedRooms: number;
  totalRooms: number;
  isAvailable: boolean;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatThaiDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
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

export default function BookingForm({
  room,
  initialCheckIn = "",
  initialCheckOut = "",
}: BookingFormProps) {
  const router = useRouter();
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    isDevMode,
  } = useLineProfile();

  const [checkIn] = useState(initialCheckIn);
  const [checkOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState("1");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [availability, setAvailability] = useState<AvailabilityResult | null>(
    null
  );
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [error, setError] = useState("");

  const nights = useMemo(
    () => calculateNights(checkIn, checkOut),
    [checkIn, checkOut]
  );
  const totalPrice = nights * room.pricePerNight;
  const canContinue =
    Boolean(profile) &&
    Boolean(availability?.isAvailable) &&
    nights > 0 &&
    totalPrice > 0 &&
    !availabilityLoading;

  useEffect(() => {
    let cancelled = false;

    async function checkAvailability() {
      setAvailability(null);
      setAvailabilityError("");

      if (!checkIn || !checkOut || nights <= 0) return;

      try {
        setAvailabilityLoading(true);

        const params = new URLSearchParams({
          roomTypeId: String(room.id),
          checkIn,
          checkOut,
        });
        const response = await fetch(`/api/rooms/availability-one?${params}`, {
          cache: "no-store",
        });
        const result = await response.json();

        if (cancelled) return;

        if (!response.ok || !result.success) {
          setAvailabilityError(
            result.message || "ไม่สามารถตรวจสอบห้องว่างได้"
          );
          return;
        }

        setAvailability(result.data);
      } catch (err) {
        console.warn(err);
        if (!cancelled) setAvailabilityError("ตรวจสอบห้องว่างไม่สำเร็จ");
      } finally {
        if (!cancelled) setAvailabilityLoading(false);
      }
    }

    checkAvailability();

    return () => {
      cancelled = true;
    };
  }, [checkIn, checkOut, nights, room.id]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!checkIn || !checkOut || nights <= 0) {
      setError("กรุณากลับไปเลือกวันที่จากหน้าห้องพักก่อนทำรายการจอง");
      return;
    }

    if (!guests || Number(guests) <= 0) {
      setError("กรุณาระบุจำนวนผู้เข้าพัก");
      return;
    }

    if (Number(guests) > room.capacity) {
      setError(`ห้องนี้รองรับได้สูงสุด ${room.capacity} คน`);
      return;
    }

    if (!phone.trim()) {
      setError("กรุณากรอกเบอร์โทรศัพท์");
      return;
    }

    if (!profile) {
      setError("ไม่พบข้อมูลผู้ใช้ LINE กรุณาลองโหลดหน้าใหม่อีกครั้ง");
      return;
    }

    if (!availability?.isAvailable) {
      setError("ช่วงวันที่เลือกไม่มีห้องว่าง กรุณาเลือกวันอื่น");
      return;
    }

    sessionStorage.setItem(
      "gorillaBookingDraft",
      JSON.stringify({
        room,
        checkIn,
        checkOut,
        nights,
        guests: Number(guests),
        phone: phone.trim(),
        note: note.trim(),
        totalPrice,
        profile,
        availability,
      })
    );

    router.push("/booking/payment");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-6 lg:p-8">
        <div className="mb-6">
          <Link
            href="/rooms"
            className="mb-5 inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
          >
            <ArrowLeft size={16} className="text-slate-700" />
            กลับไปเลือกห้อง
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
                Booking Request
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
                ยืนยันข้อมูลก่อนชำระเงิน
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                วันที่และห้องถูกเลือกจากหน้าห้องพักแล้ว กรอกข้อมูลติดต่อเพื่อไปหน้าชำระเงิน
              </p>
            </div>
            <AvailabilityBadge
              loading={availabilityLoading}
              availability={availability}
            />
          </div>
        </div>

        {(error || profileError || availabilityError) && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
            <span>{error || profileError || availabilityError}</span>
          </div>
        )}

        {isDevMode && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">
            DEV MODE: กำลังใช้ผู้ใช้ทดสอบ เพราะยังไม่ได้ตั้งค่า LIFF ID
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="rounded-[2rem] bg-slate-50 p-4 ring-1 ring-slate-200 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <CalendarDays size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-slate-950">
                  วันที่เข้าพักที่เลือก
                </h3>
                <p className="text-sm text-slate-500">
                  ถ้าต้องการเปลี่ยนวัน ให้กลับไปเลือกจากหน้าห้องพัก
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <SummaryCard label="วันเข้าพัก" value={formatThaiDate(checkIn)} />
              <SummaryCard label="วันออก" value={formatThaiDate(checkOut)} />
              <SummaryCard label="จำนวนคืน" value={`${nights} คืน`} />
              <SummaryCard
                dark
                label="ยอดชำระ"
                value={formatCurrency(totalPrice)}
              />
            </div>

            {(!checkIn || !checkOut) && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">
                กรุณากลับไปเลือกวันที่จากหน้าห้องพักก่อนทำรายการจอง
              </div>
            )}
          </div>

          <div className="rounded-[2rem] bg-slate-50 p-4 ring-1 ring-slate-200 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <User size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-slate-950">ข้อมูลผู้เข้าพัก</h3>
                <p className="text-sm text-slate-500">
                  ใช้สำหรับให้รีสอร์ทติดต่อกลับและตรวจสอบรายการจอง
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FieldShell label="จำนวนผู้เข้าพัก" required>
                <Users
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="number"
                  min="1"
                  max={room.capacity}
                  value={guests}
                  onChange={(event) => setGuests(event.target.value)}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  ห้องนี้รองรับได้สูงสุด {room.capacity} คน
                </p>
              </FieldShell>

              <FieldShell label="เบอร์โทรศัพท์" required>
                <Phone
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="เช่น 0812345678"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </FieldShell>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-black text-slate-700">
                หมายเหตุเพิ่มเติม
              </label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="เช่น ขอห้องวิวดี, เข้าพักช่วงเย็น, มีเด็กเล็ก"
                rows={4}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canContinue || profileLoading}
            className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            {profileLoading ? (
              <Loader2 size={22} className="animate-spin text-white" />
            ) : (
              <>
                ไปหน้าชำระเงิน
                <ArrowRight size={22} className="text-white" />
              </>
            )}
          </button>
        </form>
      </section>

      <aside className="h-fit rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-6 xl:sticky xl:top-28">
        <div className="overflow-hidden rounded-[2rem] bg-slate-200">
          {room.imageUrl ? (
            <img
              src={room.imageUrl}
              alt={room.name}
              className="h-64 w-full object-cover"
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center text-slate-400">
              <ImageIcon size={46} />
            </div>
          )}
        </div>

        <div className="mt-5">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
            <BedDouble size={14} className="text-slate-600" />
            ห้องที่เลือก
          </div>
          <h2 className="text-3xl font-black text-slate-950">{room.name}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            {room.description ||
              "ห้องพักบรรยากาศดี เหมาะสำหรับการพักผ่อน"}
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          <InfoRow icon={Users} label="พักได้สูงสุด" value={`${room.capacity} คน`} />
          <InfoRow
            icon={BedDouble}
            label="ห้องว่างตอนนี้"
            value={
              availabilityLoading
                ? "กำลังเช็ก"
                : `${availability?.availableRooms ?? 0} ห้อง`
            }
          />
          <InfoRow
            icon={Wallet}
            label="ราคาต่อคืน"
            value={formatCurrency(room.pricePerNight)}
          />
          <InfoRow icon={CalendarDays} label="จำนวนคืน" value={`${nights} คืน`} />
        </div>
      </aside>
    </div>
  );
}

function AvailabilityBadge({
  loading,
  availability,
}: {
  loading: boolean;
  availability: AvailabilityResult | null;
}) {
  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-600">
        <Loader2 size={18} className="animate-spin text-slate-500" />
        กำลังเช็กห้องว่าง
      </div>
    );
  }

  if (!availability) {
    return (
      <div className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-700 ring-1 ring-amber-100">
        <AlertCircle size={18} className="text-amber-600" />
        รอข้อมูลวันเข้าพัก
      </div>
    );
  }

  if (!availability.isAvailable) {
    return (
      <div className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700 ring-1 ring-red-100">
        <XCircle size={18} className="text-red-600" />
        ห้องเต็ม
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 ring-1 ring-emerald-100">
      <CheckCircle2 size={18} className="text-emerald-600" />
      ว่าง {availability.availableRooms} ห้อง
    </div>
  );
}

function SummaryCard({
  label,
  value,
  dark,
}: {
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl p-4 ring-1",
        dark
          ? "bg-slate-950 text-white ring-slate-950"
          : "bg-white ring-slate-200",
      ].join(" ")}
    >
      <p
        className={[
          "text-xs font-bold uppercase tracking-wide",
          dark ? "text-slate-400" : "text-slate-500",
        ].join(" ")}
      >
        {label}
      </p>
      <p
        className={[
          "mt-1 text-xl font-black",
          dark ? "text-white" : "text-slate-950",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function FieldShell({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">{children}</div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={18} className="text-slate-500" />
        <span className="text-sm font-bold text-slate-500">{label}</span>
      </div>
      <span className="text-right font-black text-slate-950">{value}</span>
    </div>
  );
}
