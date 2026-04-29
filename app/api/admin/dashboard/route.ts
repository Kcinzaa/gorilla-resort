import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      checkedInBookings,
      checkedOutBookings,
      activeRoomTypes,
      totalUsers,
      revenueResult,
      latestBookings,
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
      prisma.roomType.count({
        where: { isActive: true },
      }),
      prisma.user.count(),
      prisma.booking.aggregate({
        where: {
          status: {
            in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"],
          },
        },
        _sum: {
          totalPrice: true,
        },
      }),
      prisma.booking.findMany({
        take: 5,
        include: {
          user: true,
          roomType: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalBookings,
          pendingBookings,
          confirmedBookings,
          cancelledBookings,
          checkedInBookings,
          checkedOutBookings,
          activeRoomTypes,
          totalUsers,
          totalRevenue: revenueResult._sum.totalPrice ?? 0,
        },
        latestBookings,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเข้าสู่ระบบแอดมิน",
        },
        { status: 401 }
      );
    }

    console.error("GET_ADMIN_DASHBOARD_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถดึงข้อมูล Dashboard ได้",
      },
      { status: 500 }
    );
  }
}