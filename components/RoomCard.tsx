import Link from "next/link";
import { BedDouble, Users, Banknote, ArrowRight, ImageIcon } from "lucide-react";

type RoomCardProps = {
  room: {
    id: number;
    name: string;
    description?: string | null;
    pricePerNight: number;
    capacity: number;
    imageUrl?: string | null;
  };
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function RoomCard({ room }: RoomCardProps) {
  return (
    <article className="group overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200">
      <div className="relative h-56 overflow-hidden bg-slate-100">
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

        <div className="absolute left-4 top-4 rounded-2xl bg-white/90 px-3 py-2 text-sm font-bold text-slate-900 shadow-sm backdrop-blur">
          พักได้ {room.capacity} คน
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <BedDouble size={14} />
              Room Type
            </div>

            <h2 className="text-2xl font-bold text-slate-900">{room.name}</h2>
          </div>

          <div className="text-right">
            <p className="text-xl font-bold text-slate-900">
              {formatCurrency(room.pricePerNight)}
            </p>
            <p className="text-xs text-slate-500">ต่อคืน</p>
          </div>
        </div>

        <p className="min-h-12 text-sm leading-6 text-slate-600">
          {room.description || "ห้องพักบรรยากาศดี เหมาะสำหรับการพักผ่อน"}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="mb-1 flex items-center gap-2 text-slate-500">
              <Users size={16} />
              <p className="text-xs font-medium">ผู้เข้าพัก</p>
            </div>
            <p className="font-bold text-slate-900">{room.capacity} คน</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="mb-1 flex items-center gap-2 text-slate-500">
              <Banknote size={16} />
              <p className="text-xs font-medium">ราคา</p>
            </div>
            <p className="font-bold text-slate-900">
              {formatCurrency(room.pricePerNight)}
            </p>
          </div>
        </div>

        <Link
          href={`/booking?roomTypeId=${room.id}`}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
        >
          <span className="text-white">จองห้องนี้</span>
          <ArrowRight size={18} className="text-white" />
        </Link>
      </div>
    </article>
  );
}