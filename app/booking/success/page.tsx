import { Suspense } from "react";
import BookingSuccessClient from "./BookingSuccessClient";

function LoadingSuccessPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950">
      <section className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
        <div className="w-full rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <div className="mx-auto mb-5 h-14 w-14 animate-pulse rounded-2xl bg-slate-200" />
          <h1 className="text-2xl font-black text-slate-950">
            กำลังโหลดข้อมูลการจอง
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            กรุณารอสักครู่...
          </p>
        </div>
      </section>
    </main>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<LoadingSuccessPage />}>
      <BookingSuccessClient />
    </Suspense>
  );
}