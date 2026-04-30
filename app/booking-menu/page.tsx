import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  ArrowRight,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  HelpCircle,
  Home,
  Phone,
  SearchCheck,
} from "lucide-react";

const mainActions = [
  {
    order: "1",
    title: "เช็กห้องว่าง",
    subtitle: "เริ่มตรงนี้ก่อน",
    description: "เลือกวันที่จะเข้าพัก เพื่อดูว่ายังมีห้องว่างไหม",
    href: "/availability",
    buttonText: "กดเพื่อเช็กห้องว่าง",
    icon: SearchCheck,
    className: "bg-emerald-600 text-white ring-emerald-700",
    iconClass: "bg-white text-emerald-700",
    buttonClass: "bg-white text-emerald-700 hover:bg-emerald-50",
  },
  {
    order: "2",
    title: "ดูห้องพัก",
    subtitle: "ดูรูปและราคา",
    description: "ดูประเภทห้อง ราคา และจำนวนคนที่พักได้",
    href: "/rooms",
    buttonText: "กดเพื่อดูห้องพัก",
    icon: BedDouble,
    className: "bg-white text-slate-950 ring-slate-200",
    iconClass: "bg-slate-950 text-white",
    buttonClass: "bg-slate-950 text-white hover:bg-slate-800",
  },
  {
    order: "3",
    title: "การจองของฉัน",
    subtitle: "ดูสถานะล่าสุด",
    description: "ดูว่าการจองรอตรวจสอบ ยืนยันแล้ว หรือยกเลิก",
    href: "/my-bookings",
    buttonText: "กดเพื่อดูการจอง",
    icon: CalendarCheck,
    className: "bg-blue-50 text-slate-950 ring-blue-100",
    iconClass: "bg-blue-600 text-white",
    buttonClass: "bg-blue-600 text-white hover:bg-blue-700",
  },
];

const steps = [
  "กดเช็กห้องว่าง",
  "เลือกวันที่เข้าพัก",
  "เลือกห้องที่ต้องการ",
  "กรอกข้อมูลและส่งคำขอจอง",
  "รอแอดมินยืนยัน",
];

export default function BookingMenuPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-5xl px-3 py-4 sm:px-6 lg:px-8">
        <Navbar />

        <section className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-300 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-base font-bold text-white ring-1 ring-white/10">
                <Home size={20} className="text-white" />
                เมนูจองห้องพัก
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
                ต้องการจองห้องพัก กดปุ่มแรกได้เลย
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-200">
                หน้านี้รวมปุ่มสำคัญสำหรับลูกค้า ใช้งานง่ายบนโทรศัพท์
                ตัวหนังสือใหญ่ และเรียงตามลำดับที่ควรทำ
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-white/10 p-5 ring-1 ring-white/10">
              <Clock3 size={32} className="text-emerald-300" />
              <p className="mt-3 text-3xl font-black text-white">24 ชั่วโมง</p>
              <p className="mt-1 text-base text-slate-300">
                ส่งคำขอจองได้ตลอด
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4">
          {mainActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                href={action.href}
                className={[
                  "block rounded-[2rem] p-5 shadow-sm ring-1 transition active:scale-[0.99] sm:p-6",
                  action.className,
                ].join(" ")}
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div
                    className={[
                      "flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.5rem]",
                      action.iconClass,
                    ].join(" ")}
                  >
                    <Icon size={40} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-black/10 px-3 text-base font-black">
                        {action.order}
                      </span>
                      <span className="text-base font-black opacity-80">
                        {action.subtitle}
                      </span>
                    </div>

                    <h2 className="text-3xl font-black leading-tight sm:text-4xl">
                      {action.title}
                    </h2>
                    <p className="mt-2 text-lg leading-8 opacity-80">
                      {action.description}
                    </p>
                  </div>

                  <div
                    className={[
                      "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-lg font-black transition sm:w-auto",
                      action.buttonClass,
                    ].join(" ")}
                  >
                    {action.buttonText}
                    <ArrowRight size={22} />
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={30} className="text-emerald-700" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  ขั้นตอนการจอง
                </h2>
                <p className="mt-2 text-base leading-7 text-slate-500">
                  ทำตามทีละข้อ ไม่ต้องจำเยอะ
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">
                    {index + 1}
                  </div>
                  <p className="text-lg font-bold leading-7 text-slate-800">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <HelpCircle size={30} className="text-blue-700" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              ถ้าไม่แน่ใจให้ทำอย่างไร?
            </h2>

            <p className="mt-3 text-lg leading-8 text-slate-600">
              ให้กดปุ่มสีเขียว “เช็กห้องว่าง” ก่อน
              ระบบจะพาเลือกวันที่และห้องพักต่อไป
            </p>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <Phone size={24} className="text-emerald-700" />
              <p className="mt-3 text-lg font-black text-slate-950">
                ต้องการความช่วยเหลือ
              </p>
              <p className="mt-1 text-base leading-7 text-slate-500">
                โทรหารีสอร์ท หรือทัก LINE OA เพื่อให้แอดมินช่วยดูรายการจอง
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-5 rounded-[2rem] bg-white px-6 py-5 text-center text-base font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
          Gorilla Resort - เมนูจองห้องพัก
        </footer>
      </section>
    </main>
  );
}
