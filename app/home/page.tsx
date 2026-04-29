"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useLineProfile } from "@/lib/useLineProfile";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Coffee,
  Heart,
  ImageIcon,
  Loader2,
  MapPin,
  MessageCircle,
  Mountain,
  Phone,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Star,
  Trees,
  User,
  Waves,
  X,
} from "lucide-react";

type RoomType = {
  id: number;
  name: string;
  description?: string | null;
  pricePerNight: number;
  capacity: number;
  totalRooms?: number | null;
  imageUrl?: string | null;
  isActive?: boolean;
};

const heroImages = [
  {
    image: "/images/resort-hero.jpg",
    tag: "Nature Stay",
    caption: "ธรรมชาติ ความเงียบสงบ และการพักผ่อนที่ลงตัว",
  },
  {
    image: "/images/deluxe.jpg",
    tag: "Garden View",
    caption: "ห้องพักวิวสวน บรรยากาศสบาย เหมาะกับการพักผ่อน",
  },
  {
    image: "/images/pool-villa.jpg",
    tag: "Private Villa",
    caption: "บ้านพักส่วนตัว สำหรับวันหยุดพิเศษของคุณ",
  },
];

const quickStats = [
  {
    value: "24H",
    label: "ส่งคำขอจองได้ตลอด",
    description: "ลูกค้าสามารถส่งคำขอจองผ่านระบบได้ทุกเวลา",
  },
  {
    value: "LINE",
    label: "รองรับ LIFF",
    description: "เหมาะกับการเปิดผ่าน LINE OA บนมือถือ",
  },
  {
    value: "Easy",
    label: "ใช้งานง่าย",
    description: "เช็กห้องว่าง เลือกห้อง และติดตามสถานะได้",
  },
];

const amenities = [
  {
    title: "ห้องพักส่วนตัว",
    description: "มีห้องพักหลายรูปแบบ รองรับคู่รัก ครอบครัว และกลุ่มเพื่อน",
    icon: BedDouble,
    color: "bg-blue-50 text-blue-600 ring-blue-100",
  },
  {
    title: "บรรยากาศธรรมชาติ",
    description: "พื้นที่สงบ ร่มรื่น เหมาะกับการพักผ่อนในวันหยุด",
    icon: Trees,
    color: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  },
  {
    title: "เช็กห้องว่างออนไลน์",
    description: "เลือกวันเข้าพักและวันออก เพื่อดูห้องว่างก่อนจองจริง",
    icon: SearchCheck,
    color: "bg-amber-50 text-amber-600 ring-amber-100",
  },
  {
    title: "ติดตามการจอง",
    description: "ลูกค้าสามารถดูสถานะการจองล่าสุดของตัวเองได้",
    icon: CalendarCheck,
    color: "bg-violet-50 text-violet-600 ring-violet-100",
  },
];

const galleryItems = [
  {
    title: "วิวธรรมชาติ",
    description: "บรรยากาศรอบรีสอร์ทที่เหมาะกับการพักใจ",
    image: "/images/resort-hero.jpg",
    icon: Mountain,
    className: "md:col-span-2 md:row-span-2",
  },
  {
    title: "ห้องพักอบอุ่น",
    description: "พื้นที่พักผ่อนที่เรียบง่ายและสะดวกสบาย",
    image: "/images/standard.jpg",
    icon: BedDouble,
    className: "",
  },
  {
    title: "มุมพักผ่อน",
    description: "มุมสบาย ๆ สำหรับครอบครัวและกลุ่มเพื่อน",
    image: "/images/deluxe.jpg",
    icon: Coffee,
    className: "",
  },
  {
    title: "บ้านพักส่วนตัว",
    description: "พื้นที่พักผ่อนสำหรับช่วงเวลาพิเศษ",
    image: "/images/pool-villa.jpg",
    icon: Waves,
    className: "md:col-span-2",
  },
];

const bookingSteps = [
  {
    title: "ดูข้อมูลรีสอร์ท",
    description: "ลูกค้าเริ่มจากหน้าแรก เพื่อดูบรรยากาศและจุดเด่นของรีสอร์ท",
    icon: Sparkles,
  },
  {
    title: "เช็กห้องว่าง",
    description: "เลือกวันเข้าพักและวันออก เพื่อดูห้องที่ยังว่าง",
    icon: SearchCheck,
  },
  {
    title: "เลือกห้องพัก",
    description: "ดูรายละเอียดห้อง ราคา และจำนวนผู้เข้าพักที่รองรับ",
    icon: BedDouble,
  },
  {
    title: "ส่งคำขอจอง",
    description: "กรอกข้อมูลและรอแอดมินของรีสอร์ทยืนยันรายการจอง",
    icon: CalendarCheck,
  },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ResortHomePage() {
  const { profile, loading, error, isDevMode } = useLineProfile();

  const [openProfile, setOpenProfile] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState("");

  const currentImage = useMemo(() => {
    return heroImages[activeSlide];
  }, [activeSlide]);

  const showcaseRooms = useMemo(() => {
    return rooms.slice(0, 3);
  }, [rooms]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroImages.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    try {
      setRoomsLoading(true);
      setRoomsError("");

      const response = await fetch("/api/rooms", {
        method: "GET",
        cache: "no-store",
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        setRoomsError("API /api/rooms ยังไม่ส่ง JSON กลับมา");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        setRoomsError(result.message || "ไม่สามารถโหลดข้อมูลห้องพักได้");
        return;
      }

      setRooms(result.data || []);
    } catch (err) {
      console.warn(err);
      setRoomsError("เกิดข้อผิดพลาดในการโหลดข้อมูลห้องพัก");
    } finally {
      setRoomsLoading(false);
    }
  }

  function nextSlide() {
    setActiveSlide((prev) => (prev + 1) % heroImages.length);
  }

  function prevSlide() {
    setActiveSlide((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1));
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
        <Navbar onOpenProfile={() => setOpenProfile(true)} />

        {isDevMode && (
          <div className="mb-5 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700">
            DEV MODE: กำลังใช้ผู้ใช้ทดสอบ test-line-user-001 เพราะยังไม่ได้ตั้งค่า LIFF ID
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-3 shadow-2xl shadow-slate-300 sm:rounded-[3rem] sm:p-5">
          <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="relative overflow-hidden rounded-[1.7rem] bg-slate-900 p-5 text-white sm:rounded-[2.5rem] sm:p-8 lg:p-10">
              <div className="absolute inset-0 opacity-40">
                <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-500 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500 blur-3xl" />
              </div>

              <div className="relative z-10 flex min-h-[580px] flex-col justify-between">
                <div>
                  <div className="mb-6 flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-200 ring-1 ring-white/10">
                      <Sparkles size={16} className="text-slate-200" />
                      <span className="text-slate-200">Resort Showcase</span>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-200 ring-1 ring-emerald-400/20">
                      <Star size={16} className="text-emerald-200" />
                      <span className="text-emerald-200">LINE Booking</span>
                    </div>
                  </div>

                  <h1 className="max-w-4xl text-4xl font-black leading-[1.06] tracking-tight text-white sm:text-6xl lg:text-7xl">
                    จองผ่าน LINE OA และ LIFF ได้บนมือถือ
                  </h1>

                  <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
                    ระบบออกแบบให้ใช้งานง่ายบนมือถือ เหมาะสำหรับลูกค้าที่กดเข้ามาจาก Banner
                    ใน LINE OA ตั้งแต่หน้าแรกจนถึงการส่งคำขอจอง
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Link
                      href="/"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-xl"
                    >
                      <span className="text-slate-950">ไปหน้าเมนูจอง</span>
                      <ArrowRight size={18} className="text-slate-950" />
                    </Link>

                    <Link
                      href="/availability"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl"
                    >
                      <span className="text-white">เช็กห้องว่าง</span>
                      <SearchCheck size={18} className="text-white" />
                    </Link>

                    <Link
                      href="/rooms"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-4 text-sm font-black text-white ring-1 ring-white/15 transition hover:-translate-y-0.5 hover:bg-white/20"
                    >
                      <span className="text-white">ดูห้องพัก</span>
                      <BedDouble size={18} className="text-white" />
                    </Link>
                  </div>
                </div>

                <div className="mt-10 grid gap-3 sm:grid-cols-3">
                  {quickStats.map((item) => (
                    <div
                      key={item.value}
                      className="rounded-[2rem] bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur"
                    >
                      <p className="text-3xl font-black text-white">
                        {item.value}
                      </p>
                      <p className="mt-2 text-sm font-bold text-slate-200">
                        {item.label}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[1.7rem] bg-white/10 p-3 ring-1 ring-white/10 sm:rounded-[2.5rem]">
              <div className="relative min-h-[430px] overflow-hidden rounded-[1.45rem] bg-slate-200 sm:min-h-[570px] sm:rounded-[2.2rem]">
                {heroImages.map((slide, index) => (
                  <img
                    key={slide.image}
                    src={slide.image}
                    alt={slide.tag}
                    className={[
                      "absolute inset-0 h-full w-full object-cover transition-all duration-700",
                      index === activeSlide
                        ? "scale-100 opacity-100"
                        : "scale-105 opacity-0",
                    ].join(" ")}
                  />
                ))}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
                  <div className="rounded-2xl bg-white/90 p-3 shadow-lg backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                        <Star size={22} className="text-emerald-700" />
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Featured
                        </p>
                        <p className="text-base font-black text-slate-950">
                          {currentImage.tag}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="hidden rounded-2xl bg-slate-950/70 px-4 py-3 text-right text-white ring-1 ring-white/10 backdrop-blur sm:block">
                    <p className="text-xs text-slate-300">Online Request</p>
                    <p className="text-lg font-black text-white">24 Hours</p>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 backdrop-blur">
                    <MapPin size={16} className="text-white" />
                    <span className="text-white">
                      ใส่ที่อยู่รีสอร์ทของคุณตรงนี้
                    </span>
                  </div>

                  <h2 className="max-w-lg text-3xl font-black leading-tight text-white sm:text-4xl">
                    {currentImage.caption}
                  </h2>
                </div>

                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={prevSlide}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-slate-950 shadow-sm backdrop-blur transition hover:bg-white"
                    aria-label="ก่อนหน้า"
                  >
                    <ArrowLeft size={18} className="text-slate-950" />
                  </button>

                  <button
                    type="button"
                    onClick={nextSlide}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-slate-950 shadow-sm backdrop-blur transition hover:bg-white"
                    aria-label="ถัดไป"
                  >
                    <ArrowRight size={18} className="text-slate-950" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2">
                  {heroImages.map((slide, index) => (
                    <button
                      key={slide.tag}
                      type="button"
                      onClick={() => setActiveSlide(index)}
                      className={[
                        "h-2 rounded-full transition-all",
                        index === activeSlide
                          ? "w-9 bg-white"
                          : "w-2 bg-white/40 hover:bg-white/70",
                      ].join(" ")}
                      aria-label={`เลือกสไลด์ ${index + 1}`}
                    />
                  ))}
                </div>

                <p className="text-sm font-bold text-white/80">
                  {activeSlide + 1} / {heroImages.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Phone size={28} className="text-emerald-600" />
            </div>

            <h3 className="mt-5 text-2xl font-black text-slate-950">
              ติดต่อรีสอร์ท
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              08x-xxx-xxxx
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              เปิดรับคำขอจองออนไลน์ 24 ชั่วโมง
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpenProfile(true)}
            className="rounded-[2rem] bg-white p-5 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:bg-slate-50 hover:shadow-xl hover:shadow-slate-200 sm:p-6"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <User size={28} className="text-blue-600" />
            </div>

            <h3 className="mt-5 text-2xl font-black text-slate-950">
              โปรไฟล์ LINE
            </h3>

            {loading ? (
              <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                กำลังโหลดข้อมูล...
              </div>
            ) : profile ? (
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-400">
                  {profile.pictureUrl ? (
                    <img
                      src={profile.pictureUrl}
                      alt={profile.displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={20} />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">
                    {profile.displayName}
                  </p>
                  <p className="text-xs text-slate-500">กดเพื่อดูข้อมูล</p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm font-semibold text-red-600">
                ไม่พบข้อมูลผู้ใช้
              </p>
            )}
          </button>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
            <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
              Resort Story
            </p>

            <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
              ที่พักสำหรับวันพักผ่อนที่ไม่ต้องเร่งรีบ
            </h2>

            <p className="mt-5 text-sm leading-7 text-slate-500 sm:text-base">
              หน้าแรกนี้ทำหน้าที่เป็นหน้าโชว์รีสอร์ทก่อนเข้าสู่ระบบจอง
              ช่วยให้ลูกค้าเห็นภาพรวม บรรยากาศ จุดเด่น และความน่าเชื่อถือของรีสอร์ท
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <Heart size={26} className="text-red-500" />
                <p className="mt-4 font-black text-slate-950">
                  สร้างความประทับใจก่อนจอง
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  ลูกค้าเห็นบรรยากาศก่อนตัดสินใจเข้าสู่หน้าเมนูจอง
                </p>
              </div>

              <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <ShieldCheck size={26} className="text-emerald-600" />
                <p className="mt-4 font-black text-slate-950">
                  มีระบบยืนยันโดยแอดมิน
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  หลังส่งคำขอจอง แอดมินสามารถตรวจสอบและอัปเดตสถานะได้
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              {amenities.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-[2rem] bg-slate-50 p-5 ring-1 ring-slate-200 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-200"
                  >
                    <div
                      className={[
                        "flex h-14 w-14 items-center justify-center rounded-2xl ring-1",
                        item.color,
                      ].join(" ")}
                    >
                      <Icon size={26} />
                    </div>

                    <h3 className="mt-5 text-lg font-black text-slate-950">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
                Signature Rooms
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
                ตัวอย่างห้องพักยอดนิยม
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                ดึงข้อมูลห้องพักจริงจากฐานข้อมูล เพื่อให้หน้าแรกอัปเดตตามห้องที่แอดมินเพิ่ม
              </p>
            </div>

            <Link
              href="/rooms"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <span className="text-white">ดูห้องทั้งหมด</span>
              <ArrowRight size={18} className="text-white" />
            </Link>
          </div>

          {roomsLoading && (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[2rem] bg-slate-50 p-8 text-center ring-1 ring-slate-200">
              <Loader2 size={42} className="animate-spin text-slate-400" />
              <h3 className="mt-5 text-2xl font-black text-slate-950">
                กำลังโหลดห้องพัก
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                ระบบกำลังดึงข้อมูลห้องพักจากฐานข้อมูล
              </p>
            </div>
          )}

          {!roomsLoading && roomsError && (
            <div className="rounded-[2rem] border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
              {roomsError}
            </div>
          )}

          {!roomsLoading && !roomsError && showcaseRooms.length === 0 && (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[2rem] bg-slate-50 p-8 text-center ring-1 ring-slate-200">
              <BedDouble size={42} className="text-slate-400" />
              <h3 className="mt-5 text-2xl font-black text-slate-950">
                ยังไม่มีข้อมูลห้องพัก
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                กรุณาเพิ่มข้อมูลห้องพักในหน้าแอดมินหรือ Supabase Table Editor
              </p>
            </div>
          )}

          {!roomsLoading && !roomsError && showcaseRooms.length > 0 && (
            <div className="grid gap-5 md:grid-cols-3">
              {showcaseRooms.map((room) => (
                <article
                  key={room.id}
                  className="group overflow-hidden rounded-[2rem] bg-slate-50 ring-1 ring-slate-200 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-200 sm:rounded-[2.5rem]"
                >
                  <div className="relative h-60 overflow-hidden bg-slate-200">
                    {room.imageUrl ? (
                      <img
                        src={room.imageUrl}
                        alt={room.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ImageIcon size={42} />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    <div className="absolute left-4 top-4 rounded-2xl bg-white/90 px-3 py-2 text-xs font-black text-slate-700 shadow-sm backdrop-blur">
                      พักได้ {room.capacity} คน
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-2xl font-black text-white">
                        {room.name}
                      </p>
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="min-h-12 text-sm leading-6 text-slate-500">
                      {room.description ||
                        "ห้องพักบรรยากาศดี เหมาะสำหรับการพักผ่อน"}
                    </p>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-emerald-600">
                        เริ่มต้น {formatCurrency(room.pricePerNight)} / คืน
                      </p>

                      <Link
                        href={`/rooms/${room.id}`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white transition hover:bg-slate-800"
                      >
                        <ArrowRight size={18} className="text-white" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-5 rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-300 sm:rounded-[2.5rem] sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-slate-300">
                Gallery Preview
              </p>
              <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                บรรยากาศรอบรีสอร์ท
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                ส่วนนี้สามารถเปลี่ยนเป็นรูปจริงของรีสอร์ท เช่น วิวด้านหน้า ห้องพัก
                สระว่ายน้ำ คาเฟ่ หรือพื้นที่พักผ่อน
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100"
            >
              <span className="text-slate-950">เข้าสู่หน้าเมนูจอง</span>
              <ArrowRight size={18} className="text-slate-950" />
            </Link>
          </div>

          <div className="grid auto-rows-[190px] gap-4 md:grid-cols-4">
            {galleryItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className={[
                    "group relative overflow-hidden rounded-[2rem] bg-white/10 ring-1 ring-white/10",
                    item.className,
                  ].join(" ")}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
                      <Icon size={24} className="text-white" />
                    </div>

                    <p className="text-xl font-black text-white">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
              Booking Flow
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
              ขั้นตอนหลังจากเข้าหน้านี้
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              หน้าแรกนี้ทำหน้าที่โชว์รีสอร์ท จากนั้นลูกค้าจะกดไปยังหน้าเมนูจองเพื่อเริ่มใช้งานระบบ
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {bookingSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="rounded-[2rem] bg-slate-50 p-5 ring-1 ring-slate-200 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-200"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                      <span className="text-white">{index + 1}</span>
                    </div>

                    <Icon size={24} className="text-slate-400" />
                  </div>

                  <h3 className="font-black text-slate-950">{step.title}</h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {step.description}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-600">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span className="text-emerald-600">พร้อมใช้งาน</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
            <MapPin size={30} className="text-emerald-600" />

            <h2 className="mt-5 text-3xl font-black text-slate-950">
              ที่ตั้งและการติดต่อ
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              ใส่ข้อมูลที่อยู่รีสอร์ท เบอร์โทร หรือคำแนะนำการเดินทางจริงได้ตรงนี้
              เพื่อให้ลูกค้าดูข้อมูลก่อนเข้าสู่ระบบจอง
            </p>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
                ที่อยู่: ใส่ที่อยู่รีสอร์ทของคุณ
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
                โทร: 08x-xxx-xxxx
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
                LINE OA: ใส่ชื่อ LINE Official Account
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-300 sm:rounded-[2.5rem] sm:p-8">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />

            <div className="relative z-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10">
                <MessageCircle size={30} className="text-white" />
              </div>

              <h2 className="mt-5 text-3xl font-black text-white sm:text-4xl">
                พร้อมเริ่มจองห้องพักแล้วหรือยัง?
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                กดปุ่มด้านล่างเพื่อไปยังหน้าเมนูจองที่สอง
                ซึ่งเป็นหน้าที่ลูกค้าสามารถเลือกเช็กห้องว่าง ดูห้องพัก
                และดูรายการจองของตัวเองได้
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                >
                  <span className="text-slate-950">ไปหน้าเมนูจอง</span>
                  <ChevronRight size={18} className="text-slate-950" />
                </Link>

                <Link
                  href="/availability"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  <span className="text-white">เช็กห้องว่างทันที</span>
                  <SearchCheck size={18} className="text-white" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-5 rounded-[2rem] bg-white px-6 py-5 text-center text-sm font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
          Resort Showcase Home • ลูกค้ากดจาก LINE OA Banner แล้วเข้าหน้านี้ก่อน
        </footer>
      </section>

      {openProfile && profile && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="bg-slate-950 px-6 py-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-300">
                    LINE Profile
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-white">
                    ข้อมูลลูกค้า
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenProfile(false)}
                  className="rounded-full bg-white/10 p-2 transition hover:bg-white/20"
                >
                  <X size={22} className="text-white" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-slate-100 text-slate-400 ring-1 ring-slate-200">
                  {profile.pictureUrl ? (
                    <img
                      src={profile.pictureUrl}
                      alt={profile.displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={42} />
                  )}
                </div>

                <h3 className="text-2xl font-black text-slate-950">
                  {profile.displayName}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {profile.isDevMode ? "Development Mode" : "LINE LIFF User"}
                </p>
              </div>

              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    LINE User ID
                  </p>
                  <p className="mt-1 break-all text-sm font-bold text-slate-950">
                    {profile.userId}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Display Name
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    {profile.displayName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpenProfile(false)}
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <span className="text-white">ปิด</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}