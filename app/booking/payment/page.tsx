import Navbar from "@/components/Navbar";
import BookingPaymentForm from "@/components/BookingPaymentForm";

export default function BookingPaymentPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
        <Navbar />

        <section className="mb-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-6">
          <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
            Payment
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            หน้าชำระเงิน
          </h1>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            ตรวจสอบยอดชำระ สแกน QR พร้อมเพย์ แล้วแนบสลิปเพื่อส่งคำขอจอง
          </p>
        </section>

        <BookingPaymentForm />
      </section>
    </main>
  );
}
