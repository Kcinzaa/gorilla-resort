import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type AvailabilityRoom = {
  id: number;
  name: string;
  description: string | null;
  pricePerNight: number;
  capacity: number;
  totalRooms: number | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ConfirmedBooking = {
  id: number;
  roomTypeId: number;
  checkIn: Date;
  checkOut: Date;
  status: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime());
}

function normalizeDateStart(dateText: string) {
  return new Date(`${dateText}T00:00:00.000`);
}

function normalizeDateEnd(dateText: string) {
  return new Date(`${dateText}T00:00:00.000`);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const checkInParam = searchParams.get("checkIn") || "";
    const checkOutParam = searchParams.get("checkOut") || "";

    if (!checkInParam || !checkOutParam) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาระบุวันที่เข้าพักและวันที่ออก",
        },
        { status: 400 }
      );
    }

    const checkIn = normalizeDateStart(checkInParam);
    const checkOut = normalizeDateEnd(checkOutParam);

    if (!isValidDate(checkIn) || !isValidDate(checkOut)) {
      return NextResponse.json(
        {
          success: false,
          message: "รูปแบบวันที่ไม่ถูกต้อง",
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

    const rooms: AvailabilityRoom[] = await prisma.roomType.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    /*
      สำคัญ:
      นับเฉพาะรายการที่แอดมินยืนยันแล้วเท่านั้น
      PENDING = ยังไม่หักห้อง
      CANCELLED = ไม่หักห้อง
    */
    const confirmedBookings: ConfirmedBooking[] =
      await prisma.booking.findMany({
        where: {
          status: "CONFIRMED",
          checkIn: {
            lt: checkOut,
          },
          checkOut: {
            gt: checkIn,
          },
        },
        select: {
          id: true,
          roomTypeId: true,
          checkIn: true,
          checkOut: true,
          status: true,
        },
      });

    const bookedCountByRoomType = confirmedBookings.reduce<
      Record<number, number>
    >((acc: Record<number, number>, booking: ConfirmedBooking) => {
      acc[booking.roomTypeId] = (acc[booking.roomTypeId] || 0) + 1;
      return acc;
    }, {});

    const data = rooms.map((room: AvailabilityRoom) => {
      const totalRooms = Number(room.totalRooms || 0);
      const bookedRooms = bookedCountByRoomType[room.id] || 0;
      const availableRooms = Math.max(totalRooms - bookedRooms, 0);

      return {
        ...room,
        totalRooms,
        bookedRooms,
        availableRooms,
        isAvailable: availableRooms > 0,
      };
    });

    return NextResponse.json({
      success: true,
      data,
      summary: {
        checkIn: checkInParam,
        checkOut: checkOutParam,
        totalRoomTypes: rooms.length,
        totalConfirmedBookings: confirmedBookings.length,
      },
    });
  } catch (error) {
    console.error("GET ROOM AVAILABILITY ERROR:", error);

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