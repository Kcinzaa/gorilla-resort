"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { useLineProfile } from "@/lib/useLineProfile";
import { generatePromptPayPayload } from "@/lib/promptpay";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  BedDouble,
  CalendarDays,
  ImageIcon,
  Loader2,
  Phone,
  ReceiptText,
  Send,
  Sparkles,
  User,
  Users,
  Wallet,
} from "lucide-react";

type RoomType = {
  id: number;
  name: string;
  description?: string | null;
  pricePerNight: number;
  capacity: number;
  totalRooms?: number | null;
  imageUrl?: string | null;
};

type BookingFormProps = {
  room: RoomType;
  initialCheckIn?: string;
  initialCheckOut?: string;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;

  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diff = end.getTime() - start.getTime();

  if (diff <= 0) return 0;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function BookingForm({
  room,
  initialCheckIn = "",
  initialCheckOut = "",
}: BookingFormProps) {
  const router = useRouter();

  const {
    profile,
    loading: profileLoading,
    error: profileError,
    isDevMode,
  } = useLineProfile();

  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState("1");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("PROMPTPAY");
  const [paymentSlipUrl, setPaymentSlipUrl] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const [qrDataUrl, setQrDataUrl] = useState("");
  const [slipUploading, setSlipUploading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const promptPayId = process.env.NEXT_PUBLIC_PROMPTPAY_ID || "0812345678";
  const bankName = process.env.NEXT_PUBLIC_RESORT_BANK_NAME || "กสิกรไทย";
  const accountNo =
    process.env.NEXT_PUBLIC_RESORT_ACCOUNT_NO || "123-4-56789-0";
  const accountName =
    process.env.NEXT_PUBLIC_RESORT_ACCOUNT_NAME || "Resort Booking Demo";

  const nights = useMemo(() => {
    return calculateNights(checkIn, checkOut);
  }, [checkIn, checkOut]);

  const totalPrice = nights * room.pricePerNight;

  const depositAmount =
    totalPrice > 0 ? Math.max(Math.ceil(totalPrice * 0.3), 500) : 0;

  const remainingAmount =
    totalPrice > 0 ? Math.max(totalPrice - depositAmount, 0) : 0;

  useEffect(() => {
    async function createQr() {
      try {
        if (!depositAmount || depositAmount <= 0) {
          setQrDataUrl("");
          return;
        }

        const payload = generatePromptPayPayload(promptPayId, depositAmount);

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
  }, [depositAmount, promptPayId]);

  function clearError() {
    setError("");
  }

  async function handleSlipUpload(file?: File) {
    if (!file) return;

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
        setError(result.message || "อัปโหลดสลิปไม่สำเร็จ");
        return;
      }

      setPaymentSlipUrl(result.url);
    } catch (err) {
      console.warn(err);
      setError("เกิดข้อผิดพลาดในการอัปโหลดสลิป");
    } finally {
      setSlipUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!checkIn || !checkOut) {
      setError("กรุณาเลือกวันที่เข้าพักและวันที่ออก");
      return;
    }

    if (nights <= 0) {
      setError("วันที่ออกต้องมากกว่าวันที่เข้าพัก");
      return;
    }

    if (!guests || Number(guests) <= 0) {
      setError("กรุณาระบุจำนวนผู้เข้าพัก");
      return;
    }

    if (Number(guests) > room.capacity) {
      setError(`ห้องนี้รองรับได้สูงสุด ${room.capacity} คน`);
      return;
    }

    if (!phone.trim()) {
      setError("กรุณากรอกเบอร์โทรศัพท์");
      return;
    }

    if (!paymentReference.trim() && !paymentSlipUrl.trim()) {
      setError("กรุณากรอกเลขอ้างอิงการโอน หรือแนบรูปสลิปการชำระเงิน");
      return;
    }

    if (!profile) {
      setError("ไม่พบข้อมูลผู้ใช้ LINE กรุณาลองโหลดหน้าใหม่อีกครั้ง");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineUserId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl || "",
          roomTypeId: room.id,
          checkIn,
          checkOut,
          guests: Number(guests),
          phone: phone.trim(),
          note: note.trim(),
          paymentMethod,
          paymentSlipUrl: paymentSlipUrl.trim(),
          paymentReference: paymentReference.trim(),
          depositAmount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "ไม่สามารถจองห้องพักได้");
        return;
      }

      router.push(`/booking/success?bookingCode=${result.data.bookingCode}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการจองห้องพัก");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-6 lg:p-8">
        <div className="mb-6">
          <Link
            href="/rooms"
            className="mb-5 inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
          >
            <ArrowLeft size={16} className="text-slate-700" />
            <span className="text-slate-700">กลับไปเลือกห้อง</span>
          </Link>

          <h2 className="text-3xl font-black text-slate-950">
            กรอกข้อมูลการจอง
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
            เลือกวันที่เข้าพัก กรอกข้อมูลผู้เข้าพัก และชำระค่ามัดจำด้วย QR
            พร้อมเพย์ เพื่อส่งคำขอจองให้รีสอร์ทตรวจสอบ
          </p>
        </div>

        {(error || profileError) && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
            <span>{error || profileError}</span>
          </div>
        )}

        {isDevMode && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">
            DEV MODE: กำลังใช้ผู้ใช้ทดสอบ เพราะยังไม่ได้ตั้งค่า LIFF ID
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="rounded-[2rem] bg-slate-50 p-4 ring-1 ring-slate-200 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <CalendarDays size={24} className="text-white" />
              </div>

              <div>
                <h3 className="font-black text-slate-950">วันเข้าพัก</h3>
                <p className="text-sm text-slate-500">
                  เลือกช่วงวันที่ต้องการเข้าพัก
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  วันที่เข้าพัก <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <CalendarDays
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="date"
                    value={checkIn}
                    onChange={(event) => {
                      setCheckIn(event.target.value);
                      clearError();
                    }}
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  วันที่ออก <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <CalendarDays
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="date"
                    value={checkOut}
                    onChange={(event) => {
                      setCheckOut(event.target.value);
                      clearError();
                    }}
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </div>
              </div>
            </div>

            {nights > 0 && (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    จำนวนคืน
                  </p>
                  <p className="mt-1 text-xl font-black text-slate-950">
                    {nights} คืน
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    ราคาต่อคืน
                  </p>
                  <p className="mt-1 text-xl font-black text-slate-950">
                    {formatCurrency(room.pricePerNight)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-950 p-4 text-white">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    ราคารวม
                  </p>
                  <p className="mt-1 text-xl font-black text-white">
                    {formatCurrency(totalPrice)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] bg-slate-50 p-4 ring-1 ring-slate-200 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <User size={24} className="text-white" />
              </div>

              <div>
                <h3 className="font-black text-slate-950">ข้อมูลผู้เข้าพัก</h3>
                <p className="text-sm text-slate-500">
                  กรอกข้อมูลติดต่อสำหรับให้รีสอร์ทตรวจสอบ
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  จำนวนผู้เข้าพัก <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Users
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="number"
                    min="1"
                    max={room.capacity}
                    value={guests}
                    onChange={(event) => setGuests(event.target.value)}
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                <p className="mt-2 text-xs font-semibold text-slate-500">
                  ห้องนี้รองรับได้สูงสุด {room.capacity} คน
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Phone
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="เช่น 0812345678"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-black text-slate-700">
                หมายเหตุเพิ่มเติม
              </label>

              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="เช่น ขอห้องวิวดี, เข้าพักช่วงเย็น, มีเด็กเล็ก"
                rows={4}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
            </div>
          </div>

          <div className="rounded-[2rem] bg-slate-50 p-4 ring-1 ring-slate-200 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <ReceiptText size={24} className="text-white" />
              </div>

              <div>
                <h3 className="font-black text-slate-950">ชำระค่ามัดจำ</h3>
                <p className="text-sm text-slate-500">
                  สแกน QR พร้อมเพย์เพื่อชำระค่ามัดจำ แล้วแนบสลิปการโอน
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  ยอดรวม
                </p>
                <p className="mt-1 text-xl font-black text-slate-950">
                  {formatCurrency(totalPrice)}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-600 p-4 text-white">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">
                  ต้องมัดจำ
                </p>
                <p className="mt-1 text-xl font-black text-white">
                  {formatCurrency(depositAmount)}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  ยอดคงเหลือ
                </p>
                <p className="mt-1 text-xl font-black text-slate-950">
                  {formatCurrency(remainingAmount)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[320px_1fr]">
              <div className="rounded-[2rem] bg-white p-4 text-center ring-1 ring-slate-200">
                <p className="mb-3 text-sm font-black text-slate-950">
                  QR พร้อมเพย์สำหรับชำระค่ามัดจำ
                </p>

                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="PromptPay QR"
                    className="mx-auto h-72 w-72 rounded-2xl bg-white object-contain"
                  />
                ) : (
                  <div className="flex h-72 w-full items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-500">
                    เลือกวันที่เพื่อคำนวณยอดมัดจำ
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
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-bold text-slate-500">ธนาคาร</p>
                      <p className="mt-1 font-black text-slate-950">
                        {bankName}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-bold text-slate-500">
                        เลขบัญชี
                      </p>
                      <p className="mt-1 font-black text-slate-950">
                        {accountNo}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                      <p className="text-xs font-bold text-slate-500">
                        ชื่อบัญชี
                      </p>
                      <p className="mt-1 font-black text-slate-950">
                        {accountName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      วิธีชำระเงิน
                    </label>

                    <select
                      value={paymentMethod}
                      onChange={(event) =>
                        setPaymentMethod(event.target.value)
                      }
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    >
                      <option value="PROMPTPAY">พร้อมเพย์ QR</option>
                      <option value="BANK_TRANSFER">โอนผ่านธนาคาร</option>
                      <option value="OTHER">อื่น ๆ</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      เลขอ้างอิงการโอน
                    </label>

                    <input
                      value={paymentReference}
                      onChange={(event) => {
                        setPaymentReference(event.target.value);
                        clearError();
                      }}
                      placeholder="เช่น 202604291234"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    แนบรูปสลิปการชำระเงิน
                  </label>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      handleSlipUpload(event.target.files?.[0])
                    }
                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:file:bg-slate-800"
                  />

                  {slipUploading && (
                    <div className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-500">
                      <Loader2 size={18} className="animate-spin" />
                      กำลังอัปโหลดสลิป...
                    </div>
                  )}

                  {paymentSlipUrl && (
                    <div className="mt-4 overflow-hidden rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                      <p className="mb-3 text-sm font-black text-slate-700">
                        ตัวอย่างสลิปที่อัปโหลด
                      </p>

                      <img
                        src={paymentSlipUrl}
                        alt="Payment slip"
                        className="max-h-80 w-full rounded-xl object-contain"
                      />

                      <p className="mt-3 break-all text-xs font-semibold text-slate-500">
                        {paymentSlipUrl}
                      </p>
                    </div>
                  )}

                  <p className="mt-3 text-xs leading-6 text-slate-500">
                    รองรับไฟล์ JPG, PNG, WEBP ขนาดไม่เกิน 5MB
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs leading-6 text-slate-500">
              หมายเหตุ: ตอนนี้ระบบเป็นการแสดง QR และแนบสลิปให้แอดมินตรวจสอบ
              หากต้องการตรวจสอบชำระเงินอัตโนมัติ ต้องต่อ Payment Gateway ที่มี
              webhook ภายหลัง
            </p>
          </div>

          {profile && (
            <div className="rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-400">
                  {profile.pictureUrl ? (
                    <img
                      src={profile.pictureUrl}
                      alt={profile.displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={26} />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    LINE Profile
                  </p>
                  <p className="truncate text-lg font-black text-slate-950">
                    {profile.displayName}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || profileLoading || slipUploading}
            className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading || profileLoading ? (
              <>
                <Loader2 size={22} className="animate-spin text-white" />
                <span className="text-white">กำลังส่งคำขอจอง...</span>
              </>
            ) : (
              <>
                <Send size={22} className="text-white" />
                <span className="text-white">ยืนยันการจองและแจ้งชำระมัดจำ</span>
              </>
            )}
          </button>
        </form>
      </section>

      <aside className="h-fit rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-6 xl:sticky xl:top-28">
        <div className="overflow-hidden rounded-[2rem] bg-slate-200">
          {room.imageUrl ? (
            <img
              src={room.imageUrl}
              alt={room.name}
              className="h-64 w-full object-cover"
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center text-slate-400">
              <ImageIcon size={46} />
            </div>
          )}
        </div>

        <div className="mt-5">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
            <BedDouble size={14} className="text-slate-600" />
            Selected Room
          </div>

          <h2 className="text-3xl font-black text-slate-950">{room.name}</h2>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            {room.description || "ห้องพักบรรยากาศดี เหมาะสำหรับการพักผ่อน"}
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <div className="flex items-center gap-2 text-slate-500">
              <Users size={18} className="text-slate-500" />
              <span className="text-sm font-bold text-slate-500">
                พักได้สูงสุด
              </span>
            </div>
            <span className="font-black text-slate-950">{room.capacity} คน</span>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <div className="flex items-center gap-2 text-slate-500">
              <BedDouble size={18} className="text-slate-500" />
              <span className="text-sm font-bold text-slate-500">
                จำนวนห้องทั้งหมด
              </span>
            </div>
            <span className="font-black text-slate-950">
              {room.totalRooms ?? 1} ห้อง
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <div className="flex items-center gap-2 text-slate-500">
              <Banknote size={18} className="text-slate-500" />
              <span className="text-sm font-bold text-slate-500">
                ราคาต่อคืน
              </span>
            </div>
            <span className="font-black text-slate-950">
              {formatCurrency(room.pricePerNight)}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <div className="flex items-center gap-2 text-slate-500">
              <CalendarDays size={18} className="text-slate-500" />
              <span className="text-sm font-bold text-slate-500">จำนวนคืน</span>
            </div>
            <span className="font-black text-slate-950">{nights} คืน</span>
          </div>
        </div>

        <div className="mt-5 rounded-[2rem] bg-slate-950 p-5 text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                ราคารวม
              </p>
              <p className="mt-2 text-4xl font-black text-white">
                {formatCurrency(totalPrice)}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {nights > 0
                  ? `${nights} คืน × ${formatCurrency(room.pricePerNight)}`
                  : "เลือกวันที่เพื่อคำนวณราคา"}
              </p>
            </div>

            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10">
              <Sparkles size={30} className="text-white" />
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[2rem] bg-emerald-50 p-5 ring-1 ring-emerald-100">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
            ค่ามัดจำที่ต้องชำระ
          </p>
          <p className="mt-2 text-3xl font-black text-emerald-700">
            {formatCurrency(depositAmount)}
          </p>
          <p className="mt-2 text-sm leading-6 text-emerald-700">
            ยอดคงเหลือหลังมัดจำ {formatCurrency(remainingAmount)}
          </p>
        </div>
      </aside>
    </div>
  );
}