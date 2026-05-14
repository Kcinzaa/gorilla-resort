import { NextResponse } from "next/server";
import { getCentralRhinoBookedRoomCount } from "@/lib/centralAvailability";
import { prisma } from "@/lib/prisma";

function parseDate(value: string | null) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00.000`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isReservedRoomsColumnError(error: unknown) {
  return getErrorMessage(error).includes("reservedRooms");
}

function isRoomCountColumnError(error: unknown) {
  return getErrorMessage(error).includes("roomCount");
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

    async function loadRoomType(includeReservedRooms = true) {
      return prisma.roomType.findFirst({
        where: { id: roomTypeId, isActive: true },
        select: {
          id: true,
          totalRooms: true,
          ...(includeReservedRooms ? { reservedRooms: true } : {}),
        },
      });
    }

    let roomType = await loadRoomType(true).catch((error) => {
      if (!isReservedRoomsColumnError(error)) throw error;
      return loadRoomType(false);
    });

    if (!roomType) {
      return NextResponse.json(
        { success: false, message: "ห้องพักนี้ไม่พร้อมให้จอง" },
        { status: 404 }
      );
    }

    const bookingWhere = {
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

    let bookedRooms = 0;
    try {
      const result = await prisma.booking.aggregate({
        where: bookingWhere,
        _sum: {
          roomCount: true,
        },
      });
      bookedRooms = result._sum.roomCount ?? 0;
    } catch (error) {
      if (!isRoomCountColumnError(error)) throw error;
      bookedRooms = await prisma.booking.count({ where: bookingWhere });
    }

    const totalRooms = Number(roomType.totalRooms ?? 1);
    const reservedRooms = Math.min(
      Number("reservedRooms" in roomType ? roomType.reservedRooms || 0 : 0),
      totalRooms
    );
    let centralRhinoBookedRooms = 0;

    try {
      centralRhinoBookedRooms = await getCentralRhinoBookedRoomCount({
        gorillaRoomTypeId: roomTypeId,
        checkIn,
        checkOut,
      });
    } catch (error) {
      console.error("GET_ROOM_AVAILABILITY_ONE_CENTRAL_COUNT_ERROR:", {
        roomTypeId,
        error,
      });
    }

    const heldRooms = bookedRooms + reservedRooms + centralRhinoBookedRooms;
    const availableRooms = Math.max(totalRooms - heldRooms, 0);

    return NextResponse.json({
      success: true,
      data: {
        roomTypeId,
        checkIn: checkInParam,
        checkOut: checkOutParam,
        totalRooms,
        reservedRooms,
        realBookedRooms: bookedRooms + centralRhinoBookedRooms,
        localBookedRooms: bookedRooms,
        centralRhinoBookedRooms,
        bookedRooms: heldRooms,
        availableRooms,
        isAvailable: availableRooms > 0,
      },
    });
  } catch (error) {
    console.error("GET ROOM AVAILABILITY ONE ERROR:", error);

    return NextResponse.json({
      success: true,
      data: {
        roomTypeId: Number(new URL(request.url).searchParams.get("roomTypeId") || 0),
        totalRooms: 0,
        reservedRooms: 0,
        realBookedRooms: 0,
        localBookedRooms: 0,
        centralRhinoBookedRooms: 0,
        bookedRooms: 0,
        availableRooms: 0,
        isAvailable: false,
      },
      warning: "ตรวจสอบห้องว่างไม่สำเร็จ ระบบจึงปิดการจองห้องนี้ชั่วคราว",
      error:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });

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
