import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isReservedRoomsColumnError(error: unknown) {
  return getErrorMessage(error).includes("reservedRooms");
}

export async function GET() {
  try {
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

    let rooms;
    try {
      rooms = await loadRooms(true);
    } catch (error) {
      if (!isReservedRoomsColumnError(error)) throw error;
      rooms = (await loadRooms(false)).map((room) => ({
        ...room,
        reservedRooms: 0,
      }));
    }

    return NextResponse.json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    console.error("GET PUBLIC ROOMS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถโหลดรายการห้องพักได้",
        error:
          process.env.NODE_ENV === "development"
            ? getErrorMessage(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
