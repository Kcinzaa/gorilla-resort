import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCentralRhinoBookedRoomCount } from "@/lib/centralAvailability";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RoomTypeForDashboard = {
  id: number;
  name: string;
  isActive: boolean;
  totalRooms?: number | null;
  reservedRooms?: number | null;
};

type LatestBookingForDashboard = {
  id: number;
  status: string;
  totalPrice: number | null;
  createdAt: Date;
  user?: unknown;
  roomType?: unknown;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isMissingColumnError(error: unknown, columnName: string) {
  return getErrorMessage(error).includes(columnName);
}

function getTodayStart() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getTomorrowStart() {
  const date = getTodayStart();
  date.setDate(date.getDate() + 1);
  return date;
}

async function loadRoomTypes() {
  try {
    return (await prisma.roomType.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        totalRooms: true,
        reservedRooms: true,
      },
      orderBy: {
        id: "asc",
      },
    })) as RoomTypeForDashboard[];
  } catch (error) {
    if (
      !isMissingColumnError(error, "totalRooms") &&
      !isMissingColumnError(error, "reservedRooms")
    ) {
      throw error;
    }

    try {
      return (await prisma.roomType.findMany({
        select: {
          id: true,
          name: true,
          isActive: true,
          totalRooms: true,
        },
        orderBy: {
          id: "asc",
        },
      })) as RoomTypeForDashboard[];
    } catch (secondError) {
      if (!isMissingColumnError(secondError, "totalRooms")) {
        throw secondError;
      }

      return (await prisma.roomType.findMany({
        select: {
          id: true,
          name: true,
          isActive: true,
        },
        orderBy: {
          id: "asc",
        },
      })) as RoomTypeForDashboard[];
    }
  }
}

async function loadLatestBookings() {
  try {
    return (await prisma.booking.findMany({
      take: 5,
      include: {
        user: true,
        roomType: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })) as LatestBookingForDashboard[];
  } catch (error) {
    if (!isMissingColumnError(error, "createdAt")) {
      throw error;
    }

    return (await prisma.booking.findMany({
      take: 5,
      include: {
        user: true,
        roomType: true,
      },
      orderBy: {
        id: "desc",
      },
    })) as LatestBookingForDashboard[];
  }
}

async function loadRevenue() {
  try {
    return await prisma.booking.aggregate({
      where: {
        status: {
          in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"],
        },
      },
      _sum: {
        totalPrice: true,
      },
    });
  } catch (error) {
    if (!isMissingColumnError(error, "totalPrice")) {
      throw error;
    }

    return {
      _sum: {
        totalPrice: 0,
      },
    };
  }
}

async function getCentralRhinoBookedTodayByRoom(roomTypes: RoomTypeForDashboard[]) {
  const checkIn = getTodayStart();
  const checkOut = getTomorrowStart();

  const rows = await Promise.all(
    roomTypes.map(async (room) => {
      try {
        const centralRhinoBookedRooms = await getCentralRhinoBookedRoomCount({
          gorillaRoomTypeId: room.id,
          checkIn,
          checkOut,
        });

        return {
          roomTypeId: room.id,
          roomName: room.name,
          centralRhinoBookedRooms,
        };
      } catch (error) {
        console.error("GET_CENTRAL_RHINO_DASHBOARD_COUNT_ERROR", {
          roomTypeId: room.id,
          roomName: room.name,
          error,
        });

        return {
          roomTypeId: room.id,
          roomName: room.name,
          centralRhinoBookedRooms: 0,
        };
      }
    }),
  );

  return rows;
}

export async function GET() {
  try {
    await requireAdmin();

    const roomTypes = await loadRoomTypes();

    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      checkedInBookings,
      checkedOutBookings,
      totalUsers,
      revenueResult,
      latestBookings,
      centralRhinoBookedTodayByRoom,
    ] = await Promise.all([
      prisma.booking.count(),

      prisma.booking.count({
        where: { status: "PENDING" },
      }),

      prisma.booking.count({
        where: { status: "CONFIRMED" },
      }),

      prisma.booking.count({
        where: { status: "CANCELLED" },
      }),

      prisma.booking.count({
        where: { status: "CHECKED_IN" },
      }),

      prisma.booking.count({
        where: { status: "CHECKED_OUT" },
      }),

      prisma.user.count(),

      loadRevenue(),

      loadLatestBookings(),

      getCentralRhinoBookedTodayByRoom(roomTypes),
    ]);

    const totalRoomTypes = roomTypes.length;

    const activeRoomTypes = roomTypes.filter((room) => {
      return room.isActive !== false;
    }).length;

    const totalPhysicalRooms = roomTypes.reduce((sum, room) => {
      return sum + Number(room.totalRooms || 0);
    }, 0);

    const reservedRooms = roomTypes.reduce((sum, room) => {
      return sum + Number(room.reservedRooms || 0);
    }, 0);

    const centralRhinoBookedToday = centralRhinoBookedTodayByRoom.reduce(
      (sum, room) => sum + Number(room.centralRhinoBookedRooms || 0),
      0,
    );

    const totalHeldRoomsToday = reservedRooms + centralRhinoBookedToday;

    const availablePhysicalRoomsToday = Math.max(
      totalPhysicalRooms - totalHeldRoomsToday,
      0,
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          summary: {
            totalBookings,
            pendingBookings,
            confirmedBookings,
            cancelledBookings,
            checkedInBookings,
            checkedOutBookings,

            /**
             * ของเดิม dashboard ใช้ตัวนี้อยู่
             */
            activeRoomTypes,

            /**
             * เพิ่มใหม่สำหรับ Gorilla
             */
            totalRoomTypes,
            totalPhysicalRooms,
            reservedRooms,
            centralRhinoBookedToday,
            totalHeldRoomsToday,
            availablePhysicalRoomsToday,

            totalUsers,
            totalRevenue: revenueResult._sum.totalPrice ?? 0,
          },

          /**
           * รายละเอียดว่าจองจาก Rhino มากระทบห้องไหนบ้างของวันนี้
           * เช่น Standard, King Single, King Double
           */
          centralRhinoBookedTodayByRoom,

          latestBookings,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเข้าสู่ระบบแอดมิน",
        },
        { status: 401 },
      );
    }

    console.error("GET_ADMIN_DASHBOARD_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถดึงข้อมูล Dashboard ได้",
        error:
          process.env.NODE_ENV === "development"
            ? getErrorMessage(error)
            : undefined,
      },
      { status: 500 },
    );
  }
}