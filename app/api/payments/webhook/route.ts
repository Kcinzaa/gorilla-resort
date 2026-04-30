import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PaymentWebhookBody = {
  secret?: string;
  bookingCode?: string;
  paymentReference?: string;
  status?: string;
  amount?: number;
  provider?: string;
  providerEventId?: string;
  paidAt?: string;
};

function cleanString(value: unknown) {
  return String(value || "").trim();
}

function isPaidStatus(status: string) {
  return ["PAID", "SUCCESS", "SUCCEEDED", "COMPLETED"].includes(
    status.toUpperCase()
  );
}

function parsePaidAt(value: unknown) {
  const text = cleanString(value);

  if (!text) return new Date();

  const date = new Date(text);

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PaymentWebhookBody;

    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        {
          success: false,
          message: "ยังไม่ได้ตั้งค่า PAYMENT_WEBHOOK_SECRET",
        },
        { status: 500 }
      );
    }

    const secret =
      request.headers.get("x-payment-webhook-secret") ||
      cleanString(body.secret);

    if (secret !== webhookSecret) {
      return NextResponse.json(
        {
          success: false,
          message: "Webhook secret ไม่ถูกต้อง",
        },
        { status: 401 }
      );
    }

    const bookingCode = cleanString(body.bookingCode);
    const paymentReference = cleanString(body.paymentReference);
    const status = cleanString(body.status);

    if (!bookingCode && !paymentReference) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาระบุ bookingCode หรือ paymentReference",
        },
        { status: 400 }
      );
    }

    if (!isPaidStatus(status)) {
      return NextResponse.json({
        success: true,
        message: "รับ webhook แล้ว แต่สถานะยังไม่ใช่การชำระสำเร็จ",
      });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          ...(bookingCode ? [{ bookingCode }] : []),
          ...(paymentReference ? [{ paymentReference }] : []),
        ],
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบรายการจองที่ตรงกับข้อมูลการชำระเงิน",
        },
        { status: 404 }
      );
    }

    const updatedBooking = await prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        paymentStatus: "PAID",
        paidAt: parsePaidAt(body.paidAt),
        paymentReference:
          paymentReference || body.providerEventId || booking.paymentReference,
      },
      include: {
        roomType: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "อัปเดตสถานะการชำระเงินสำเร็จ",
      data: updatedBooking,
    });
  } catch (error) {
    console.error("PAYMENT_WEBHOOK_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถประมวลผล payment webhook ได้",
      },
      { status: 500 }
    );
  }
}
