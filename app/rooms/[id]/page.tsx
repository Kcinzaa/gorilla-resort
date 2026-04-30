import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Hotel,
  ImageIcon,
  Users,
  Wallet,
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

export default async function RoomDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const roomId = Number(resolvedParams.id);

  if (!roomId || Number.isNaN(roomId)) {
    notFound();
  }

  const room = await prisma.roomType.findFirst({
    where: {
      id: roomId,
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
      id: "asc",
    },
    take: 3,
    select: {
      id: true,
      name: true,
      description: true,
      pricePerNight: true,
      capacity: true,
      imageUrl: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto max-w-6xl px-3 py-4 sm:px-6 lg:px-8">
        <div className="mb-5 rounded-[2rem] bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:p-4">
          <Link
            href="/rooms"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
          >
            <ArrowLeft size={18} className="text-slate-700" />
            <span className="text-slate-700">กลับไปหน้าห้องพัก</span>
          </Link>
        </div>

        <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative min-h-[360px] overflow-hidden bg-slate-200 sm:min-h-[520px]">
              {room.imageUrl ? (
                <img
                  src={room.imageUrl}
                  alt={room.name}
                  className="h-full min-h-[360px] w-full object-cover sm:min-h-[520px]"
                />
              ) : (
                <div className="flex h-full min-h-[360px] w-full items-center justify-center bg-slate-100 text-slate-400 sm:min-h-[520px]">
                  <ImageIcon size={56} />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 sm:p-7 lg:hidden">
                <h1 className="text-4xl font-black leading-tight text-white">
                  {room.name}
                </h1>
              </div>
            </div>

            <div className="p-5 sm:p-7 lg:p-8">
              <div className="hidden lg:block">
                <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
                  Room Detail
                </p>
                <h1 className="mt-2 text-5xl font-black leading-tight text-slate-950">
                  {room.name}
                </h1>
              </div>

              <p className="mt-2 text-sm leading-7 text-slate-600 lg:mt-6">
                {room.description ||
                  "ห้องพักบรรยากาศดี เหมาะสำหรับการพักผ่อนแบบเรียบง่ายและเป็นส่วนตัว"}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-2xl bg-slate-950 p-5 text-white">
                  <Wallet size={24} className="text-white" />
                  <p className="mt-4 text-3xl font-black text-white">
                    {formatCurrency(room.pricePerNight)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-300">
                    ราคาต่อคืน
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                  <Users size={24} className="text-slate-600" />
                  <p className="mt-4 text-2xl font-black text-slate-950">
                    {room.capacity} คน
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    รองรับผู้เข้าพัก
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                  <BedDouble size={24} className="text-slate-600" />
                  <p className="mt-4 text-2xl font-black text-slate-950">
                    {room.totalRooms || 1} ห้อง
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    จำนวนห้องทั้งหมด
                  </p>
                </div>
              </div>

              <Link
                href={`/booking?roomTypeId=${room.id}`}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
              >
                <span className="text-white">จองห้องนี้</span>
                <ArrowRight size={18} className="text-white" />
              </Link>
            </div>
          </div>
        </section>

        {relatedRooms.length > 0 && (
          <section className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
                  More Rooms
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  ห้องพักอื่นที่น่าสนใจ
                </h2>
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
                  className="overflow-hidden rounded-[2rem] bg-slate-50 ring-1 ring-slate-200 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-200"
                >
                  <div className="relative h-56 overflow-hidden bg-slate-200">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-emerald-700">
                        <Hotel size={38} />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-2xl font-black text-white">
                        {item.name}
                      </p>
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="line-clamp-2 text-sm leading-6 text-slate-500">
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
                        aria-label={`ดูรายละเอียด ${item.name}`}
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
      </section>
    </main>
  );
}
