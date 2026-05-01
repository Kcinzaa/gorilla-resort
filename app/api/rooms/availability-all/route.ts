import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RoomTypeItem = {
  id: number;
  name: string;
  description: string | null;
  pricePerNight: number;
  capacity: number;
  totalRooms: number | null;
  reservedRooms: number | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function parseDate(value: string | null) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00.000`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isReservedRoomsColumnError(error: unknown) {
  return getErrorMessage(error).includes("reservedRooms");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const checkInParam = searchParams.get("checkIn");
    const checkOutParam = searchParams.get("checkOut");

    const checkIn = parseDate(checkInParam);
    const checkOut = parseDate(checkOutParam);

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

    let roomTypes: RoomTypeItem[];
    try {
      roomTypes = await prisma.roomType.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error) {
      if (!isReservedRoomsColumnError(error)) throw error;
      roomTypes = (await prisma.roomType.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          description: true,
          pricePerNight: true,
          capacity: true,
          totalRooms: true,
          imageUrl: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      })).map((room) => ({ ...room, reservedRooms: 0 }));
    }

    const results = await Promise.all(
      roomTypes.map(async (roomType: RoomTypeItem) => {
        const overlappingBookings = await prisma.booking.count({
          where: {
            roomTypeId: roomType.id,

            // สำคัญ:
            // PENDING = ลูกค้าส่งสลิปและจองแล้ว ต้องกันห้องไว้ก่อน
            // CONFIRMED = แอดมินยืนยันแล้ว ยังกันห้อง
            // CANCELLED = ไม่หักห้อง
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
        const bookedRooms = reservedRooms + overlappingBookings;
        const availableRooms = Math.max(totalRooms - bookedRooms, 0);

        return {
          id: roomType.id,
          name: roomType.name,
          description: roomType.description,
          pricePerNight: roomType.pricePerNight,
          capacity: roomType.capacity,
          totalRooms,
          reservedRooms,
          imageUrl: roomType.imageUrl,
          realBookedRooms: overlappingBookings,
          bookedRooms,
          availableRooms,
          isAvailable: availableRooms > 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: results,
      summary: {
        checkIn: checkInParam,
        checkOut: checkOutParam,
        totalRoomTypes: results.length,
        totalAvailableRoomTypes: results.filter((room) => room.isAvailable)
          .length,
      },
    });
  } catch (error) {
    console.error("GET ALL ROOM AVAILABILITY ERROR:", error);

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
