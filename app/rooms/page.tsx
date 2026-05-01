"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  AlertCircle,
  ArrowRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Eye,
  ImageIcon,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCcw,
  SearchCheck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

const DATE_STORAGE_KEY = "gorillaRoomSearchDates";

function RoomsLoadingShell() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
        <Navbar />
        <div className="mt-5 flex min-h-[360px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
            <Loader2 size={36} className="animate-spin" />
          </div>
          <h2 className="mt-5 text-2xl font-black text-slate-950">
            กำลังโหลดหน้าห้องพัก
          </h2>
        </div>
      </section>
    </main>
  );
}

type RoomType = {
  id: number;
  name: string;
  description?: string | null;
  pricePerNight: number;
  capacity: number;
  totalRooms?: number;
  imageUrl?: string | null;
  isActive?: boolean;
  bookedRooms?: number;
  reservedRooms?: number;
  availableRooms?: number;
  isAvailable?: boolean;
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

export default function RoomsPage() {
  return (
    <Suspense fallback={<RoomsLoadingShell />}>
      <RoomsContent />
    </Suspense>
  );
}

function RoomsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const hasSelectedDates = Boolean(checkIn && checkOut);

  const activeRooms = useMemo(() => {
    return rooms.filter((room) => room.isActive !== false);
  }, [rooms]);

  const totalAvailableRooms = useMemo(() => {
    if (!hasSelectedDates) return 0;
    return activeRooms.reduce((sum, room) => {
      return sum + Number(room.availableRooms ?? room.totalRooms ?? 0);
    }, 0);
  }, [activeRooms, hasSelectedDates]);

  async function fetchRooms() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/rooms", {
        method: "GET",
        cache: "no-store",
      });
      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        setError("API /api/rooms ไม่ได้ส่ง JSON กลับมา");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "ไม่สามารถโหลดข้อมูลห้องพักได้");
        return;
      }

      setRooms(result.data || []);
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูลห้องพัก");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const queryCheckIn = searchParams.get("checkIn") || "";
    const queryCheckOut = searchParams.get("checkOut") || "";
    let storedCheckIn = "";
    let storedCheckOut = "";

    try {
      const stored = window.sessionStorage.getItem(DATE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          checkIn?: string;
          checkOut?: string;
        };
        storedCheckIn = parsed.checkIn || "";
        storedCheckOut = parsed.checkOut || "";
      }
    } catch {
      window.sessionStorage.removeItem(DATE_STORAGE_KEY);
    }

    const nextCheckIn = queryCheckIn || storedCheckIn;
    const nextCheckOut = queryCheckOut || storedCheckOut;

    setCheckIn(nextCheckIn);
    setCheckOut(nextCheckOut);

    if (nextCheckIn && nextCheckOut) {
      fetchAvailability(nextCheckIn, nextCheckOut);
    } else {
      fetchRooms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAvailability(
    nextCheckIn = checkIn,
    nextCheckOut = checkOut
  ) {
    try {
      setAvailabilityError("");

      if (!nextCheckIn || !nextCheckOut) return;

      const start = new Date(nextCheckIn);
      const end = new Date(nextCheckOut);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        setAvailabilityError("รูปแบบวันที่ไม่ถูกต้อง");
        return;
      }

      if (end <= start) {
        setAvailabilityError("วันที่ออกต้องมากกว่าวันที่เข้าพัก");
        return;
      }

      setAvailabilityLoading(true);

      const params = new URLSearchParams({
        checkIn: nextCheckIn,
        checkOut: nextCheckOut,
      });
      const response = await fetch(`/api/rooms/availability?${params}`, {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setAvailabilityError(result.message || "ไม่สามารถเช็กห้องว่างได้");
        return;
      }

      setRooms(result.data || []);
    } catch (err) {
      console.error(err);
      setAvailabilityError("เกิดข้อผิดพลาดในการเช็กห้องว่าง");
    } finally {
      setAvailabilityLoading(false);
      setLoading(false);
    }
  }

  function syncSelectedDates(nextCheckIn: string, nextCheckOut: string) {
    const params = new URLSearchParams(window.location.search);

    if (nextCheckIn) {
      params.set("checkIn", nextCheckIn);
    } else {
      params.delete("checkIn");
    }

    if (nextCheckOut) {
      params.set("checkOut", nextCheckOut);
    } else {
      params.delete("checkOut");
    }

    if (nextCheckIn && nextCheckOut) {
      window.sessionStorage.setItem(
        DATE_STORAGE_KEY,
        JSON.stringify({ checkIn: nextCheckIn, checkOut: nextCheckOut })
      );
    } else {
      window.sessionStorage.removeItem(DATE_STORAGE_KEY);
    }

    const nextUrl = params.toString() ? `/rooms?${params.toString()}` : "/rooms";
    router.replace(nextUrl, { scroll: false });
  }

  function handleDateChange(nextCheckIn: string, nextCheckOut: string) {
    setCheckIn(nextCheckIn);
    setCheckOut(nextCheckOut);
    syncSelectedDates(nextCheckIn, nextCheckOut);

    if (nextCheckIn && nextCheckOut) {
      fetchAvailability(nextCheckIn, nextCheckOut);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
        <Navbar />

        <section className="mt-5 overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div
              className="relative min-h-[420px] overflow-hidden bg-slate-950 p-6 text-white sm:p-8 lg:min-h-full lg:p-10"
              style={{
                backgroundImage: "url('/images/S__55943295.jpg')",
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/20" />
              <div className="relative flex h-full flex-col justify-end">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-black text-white ring-1 ring-white/20 backdrop-blur">
                  <SearchCheck size={18} className="text-emerald-300" />
                  เลือกวันเข้าพักก่อนจอง
                </div>
                <h1 className="mt-5 text-4xl font-black leading-tight text-white sm:text-5xl">
                  ค้นหาห้องว่างของ Gorilla Resort
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-100">
                  เลือกวันเข้าพักและวันออก ระบบจะแสดงห้องว่างพร้อมปุ่มจองทันที
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <MiniStat label="ประเภทห้อง" value={String(activeRooms.length)} />
                  <MiniStat
                    label="ราคาเริ่มต้น"
                    value={
                      activeRooms.length
                        ? formatCurrency(
                            Math.min(...activeRooms.map((room) => room.pricePerNight))
                          )
                        : "-"
                    }
                  />
                  <MiniStat
                    label="ห้องว่าง"
                    value={hasSelectedDates ? String(totalAvailableRooms) : "-"}
                  />
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 lg:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <DateField
                  label="วันเข้าพัก"
                  value={checkIn}
                  onChange={(value) => handleDateChange(value, checkOut)}
                />
                <DateField
                  label="วันออก"
                  value={checkOut}
                  onChange={(value) => handleDateChange(checkIn, value)}
                />
              </div>

              <button
                type="button"
                onClick={() => fetchAvailability()}
                disabled={!hasSelectedDates || availabilityLoading}
                className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                {availabilityLoading ? (
                  <Loader2 size={20} className="animate-spin text-white" />
                ) : (
                  <SearchCheck size={20} className="text-white" />
                )}
                เช็กห้องว่าง
              </button>

              {availabilityError && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  {availabilityError}
                </div>
              )}

              {hasSelectedDates && (
                <div className="mt-5 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                        วันที่เลือก
                      </p>
                      <p className="mt-1 text-lg font-black text-slate-950">
                        {formatThaiDate(checkIn)} - {formatThaiDate(checkOut)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 ring-1 ring-emerald-100">
                      ว่างรวม {totalAvailableRooms} ห้อง
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-5">
          {loading && (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                <Loader2 size={36} className="animate-spin" />
              </div>
              <h2 className="mt-5 text-2xl font-black text-slate-950">
                กำลังโหลดรายการห้องพัก
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                กรุณารอสักครู่ ระบบกำลังดึงข้อมูลห้องพัก
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-sm sm:rounded-[2.5rem]">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                    <AlertCircle size={28} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-red-700">
                      โหลดข้อมูลห้องพักไม่สำเร็จ
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-red-600">{error}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fetchRooms}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
                >
                  <RefreshCcw size={18} className="text-white" />
                  โหลดใหม่
                </button>
              </div>
            </div>
          )}

          {!loading && !error && activeRooms.length === 0 && (
            <EmptyState
              icon={BedDouble}
              title="ยังไม่มีห้องพักที่เปิดให้จอง"
              description="ตอนนี้ยังไม่มีประเภทห้องพักที่เปิดใช้งาน กรุณาติดต่อรีสอร์ทหรือลองใหม่ภายหลัง"
            />
          )}

          {!loading && !error && activeRooms.length > 0 && hasSelectedDates && (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {activeRooms.map((room) => {
                const availableRooms = Number(
                  room.availableRooms ?? room.totalRooms ?? 0
                );
                const isAvailable = Boolean(
                  room.isAvailable ?? availableRooms > 0
                );

                return (
                  <article
                    key={room.id}
                    className="group overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200 sm:rounded-[2.5rem]"
                  >
                    <Link
                      href={`/rooms/${room.id}?checkIn=${checkIn}&checkOut=${checkOut}`}
                      className="block"
                      aria-label={`ดูรายละเอียดห้อง ${room.name}`}
                    >
                      <div className="relative h-64 overflow-hidden bg-slate-200">
                        {room.imageUrl ? (
                          <img
                            src={room.imageUrl}
                            alt={room.name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <ImageIcon size={44} />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-2xl bg-white/90 px-3 py-2 text-xs font-black text-slate-700 shadow-sm backdrop-blur">
                          <BedDouble size={15} className="text-slate-700" />
                          Room Type
                        </div>

                        <div
                          className={[
                            "absolute right-4 top-4 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black ring-1",
                            isAvailable
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                              : "bg-red-50 text-red-700 ring-red-100",
                          ].join(" ")}
                        >
                          {isAvailable ? (
                            <CheckCircle2
                              size={15}
                              className="text-emerald-700"
                            />
                          ) : (
                            <XCircle size={15} className="text-red-700" />
                          )}
                          {isAvailable ? `ว่าง ${availableRooms} ห้อง` : "เต็ม"}
                        </div>

                        <div className="absolute bottom-4 left-4 right-4">
                          <h2 className="text-3xl font-black text-white">
                            {room.name}
                          </h2>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-200">
                            {room.description ||
                              "ห้องพักบรรยากาศดี เหมาะสำหรับการพักผ่อน"}
                          </p>
                        </div>
                      </div>
                    </Link>

                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-3">
                        <RoomStat
                          icon={BedDouble}
                          label="ทั้งหมด"
                          value={`${room.totalRooms ?? 0} ห้อง`}
                        />
                        <RoomStat
                          icon={Users}
                          label="จองแล้ว"
                          value={`${room.bookedRooms ?? 0} ห้อง`}
                        />
                        <RoomStat
                          icon={BedDouble}
                          label="ว่าง"
                          value={`${availableRooms} ห้อง`}
                        />
                        <RoomStat
                          icon={Wallet}
                          label="ราคา"
                          value={formatCurrency(room.pricePerNight)}
                        />
                      </div>

                      <div className="mt-5 grid gap-3">
                        <Link
                          href={`/rooms/${room.id}?checkIn=${checkIn}&checkOut=${checkOut}`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-800 transition hover:bg-slate-200"
                        >
                          <Eye size={18} className="text-slate-800" />
                          ดูรายละเอียดห้องพัก
                        </Link>

                        {isAvailable ? (
                          <Link
                            href={`/booking?roomTypeId=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}`}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
                          >
                            จองห้องนี้
                            <ArrowRight size={18} className="text-white" />
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl bg-slate-200 px-5 py-4 text-sm font-black text-slate-500"
                          >
                            ห้องเต็มในช่วงวันที่เลือก
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
                Contact Resort
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">
                ติดต่อรีสอร์ท
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
                หากต้องการสอบถามรายละเอียดห้องพัก การเดินทาง หรือแจ้งข้อมูลเพิ่มเติมหลังจอง
                สามารถติดต่อรีสอร์ทได้ตามช่องทางด้านขวา
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <ContactCard icon={Phone} label="โทร" value="091 782 5165" />
              <ContactCard
                icon={MessageCircle}
                label="อีเมล"
                value="gorillaresort61@gmail.com"
                href="mailto:gorillaresort61@gmail.com"
              />
              <ContactCard
                icon={MapPin}
                label="ที่ตั้ง"
                value="61, Amphoe Kamphaeng Saen, Thailand, 73140"
              />
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-slate-700">
        {label}
      </label>
      <div className="relative">
        <CalendarDays
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-300">{label}</p>
    </div>
  );
}

function RoomStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={16} />
        <p className="text-xs font-bold">{label}</p>
      </div>
      <p className="mt-2 font-black text-slate-950">{value}</p>
    </div>
  );
}

function ContactCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <Icon size={22} className="text-emerald-600" />
      <p className="mt-3 text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-black leading-6 text-slate-950">
        {value}
      </p>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="min-w-0 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 transition hover:bg-white hover:shadow-sm"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="min-w-0 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
      {content}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CalendarDays;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
      <Icon size={42} className="text-slate-400" />
      <h2 className="mt-5 text-2xl font-black text-slate-950">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}
