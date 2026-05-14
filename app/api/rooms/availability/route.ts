import { NextResponse } from "next/server";
import { getCentralRhinoBookedRoomCount } from "@/lib/centralAvailability";
import { prisma } from "@/lib/prisma";

type AvailabilityRoom = {
  id: number;
  name: string;
  description: string | null;
  pricePerNight: number;
  capacity: number;
  totalRooms: number | null;
  reservedRooms: number | null;
  imageUrl: string | null;
  isActive: boolean;
};

type ConfirmedBooking = {
  id: number;
  roomTypeId: number;
  checkIn: Date;
  checkOut: Date;
  status: string;
  roomCount?: number | null;
};

const FALLBACK_GORILLA_ROOMS: AvailabilityRoom[] = [
  {
    id: 1,
    name: "Standard room",
    description: "ห้องรีสอร์ท 2 ท่าน",
    pricePerNight: 700,
    capacity: 2,
    totalRooms: 16,
    reservedRooms: 6,
    imageUrl: "/images/room/standard.jpg",
    isActive: true,
  },
  {
    id: 5,
    name: "King size room double",
    description: "ห้องรีสอร์ทเตียงคู่",
    pricePerNight: 1200,
    capacity: 2,
    totalRooms: 2,
    reservedRooms: 0,
    imageUrl: "/images/room/king-double.jpg",
    isActive: true,
  },
  {
    id: 6,
    name: "King size room single",
    description: "ห้องรีสอร์ทเตียงเดี่ยว",
    pricePerNight: 1200,
    capacity: 2,
    totalRooms: 2,
    reservedRooms: 0,
    imageUrl: "/images/room/king-single.jpg",
    isActive: true,
  },
];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isReservedRoomsColumnError(error: unknown) {
  return getErrorMessage(error).includes("reservedRooms");
}

function isRoomCountColumnError(error: unknown) {
  return getErrorMessage(error).includes("roomCount");
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

    async function loadRooms(includeReservedRooms = true) {
      return prisma.roomType.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
          name: true,
          description: true,
          pricePerNight: true,
          capacity: true,
          totalRooms: true,
          ...(includeReservedRooms ? { reservedRooms: true } : {}),
          imageUrl: true,
          isActive: true,
        },
      });
    }

    let rooms: AvailabilityRoom[];
    try {
      rooms = (await loadRooms(true)) as AvailabilityRoom[];
    } catch (error) {
      if (isReservedRoomsColumnError(error)) {
        rooms = (await loadRooms(false)).map((room) => ({
          ...room,
          reservedRooms: 0,
        })) as AvailabilityRoom[];
      } else {
        console.error("LOAD_GORILLA_AVAILABILITY_ROOMS_FALLBACK_USED", error);
        rooms = FALLBACK_GORILLA_ROOMS;
      }
    }

    /*
      สำคัญ:
      PENDING = ลูกค้าส่งสลิปและจองแล้ว ต้องกันห้องไว้ก่อน
      CONFIRMED = แอดมินยืนยันแล้ว ยังกันห้อง
      CANCELLED = ไม่หักห้อง คืนห้องว่างทันที
    */
    let confirmedBookings: ConfirmedBooking[];
    try {
      confirmedBookings = await prisma.booking.findMany({
        where: {
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
        select: {
          id: true,
          roomTypeId: true,
          checkIn: true,
          checkOut: true,
          status: true,
          roomCount: true,
        },
      });
    } catch (error) {
      if (isRoomCountColumnError(error)) {
        confirmedBookings = await prisma.booking.findMany({
          where: {
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
          select: {
            id: true,
            roomTypeId: true,
            checkIn: true,
            checkOut: true,
            status: true,
          },
        });
      } else {
        console.error("LOAD_GORILLA_AVAILABILITY_BOOKINGS_FAILED", error);
        confirmedBookings = [];
      }
    }

    const bookedCountByRoomType = confirmedBookings.reduce<
      Record<number, number>
    >((acc: Record<number, number>, booking: ConfirmedBooking) => {
      acc[booking.roomTypeId] =
        (acc[booking.roomTypeId] || 0) + Math.max(Number(booking.roomCount || 1), 1);
      return acc;
    }, {});

    const data = await Promise.all(rooms.map(async (room: AvailabilityRoom) => {
      const totalRooms = Number(room.totalRooms || 0);
      const reservedRooms = Math.min(Number(room.reservedRooms || 0), totalRooms);
      const realBookedRooms = bookedCountByRoomType[room.id] || 0;
      let centralRhinoBookedRooms = 0;

      try {
        centralRhinoBookedRooms = await getCentralRhinoBookedRoomCount({
          gorillaRoomTypeId: room.id,
          checkIn,
          checkOut,
        });
      } catch (error) {
        console.error("GET_ROOM_AVAILABILITY_CENTRAL_COUNT_ERROR", {
          roomTypeId: room.id,
          roomName: room.name,
          error,
        });
      }

      const bookedRooms = reservedRooms + realBookedRooms + centralRhinoBookedRooms;
      const availableRooms = Math.max(totalRooms - bookedRooms, 0);

      return {
        ...room,
        totalRooms,
        reservedRooms,
        realBookedRooms: realBookedRooms + centralRhinoBookedRooms,
        localBookedRooms: realBookedRooms,
        centralRhinoBookedRooms,
        bookedRooms,
        availableRooms,
        isAvailable: availableRooms > 0,
      };
    }));

    return NextResponse.json({
      success: true,
      data,
      summary: {
        checkIn: checkInParam,
        checkOut: checkOutParam,
        totalRoomTypes: rooms.length,
        totalHeldBookings:
          confirmedBookings.reduce(
            (sum, booking) => sum + Math.max(Number(booking.roomCount || 1), 1),
            0
          ) +
          rooms.reduce((sum, room) => sum + Number(room.reservedRooms || 0), 0),
      },
    });
  } catch (error) {
    console.error("GET ROOM AVAILABILITY ERROR:", error);

    const data = FALLBACK_GORILLA_ROOMS.map((room) => {
      const totalRooms = Number(room.totalRooms || 0);
      const reservedRooms = Math.min(Number(room.reservedRooms || 0), totalRooms);
      const availableRooms = Math.max(totalRooms - reservedRooms, 0);

      return {
        ...room,
        totalRooms,
        reservedRooms,
        realBookedRooms: 0,
        localBookedRooms: 0,
        centralRhinoBookedRooms: 0,
        bookedRooms: reservedRooms,
        availableRooms,
        isAvailable: availableRooms > 0,
      };
    });

    return NextResponse.json({
      success: true,
      data,
      warning: "ใช้ข้อมูลสำรองของ Gorilla เนื่องจากตรวจสอบห้องว่างไม่สำเร็จ",
      error:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });
  }
}
