"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { generatePromptPayPayload } from "@/lib/promptpay";
import {
  AlertCircle,
  ArrowLeft,
  BedDouble,
  CalendarDays,
  ImageIcon,
  Loader2,
  ReceiptText,
  Send,
  User,
  Wallet,
} from "lucide-react";

type BookingDraft = {
  room: {
    id: number;
    name: string;
    description?: string | null;
    pricePerNight: number;
    capacity: number;
    totalRooms?: number | null;
    imageUrl?: string | null;
  };
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  phone: string;
  note: string;
  totalPrice: number;
  profile: {
    userId: string;
    displayName: string;
    pictureUrl?: string;
  };
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function BookingPaymentForm() {
  const router = useRouter();
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("PROMPTPAY");
  const [paymentSlipUrl, setPaymentSlipUrl] = useState("");
  const [selectedSlipFile, setSelectedSlipFile] = useState<File | null>(null);
  const [localSlipPreviewUrl, setLocalSlipPreviewUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [slipUploading, setSlipUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const promptPayId = process.env.NEXT_PUBLIC_PROMPTPAY_ID || "0812345678";
  const bankName = process.env.NEXT_PUBLIC_RESORT_BANK_NAME || "กรุงศรี";
  const accountNo =
    process.env.NEXT_PUBLIC_RESORT_ACCOUNT_NO || "213-1-43973-6";
  const accountName =
    process.env.NEXT_PUBLIC_RESORT_ACCOUNT_NAME || "ปราณี ศรีคำ";

  const paymentAmount = useMemo(() => draft?.totalPrice || 0, [draft]);

  useEffect(() => {
    const raw = sessionStorage.getItem("gorillaBookingDraft");
    if (!raw) return;

    try {
      setDraft(JSON.parse(raw));
    } catch {
      sessionStorage.removeItem("gorillaBookingDraft");
    }
  }, []);

  useEffect(() => {
    async function createQr() {
      if (!paymentAmount) {
        setQrDataUrl("");
        return;
      }

      try {
        const payload = generatePromptPayPayload(promptPayId, paymentAmount);
        const url = await QRCode.toDataURL(payload, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "M",
        });
        setQrDataUrl(url);
      } catch (err) {
        console.warn("Create PromptPay QR failed:", err);
        setQrDataUrl("");
      }
    }

    createQr();
  }, [paymentAmount, promptPayId]);

  async function uploadSlipFile(file: File) {
    try {
      setSlipUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/slip", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.detail
            ? `${result.message || "อัปโหลดสลิปไม่สำเร็จ"}: ${result.detail}`
            : result.message || "อัปโหลดสลิปไม่สำเร็จ"
        );
        return "";
      }

      const uploadedUrl = result.data?.url || result.url || "";
      if (!uploadedUrl) {
        setError("อัปโหลดสลิปแล้ว แต่ระบบไม่ได้รับ URL ของไฟล์");
        return "";
      }

      setPaymentSlipUrl(uploadedUrl);
      return uploadedUrl;
    } catch (err) {
      console.warn(err);
      setError("เกิดข้อผิดพลาดในการอัปโหลดสลิป");
      return "";
    } finally {
      setSlipUploading(false);
    }
  }

  async function handleSlipUpload(file?: File) {
    setPaymentSlipUrl("");
    setLocalSlipPreviewUrl("");

    if (!file) {
      setSelectedSlipFile(null);
      return;
    }

    setSelectedSlipFile(file);
    setLocalSlipPreviewUrl(URL.createObjectURL(file));
    await uploadSlipFile(file);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft) {
      setError("ไม่พบข้อมูลการจอง กรุณากลับไปเลือกห้องใหม่");
      return;
    }

    try {
      setLoading(true);
      setError("");

      let submittedSlipUrl = paymentSlipUrl.trim();
      if (!submittedSlipUrl && selectedSlipFile) {
        submittedSlipUrl = await uploadSlipFile(selectedSlipFile);
      }

      if (!submittedSlipUrl) {
        setError("กรุณาแนบรูปสลิป และรอให้อัปโหลดขึ้น Supabase สำเร็จก่อน");
        return;
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineUserId: draft.profile.userId,
          displayName: draft.profile.displayName,
          pictureUrl: draft.profile.pictureUrl || "",
          roomTypeId: draft.room.id,
          checkIn: draft.checkIn,
          checkOut: draft.checkOut,
          guests: draft.guests,
          phone: draft.phone,
          note: draft.note,
          paymentMethod,
          paymentSlipUrl: submittedSlipUrl,
          paymentReference: "",
          depositAmount: draft.totalPrice,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "ไม่สามารถจองห้องพักได้");
        return;
      }

      const booking = result.data;
      sessionStorage.removeItem("gorillaBookingDraft");

      const successParams = new URLSearchParams({
        bookingCode: booking?.bookingCode || "",
        roomName: booking?.roomType?.name || draft.room.name,
        checkIn: booking?.checkIn || draft.checkIn,
        checkOut: booking?.checkOut || draft.checkOut,
        guests: String(booking?.guests || draft.guests),
        totalPrice: String(booking?.totalPrice || draft.totalPrice),
        depositAmount: String(booking?.depositAmount || draft.totalPrice),
        paymentStatus: booking?.paymentStatus || "PENDING",
        status: booking?.status || "PENDING",
      });

      router.push(`/booking/success?${successParams.toString()}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการจองห้องพัก");
    } finally {
      setLoading(false);
    }
  }

  if (!draft) {
    return (
      <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <AlertCircle size={42} className="mx-auto text-amber-600" />
        <h1 className="mt-4 text-2xl font-black text-slate-950">
          ไม่พบข้อมูลการจอง
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          กรุณากลับไปเลือกห้องและวันที่เข้าพักอีกครั้ง
        </p>
        <Link
          href="/rooms"
          className="mt-6 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white"
        >
          กลับไปเลือกห้อง
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-6 lg:p-8">
        <Link
          href={`/booking?roomTypeId=${draft.room.id}&checkIn=${draft.checkIn}&checkOut=${draft.checkOut}`}
          className="mb-5 inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
        >
          <ArrowLeft size={16} className="text-slate-700" />
          <span className="text-slate-700">กลับไปแก้ข้อมูล</span>
        </Link>

        <h1 className="text-3xl font-black text-slate-950">ชำระเงินเต็มจำนวน</h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          สแกน QR พร้อมเพย์หรือโอนเข้าบัญชี แล้วแนบสลิปเพื่อส่งคำขอจองให้รีสอร์ทตรวจสอบ
        </p>

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              ยอดรวม
            </p>
            <p className="mt-1 text-xl font-black text-slate-950">
              {formatCurrency(draft.totalPrice)}
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-600 p-4 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">
              ต้องชำระ
            </p>
            <p className="mt-1 text-xl font-black text-white">
              {formatCurrency(paymentAmount)}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[320px_1fr]">
          <div className="rounded-[2rem] bg-white p-4 text-center ring-1 ring-slate-200">
            <p className="mb-3 text-sm font-black text-slate-950">
              QR พร้อมเพย์สำหรับชำระเต็มจำนวน
            </p>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="PromptPay QR"
                className="mx-auto h-72 w-72 rounded-2xl bg-white object-contain"
              />
            ) : (
              <div className="flex h-72 w-full items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-500">
                ไม่สามารถสร้าง QR ได้
              </div>
            )}
            <p className="mt-3 text-xs font-bold text-slate-500">
              PromptPay ID: {promptPayId}
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className="mb-3 flex items-center gap-2">
                <Wallet size={20} className="text-slate-500" />
                <p className="font-black text-slate-950">
                  ข้อมูลบัญชีรับชำระ
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <AccountBox label="ธนาคาร" value={bankName} />
                <AccountBox label="เลขบัญชี" value={accountNo} />
                <AccountBox label="ชื่อบัญชี" value={accountName} wide />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                วิธีชำระเงิน
              </label>
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              >
                <option value="PROMPTPAY">พร้อมเพย์ QR</option>
                <option value="BANK_TRANSFER">โอนผ่านธนาคาร</option>
                <option value="OTHER">อื่น ๆ</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                แนบรูปสลิปการชำระเงิน <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => handleSlipUpload(event.target.files?.[0])}
                className="block w-full rounded-[1.5rem] border-2 border-dashed border-emerald-300 bg-emerald-50 px-5 py-8 text-base font-bold text-slate-900 outline-none transition file:mr-4 file:rounded-2xl file:border-0 file:bg-emerald-600 file:px-6 file:py-4 file:text-base file:font-black file:text-white hover:file:bg-emerald-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
              {slipUploading && (
                <div className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-500">
                  <Loader2 size={18} className="animate-spin" />
                  กำลังอัปโหลดสลิป...
                </div>
              )}
              {!slipUploading && paymentSlipUrl && (
                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  อัปโหลดสลิปสำเร็จแล้ว
                </div>
              )}
              {(paymentSlipUrl || localSlipPreviewUrl) && (
                <div className="mt-4 overflow-hidden rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                  <p className="mb-3 text-sm font-black text-slate-700">
                    ตัวอย่างสลิปที่อัปโหลด
                  </p>
                  <img
                    src={paymentSlipUrl || localSlipPreviewUrl}
                    alt="Payment slip"
                    className="max-h-80 w-full rounded-xl object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || slipUploading}
          className="mt-5 inline-flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={22} className="animate-spin text-white" />
              <span className="text-white">กำลังส่งคำขอจอง...</span>
            </>
          ) : (
            <>
              <Send size={22} className="text-white" />
              <span className="text-white">ยืนยันการจองและแจ้งชำระเงิน</span>
            </>
          )}
        </button>
      </section>

      <aside className="h-fit rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-6 xl:sticky xl:top-28">
        <div className="overflow-hidden rounded-[2rem] bg-slate-200">
          {draft.room.imageUrl ? (
            <img
              src={draft.room.imageUrl}
              alt={draft.room.name}
              className="h-56 w-full object-cover"
            />
          ) : (
            <div className="flex h-56 w-full items-center justify-center text-slate-400">
              <ImageIcon size={42} />
            </div>
          )}
        </div>
        <div className="mt-5">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
            <BedDouble size={14} className="text-slate-600" />
            ห้องที่เลือก
          </div>
          <h2 className="text-2xl font-black text-slate-950">
            {draft.room.name}
          </h2>
        </div>
        <div className="mt-5 grid gap-3">
          <SideRow icon={CalendarDays} label="เข้าพัก" value={draft.checkIn} />
          <SideRow icon={CalendarDays} label="ออก" value={draft.checkOut} />
          <SideRow icon={User} label="ผู้เข้าพัก" value={`${draft.guests} คน`} />
          <SideRow icon={ReceiptText} label="จำนวนคืน" value={`${draft.nights} คืน`} />
        </div>
      </aside>
    </form>
  );
}

function AccountBox({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={["rounded-2xl bg-slate-50 p-4", wide ? "sm:col-span-2" : ""].join(" ")}>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 font-black text-slate-950">{value}</p>
    </div>
  );
}

function SideRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={18} className="text-slate-500" />
        <span className="text-sm font-bold text-slate-500">{label}</span>
      </div>
      <span className="font-black text-slate-950">{value}</span>
    </div>
  );
}
