import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Coffee,
  Hotel,
  ImageIcon,
  MapPin,
  Mountain,
  Phone,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Star,
  Trees,
  Users,
  Wallet,
  Waves,
  Wifi,
} from "lucide-react";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTomorrowDateInputValue() {
  const now = new Date();
  now.setDate(now.getDate() + 1);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default async function RoomDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const roomId = Number(resolvedParams.id);

  if (!roomId || Number.isNaN(roomId)) {
    notFound();
  }

  const room = await prisma.roomType.findUnique({
    where: {
      id: roomId,
    },
  });

  if (!room || !room.isActive) {
    notFound();
  }

  const relatedRooms = await prisma.roomType.findMany({
    where: {
      isActive: true,
      id: {
        not: room.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 3,
  });

  const confirmedBookings = await prisma.booking.count({
    where: {
      roomTypeId: room.id,
      status: "CONFIRMED",
    },
  });

  const pendingBookings = await prisma.booking.count({
    where: {
      roomTypeId: room.id,
      status: "PENDING",
    },
  });

  const totalRooms = Number(room.totalRooms || 0);
  const today = getTodayDateInputValue();
  const tomorrow = getTomorrowDateInputValue();

  const amenities = [
    {
      title: "ห้องพักส่วนตัว",
      description: "เหมาะสำหรับการพักผ่อนแบบเป็นส่วนตัว",
      icon: BedDouble,
    },
    {
      title: "รองรับผู้เข้าพัก",
      description: `รองรับได้สูงสุด ${room.capacity} คน`,
      icon: Users,
    },
    {
      title: "บรรยากาศธรรมชาติ",
      description: "เหมาะสำหรับวันพักผ่อนที่ต้องการความสงบ",
      icon: Trees,
    },
    {
      title: "จองออนไลน์ได้",
      description: "เลือกวันที่และส่งคำขอจองผ่านระบบได้ทันที",
      icon: SearchCheck,
    },
    {
      title: "แอดมินตรวจสอบ",
      description: "รายการจองจะได้รับการตรวจสอบก่อนยืนยัน",
      icon: ShieldCheck,
    },
    {
      title: "เหมาะกับ LINE LIFF",
      description: "ลูกค้าสามารถเปิดผ่าน LINE OA ได้สะดวก",
      icon: Wifi,
    },
  ];

  const bookingSteps = [
    {
      title: "เลือกวันที่เข้าพัก",
      description: "เลือกวันเช็กอินและเช็กเอาต์ที่ต้องการ",
    },
    {
      title: "ตรวจสอบห้องว่าง",
      description: "ระบบจะตรวจสอบจำนวนห้องที่ยังว่างในช่วงวันที่เลือก",
    },
    {
      title: "ส่งคำขอจอง",
      description: "กรอกข้อมูลติดต่อ จำนวนผู้เข้าพัก และหมายเหตุเพิ่มเติม",
    },
    {
      title: "รอแอดมินยืนยัน",
      description: "แอดมินตรวจสอบรายการ ชำระเงิน และยืนยันการจอง",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f4f7f2] text-slate-950">
      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[2rem] bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:p-4">
          <Link
            href="/rooms"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
          >
            <ArrowLeft size={18} className="text-slate-700" />
            <span className="text-slate-700">กลับไปหน้าห้องพัก</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/availability"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
            >
              <SearchCheck size={18} className="text-white" />
              <span className="text-white">เช็กห้องว่าง</span>
            </Link>

            <Link
              href="/booking-menu"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <span className="text-white">เมนูจอง</span>
              <ChevronRight size={18} className="text-white" />
            </Link>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 shadow-2xl shadow-slate-300 sm:rounded-[3rem]">
          <div className="absolute inset-0">
            {room.imageUrl ? (
              <img
                src={room.imageUrl}
                alt={room.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-600">
                <ImageIcon size={92} />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-950/15" />
            <div className="absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-slate-950/90 to-transparent" />
            <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-emerald-500/30 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
          </div>

          <div className="relative grid min-h-[680px] gap-8 p-5 sm:p-8 lg:grid-cols-[1.04fr_0.96fr] lg:p-10">
            <div className="flex max-w-4xl flex-col justify-center py-10 text-white">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-black text-white ring-1 ring-white/20 backdrop-blur">
                  <Sparkles size={16} className="text-white" />
                  Gorilla Resort
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-bold text-emerald-100 ring-1 ring-emerald-300/25 backdrop-blur">
                  <Hotel size={16} className="text-emerald-100" />
                  Room Detail
                </span>
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
                {room.name}
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-100 sm:text-lg">
                {room.description ||
                  "ห้องพักบรรยากาศดี เหมาะสำหรับการพักผ่อนแบบเงียบสงบ พร้อมสิ่งอำนวยความสะดวกครบครัน"}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={`/booking?roomTypeId=${room.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-2xl"
                >
                  <span className="text-white">จองห้องนี้</span>
                  <ArrowRight size={18} className="text-white" />
                </Link>

                <Link
                  href="/availability"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-2xl"
                >
                  <SearchCheck size={18} className="text-slate-950" />
                  <span className="text-slate-950">เช็กห้องว่าง</span>
                </Link>

                <Link
                  href="/my-bookings"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-6 py-4 text-sm font-black text-white ring-1 ring-white/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/25"
                >
                  <span className="text-white">การจองของฉัน</span>
                  <ChevronRight size={18} className="text-white" />
                </Link>
              </div>

              <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
                <div className="rounded-[1.5rem] bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur">
                  <p className="text-2xl font-black text-white">
                    {formatCurrency(room.pricePerNight)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-300">
                    ราคาต่อคืน
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur">
                  <p className="text-2xl font-black text-white">
                    {room.capacity} คน
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-300">
                    รองรับผู้เข้าพัก
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur">
                  <p className="text-2xl font-black text-white">
                    {totalRooms > 0 ? `${totalRooms} ห้อง` : "-"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-300">
                    จำนวนห้องทั้งหมด
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-end lg:justify-end">
              <div className="w-full max-w-md rounded-[2rem] bg-white/95 p-5 shadow-2xl ring-1 ring-white/70 backdrop-blur sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
                      Booking Card
                    </p>
                    <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950">
                      เริ่มต้น {formatCurrency(room.pricePerNight)} / คืน
                    </h2>
                  </div>

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    <Wallet size={28} className="text-emerald-700" />
                  </div>
                </div>

                <p className="text-sm leading-7 text-slate-600">
                  เลือกวันที่เข้าพักและวันที่ออก แล้วกดจองเพื่อส่งคำขอจองห้องนี้ได้ทันที
                </p>

                <form action="/booking" method="GET" className="mt-5 grid gap-3">
                  <input type="hidden" name="roomTypeId" value={room.id} />

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      วันที่เข้าพัก
                    </label>
                    <div className="relative">
                      <CalendarDays
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="date"
                        name="checkIn"
                        defaultValue={today}
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      วันที่ออก
                    </label>
                    <div className="relative">
                      <CalendarDays
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="date"
                        name="checkOut"
                        defaultValue={tomorrow}
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-2 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700"
                  >
                    <span className="text-white">จองห้องนี้</span>
                    <ArrowRight size={18} className="text-white" />
                  </button>

                  <Link
                    href={`/availability?roomTypeId=${room.id}`}
                    className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    <SearchCheck size={18} className="text-white" />
                    <span className="text-white">เช็กห้องว่างก่อนจอง</span>
                  </Link>
                </form>

                <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex items-start gap-3">
                    <BadgeCheck size={24} className="mt-1 text-emerald-600" />
                    <div>
                      <p className="font-black text-slate-950">
                        การจองจะรอแอดมินตรวจสอบ
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        หลังส่งคำขอจอง แอดมินจะตรวจสอบข้อมูลและยืนยันรายการให้ลูกค้า
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-5">
            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
                    Room Overview
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
                    รายละเอียดห้องพัก
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                    ข้อมูลสำคัญของห้องพัก ประกอบด้วยราคา จำนวนผู้เข้าพัก และจำนวนห้องทั้งหมด
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1.5rem] bg-slate-50 p-5 ring-1 ring-slate-200">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    <Banknote size={24} className="text-emerald-700" />
                  </div>
                  <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-500">
                    ราคา
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-950">
                    {formatCurrency(room.pricePerNight)} / คืน
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-slate-50 p-5 ring-1 ring-slate-200">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                    <Users size={24} className="text-blue-700" />
                  </div>
                  <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-500">
                    ผู้เข้าพัก
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-950">
                    สูงสุด {room.capacity} คน
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-slate-50 p-5 ring-1 ring-slate-200">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                    <BedDouble size={24} className="text-amber-700" />
                  </div>
                  <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-500">
                    จำนวนห้อง
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-950">
                    {totalRooms > 0 ? `${totalRooms} ห้อง` : "-"}
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/10">
                    <Star size={24} className="text-white" />
                  </div>
                  <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-400">
                    สถานะ
                  </p>
                  <p className="mt-1 text-lg font-black text-white">
                    พร้อมรับคำขอจอง
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-5 ring-1 ring-slate-200">
                <h3 className="text-xl font-black text-slate-950">
                  คำอธิบายห้องพัก
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {room.description ||
                    "ห้องพักบรรยากาศดี เหมาะสำหรับลูกค้าที่ต้องการพักผ่อนแบบสงบ มีพื้นที่ใช้งานสะดวก และเหมาะกับการเข้าพักในวันหยุด"}
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
              <div className="mb-6">
                <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
                  Amenities
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  จุดเด่นของห้องนี้
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  รายละเอียดเสริมที่ช่วยให้ลูกค้าตัดสินใจได้ง่ายขึ้น
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {amenities.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article
                      key={item.title}
                      className="group rounded-[1.5rem] bg-slate-50 p-5 ring-1 ring-slate-200 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-200"
                    >
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 transition group-hover:scale-110">
                        <Icon size={24} className="text-emerald-700" />
                      </div>
                      <h3 className="font-black text-slate-950">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {item.description}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-300 sm:rounded-[2.5rem] sm:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-emerald-300">
                    Booking Steps
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-white">
                    จองห้องนี้อย่างไร
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                    ลูกค้าสามารถเริ่มจากการเช็กห้องว่าง แล้วส่งคำขอจองผ่านระบบได้ทันที
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {bookingSteps.map((step, index) => (
                  <article
                    key={step.title}
                    className="rounded-[1.5rem] bg-white/10 p-5 ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-white/15"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-black text-slate-950">
                      {index + 1}
                    </div>
                    <h3 className="mt-5 font-black text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {step.description}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-6 lg:sticky lg:top-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-white">
              <BedDouble size={30} className="text-white" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              สรุปห้องพัก
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              ข้อมูลสำคัญสำหรับตัดสินใจก่อนส่งคำขอจอง
            </p>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Room
                </p>
                <p className="mt-1 font-black text-slate-950">{room.name}</p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Price
                </p>
                <p className="mt-1 text-2xl font-black text-emerald-700">
                  {formatCurrency(room.pricePerNight)}
                </p>
                <p className="mt-1 text-xs font-semibold text-emerald-700">
                  ต่อคืน
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Capacity
                </p>
                <p className="mt-1 font-black text-slate-950">
                  {room.capacity} คน
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950 p-4 text-white">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Admin status
                </p>
                <p className="mt-1 font-black text-white">
                  ยืนยันโดยแอดมิน
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <Link
                href={`/booking?roomTypeId=${room.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
              >
                <span className="text-white">จองห้องนี้</span>
                <ArrowRight size={18} className="text-white" />
              </Link>

              <Link
                href="/availability"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800"
              >
                <SearchCheck size={18} className="text-white" />
                <span className="text-white">เช็กห้องว่าง</span>
              </Link>

              <Link
                href="/rooms"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                <ArrowLeft size={18} className="text-slate-700" />
                <span className="text-slate-700">ดูห้องอื่น</span>
              </Link>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-amber-50 p-5 ring-1 ring-amber-100">
              <div className="flex items-start gap-3">
                <Clock3 size={24} className="text-amber-600" />
                <div>
                  <p className="font-black text-amber-700">
                    หมายเหตุ
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-700">
                    การจองจะสมบูรณ์เมื่อแอดมินตรวจสอบและยืนยันรายการเรียบร้อยแล้ว
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-5 ring-1 ring-slate-200">
              <div className="flex items-start gap-3">
                <Phone size={24} className="text-emerald-700" />
                <div>
                  <p className="font-black text-slate-950">
                    ติดต่อรีสอร์ท
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    โทร 08x-xxx-xxxx หรือสอบถามผ่าน LINE OA ของรีสอร์ท
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        {relatedRooms.length > 0 && (
          <section className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
                  More Rooms
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
                  ห้องพักอื่นที่น่าสนใจ
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                  ลูกค้าสามารถดูตัวเลือกอื่น ๆ และเปรียบเทียบก่อนจองได้
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

            <div className="grid gap-5 md:grid-cols-3">
              {relatedRooms.map((item) => (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-[2rem] bg-slate-50 ring-1 ring-slate-200 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-200"
                >
                  <div className="relative h-60 overflow-hidden bg-slate-200">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-emerald-700">
                        <ImageIcon size={42} />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    <div className="absolute left-4 top-4 rounded-2xl bg-white/90 px-3 py-2 text-xs font-black text-slate-700 shadow-sm backdrop-blur">
                      พักได้ {item.capacity} คน
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-2xl font-black text-white">
                        {item.name}
                      </p>
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="min-h-12 text-sm leading-6 text-slate-500">
                      {item.description ||
                        "ห้องพักบรรยากาศดี เหมาะสำหรับการพักผ่อน"}
                    </p>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          เริ่มต้น
                        </p>
                        <p className="text-lg font-black text-emerald-700">
                          {formatCurrency(item.pricePerNight)} / คืน
                        </p>
                      </div>

                      <Link
                        href={`/rooms/${item.id}`}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white transition hover:bg-slate-800"
                      >
                        <ArrowRight size={18} className="text-white" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="mt-5 overflow-hidden rounded-[2rem] bg-slate-950 shadow-xl shadow-slate-300 sm:rounded-[2.5rem]">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.85fr]">
            <div className="p-6 text-white sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-slate-200 ring-1 ring-white/10">
                <Coffee size={16} className="text-amber-300" />
                Ready to relax
              </div>

              <h2 className="mt-5 text-3xl font-black leading-tight text-white sm:text-5xl">
                เลือกห้องที่ใช่ แล้วเริ่มวันพักผ่อนของคุณ
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                กดเช็กห้องว่าง เลือกวันที่ต้องการ และส่งคำขอจองได้ทันที
                ระบบจะช่วยให้ลูกค้าติดตามสถานะการจองได้สะดวกยิ่งขึ้น
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/availability"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  <span className="text-white">เริ่มเช็กห้องว่าง</span>
                  <SearchCheck size={18} className="text-white" />
                </Link>

                <Link
                  href="/my-bookings"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-4 text-sm font-black text-white ring-1 ring-white/15 transition hover:bg-white/20"
                >
                  <span className="text-white">ดูการจองของฉัน</span>
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
          Gorilla Resort • Room Detail • Online Booking System
        </footer>
      </section>
    </main>
  );
}