import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
type PaymentStatus = "UNPAID" | "PENDING" | "PAID" | "REJECTED";

function isAdmin(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  const cookie = request.headers.get("cookie") || "";
  const hasCookieToken = cookie.includes("adminToken=admin-local-session");

  return token === "admin-local-session" || hasCookieToken;
}

function isValidBookingStatus(status: string): status is BookingStatus {
  return ["PENDING", "CONFIRMED", "CANCELLED"].includes(status);
}

function isValidPaymentStatus(status: string): status is PaymentStatus {
  return ["UNPAID", "PENDING", "PAID", "REJECTED"].includes(status);
}

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่มีสิทธิ์ใช้งานส่วนนี้",
        },
        { status: 401 }
      );
    }

    const bookings = await prisma.booking.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        roomType: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("GET ADMIN BOOKINGS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถโหลดรายการจองได้",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่มีสิทธิ์ใช้งานส่วนนี้",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = Number(body.id);
    const status = String(body.status || "").trim();
    const paymentStatus = String(body.paymentStatus || "").trim();

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบรหัสรายการจอง",
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

      if (paymentStatus === "PAID") {
        data.paidAt = new Date();
      }

      if (
        paymentStatus === "UNPAID" ||
        paymentStatus === "PENDING" ||
        paymentStatus === "REJECTED"
      ) {
        data.paidAt = null;
      }
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
        id,
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
    console.error("PATCH ADMIN BOOKINGS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถอัปเดตรายการจองได้",
      },
      { status: 500 }
    );
  }
}