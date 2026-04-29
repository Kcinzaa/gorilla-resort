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

    const checkIn = parseDate(searchParams.get("checkIn"));
    const checkOut = parseDate(searchParams.get("checkOut"));

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

    const roomTypes = await prisma.roomType.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const results = await Promise.all(
      roomTypes.map(async (roomType) => {
        const overlappingBookings = await prisma.booking.count({
          where: {
            roomTypeId: roomType.id,
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

        return {
          id: roomType.id,
          name: roomType.name,
          description: roomType.description,
          pricePerNight: roomType.pricePerNight,
          capacity: roomType.capacity,
          totalRooms,
          imageUrl: roomType.imageUrl,
          bookedRooms: overlappingBookings,
          availableRooms,
          isAvailable: availableRooms > 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("GET ALL ROOM AVAILABILITY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถตรวจสอบห้องว่างได้",
      },
      { status: 500 }
    );
  }
}