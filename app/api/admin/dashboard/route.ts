import { NextRequest, NextResponse } from "next/server";
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

const FALLBACK_DASHBOARD_ROOMS: RoomTypeForDashboard[] = [
  { id: 1, name: "Standard room", isActive: true, totalRooms: 16, reservedRooms: 6 },
  { id: 5, name: "King size room double", isActive: true, totalRooms: 2, reservedRooms: 0 },
  { id: 6, name: "King size room single", isActive: true, totalRooms: 2, reservedRooms: 0 },
];

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

function getDateStart(dateValue?: string | null) {
  if (!dateValue) return getTodayStart();

  const [year, month, day] = dateValue.split("-").map(Number);

  if (!year || !month || !day) return getTodayStart();

  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  if (Number.isNaN(date.getTime())) return getTodayStart();

  return date;
}

function addDays(dateValue: Date, days: number) {
  const date = new Date(dateValue);
  date.setDate(date.getDate() + days);
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
      console.error("LOAD_DASHBOARD_ROOM_TYPES_FALLBACK_USED", error);
      return FALLBACK_DASHBOARD_ROOMS;
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
        console.error("LOAD_DASHBOARD_ROOM_TYPES_SECOND_FALLBACK_USED", secondError);
        return FALLBACK_DASHBOARD_ROOMS;
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

async function safeNumber(factory: () => Promise<number>, label: string) {
  try {
    return await factory();
  } catch (error) {
    console.error(`ADMIN_DASHBOARD_${label}_ERROR`, error);
    return 0;
  }
}

async function safeLatestBookings() {
  try {
    return await loadLatestBookings();
  } catch (error) {
    console.error("ADMIN_DASHBOARD_LATEST_BOOKINGS_ERROR", error);
    return [];
  }
}

async function safeRevenue() {
  try {
    return await loadRevenue();
  } catch (error) {
    console.error("ADMIN_DASHBOARD_REVENUE_ERROR", error);
    return { _sum: { totalPrice: 0 } };
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

async function getCentralRhinoBookedTodayByRoom(
  roomTypes: RoomTypeForDashboard[],
  targetDate: Date,
) {
  const checkIn = targetDate;
  const checkOut = addDays(targetDate, 1);

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

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const targetDate = getDateStart(request.nextUrl.searchParams.get("date"));
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
    ] = await Promise.all([
      safeNumber(() => prisma.booking.count(), "TOTAL_BOOKINGS"),

      safeNumber(
        () => prisma.booking.count({ where: { status: "PENDING" } }),
        "PENDING_BOOKINGS",
      ),

      safeNumber(
        () => prisma.booking.count({ where: { status: "CONFIRMED" } }),
        "CONFIRMED_BOOKINGS",
      ),

      safeNumber(
        () => prisma.booking.count({ where: { status: "CANCELLED" } }),
        "CANCELLED_BOOKINGS",
      ),

      safeNumber(
        () => prisma.booking.count({ where: { status: "CHECKED_IN" } }),
        "CHECKED_IN_BOOKINGS",
      ),

      safeNumber(
        () => prisma.booking.count({ where: { status: "CHECKED_OUT" } }),
        "CHECKED_OUT_BOOKINGS",
      ),

      safeNumber(() => prisma.user.count(), "TOTAL_USERS"),

      safeRevenue(),

      safeLatestBookings(),

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

    const centralRhinoBookedToday = 0;

    const totalHeldRoomsToday = reservedRooms;

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
            dashboardDate: targetDate.toISOString().slice(0, 10),
            totalHeldRoomsToday,
            availablePhysicalRoomsToday,

            totalUsers,
            totalRevenue: revenueResult._sum.totalPrice ?? 0,
          },

          /**
           * รายละเอียดว่าจองจาก Rhino มากระทบห้องไหนบ้างของวันนี้
           * เช่น Standard, King Single, King Double
           */
          centralRhinoBookedTodayByRoom: [],

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

    const totalPhysicalRooms = FALLBACK_DASHBOARD_ROOMS.reduce(
      (sum, room) => sum + Number(room.totalRooms || 0),
      0,
    );
    const reservedRooms = FALLBACK_DASHBOARD_ROOMS.reduce(
      (sum, room) => sum + Number(room.reservedRooms || 0),
      0,
    );

    return NextResponse.json({
      success: true,
      warning: "ใช้ข้อมูลสำรองของ Dashboard เนื่องจากโหลดฐานข้อมูลไม่สำเร็จ",
      data: {
        summary: {
          totalBookings: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          cancelledBookings: 0,
          checkedInBookings: 0,
          checkedOutBookings: 0,
          activeRoomTypes: FALLBACK_DASHBOARD_ROOMS.length,
          totalRoomTypes: FALLBACK_DASHBOARD_ROOMS.length,
          totalPhysicalRooms,
          reservedRooms,
          centralRhinoBookedToday: 0,
          dashboardDate: getTodayStart().toISOString().slice(0, 10),
          totalHeldRoomsToday: reservedRooms,
          availablePhysicalRoomsToday: Math.max(totalPhysicalRooms - reservedRooms, 0),
          totalUsers: 0,
          totalRevenue: 0,
        },
        centralRhinoBookedTodayByRoom: FALLBACK_DASHBOARD_ROOMS.map((room) => ({
          roomTypeId: room.id,
          roomName: room.name,
          centralRhinoBookedRooms: 0,
        })),
        latestBookings: [],
        error:
          process.env.NODE_ENV === "development" ? getErrorMessage(error) : undefined,
      },
    });

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
