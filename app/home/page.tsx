"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Coffee,
  ImageIcon,
  Loader2,
  MapPin,
  Mountain,
  Phone,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Trees,
  Waves,
  Wifi,
} from "lucide-react";

type RoomType = {
  id: number;
  name: string;
  description?: string | null;
  pricePerNight: number;
  capacity: number;
  imageUrl?: string | null;
};

const heroImages = [
  {
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=85",
    tag: "Nature Retreat",
    title: "พักผ่อนท่ามกลางธรรมชาติ",
  },
  {
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=85",
    tag: "Private Stay",
    title: "ห้องพักสงบ เป็นส่วนตัว",
  },
  {
    image:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1800&q=85",
    tag: "Slow Morning",
    title: "เช้าที่สบายกว่าเดิม",
  },
];

const highlights = [
  {
    title: "ห้องพักส่วนตัว",
    description: "เหมาะกับคู่รัก ครอบครัว และกลุ่มเพื่อนที่อยากพักแบบสบาย ๆ",
    icon: BedDouble,
  },
  {
    title: "บรรยากาศธรรมชาติ",
    description: "พื้นที่ร่มรื่น เงียบสงบ เหมาะกับวันพักผ่อนที่ไม่ต้องรีบ",
    icon: Trees,
  },
  {
    title: "เช็กห้องว่างออนไลน์",
    description: "เลือกวันเข้าพักและดูห้องว่างก่อนส่งคำขอจองได้ทันที",
    icon: SearchCheck,
  },
  {
    title: "แอดมินดูแลการจอง",
    description: "หลังส่งคำขอจอง รีสอร์ทจะตรวจสอบและยืนยันรายการให้ลูกค้า",
    icon: ShieldCheck,
  },
];

const galleryItems = [
  {
    title: "วิวธรรมชาติ",
    description: "พื้นที่เปิดโล่งสำหรับพักใจและใช้เวลาร่วมกัน",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85",
    icon: Mountain,
    className: "md:col-span-2 md:row-span-2",
  },
  {
    title: "มุมกาแฟ",
    description: "เริ่มเช้าวันหยุดแบบไม่ต้องรีบ",
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=85",
    icon: Coffee,
    className: "",
  },
  {
    title: "พื้นที่พักผ่อน",
    description: "นั่งเล่น อ่านหนังสือ หรือคุยกันยาว ๆ",
    image:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=85",
    icon: Waves,
    className: "",
  },
  {
    title: "บ้านพักส่วนตัว",
    description: "พื้นที่เรียบง่าย อบอุ่น และเป็นส่วนตัว",
    image:
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=85",
    icon: BedDouble,
    className: "md:col-span-2",
  },
];

const bookingSteps = [
  "เลือกวันที่ต้องการเข้าพัก",
  "ดูห้องว่างและรายละเอียดห้อง",
  "ส่งคำขอจองพร้อมข้อมูลติดต่อ",
  "รอแอดมินตรวจสอบและยืนยัน",
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

  const currentImage = useMemo(() => heroImages[activeSlide], [activeSlide]);
  const showcaseRooms = useMemo(() => rooms.slice(0, 3), [rooms]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroImages.length);
    }, 6000);

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
    <main className="min-h-screen bg-[#f3f6f0] text-slate-950">
      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
        <Navbar showProfile={false} />

        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 shadow-2xl shadow-slate-300 sm:rounded-[2.5rem]">
          <div className="absolute inset-0">
            {heroImages.map((slide, index) => (
              <img
                key={slide.image}
                src={slide.image}
                alt={slide.title}
                className={[
                  "absolute inset-0 h-full w-full object-cover transition duration-700",
                  index === activeSlide
                    ? "scale-100 opacity-100"
                    : "scale-105 opacity-0",
                ].join(" ")}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-slate-950/15" />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-slate-950/80 to-transparent" />
          </div>

          <div className="relative grid min-h-[620px] gap-8 p-5 sm:p-8 lg:grid-cols-[1.02fr_0.98fr] lg:p-10">
            <div className="flex max-w-3xl flex-col justify-center py-10 text-white">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-black text-white ring-1 ring-white/20 backdrop-blur">
                  <Sparkles size={16} className="text-white" />
                  Gorilla Resort
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-bold text-emerald-100 ring-1 ring-emerald-300/25 backdrop-blur">
                  <MapPin size={16} className="text-emerald-100" />
                  Nature Stay & Private Retreat
                </span>
              </div>

              <h1 className="text-4xl font-black leading-[1.05] text-white sm:text-6xl lg:text-7xl">
                รีสอร์ทเงียบสงบ สำหรับวันพักผ่อนที่อยากช้าลง
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-100 sm:text-lg">
                เลือกห้องพัก เช็กวันว่าง และส่งคำขอจองออนไลน์ได้ง่าย
                เหมาะสำหรับลูกค้าที่อยากดูบรรยากาศรีสอร์ทก่อนตัดสินใจเข้าพัก
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/availability"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  เช็กห้องว่าง
                  <SearchCheck size={18} className="text-white" />
                </Link>

                <Link
                  href="/rooms"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-slate-100"
                >
                  ดูห้องพัก
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
            </div>

            <div className="flex items-end lg:justify-end">
              <div className="w-full max-w-md rounded-[2rem] bg-white/92 p-5 shadow-2xl ring-1 ring-white/70 backdrop-blur sm:p-6">
                <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
                  Featured Stay
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  {currentImage.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {currentImage.tag} พร้อมระบบจองออนไลน์ที่ช่วยให้ลูกค้าเริ่มต้นได้ทันที
                  ตั้งแต่ดูห้องจนถึงส่งคำขอจอง
                </p>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    ["24H", "ส่งคำขอจอง"],
                    ["Online", "เช็กห้องว่าง"],
                    ["Easy", "ใช้งานง่าย"],
                  ].map(([value, label]) => (
                    <div
                      key={value}
                      className="rounded-2xl bg-slate-50 p-3 text-center ring-1 ring-slate-200"
                    >
                      <p className="text-lg font-black text-slate-950">
                        {value}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {label}
                      </p>
                    </div>
                  ))}
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
                className="rounded-[1.7rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
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
                Rooms
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
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              ดูห้องทั้งหมด
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
                  <div className="relative h-60 overflow-hidden bg-slate-200">
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
                      <p className="text-sm font-black text-emerald-700">
                        เริ่มต้น {formatCurrency(room.pricePerNight)} / คืน
                      </p>

                      <Link
                        href="/rooms"
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
          <div className="mb-6">
            <p className="text-sm font-black uppercase tracking-wide text-emerald-300">
              Resort Mood
            </p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
              บรรยากาศรอบรีสอร์ท
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
              ภาพรวมสำหรับช่วยให้ลูกค้ารู้สึกถึงสถานที่ก่อนเริ่มจอง
            </p>
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
              จองห้องพักง่าย ๆ
            </h2>
            <div className="mt-6 grid gap-3">
              {bookingSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                    {index + 1}
                  </div>
                  <p className="font-bold text-slate-700">{step}</p>
                  <CheckCircle2
                    size={18}
                    className="ml-auto shrink-0 text-emerald-600"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
            <div className="absolute right-0 top-0 h-full w-1/2 bg-emerald-50" />
            <div className="relative grid gap-6 md:grid-cols-[1fr_0.9fr] md:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
                  Contact
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
                  พร้อมพักผ่อนแล้ว เริ่มเช็กห้องว่างได้เลย
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  ลูกค้าสามารถเลือกวันเข้าพัก ดูห้องว่าง
                  และส่งคำขอจองผ่านระบบได้ทันที
                  จากนั้นแอดมินจะตรวจสอบและยืนยันรายการ
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
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    ไปเมนูจอง
                    <ChevronRight size={18} className="text-white" />
                  </Link>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <Phone size={22} className="text-emerald-700" />
                  <p className="mt-3 text-sm font-black text-slate-950">
                    โทร 08x-xxx-xxxx
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <MapPin size={22} className="text-emerald-700" />
                  <p className="mt-3 text-sm font-black text-slate-950">
                    ใส่ที่อยู่รีสอร์ทจริงตรงนี้
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <Wifi size={22} className="text-emerald-700" />
                  <p className="mt-3 text-sm font-black text-slate-950">
                    สะดวก สงบ และจองออนไลน์ได้
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-5 rounded-[2rem] bg-white px-6 py-5 text-center text-sm font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
          Gorilla Resort - Nature Stay & Private Retreat
        </footer>
      </section>
    </main>
  );
}
