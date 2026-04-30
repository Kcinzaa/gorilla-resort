import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
type PaymentStatus = "UNPAID" | "PENDING" | "PAID" | "REJECTED";

function isValidBookingStatus(status: string): status is BookingStatus {
  return ["PENDING", "CONFIRMED", "CANCELLED"].includes(status);
}

function isValidPaymentStatus(status: string): status is PaymentStatus {
  return ["UNPAID", "PENDING", "PAID", "REJECTED"].includes(status);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่มีสิทธิ์ใช้งานส่วนนี้",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const bookingId = Number(id);

    if (!bookingId || Number.isNaN(bookingId)) {
      return NextResponse.json(
        {
          success: false,
          message: "รหัสรายการจองไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        roomType: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบรายการจอง",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("GET ADMIN BOOKING DETAIL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถโหลดรายละเอียดรายการจองได้",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่มีสิทธิ์ใช้งานส่วนนี้",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const bookingId = Number(id);
    const body = await request.json();

    const status = String(body.status || "").trim();
    const paymentStatus = String(body.paymentStatus || "").trim();

    if (!bookingId || Number.isNaN(bookingId)) {
      return NextResponse.json(
        {
          success: false,
          message: "รหัสรายการจองไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    const data: {
      status?: BookingStatus;
      paymentStatus?: PaymentStatus;
      paidAt?: Date | null;
    } = {};

    if (status) {
      if (!isValidBookingStatus(status)) {
        return NextResponse.json(
          {
            success: false,
            message: "สถานะรายการจองไม่ถูกต้อง",
          },
          { status: 400 }
        );
      }

      data.status = status;
    }

    if (paymentStatus) {
      if (!isValidPaymentStatus(paymentStatus)) {
        return NextResponse.json(
          {
            success: false,
            message: "สถานะการชำระเงินไม่ถูกต้อง",
          },
          { status: 400 }
        );
      }

      data.paymentStatus = paymentStatus;
      data.paidAt = paymentStatus === "PAID" ? new Date() : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่มีข้อมูลสำหรับอัปเดต",
        },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.update({
      where: {
        id: bookingId,
      },
      data,
      include: {
        roomType: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "อัปเดตรายการจองสำเร็จ",
      data: booking,
    });
  } catch (error) {
    console.error("PATCH ADMIN BOOKING DETAIL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถอัปเดตรายการจองได้",
      },
      { status: 500 }
    );
  }
}
