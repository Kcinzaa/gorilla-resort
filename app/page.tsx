import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  ArrowRight,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Hotel,
  MapPin,
  MessageCircle,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Wallet,
} from "lucide-react";

const mainActions = [
  {
    title: "เช็กห้องว่าง",
    description: "เลือกวันที่เข้าพักและวันที่ออก เพื่อดูห้องที่ยังว่าง",
    href: "/availability",
    icon: SearchCheck,
    badge: "แนะนำ",
    buttonText: "ไปหน้าเช็กห้องว่าง",
    cardClass: "bg-emerald-50 ring-emerald-100",
    iconClass: "bg-emerald-600 text-white",
    buttonClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  {
    title: "ดูห้องพัก",
    description: "ดูรายละเอียด ประเภทห้อง ราคา และจำนวนผู้เข้าพัก",
    href: "/rooms",
    icon: BedDouble,
    badge: "Rooms",
    buttonText: "ไปหน้าห้องพัก",
    cardClass: "bg-white ring-slate-200",
    iconClass: "bg-slate-950 text-white",
    buttonClass: "bg-slate-950 hover:bg-slate-800 text-white",
  },
  {
    title: "การจองของฉัน",
    description: "ตรวจสอบสถานะการจอง เช่น รอตรวจสอบ ยืนยันแล้ว หรือยกเลิก",
    href: "/my-bookings",
    icon: CalendarCheck,
    badge: "My Booking",
    buttonText: "ดูการจองของฉัน",
    cardClass: "bg-blue-50 ring-blue-100",
    iconClass: "bg-blue-600 text-white",
    buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
  },
];

const features = [
  {
    title: "เช็กห้องว่างก่อนจอง",
    description: "เลือกวันที่เข้าพักและดูจำนวนห้องว่างของแต่ละประเภทได้ทันที",
    icon: SearchCheck,
  },
  {
    title: "จองผ่าน LINE ได้ง่าย",
    description: "ออกแบบให้ใช้งานบนมือถือและเปิดผ่าน LINE LIFF ได้สะดวก",
    icon: MessageCircle,
  },
  {
    title: "ตรวจสอบสถานะการจอง",
    description: "ลูกค้าสามารถดูรายการจองและสถานะล่าสุดของตัวเองได้",
    icon: CalendarCheck,
  },
  {
    title: "จัดการโดยแอดมิน",
    description: "รีสอร์ทสามารถตรวจสอบและยืนยันการจองผ่านหลังบ้าน",
    icon: ShieldCheck,
  },
];

const steps = [
  {
    title: "เช็กห้องว่าง",
    description: "เลือกวันเข้าพักและวันออกก่อน เพื่อดูห้องที่ยังจองได้",
    icon: SearchCheck,
  },
  {
    title: "เลือกประเภทห้อง",
    description: "เลือกห้องที่เหมาะกับจำนวนผู้เข้าพักและงบประมาณ",
    icon: BedDouble,
  },
  {
    title: "กรอกข้อมูลจอง",
    description: "กรอกเบอร์โทรศัพท์ จำนวนผู้เข้าพัก และหมายเหตุเพิ่มเติม",
    icon: User,
  },
  {
    title: "ส่งคำขอจอง",
    description: "ระบบจะบันทึกคำขอจองและรอแอดมินตรวจสอบ",
    icon: Clock3,
  },
  {
    title: "ติดตามสถานะ",
    description: "กลับมาดูสถานะการจองของตัวเองได้ทุกเมื่อ",
    icon: CalendarCheck,
  },
];

const stats = [
  {
    value: "24H",
    label: "ส่งคำขอจองได้ตลอด",
    icon: Clock3,
  },
  {
    value: "LINE",
    label: "รองรับการเปิดผ่าน LIFF",
    icon: MessageCircle,
  },
  {
    value: "Easy",
    label: "ขั้นตอนจองไม่ซับซ้อน",
    icon: Sparkles,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
        <Navbar />

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-300 sm:rounded-[2.5rem] sm:p-8 lg:p-10">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-500 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500 blur-3xl" />
            </div>

            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10">
                <Sparkles size={16} className="text-slate-200" />
                <span className="text-slate-200">Booking Menu</span>
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                จองห้องพักง่าย ๆ ผ่าน LINE
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                เลือกห้องพัก ตรวจสอบราคา เช็กห้องว่าง กรอกข้อมูล
                และติดตามสถานะการจองได้ในระบบเดียว เหมาะสำหรับลูกค้าที่เปิดเว็บผ่าน LINE OA และ LIFF
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {stats.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.value}
                      className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/10"
                    >
                      <Icon size={24} className="text-slate-300" />
                      <p className="mt-4 text-3xl font-black text-white">
                        {item.value}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {item.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/availability"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <span className="text-white">เช็กห้องว่าง</span>
                  <SearchCheck size={18} className="text-white" />
                </Link>

                <Link
                  href="/rooms"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-slate-100"
                >
                  <span className="text-slate-950">ดูห้องพัก</span>
                  <ArrowRight size={18} className="text-slate-950" />
                </Link>

                <Link
                  href="/my-bookings"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-4 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/20"
                >
                  <span className="text-white">การจองของฉัน</span>
                  <CalendarCheck size={18} className="text-white" />
                </Link>
              </div>
            </div>
          </div>

          <aside className="grid gap-5">
            {mainActions.map((action) => {
              const Icon = action.icon;

              return (
                <div
                  key={action.href}
                  className={[
                    "rounded-[2rem] p-5 shadow-sm ring-1 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200 sm:rounded-[2.5rem] sm:p-7",
                    action.cardClass,
                  ].join(" ")}
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div
                      className={[
                        "flex h-16 w-16 items-center justify-center rounded-3xl",
                        action.iconClass,
                      ].join(" ")}
                    >
                      <Icon size={30} className="text-white" />
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                      {action.badge}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">
                    {action.title}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {action.description}
                  </p>

                  <Link
                    href={action.href}
                    className={[
                      "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold transition",
                      action.buttonClass,
                    ].join(" ")}
                  >
                    <span className="text-white">{action.buttonText}</span>
                    <ArrowRight size={18} className="text-white" />
                  </Link>
                </div>
              );
            })}
          </aside>
        </section>

        <section className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200 sm:p-6"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Icon size={26} className="text-slate-700" />
                </div>

                <h3 className="text-xl font-black text-slate-950">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
              <MapPin size={16} className="text-slate-600" />
              <span className="text-slate-600">Resort Flow</span>
            </div>

            <h3 className="text-3xl font-black text-slate-950 sm:text-4xl">
              ขั้นตอนการจอง
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              ระบบนี้ออกแบบให้ลูกค้าจองง่าย และให้แอดมินตรวจสอบได้สะดวก
              โดยเริ่มจากการเช็กห้องว่างก่อนจองจริง
            </p>

            <div className="mt-6 rounded-[2rem] bg-slate-950 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <Hotel size={24} className="text-white" />
                </div>

                <div>
                  <p className="text-sm text-slate-300">Resort Booking</p>
                  <p className="text-xl font-black text-white">
                    LINE OA + LIFF
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">
                ลูกค้าสามารถกดจาก LINE OA เข้าหน้ารีสอร์ท แล้วเข้าหน้าเมนูจองนี้เพื่อใช้งานระบบต่อได้ทันที
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              {steps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <div
                    key={step.title}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:bg-white hover:shadow-sm"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                        <span className="text-white">{index + 1}</span>
                      </div>

                      <Icon size={22} className="text-slate-400" />
                    </div>

                    <p className="font-black text-slate-950">{step.title}</p>

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
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-emerald-600">
                  Customer Tools
                </p>

                <h3 className="mt-2 text-3xl font-black text-slate-950">
                  เมนูสำหรับลูกค้า
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  รวมเครื่องมือหลักที่ลูกค้าต้องใช้ ตั้งแต่ดูห้อง เช็กห้องว่าง จนถึงดูรายการจอง
                </p>
              </div>

              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[2rem] bg-slate-950 text-white">
                <Sparkles size={34} className="text-white" />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Link
                href="/availability"
                className="rounded-3xl bg-emerald-50 p-5 ring-1 ring-emerald-100 transition hover:bg-emerald-100"
              >
                <SearchCheck size={26} className="text-emerald-600" />
                <p className="mt-4 font-black text-slate-950">เช็กห้องว่าง</p>
                <p className="mt-1 text-sm text-slate-500">ตามวันที่เลือก</p>
              </Link>

              <Link
                href="/rooms"
                className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200 transition hover:bg-slate-100"
              >
                <BedDouble size={26} className="text-slate-700" />
                <p className="mt-4 font-black text-slate-950">ดูห้องพัก</p>
                <p className="mt-1 text-sm text-slate-500">ราคาและรายละเอียด</p>
              </Link>

              <Link
                href="/my-bookings"
                className="rounded-3xl bg-blue-50 p-5 ring-1 ring-blue-100 transition hover:bg-blue-100"
              >
                <CalendarCheck size={26} className="text-blue-600" />
                <p className="mt-4 font-black text-slate-950">การจองของฉัน</p>
                <p className="mt-1 text-sm text-slate-500">ติดตามสถานะ</p>
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-300 sm:rounded-[2.5rem] sm:p-8">
            <Wallet size={34} className="text-emerald-300" />

            <h3 className="mt-5 text-3xl font-black text-white">
              จองง่าย สรุปราคาอัตโนมัติ
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-300">
              เมื่อเลือกวันเข้าพักและวันออก ระบบจะคำนวณจำนวนคืนและราคารวมให้ลูกค้าก่อนส่งคำขอจอง
            </p>

            <Link
              href="/rooms"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
            >
              <span className="text-slate-950">เริ่มเลือกห้องพัก</span>
              <ArrowRight size={18} className="text-slate-950" />
            </Link>
          </div>
        </section>

        <footer className="mt-5 rounded-[2rem] bg-white px-6 py-5 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          Resort Booking System • Built for LINE OA + LIFF
        </footer>
      </section>
    </main>
  );
}