import { prisma } from "@/lib/prisma";

// Apps Script webhook URL (override with GOOGLE_SHEETS_WEBHOOK_URL in .env)
const DEFAULT_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbwSK4U3KjEDYb5Tw6yYU01RExEBhsKdtzjV4N49yuIeFmuWqOsme0JGT123KjrcNWeOkg/exec";

export type SyncResult = {
  ok: boolean;
  status: number;
  message: string;
  count?: number;
  error?: string;
  upstream?: unknown;
};

function toDateString(date: Date | null | undefined) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function calculateNights(checkIn: Date, checkOut: Date) {
  const diff = checkOut.getTime() - checkIn.getTime();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}

export async function syncBookingsToSheets(): Promise<SyncResult> {
  const webhookUrl =
    process.env.GOOGLE_SHEETS_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      ok: false,
      status: 400,
      message: "ยังไม่ได้ตั้งค่า GOOGLE_SHEETS_WEBHOOK_URL ใน .env",
    };
  }

  let rows;
  try {
    rows = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      include: { roomType: true },
    });
  } catch (error) {
    console.error("SYNC_GOOGLE_SHEETS_PRISMA_ERROR", error);
    return {
      ok: false,
      status: 500,
      message: "โหลด bookings ไม่สำเร็จ",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const bookings = rows.map((row) => ({
    booking_code: row.bookingCode || String(row.id),
    customer_name: row.displayName || "",
    customer_phone: row.phone || "",
    room_name: row.roomType?.name || "",
    check_in: toDateString(row.checkIn),
    check_out: toDateString(row.checkOut),
    nights: calculateNights(row.checkIn, row.checkOut),
    guests: Number(row.guests || 0),
    room_count: Number(row.roomCount || 1),
    total_price: Number(row.totalPrice || 0),
    deposit_amount: Number(row.depositAmount || 0),
    booking_status: row.status || "",
    payment_status: row.paymentStatus || "",
    payment_method: row.paymentMethod || "",
    payment_reference: row.paymentReference || "",
    payment_slip_url: row.paymentSlipUrl || "",
    note: row.note || "",
    created_at: row.createdAt ? row.createdAt.toISOString() : "",
    updated_at: row.updatedAt ? row.updatedAt.toISOString() : "",
  }));

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookings, syncedAt: new Date().toISOString() }),
      cache: "no-store",
      redirect: "follow",
    });

    const text = await response.text();
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }

    if (!response.ok) {
      console.error("SYNC_GOOGLE_SHEETS_WEBHOOK_ERROR", response.status, parsed);
      return {
        ok: false,
        status: 502,
        message: "ส่งข้อมูลไป Google Sheet ไม่สำเร็จ",
        upstream: parsed,
      };
    }

    return {
      ok: true,
      status: 200,
      message: "ซิงก์ Google Sheet สำเร็จ",
      count: bookings.length,
      upstream: parsed,
    };
  } catch (error) {
    console.error("SYNC_GOOGLE_SHEETS_FETCH_THROW", error);
    return {
      ok: false,
      status: 500,
      message: "ส่งข้อมูลไป Google Sheet ไม่สำเร็จ",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fire-and-forget sync — ไม่บล็อก caller, ไม่ throw
 */
export function triggerSheetsSync(label: string): void {
  syncBookingsToSheets()
    .then((result) => {
      if (!result.ok) {
        console.error(`SHEETS_SYNC_FAIL[${label}]`, result.message, result.error);
      }
    })
    .catch((error) => {
      console.error(`SHEETS_SYNC_THROW[${label}]`, error);
    });
}
