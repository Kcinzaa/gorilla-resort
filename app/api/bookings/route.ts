import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  const bookedRooms = await prisma.booking.count({
    where: {
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
    },
  });

  const totalRooms = roomType.totalRooms ?? 1;
  const availableRooms = Math.max(totalRooms - bookedRooms, 0);

  return {
    roomType,
    totalRooms,
    bookedRooms,
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

    const bookings = await prisma.booking.findMany({
      where: {
        ...(lineUserId
          ? {
              lineUserId,
            }
          : {}),
        ...(bookingCode
          ? {
              bookingCode,
            }
          : {}),
      },
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
    console.error("GET BOOKINGS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถโหลดรายการจองได้",
      },
      { status: 500 }
    );
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

    const totalPrice = nights * roomType.pricePerNight;
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
        totalPrice,
        
        status: "PENDING",

        depositAmount,
        paymentStatus: "PAID",
        paymentMethod,
        paymentSlipUrl,
        paymentReference,
        paidAt: null,
      },
      include: {
        roomType: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "ส่งคำขอจองและแจ้งชำระเงินสำเร็จ",
      data: booking,
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
        paidAt: null,
      },
      include: {
        roomType: true,
      },
    });

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
