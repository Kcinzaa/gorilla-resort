import { NextResponse } from "next/server";
import { getCentralRhinoBookedRoomCount } from "@/lib/centralAvailability";
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

const FALLBACK_GORILLA_ROOMS: RoomTypeItem[] = [
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
    createdAt: new Date(0),
    updatedAt: new Date(0),
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
    createdAt: new Date(0),
    updatedAt: new Date(0),
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
    createdAt: new Date(0),
    updatedAt: new Date(0),
  },
];

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

function isRoomCountColumnError(error: unknown) {
  return getErrorMessage(error).includes("roomCount");
}

async function getOverlappingRoomCount({
  roomTypeId,
  checkIn,
  checkOut,
}: {
  roomTypeId: number;
  checkIn: Date;
  checkOut: Date;
}) {
  const where = {
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

  try {
    const result = await prisma.booking.aggregate({
      where,
      _sum: {
        roomCount: true,
      },
    });

    return result._sum.roomCount ?? 0;
  } catch (error) {
    if (!isRoomCountColumnError(error)) throw error;
    return prisma.booking.count({ where });
  }
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
      if (!isReservedRoomsColumnError(error)) {
        console.error("LOAD_ALL_ROOM_AVAILABILITY_ROOMS_FALLBACK_USED:", error);
        roomTypes = FALLBACK_GORILLA_ROOMS;
      } else {
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
    }

    const results = await Promise.all(
      roomTypes.map(async (roomType: RoomTypeItem) => {
        let overlappingBookings = 0;
        let centralRhinoBookedRooms = 0;

        try {
          overlappingBookings = await getOverlappingRoomCount({
            roomTypeId: roomType.id,
            checkIn,
            checkOut,
          });
        } catch (error) {
          console.error("GET_ALL_AVAILABILITY_LOCAL_COUNT_ERROR:", {
            roomTypeId: roomType.id,
            roomName: roomType.name,
            error,
          });
        }

        try {
          centralRhinoBookedRooms = await getCentralRhinoBookedRoomCount({
            gorillaRoomTypeId: roomType.id,
            checkIn,
            checkOut,
          });
        } catch (error) {
          console.error("GET_ALL_AVAILABILITY_CENTRAL_COUNT_ERROR:", {
            roomTypeId: roomType.id,
            roomName: roomType.name,
            error,
          });
        }

        const totalRooms = Number(roomType.totalRooms ?? 1);
        const reservedRooms = Math.min(Number(roomType.reservedRooms || 0), totalRooms);
        const bookedRooms =
          reservedRooms + overlappingBookings + centralRhinoBookedRooms;
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
          realBookedRooms: overlappingBookings + centralRhinoBookedRooms,
          localBookedRooms: overlappingBookings,
          centralRhinoBookedRooms,
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

    const results = FALLBACK_GORILLA_ROOMS.map((roomType) => {
      const totalRooms = Number(roomType.totalRooms ?? 1);
      const reservedRooms = Math.min(
        Math.max(Number(roomType.reservedRooms || 0), 0),
        totalRooms
      );
      const bookedRooms = reservedRooms;
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
        realBookedRooms: 0,
        localBookedRooms: 0,
        centralRhinoBookedRooms: 0,
        bookedRooms,
        availableRooms,
        isAvailable: availableRooms > 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: results,
      warning: "ใช้ข้อมูลสำรองของ Gorilla เนื่องจากตรวจสอบห้องว่างไม่สำเร็จ",
      error:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });

    /*
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
    */
  }
}
