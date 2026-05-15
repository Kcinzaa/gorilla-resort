import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCentralRhinoBookedRoomCount } from "@/lib/centralAvailability";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RoomTypeRow = {
  id: number;
  name: string;
  description: string | null;
  pricePerNight: number;
  capacity: number;
  totalRooms: number | null;
  reservedRooms?: number | null;
  imageUrl: string | null;
  isActive: boolean;
};

type BookingRow = {
  id: number;
  roomTypeId: number;
  checkIn: Date;
  checkOut: Date;
  status: string;
  roomCount?: number | null;
};

const FALLBACK_GORILLA_ROOMS: RoomTypeRow[] = [
  {
    id: 1,
    name: "Standard room",
    description: "ห้องรีสอร์ท 2 ท่าน",
    pricePerNight: 700,
    capacity: 2,
    totalRooms: 16,
    reservedRooms: 6,
    imageUrl: null,
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
    imageUrl: null,
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
    imageUrl: null,
    isActive: true,
  },
];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isMissingColumnError(error: unknown, columnName: string) {
  return getErrorMessage(error).includes(columnName);
}

function isReservedRoomsColumnError(error: unknown) {
  return isMissingColumnError(error, "reservedRooms");
}

function isRoomCountColumnError(error: unknown) {
  return isMissingColumnError(error, "roomCount");
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

function isHoldingBookingStatus(status: string) {
  const value = String(status || "").toUpperCase();

  return (
    value === "PENDING" ||
    value === "CONFIRMED" ||
    value === "CHECKED_IN" ||
    value === "WAITING_PAYMENT" ||
    value === "WAITING_VERIFY"
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

async function loadActiveRooms() {
  try {
    return (await loadRooms(true)) as RoomTypeRow[];
  } catch (error) {
    if (isReservedRoomsColumnError(error)) {
      return (await loadRooms(false)).map((room) => ({
        ...room,
        reservedRooms: 0,
      })) as RoomTypeRow[];
    }

    console.error("LOAD_GORILLA_ROOMS_FALLBACK_USED", error);
    return FALLBACK_GORILLA_ROOMS;
  }
}

async function loadBookingsForDateRange(checkIn: Date, checkOut: Date) {
  try {
    return (await prisma.booking.findMany({
      where: {
        status: {
          in: [
            "PENDING",
            "CONFIRMED",
            "CHECKED_IN",
            "WAITING_PAYMENT",
            "WAITING_VERIFY",
          ],
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
    })) as BookingRow[];
  } catch (error) {
    if (!isRoomCountColumnError(error)) {
      throw error;
    }

    return (await prisma.booking.findMany({
      where: {
        status: {
          in: [
            "PENDING",
            "CONFIRMED",
            "CHECKED_IN",
            "WAITING_PAYMENT",
            "WAITING_VERIFY",
          ],
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
    })) as BookingRow[];
  }
}

function getBookedCountByRoomType(bookings: BookingRow[]) {
  return bookings.reduce<Record<number, number>>((acc, booking) => {
    if (!isHoldingBookingStatus(booking.status)) {
      return acc;
    }

    const roomCount = Math.max(Number(booking.roomCount || 1), 1);

    acc[booking.roomTypeId] = (acc[booking.roomTypeId] || 0) + roomCount;

    return acc;
  }, {});
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const checkInParam = searchParams.get("checkIn") || "";
    const checkOutParam = searchParams.get("checkOut") || "";
    const adminOwnOnly = searchParams.get("adminOwnOnly") === "1";

    const rooms = await loadActiveRooms();

    /**
     * ถ้าไม่ได้ส่ง checkIn/checkOut มา
     * ให้ส่งข้อมูลห้องปกติกลับไปก่อน ใช้กับหน้าที่ต้องการ list ห้องเฉย ๆ
     */
    if (!checkInParam || !checkOutParam) {
      const data = rooms.map((room) => {
        const totalRooms = Number(room.totalRooms || 0);
        const reservedRooms = Math.min(
          Math.max(Number(room.reservedRooms || 0), 0),
          totalRooms,
        );

        const availableRooms = Math.max(totalRooms - reservedRooms, 0);

        return {
          ...room,
          totalRooms,
          reservedRooms,
          localBookedRooms: 0,
          centralRhinoBookedRooms: 0,
          realBookedRooms: 0,
          bookedRooms: reservedRooms,
          availableRooms,
          isAvailable: availableRooms > 0,
        };
      });

      return NextResponse.json(
        {
          success: true,
          data,
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          },
        },
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
        { status: 400 },
      );
    }

    if (checkOut <= checkIn) {
      return NextResponse.json(
        {
          success: false,
          message: "วันที่ออกต้องมากกว่าวันที่เข้าพัก",
        },
        { status: 400 },
      );
    }

    let bookings: BookingRow[] = [];

    try {
      bookings = await loadBookingsForDateRange(checkIn, checkOut);
    } catch (error) {
      console.error("LOAD_GORILLA_BOOKINGS_FOR_AVAILABILITY_FAILED", error);
      bookings = [];
    }
    const bookedCountByRoomType = getBookedCountByRoomType(bookings);

    const data = await Promise.all(
      rooms.map(async (room) => {
        const totalRooms = Number(room.totalRooms || 0);

        const reservedRooms = Math.min(
          Math.max(Number(room.reservedRooms || 0), 0),
          totalRooms,
        );

        const localBookedRooms = Number(bookedCountByRoomType[room.id] || 0);

        let centralRhinoBookedRooms = 0;

        if (!adminOwnOnly) {
          try {
            centralRhinoBookedRooms = await getCentralRhinoBookedRoomCount({
              gorillaRoomTypeId: room.id,
              checkIn,
              checkOut,
            });
          } catch (error) {
            console.error("GET_PUBLIC_ROOMS_CENTRAL_COUNT_ERROR", {
              roomTypeId: room.id,
              roomName: room.name,
              error,
            });
          }
        }

        /**
         * realBookedRooms = ลูกค้าจองจริง
         * รวมทั้ง Gorilla และ Rhino
         */
        const realBookedRooms = localBookedRooms + centralRhinoBookedRooms;

        /**
         * bookedRooms = ห้องที่ถูกใช้ทั้งหมด
         * รวมล็อกห้อง + ลูกค้าจองจริง
         */
        const bookedRooms = reservedRooms + realBookedRooms;

        const availableRooms = Math.max(totalRooms - bookedRooms, 0);

        return {
          ...room,
          totalRooms,
          reservedRooms,
          localBookedRooms,
          centralRhinoBookedRooms,
          realBookedRooms,
          bookedRooms,
          availableRooms,
          isAvailable: availableRooms > 0,
        };
      }),
    );

    return NextResponse.json(
      {
        success: true,
        data,
        summary: {
          checkIn: checkInParam,
          checkOut: checkOutParam,
          totalRoomTypes: rooms.length,
          totalRooms: data.reduce(
            (sum, room) => sum + Number(room.totalRooms || 0),
            0,
          ),
          totalReservedRooms: data.reduce(
            (sum, room) => sum + Number(room.reservedRooms || 0),
            0,
          ),
          totalLocalBookedRooms: data.reduce(
            (sum, room) => sum + Number(room.localBookedRooms || 0),
            0,
          ),
          totalCentralRhinoBookedRooms: data.reduce(
            (sum, room) => sum + Number(room.centralRhinoBookedRooms || 0),
            0,
          ),
          totalBookedRooms: data.reduce(
            (sum, room) => sum + Number(room.bookedRooms || 0),
            0,
          ),
          totalAvailableRooms: data.reduce(
            (sum, room) => sum + Number(room.availableRooms || 0),
            0,
          ),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("GET PUBLIC ROOMS ERROR:", error);

    const data = FALLBACK_GORILLA_ROOMS.map((room) => {
      const totalRooms = Number(room.totalRooms || 0);
      const reservedRooms = Math.min(
        Math.max(Number(room.reservedRooms || 0), 0),
        totalRooms,
      );
      const availableRooms = Math.max(totalRooms - reservedRooms, 0);

      return {
        ...room,
        totalRooms,
        reservedRooms,
        localBookedRooms: 0,
        centralRhinoBookedRooms: 0,
        realBookedRooms: 0,
        bookedRooms: reservedRooms,
        availableRooms,
        isAvailable: availableRooms > 0,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data,
        warning: "ใช้ข้อมูลสำรองของ Gorilla เนื่องจากโหลดฐานข้อมูลไม่สำเร็จ",
        error:
          process.env.NODE_ENV === "development"
            ? getErrorMessage(error)
            : undefined,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      },
    );
  }
}
