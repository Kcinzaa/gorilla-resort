import { NextResponse } from "next/server";
import { syncGorillaBookingToCentral } from "@/lib/centralBookingSync";
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

function isMissingColumnError(error: unknown, columnName: string) {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes(columnName);
}

async function loadAdminBookings() {
  try {
    return await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      include: { roomType: true },
    });
  } catch (error) {
    // Tolerate DBs that haven't been migrated yet (roomCount column missing).
    if (!isMissingColumnError(error, "roomCount")) throw error;

    return await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        bookingCode: true,
        lineUserId: true,
        displayName: true,
        pictureUrl: true,
        phone: true,
        note: true,
        roomTypeId: true,
        checkIn: true,
        checkOut: true,
        guests: true,
        totalPrice: true,
        status: true,
        depositAmount: true,
        paymentStatus: true,
        paymentMethod: true,
        paymentSlipUrl: true,
        paymentReference: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true,
        roomType: true,
      },
    });
  }
}

export async function GET(request: Request) {
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

    let bookings: Awaited<ReturnType<typeof loadAdminBookings>> | [] = [];
    try {
      bookings = await loadAdminBookings();
    } catch (loadError) {
      console.error("LOAD_ADMIN_BOOKINGS_FATAL:", loadError);
      bookings = [];
    }

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("GET ADMIN BOOKINGS ERROR:", error);

    // Soft-fail: return empty list + warning so the dashboard renders.
    return NextResponse.json(
      {
        success: true,
        data: [],
        warning: "โหลดรายการจองไม่สำเร็จ ระบบจะลองอีกครั้ง",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 200 },
    );
  }
}

export async function PATCH(request: Request) {
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

    let centralSync = null;
    try {
      centralSync = await syncGorillaBookingToCentral(booking);
    } catch (syncError) {
      console.error("SYNC_ADMIN_BOOKING_TO_CENTRAL_ERROR:", syncError);
      centralSync = {
        synced: false,
        skipped: false,
        message: syncError instanceof Error ? syncError.message : "Unknown sync error",
      };
    }

    return NextResponse.json({
      success: true,
      message: "อัปเดตรายการจองสำเร็จ",
      data: booking,
      centralSync,
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
