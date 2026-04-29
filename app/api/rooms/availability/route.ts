import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseDate(value: string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const roomTypeId = Number(searchParams.get("roomTypeId"));
    const checkIn = parseDate(searchParams.get("checkIn"));
    const checkOut = parseDate(searchParams.get("checkOut"));

    if (!roomTypeId) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบรหัสประเภทห้องพัก",
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

    const roomType = await prisma.roomType.findFirst({
      where: {
        id: roomTypeId,
        isActive: true,
      },
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

    const overlappingBookings = await prisma.booking.count({
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
    const availableRooms = Math.max(totalRooms - overlappingBookings, 0);

    return NextResponse.json({
      success: true,
      data: {
        roomTypeId: roomType.id,
        roomName: roomType.name,
        totalRooms,
        bookedRooms: overlappingBookings,
        availableRooms,
        isAvailable: availableRooms > 0,
        checkIn,
        checkOut,
      },
    });
  } catch (error) {
    console.error("GET ROOM AVAILABILITY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถตรวจสอบห้องว่างได้",
      },
      { status: 500 }
    );
  }
}