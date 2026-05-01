import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseDate(value: string | null) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00.000`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomTypeId = Number(searchParams.get("roomTypeId"));
    const checkInParam = searchParams.get("checkIn");
    const checkOutParam = searchParams.get("checkOut");
    const checkIn = parseDate(checkInParam);
    const checkOut = parseDate(checkOutParam);

    if (!roomTypeId || Number.isNaN(roomTypeId)) {
      return NextResponse.json(
        { success: false, message: "ไม่พบประเภทห้องพัก" },
        { status: 400 }
      );
    }

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุวันที่เข้าพักและวันที่ออก" },
        { status: 400 }
      );
    }

    if (checkOut <= checkIn) {
      return NextResponse.json(
        { success: false, message: "วันที่ออกต้องมากกว่าวันที่เข้าพัก" },
        { status: 400 }
      );
    }

    const roomType = await prisma.roomType.findFirst({
      where: { id: roomTypeId, isActive: true },
      select: { id: true, totalRooms: true, reservedRooms: true },
    });

    if (!roomType) {
      return NextResponse.json(
        { success: false, message: "ห้องพักนี้ไม่พร้อมให้จอง" },
        { status: 404 }
      );
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

    const totalRooms = Number(roomType.totalRooms ?? 1);
    const reservedRooms = Math.min(Number(roomType.reservedRooms || 0), totalRooms);
    const heldRooms = bookedRooms + reservedRooms;
    const availableRooms = Math.max(totalRooms - heldRooms, 0);

    return NextResponse.json({
      success: true,
      data: {
        roomTypeId,
        checkIn: checkInParam,
        checkOut: checkOutParam,
        totalRooms,
        reservedRooms,
        realBookedRooms: bookedRooms,
        bookedRooms: heldRooms,
        availableRooms,
        isAvailable: availableRooms > 0,
      },
    });
  } catch (error) {
    console.error("GET ROOM AVAILABILITY ONE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถตรวจสอบห้องว่างได้",
        error:
          process.env.NODE_ENV === "development"
            ? getErrorMessage(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
