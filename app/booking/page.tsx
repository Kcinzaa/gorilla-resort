import { prisma } from "@/lib/prisma";
import BookingForm from "@/components/BookingForm";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { ArrowRight, BedDouble, Hotel, SearchCheck } from "lucide-react";

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
    select: {
      id: true,
      name: true,
      description: true,
      pricePerNight: true,
      capacity: true,
      totalRooms: true,
      imageUrl: true,
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

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
                ห้องที่เลือก
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">
                {room.name}
              </h1>
            </div>

            <div className="rounded-[2rem] bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <BedDouble size={32} />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-500">ราคา/คืน</p>
                  <p className="mt-1 text-xl font-black text-slate-950">
                    ฿{room.pricePerNight.toLocaleString("th-TH")}
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

      </section>
    </main>
  );
}
