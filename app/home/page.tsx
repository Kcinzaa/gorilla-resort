"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Coffee,
  Hotel,
  ImageIcon,
  Leaf,
  Loader2,
  MapPin,
  Mountain,
  Phone,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Star,
  Trees,
  Users,
  Waves,
  Wifi,
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

const resortName = "Gorilla Resort";
const resortSubtitle = "Nature Stay & Private Retreat";
const resortPhone = "08x-xxx-xxxx";
const resortLocation = "ใส่ที่อยู่รีสอร์ทของคุณตรงนี้";

const heroImages = [
  {
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1900&q=90",
    tag: "Nature Retreat",
    title: "พักใจกลางธรรมชาติ",
    description:
      "หลบจากความวุ่นวาย แล้วปล่อยให้ธรรมชาติช่วยเติมพลังให้วันพักผ่อนของคุณ",
  },
  {
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1900&q=90",
    tag: "Private Stay",
    title: "ห้องพักส่วนตัว บรรยากาศสงบ",
    description:
      "เลือกห้องที่เหมาะกับคุณ เช็กห้องว่าง และส่งคำขอจองออนไลน์ได้ในไม่กี่ขั้นตอน",
  },
  {
    image:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1900&q=90",
    tag: "Slow Morning",
    title: "เช้าที่ช้าลง และสบายกว่าเดิม",
    description:
      "เริ่มต้นวันใหม่ด้วยบรรยากาศดี ๆ พร้อมระบบจองที่ออกแบบให้ใช้งานง่ายบนมือถือ",
  },
];

const quickStats = [
  {
    value: "24H",
    label: "ส่งคำขอจองได้",
    description: "ลูกค้าสามารถส่งคำขอจองได้ตลอดเวลา",
    icon: Clock3,
  },
  {
    value: "Online",
    label: "เช็กห้องว่าง",
    description: "ตรวจสอบวันเข้าพักและห้องว่างได้ทันที",
    icon: SearchCheck,
  },
  {
    value: "LINE",
    label: "เหมาะกับ LIFF",
    description: "รองรับการเปิดผ่าน LINE OA บนมือถือ",
    icon: Sparkles,
  },
];

const highlights = [
  {
    title: "ห้องพักเป็นส่วนตัว",
    description:
      "เหมาะสำหรับคู่รัก ครอบครัว และกลุ่มเพื่อนที่ต้องการพักผ่อนแบบเงียบสงบ",
    icon: BedDouble,
  },
  {
    title: "บรรยากาศธรรมชาติ",
    description:
      "พื้นที่ร่มรื่น สบายตา ช่วยให้วันหยุดของคุณผ่อนคลายตั้งแต่ก้าวแรก",
    icon: Trees,
  },
  {
    title: "เช็กห้องว่างออนไลน์",
    description:
      "เลือกวันเข้าพักและวันออก ระบบจะแสดงจำนวนห้องว่างให้ทันที",
    icon: SearchCheck,
  },
  {
    title: "แอดมินดูแลการจอง",
    description:
      "หลังส่งคำขอจอง แอดมินจะตรวจสอบข้อมูลและอัปเดตสถานะให้ลูกค้า",
    icon: ShieldCheck,
  },
];

const galleryItems = [
  {
    title: "วิวธรรมชาติ",
    description: "พื้นที่เปิดโล่งสำหรับพักใจและใช้เวลาร่วมกัน",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=90",
    icon: Mountain,
    className: "md:col-span-2 md:row-span-2",
  },
  {
    title: "มุมกาแฟยามเช้า",
    description: "เริ่มเช้าวันหยุดแบบไม่ต้องเร่งรีบ",
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=90",
    icon: Coffee,
    className: "",
  },
  {
    title: "พื้นที่พักผ่อน",
    description: "นั่งเล่น อ่านหนังสือ หรือคุยกันยาว ๆ",
    image:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1000&q=90",
    icon: Waves,
    className: "",
  },
  {
    title: "บ้านพักส่วนตัว",
    description: "พื้นที่เรียบง่าย อบอุ่น และเป็นส่วนตัว",
    image:
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1400&q=90",
    icon: Hotel,
    className: "md:col-span-2",
  },
];

const bookingSteps = [
  {
    title: "เลือกวันที่เข้าพัก",
    description: "เลือกวันเช็กอินและเช็กเอาต์ที่ต้องการ",
  },
  {
    title: "ดูห้องว่าง",
    description: "ระบบจะแสดงห้องที่ยังว่างในช่วงวันที่เลือก",
  },
  {
    title: "ส่งคำขอจอง",
    description: "กรอกข้อมูลติดต่อและรายละเอียดการเข้าพัก",
  },
  {
    title: "รอแอดมินยืนยัน",
    description: "แอดมินตรวจสอบข้อมูลและอัปเดตสถานะการจอง",
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

  const lowestPrice = useMemo(() => {
    if (rooms.length === 0) return 0;

    return rooms.reduce((min, room) => {
      return Math.min(min, Number(room.pricePerNight || 0));
    }, Number(rooms[0]?.pricePerNight || 0));
  }, [rooms]);

  const totalRoomTypes = rooms.length;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroImages.length);
    }, 6500);

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

  return (
    <main className="min-h-screen bg-[#f4f7f2] text-slate-950">
      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
        <Navbar showProfile={false} />

        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 shadow-2xl shadow-slate-300 sm:rounded-[3rem]">
          <div className="absolute inset-0">
            {heroImages.map((slide, index) => (
              <img
                key={slide.image}
                src={slide.image}
                alt={slide.title}
                className={[
                  "absolute inset-0 h-full w-full object-cover transition-all duration-1000",
                  index === activeSlide
                    ? "scale-100 opacity-100"
                    : "scale-110 opacity-0",
                ].join(" ")}
              />
            ))}

            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/65 to-slate-950/20" />
            <div className="absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-slate-950/90 to-transparent" />
            <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-emerald-500/30 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
          </div>

          <div className="relative grid min-h-[680px] gap-8 p-5 sm:p-8 lg:grid-cols-[1.04fr_0.96fr] lg:p-10">
            <div className="flex max-w-4xl flex-col justify-center py-10 text-white">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-black text-white ring-1 ring-white/20 backdrop-blur">
                  <Sparkles size={16} className="text-white" />
                  {resortName}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-bold text-emerald-100 ring-1 ring-emerald-300/25 backdrop-blur">
                  <MapPin size={16} className="text-emerald-100" />
                  {resortSubtitle}
                </span>
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
                รีสอร์ทเงียบสงบ สำหรับวันพักผ่อนที่อยากช้าลง
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-100 sm:text-lg">
                เลือกห้องพัก เช็กวันว่าง และส่งคำขอจองออนไลน์ได้ง่าย
                เหมาะสำหรับลูกค้าที่อยากดูบรรยากาศรีสอร์ทก่อนตัดสินใจเข้าพัก
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/availability"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-2xl"
                >
                  เช็กห้องว่าง
                  <SearchCheck size={18} className="text-white" />
                </Link>

                <Link
                  href="/rooms"
                  className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-2xl"
                >
                  <span className="text-slate-950">ดูห้องพัก</span>
                  <BedDouble size={18} className="text-slate-950" />
                </Link>

                <Link
                  href="/booking-menu"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-6 py-4 text-sm font-black text-white ring-1 ring-white/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/25"
                >
                  เมนูจอง
                  <ArrowRight size={18} className="text-white" />
                </Link>
              </div>

              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                <div className="rounded-[1.5rem] bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur">
                  <p className="text-2xl font-black text-white">
                    {totalRoomTypes > 0 ? totalRoomTypes : "-"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-300">
                    ประเภทห้องพัก
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur">
                  <p className="text-2xl font-black text-white">
                    {lowestPrice > 0 ? formatCurrency(lowestPrice) : "-"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-300">
                    ราคาเริ่มต้น
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur">
                  <p className="text-2xl font-black text-white">LINE</p>
                  <p className="mt-1 text-sm font-semibold text-slate-300">
                    จองผ่าน LIFF
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-end lg:justify-end">
              <div className="w-full max-w-md rounded-[2rem] bg-white/95 p-5 shadow-2xl ring-1 ring-white/70 backdrop-blur sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
                      Featured Stay
                    </p>
                    <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950">
                      {currentImage.title}
                    </h2>
                  </div>

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    <Leaf size={28} className="text-emerald-700" />
                  </div>
                </div>

                <p className="text-sm leading-7 text-slate-600">
                  {currentImage.description}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {quickStats.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.value}
                        className="rounded-2xl bg-slate-50 p-3 text-center ring-1 ring-slate-200 transition hover:-translate-y-1 hover:bg-white hover:shadow-lg"
                      >
                        <Icon
                          size={20}
                          className="mx-auto mb-2 text-emerald-700"
                        />
                        <p className="text-lg font-black text-slate-950">
                          {item.value}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {item.label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-[1.5rem] bg-slate-950 p-4 text-white">
                  <div className="flex items-start gap-3">
                    <BadgeCheck size={24} className="mt-1 text-emerald-300" />
                    <div>
                      <p className="font-black text-white">
                        เริ่มจองได้ทันที
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-300">
                        เช็กห้องว่าง เลือกห้อง และส่งคำขอจองออนไลน์ได้ในไม่กี่ขั้นตอน
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  {heroImages.map((slide, index) => (
                    <button
                      key={slide.image}
                      type="button"
                      onClick={() => setActiveSlide(index)}
                      className={[
                        "h-2.5 rounded-full transition",
                        index === activeSlide
                          ? "w-10 bg-emerald-600"
                          : "w-2.5 bg-slate-300 hover:bg-slate-400",
                      ].join(" ")}
                      aria-label={`ดูภาพ ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="group rounded-[1.7rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:scale-110">
                  <Icon size={27} className="text-emerald-700" />
                </div>
                <h2 className="text-xl font-black text-slate-950">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
              </article>
            );
          })}
        </section>

        <section className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
                Recommended Rooms
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
                ห้องพักแนะนำ
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                เลือกห้องที่เหมาะกับจำนวนผู้เข้าพัก แล้วเช็กวันว่างก่อนส่งคำขอจอง
              </p>
            </div>

            <Link
              href="/rooms"
              className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg"
            >
              <span className="text-slate-950">ดูห้องทั้งหมด</span>
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
                เพิ่มข้อมูลห้องพักในหน้าแอดมิน แล้วส่วนนี้จะแสดงอัตโนมัติ
              </p>
            </div>
          )}

          {!roomsLoading && !roomsError && showcaseRooms.length > 0 && (
            <div className="grid gap-5 md:grid-cols-3">
              {showcaseRooms.map((room) => (
                <article
                  key={room.id}
                  className="group overflow-hidden rounded-[2rem] bg-slate-50 ring-1 ring-slate-200 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-200"
                >
                  <div className="relative h-64 overflow-hidden bg-slate-200">
                    {room.imageUrl ? (
                      <img
                        src={room.imageUrl}
                        alt={room.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-emerald-700">
                        <ImageIcon size={42} />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                    <div className="absolute left-4 top-4 rounded-2xl bg-white/90 px-3 py-2 text-xs font-black text-slate-700 shadow-sm backdrop-blur">
                      พักได้ {room.capacity} คน
                    </div>

                    <div className="absolute right-4 top-4 rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-black text-white shadow-sm">
                      แนะนำ
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
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          เริ่มต้น
                        </p>
                        <p className="text-lg font-black text-emerald-700">
                          {formatCurrency(room.pricePerNight)} / คืน
                        </p>
                      </div>

                      <Link
                        href={`/rooms/${room.id}`}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white transition hover:bg-slate-800"
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
              <p className="text-sm font-black uppercase tracking-wide text-emerald-300">
                Resort Mood
              </p>
              <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                บรรยากาศรอบรีสอร์ท
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                ภาพรวมที่จะช่วยให้ลูกค้ารู้สึกถึงสถานที่ ก่อนเริ่มเช็กห้องว่างและส่งคำขอจอง
              </p>
            </div>

            <Link
              href="/availability"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100"
            >
              <span className="text-slate-950">เช็กห้องว่าง</span>
              <SearchCheck size={18} className="text-slate-950" />
            </Link>
          </div>

          <div className="grid auto-rows-[190px] gap-4 md:grid-cols-4">
            {galleryItems.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className={[
                    "group relative overflow-hidden rounded-[2rem] bg-white/10 ring-1 ring-white/10",
                    item.className,
                  ].join(" ")}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
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
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
            <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
              Booking Steps
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">
              จองห้องพักง่าย ๆ ใน 4 ขั้นตอน
            </h2>

            <div className="mt-6 grid gap-3">
              {bookingSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="group flex items-start gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                    {index + 1}
                  </div>

                  <div>
                    <p className="font-black text-slate-950">{step.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {step.description}
                    </p>
                  </div>

                  <CheckCircle2
                    size={19}
                    className="ml-auto mt-3 shrink-0 text-emerald-600"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
            <div className="absolute right-0 top-0 hidden h-full w-1/2 bg-emerald-50 md:block" />

            <div className="relative grid gap-6 p-5 sm:p-8 md:grid-cols-[1fr_0.9fr] md:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
                  Contact
                </p>
                <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                  พร้อมพักผ่อนแล้ว เริ่มเช็กห้องว่างได้เลย
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  ลูกค้าสามารถเลือกวันเข้าพัก ดูห้องว่าง และส่งคำขอจองผ่านระบบได้ทันที
                  จากนั้นแอดมินจะตรวจสอบและยืนยันรายการให้เรียบร้อย
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/availability"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
                  >
                    เช็กห้องว่าง
                    <CalendarDays size={18} className="text-white" />
                  </Link>

                  <Link
                    href="/booking-menu"
                    className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg"
                  >
                    <span className="text-slate-950">ไปเมนูจอง</span>
                    <ChevronRight size={18} className="text-white" />
                  </Link>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <Phone size={22} className="text-emerald-700" />
                  <p className="mt-3 text-sm font-black text-slate-950">
                    โทร {resortPhone}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    ติดต่อรีสอร์ทเพื่อสอบถามรายละเอียดเพิ่มเติม
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <MapPin size={22} className="text-emerald-700" />
                  <p className="mt-3 text-sm font-black text-slate-950">
                    {resortLocation}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    อัปเดตที่อยู่จริงของรีสอร์ทได้ภายหลัง
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <Wifi size={22} className="text-emerald-700" />
                  <p className="mt-3 text-sm font-black text-slate-950">
                    สะดวก สงบ และจองออนไลน์ได้
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    เหมาะกับลูกค้าที่กดเข้ามาจาก LINE OA
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-[2rem] bg-slate-950 shadow-xl shadow-slate-300 sm:rounded-[2.5rem]">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.85fr]">
            <div className="p-6 text-white sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-slate-200 ring-1 ring-white/10">
                <Star size={16} className="text-amber-300" />
                Ready to book
              </div>

              <h2 className="mt-5 text-3xl font-black leading-tight text-white sm:text-5xl">
                วันพักผ่อนที่ดี เริ่มจากการเลือกที่พักที่ใช่
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                กดเช็กห้องว่าง เลือกวันที่ต้องการ และส่งคำขอจองได้ทันที
                ระบบจะช่วยให้ลูกค้าติดตามสถานะได้ง่ายขึ้น
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/availability"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  เริ่มเช็กห้องว่าง
                  <SearchCheck size={18} className="text-white" />
                </Link>

                <Link
                  href="/my-bookings"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-4 text-sm font-black text-white ring-1 ring-white/15 transition hover:bg-white/20"
                >
                  ดูการจองของฉัน
                  <ArrowRight size={18} className="text-white" />
                </Link>
              </div>
            </div>

            <div className="relative min-h-[300px] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=90"
                alt="Resort room"
                className="h-full min-h-[300px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/20 to-transparent lg:bg-gradient-to-l" />
            </div>
          </div>
        </section>

        <footer className="mt-5 rounded-[2rem] bg-white px-6 py-5 text-center text-sm font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
          {resortName} • {resortSubtitle} • Online Booking System
        </footer>
      </section>
    </main>
  );
}