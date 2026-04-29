import { prisma } from "@/lib/prisma";
import BookingForm from "@/components/BookingForm";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  CalendarCheck,
  Hotel,
  SearchCheck,
} from "lucide-react";

type BookingPageProps = {
  searchParams: Promise<{
    roomTypeId?: string;
    checkIn?: string;
    checkOut?: string;
  }>;
};

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const params = await searchParams;
  const roomTypeId = Number(params.roomTypeId);

  if (!roomTypeId) {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-950">
        <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
          <Navbar />

          <section className="flex min-h-[70vh] items-center justify-center">
            <div className="w-full max-w-2xl rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-slate-100 text-slate-400">
                <Hotel size={44} />
              </div>

              <h1 className="mt-6 text-3xl font-black text-slate-950">
                ไม่พบห้องพักที่ต้องการจอง
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
                กรุณาเลือกห้องพักจากหน้ารายการห้องพัก หรือเช็กห้องว่างก่อนทำรายการจอง
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/rooms"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  <span className="text-white">เลือกห้องพัก</span>
                  <BedDouble size={18} className="text-white" />
                </Link>

                <Link
                  href="/availability"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  <span className="text-white">เช็กห้องว่าง</span>
                  <SearchCheck size={18} className="text-white" />
                </Link>
              </div>
            </div>
          </section>
        </section>
      </main>
    );
  }

  const room = await prisma.roomType.findFirst({
    where: {
      id: roomTypeId,
      isActive: true,
    },
  });

  if (!room) {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-950">
        <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
          <Navbar />

          <section className="flex min-h-[70vh] items-center justify-center">
            <div className="w-full max-w-2xl rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-slate-100 text-slate-400">
                <BedDouble size={44} />
              </div>

              <h1 className="mt-6 text-3xl font-black text-slate-950">
                ห้องพักนี้ไม่พร้อมให้จอง
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
                ห้องพักอาจถูกปิดใช้งาน หรือไม่มีอยู่ในระบบ กรุณาเลือกห้องพักใหม่อีกครั้ง
              </p>

              <Link
                href="/rooms"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:bg-slate-800"
              >
                <span className="text-white">กลับไปเลือกห้องพัก</span>
                <ArrowRight size={18} className="text-white" />
              </Link>
            </div>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
        <Navbar />

        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-300 sm:rounded-[2.5rem] sm:p-8 lg:p-10">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-emerald-500 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500 blur-3xl" />
          </div>

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-200 ring-1 ring-white/10">
                <CalendarCheck size={16} className="text-slate-200" />
                <span className="text-slate-200">Booking Request</span>
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                ยืนยันข้อมูลการจองห้องพัก
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                ตรวจสอบห้องที่เลือก เลือกวันที่เข้าพัก กรอกข้อมูลติดต่อ
                และส่งคำขอจองให้แอดมินรีสอร์ทตรวจสอบ
              </p>
            </div>

            <div className="rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/10">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-950">
                  <BedDouble size={32} />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-300">
                    ห้องที่เลือก
                  </p>
                  <p className="mt-1 text-2xl font-black text-white">
                    {room.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <BookingForm
            room={room}
            initialCheckIn={params.checkIn || ""}
            initialCheckOut={params.checkOut || ""}
          />
        </section>

        <footer className="mt-5 rounded-[2rem] bg-white px-6 py-5 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          Booking Request • Resort Booking System
        </footer>
      </section>
    </main>
  );
}