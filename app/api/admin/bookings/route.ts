import { NextResponse } from "next/server";
import { syncGorillaBookingToCentral } from "@/lib/centralBookingSync";
import { getCentralSupabaseAdmin } from "@/lib/centralSupabaseAdmin";
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

type RhinoBookingRow = {
  id: string;
  booking_no?: string | null;
  payment_reference?: string | null;
  line_user_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_contact?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  total_rooms?: number | null;
  total_guests?: number | null;
  total_amount?: number | null;
  booking_status?: string | null;
  payment_status?: string | null;
  payment_slip_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  cart_data?: unknown;
};

type RhinoCartItem = {
  roomName?: string;
  roomSlug?: string;
  room_slug?: string;
  slug?: string;
  quantity?: number;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value) return {};

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function normalizeRhinoCartItems(value: unknown) {
  const cart = asRecord(value);
  const items = Array.isArray(cart.items) ? cart.items : [];

  return items
    .filter((item) => item && typeof item === "object")
    .map((item) => item as RhinoCartItem);
}

function mapRhinoSlugToGorillaRoomTypeId(slug?: string | null) {
  const value = String(slug || "").trim().toLowerCase();

  if (value === "resort-2-person") return 1;
  if (value === "gorilla-king-double") return 5;
  if (value === "gorilla-king-single") return 6;

  return 0;
}

function normalizeRhinoBookingStatus(status?: string | null) {
  const value = String(status || "").toUpperCase();

  if (["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"].includes(value)) {
    return "CONFIRMED";
  }

  if (["CANCELLED", "CANCELED", "EXPIRED"].includes(value)) {
    return "CANCELLED";
  }

  return "PENDING";
}

function normalizeRhinoPaymentStatus(status?: string | null) {
  const value = String(status || "").toUpperCase();

  if (["PAID", "SUCCESS", "CONFIRMED"].includes(value)) return "PAID";
  if (["REJECTED", "FAILED"].includes(value)) return "REJECTED";
  if (["PENDING", "WAITING_VERIFY", "WAITING_PAYMENT"].includes(value)) {
    return "PENDING";
  }

  return "UNPAID";
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

async function loadRhinoAdminBookings() {
  try {
    const central = getCentralSupabaseAdmin();

    if (!central) return [];

    const roomTypes = await prisma.roomType.findMany({
      select: {
        id: true,
        name: true,
        pricePerNight: true,
        imageUrl: true,
        capacity: true,
      },
    });

    const roomTypeById = new Map(roomTypes.map((room) => [room.id, room]));

    const { data, error } = await central
      .from("bookings")
      .select(
        "id, booking_no, payment_reference, line_user_id, customer_name, customer_phone, customer_contact, check_in, check_out, total_rooms, total_guests, total_amount, booking_status, payment_status, payment_slip_url, created_at, updated_at, cart_data",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("LOAD_RHINO_ADMIN_BOOKINGS_ERROR:", error);
      return [];
    }

    return ((data || []) as RhinoBookingRow[]).map((row) => {
      const items = normalizeRhinoCartItems(row.cart_data);
      const firstItem = items[0];
      const firstSlug =
        firstItem?.roomSlug || firstItem?.room_slug || firstItem?.slug || "";
      const roomTypeId = mapRhinoSlugToGorillaRoomTypeId(firstSlug);
      const roomType = roomTypeById.get(roomTypeId);
      const roomName =
        firstItem?.roomName || roomType?.name || "ห้องพัก Rhino";

      return {
        id: `rhino-${row.id}`,
        bookingCode: row.booking_no || row.payment_reference || "",
        lineUserId: row.line_user_id || "",
        displayName: row.customer_name || "",
        pictureUrl: null,
        phone: row.customer_phone || "",
        note: row.customer_contact || "",
        roomTypeId,
        checkIn: row.check_in || null,
        checkOut: row.check_out || null,
        guests: Number(row.total_guests || 0),
        roomCount: Number(row.total_rooms || firstItem?.quantity || 1),
        totalPrice: Number(row.total_amount || 0),
        status: normalizeRhinoBookingStatus(row.booking_status),
        depositAmount: null,
        paymentStatus: normalizeRhinoPaymentStatus(row.payment_status),
        paymentMethod: "RHINO",
        paymentSlipUrl: row.payment_slip_url || null,
        paymentReference: row.payment_reference || null,
        paidAt: null,
        createdAt: row.created_at || null,
        updatedAt: row.updated_at || null,
        source: "rhino",
        roomType: {
          id: roomTypeId,
          name: roomName,
          pricePerNight: Number(roomType?.pricePerNight || 0),
          imageUrl: roomType?.imageUrl || null,
          capacity: Number(roomType?.capacity || 0),
        },
      };
    });
  } catch (error) {
    console.error("LOAD_RHINO_ADMIN_BOOKINGS_THROW:", error);
    return [];
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

    const { searchParams } = new URL(request.url);
    const includeRhino = searchParams.get("includeRhino") === "1";

    let bookings: Awaited<ReturnType<typeof loadAdminBookings>> | [] = [];
    try {
      bookings = await loadAdminBookings();
    } catch (loadError) {
      console.error("LOAD_ADMIN_BOOKINGS_FATAL:", loadError);
      bookings = [];
    }

    const rhinoBookings = includeRhino ? await loadRhinoAdminBookings() : [];
    const combinedBookings = [...bookings, ...rhinoBookings].sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();

      return bTime - aTime;
    });

    return NextResponse.json({
      success: true,
      data: combinedBookings,
      meta: {
        gorillaCount: bookings.length,
        rhinoCount: rhinoBookings.length,
      },
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
