import { NextResponse } from "next/server";
import { getCentralRhinoBookedRoomCount } from "@/lib/centralAvailability";
import { syncGorillaBookingToCentral } from "@/lib/centralBookingSync";
import { triggerSheetsSync } from "@/lib/googleSheetsSync";
import { prisma } from "@/lib/prisma";
import { getCentralSupabaseAdmin } from "@/lib/centralSupabaseAdmin";

function cleanString(value: unknown) {
  return String(value || "").trim();
}

function parseDate(value: unknown) {
  const text = cleanString(value);

  if (!text) return null;

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function calculateNights(checkIn: Date, checkOut: Date) {
  const diff = checkOut.getTime() - checkIn.getTime();

  if (diff <= 0) return 0;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function createBookingCode() {
  const date = new Date();

  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const random = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `RB${year}${month}${day}-${random}`;
}

function calculateDeposit(totalPrice: number) {
  if (!totalPrice || totalPrice <= 0) {
    return 0;
  }

  return totalPrice;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isRoomCountColumnError(error: unknown) {
  return getErrorMessage(error).includes("roomCount");
}

async function getBookedRoomCount({
  roomTypeId,
  checkIn,
  checkOut,
}: {
  roomTypeId: number;
  checkIn: Date;
  checkOut: Date;
}) {
  const where = {
    roomTypeId,
    status: {
      in: ["PENDING", "CONFIRMED"],
    },
    checkIn: {
      lt: checkOut,
    },
    checkOut: {
      gt: checkIn,
    },
  };

  try {
    const result = await prisma.booking.aggregate({
      where,
      _sum: {
        roomCount: true,
      },
    });

    return result._sum.roomCount ?? 0;
  } catch (error) {
    if (!isRoomCountColumnError(error)) throw error;
    return prisma.booking.count({ where });
  }
}

async function getAvailableRooms({
  roomTypeId,
  checkIn,
  checkOut,
}: {
  roomTypeId: number;
  checkIn: Date;
  checkOut: Date;
}) {
  const roomType = await prisma.roomType.findFirst({
    where: {
      id: roomTypeId,
      isActive: true,
    },
  });

  if (!roomType) {
    return {
      roomType: null,
      totalRooms: 0,
      bookedRooms: 0,
      availableRooms: 0,
    };
  }

  const bookedRooms = await getBookedRoomCount({
    roomTypeId,
    checkIn,
    checkOut,
  });

  let centralRhinoBookedRooms = 0;

  try {
    centralRhinoBookedRooms = await getCentralRhinoBookedRoomCount({
      gorillaRoomTypeId: roomTypeId,
      checkIn,
      checkOut,
    });
  } catch (error) {
    console.error("GET_BOOKING_AVAILABLE_ROOMS_CENTRAL_COUNT_ERROR:", {
      roomTypeId,
      checkIn,
      checkOut,
      error,
    });
  }

  const totalRooms = roomType.totalRooms ?? 1;
  const reservedRooms = Math.min(Number(roomType.reservedRooms || 0), totalRooms);
  const availableRooms = Math.max(
    totalRooms - reservedRooms - bookedRooms - centralRhinoBookedRooms,
    0
  );

  return {
    roomType,
    totalRooms,
    reservedRooms,
    bookedRooms: reservedRooms + bookedRooms + centralRhinoBookedRooms,
    localBookedRooms: bookedRooms,
    centralRhinoBookedRooms,
    availableRooms,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const lineUserId = cleanString(searchParams.get("lineUserId"));
    const bookingCode = cleanString(searchParams.get("bookingCode"));

    if (!lineUserId && !bookingCode) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาระบุ lineUserId หรือ bookingCode",
        },
        { status: 400 }
      );
    }

    const where = {
      ...(lineUserId ? { lineUserId } : {}),
      ...(bookingCode ? { bookingCode } : {}),
    };

    const localBookings = await loadGorillaBookingsSafely(where);

    const sorted = [...localBookings].sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });

    return NextResponse.json({
      success: true,
      data: sorted,
      meta: {
        gorillaCount: localBookings.length,
      },
    });
  } catch (error) {
    console.error("GET BOOKINGS FATAL:", error);

    const errMsg = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        success: false,
        message: `ไม่สามารถโหลดรายการจองได้: ${errMsg}`,
      },
      { status: 500 },
    );
  }
}

type AnyBookingRecord = {
  id: number | string;
  bookingCode?: string | null;
  lineUserId?: string | null;
  displayName?: string | null;
  phone?: string | null;
  note?: string | null;
  roomTypeId?: number | null;
  checkIn?: string | Date | null;
  checkOut?: string | Date | null;
  guests?: number | null;
  roomCount?: number | null;
  totalPrice?: number | null;
  status?: string | null;
  depositAmount?: number | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  paymentSlipUrl?: string | null;
  paymentReference?: string | null;
  paidAt?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  roomType?:
    | {
        id?: number | null;
        name?: string | null;
        pricePerNight?: number | null;
        imageUrl?: string | null;
        capacity?: number | null;
      }
    | null;
  source?: "gorilla" | "rhino";
};

/**
 * Load gorilla bookings, falling back to a roomCount-free select if the
 * Booking table hasn't been migrated yet.
 */
async function loadGorillaBookingsSafely(where: {
  lineUserId?: string;
  bookingCode?: string;
}): Promise<AnyBookingRecord[]> {
  try {
    const rows = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { roomType: true },
    });

    return rows.map((row) => ({ ...row, source: "gorilla" as const }));
  } catch (firstError) {
    if (!isRoomCountColumnError(firstError)) {
      console.error("LOAD_GORILLA_BOOKINGS_PRIMARY_ERROR:", firstError);
    }

    const rows = await prisma.booking.findMany({
      where,
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

    return rows.map((row) => ({ ...row, source: "gorilla" as const }));
  }
}

type RhinoBookingRow = {
  id: string;
  booking_no?: string | null;
  payment_reference?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_contact?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  nights?: number | null;
  total_rooms?: number | null;
  total_guests?: number | null;
  total_adults?: number | null;
  total_children?: number | null;
  total_amount?: number | null;
  booking_status?: string | null;
  payment_status?: string | null;
  payment_slip_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  cart_data?: unknown;
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

function normalizeRhinoCartData(value: unknown) {
  const cart = asRecord(value);
  const items = Array.isArray(cart.items)
    ? cart.items.filter((item) => item && typeof item === "object")
    : [];

  return { items: items as { roomName?: string; quantity?: number }[] };
}

/**
 * Pull the user's Rhino-side bookings (resort rooms booked through Rhino) so
 * /my-bookings shows everything across both systems. Safe — returns [] if the
 * central client isn't configured.
 */
async function loadRhinoCentralBookingsByLineUser(
  lineUserId: string,
): Promise<AnyBookingRecord[]> {
  try {
    const central = getCentralSupabaseAdmin();
    if (!central) return [];

    const { data, error } = await central
      .from("bookings")
      .select(
        "id, booking_no, payment_reference, customer_name, customer_phone, customer_contact, check_in, check_out, nights, total_rooms, total_guests, total_adults, total_children, total_amount, booking_status, payment_status, payment_slip_url, created_at, updated_at, cart_data",
      )
      .eq("line_user_id", lineUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("LOAD_RHINO_BOOKINGS_ERROR:", error);
      return [];
    }

    return ((data || []) as RhinoBookingRow[]).map((row) => {
      const cartData = normalizeRhinoCartData(row.cart_data);
      const firstItem = cartData.items[0];
      const roomName = firstItem?.roomName || "ห้องพัก Rhino";

      return {
        id: `rhino-${row.id}`,
        bookingCode: row.booking_no || row.payment_reference || "",
        lineUserId,
        displayName: row.customer_name || "",
        phone: row.customer_phone || "",
        note: row.customer_contact || "",
        checkIn: row.check_in || null,
        checkOut: row.check_out || null,
        guests: Number(row.total_guests || 0),
        roomCount: Number(row.total_rooms || 0),
        totalPrice: Number(row.total_amount || 0),
        status: row.booking_status || "PENDING",
        paymentStatus: row.payment_status || "UNPAID",
        paymentSlipUrl: row.payment_slip_url || null,
        paymentReference: row.payment_reference || null,
        createdAt: row.created_at || null,
        updatedAt: row.updated_at || null,
        roomType: {
          id: 0,
          name: roomName,
          pricePerNight: 0,
          imageUrl: null,
          capacity: 0,
        },
        source: "rhino" as const,
      };
    });
  } catch (error) {
    console.error("LOAD_RHINO_BOOKINGS_THROW:", error);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const lineUserId = cleanString(body.lineUserId);
    const displayName = cleanString(body.displayName);
    const pictureUrl = cleanString(body.pictureUrl);
    const phone = cleanString(body.phone);
    const note = cleanString(body.note);

    const paymentMethod = cleanString(body.paymentMethod || "PROMPTPAY");
    const paymentSlipUrl = cleanString(body.paymentSlipUrl);
    const paymentReference = cleanString(body.paymentReference);

    const roomTypeId = Number(body.roomTypeId);
    const guests = Number(body.guests);
    const roomCount = Math.max(Number(body.roomCount || 1), 1);

    const checkIn = parseDate(body.checkIn);
    const checkOut = parseDate(body.checkOut);

    if (!lineUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบข้อมูลผู้ใช้ LINE",
        },
        { status: 400 }
      );
    }

    if (!roomTypeId || Number.isNaN(roomTypeId)) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบประเภทห้องพัก",
        },
        { status: 400 }
      );
    }

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาระบุวันที่เข้าพักและวันที่ออก",
        },
        { status: 400 }
      );
    }

    if (checkOut <= checkIn) {
      return NextResponse.json(
        {
          success: false,
          message: "วันที่ออกต้องมากกว่าวันที่เข้าพัก",
        },
        { status: 400 }
      );
    }

    if (!guests || Number.isNaN(guests) || guests <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาระบุจำนวนผู้เข้าพัก",
        },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณากรอกเบอร์โทรศัพท์",
        },
        { status: 400 }
      );
    }

    if (!paymentSlipUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาแนบสลิปการชำระเงิน",
        },
        { status: 400 }
      );
    }

    const { roomType, availableRooms } = await getAvailableRooms({
      roomTypeId,
      checkIn,
      checkOut,
    });

    if (!roomType) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบห้องพัก หรือห้องพักนี้ไม่ได้เปิดให้จอง",
        },
        { status: 404 }
      );
    }

    if (guests > roomType.capacity) {
      return NextResponse.json(
        {
          success: false,
          message: `ห้องนี้รองรับได้สูงสุด ${roomType.capacity} คน`,
        },
        { status: 400 }
      );
    }

    if (availableRooms <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ช่วงวันที่เลือกห้องพักเต็มแล้ว กรุณาเลือกวันอื่น",
        },
        { status: 409 }
      );
    }

    if (roomCount > availableRooms) {
      return NextResponse.json(
        {
          success: false,
          message: `à¸«à¹‰à¸­à¸‡à¸§à¹ˆà¸²à¸‡à¹€à¸«à¸¥à¸·à¸­ ${availableRooms} à¸«à¹‰à¸­à¸‡ à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¸ˆà¸­à¸‡ ${roomCount} à¸«à¹‰à¸­à¸‡à¹„à¸”à¹‰`,
        },
        { status: 409 }
      );
    }

    const nights = calculateNights(checkIn, checkOut);

    if (nights <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "จำนวนคืนไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    const totalPrice = nights * roomType.pricePerNight * roomCount;
    const depositAmount = calculateDeposit(totalPrice);
    const bookingCode = createBookingCode();

    const booking = await prisma.booking.create({
      data: {
        bookingCode,
        lineUserId,
        displayName: displayName || "LINE User",
        pictureUrl,
        phone,
        note,

        roomTypeId,
        checkIn,
        checkOut,
        guests,
        roomCount,
        totalPrice,
        
        status: "PENDING",

        depositAmount,
        paymentStatus: "PAID",
        paymentMethod,
        paymentSlipUrl,
        paymentReference,
        paidAt: new Date(),
      },
      include: {
        roomType: true,
      },
    });

    let centralSync = null;
    try {
      centralSync = await syncGorillaBookingToCentral(booking);
    } catch (syncError) {
      console.error("SYNC_GORILLA_BOOKING_TO_CENTRAL_ERROR:", syncError);
      centralSync = {
        synced: false,
        skipped: false,
        message: syncError instanceof Error ? syncError.message : "Unknown sync error",
      };
    }

    triggerSheetsSync("new-booking");

    return NextResponse.json({
      success: true,
      message: "ส่งคำขอจองและแจ้งชำระเงินสำเร็จ",
      data: booking,
      centralSync,
    });
  } catch (error) {
    console.error("POST BOOKINGS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถจองห้องพักได้",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const id = Number(body.id);
    const bookingCode = cleanString(body.bookingCode);
    const lineUserId = cleanString(body.lineUserId);

    const paymentMethod = cleanString(body.paymentMethod || "PROMPTPAY");
    const paymentSlipUrl = cleanString(body.paymentSlipUrl);
    const paymentReference = cleanString(body.paymentReference);

    if (!id && !bookingCode) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาระบุ id หรือ bookingCode ของรายการจอง",
        },
        { status: 400 }
      );
    }

    if (!lineUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบข้อมูลผู้ใช้ LINE",
        },
        { status: 400 }
      );
    }

    if (!paymentSlipUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาแนบสลิปการชำระเงิน",
        },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findFirst({
      where: {
        ...(id
          ? {
              id,
            }
          : {}),
        ...(bookingCode
          ? {
              bookingCode,
            }
          : {}),
        lineUserId,
      },
      include: {
        roomType: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบรายการจอง หรือคุณไม่มีสิทธิ์แก้ไขรายการนี้",
        },
        { status: 404 }
      );
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          message: "รายการจองนี้ถูกยกเลิกแล้ว ไม่สามารถส่งสลิปใหม่ได้",
        },
        { status: 400 }
      );
    }

    if (booking.paymentStatus === "PAID") {
      return NextResponse.json(
        {
          success: false,
          message: "รายการนี้ชำระเงินสำเร็จแล้ว ไม่ต้องส่งสลิปใหม่",
        },
        { status: 400 }
      );
    }

    const updatedBooking = await prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        paymentStatus: "PENDING",
        paymentMethod,
        paymentSlipUrl,
        paymentReference,
        paidAt: new Date(),
      },
      include: {
        roomType: true,
      },
    });

    triggerSheetsSync("upload-slip");

    return NextResponse.json({
      success: true,
      message: "ส่งสลิปใหม่สำเร็จ รอแอดมินตรวจสอบอีกครั้ง",
      data: updatedBooking,
    });
  } catch (error) {
    console.error("PATCH BOOKINGS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถส่งสลิปใหม่ได้",
      },
      { status: 500 }
    );
  }
}
