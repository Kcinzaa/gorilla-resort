import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import {
  mapGorillaRoomToRhinoSlug,
  syncGorillaRoomLocks,
} from "@/lib/roomLockSync";
import { getCentralRhinoBookedRoomCount } from "@/lib/centralAvailability";

const FALLBACK_GORILLA_ROOMS = [
  {
    id: 1,
    name: "Standard room",
    description: "ห้องรีสอร์ท 2 ท่าน",
    pricePerNight: 700,
    capacity: 2,
    totalRooms: 16,
    reservedRooms: 6,
    imageUrl: "/images/S__37019660_0.jpg",
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
    imageUrl: "/images/AA6292A7-4B4B-452D-8C8A-B20791839228.jpg",
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
    imageUrl: "/images/DB5B7FFF-8EE4-448E-B5B8-7CED9A9E3E70.jpg",
    isActive: true,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  },
];

function cleanString(value: unknown) {
  return String(value || "").trim();
}

function cleanNumber(value: unknown) {
  return Number(value);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isReservedRoomsColumnError(error: unknown) {
  return getErrorMessage(error).includes("reservedRooms");
}

async function syncRoomLocksAfterSave({
  roomId,
  reservedRooms,
  totalRooms,
}: {
  roomId: number;
  reservedRooms: number;
  totalRooms: number;
}) {
  if (!mapGorillaRoomToRhinoSlug(roomId)) return null;

  return syncGorillaRoomLocks({
    gorillaRoomTypeId: roomId,
    lockedRooms: reservedRooms,
    totalRooms,
  });
}

function parseAdminDate(value: string | null) {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00.000`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: Request) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json(
        { success: false, message: "ไม่มีสิทธิ์ใช้งานส่วนนี้" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const checkIn = parseAdminDate(searchParams.get("checkIn"));
    const checkOut = parseAdminDate(searchParams.get("checkOut"));
    const withAvailability = Boolean(checkIn && checkOut && checkOut > checkIn);

    let rooms;
    try {
      rooms = await prisma.roomType.findMany({ orderBy: { createdAt: "desc" } });
    } catch (error) {
      if (isReservedRoomsColumnError(error)) {
        rooms = (await prisma.roomType.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true, name: true, description: true, pricePerNight: true,
            capacity: true, totalRooms: true, imageUrl: true,
            isActive: true, createdAt: true, updatedAt: true,
          },
        })).map((room) => ({ ...room, reservedRooms: 0 }));
      } else {
        console.error("GET_ADMIN_ROOMS_FALLBACK_USED:", error);
        rooms = FALLBACK_GORILLA_ROOMS;
      }
    }

    if (!withAvailability) {
      return NextResponse.json({ success: true, data: rooms });
    }

    // With dates: compute live availability per room
    type BookingCount = { roomTypeId: number; _sum: { roomCount: number | null } };
    let localBookedByRoom: Record<number, number> = {};
    try {
      const results = await prisma.booking.groupBy({
        by: ["roomTypeId"],
        where: {
          status: { in: ["PENDING", "CONFIRMED", "WAITING_PAYMENT", "WAITING_VERIFY", "CHECKED_IN"] },
          checkIn: { lt: checkOut! },
          checkOut: { gt: checkIn! },
        },
        _sum: { roomCount: true },
      });
      localBookedByRoom = (results as BookingCount[]).reduce<Record<number, number>>((acc, row) => {
        acc[row.roomTypeId] = Number(row._sum.roomCount ?? 1);
        return acc;
      }, {});
    } catch {
      // fallback: count bookings without roomCount aggregation
      try {
        const rows = await prisma.booking.findMany({
          where: {
            status: { in: ["PENDING", "CONFIRMED", "WAITING_PAYMENT", "WAITING_VERIFY", "CHECKED_IN"] },
            checkIn: { lt: checkOut! },
            checkOut: { gt: checkIn! },
          },
          select: { roomTypeId: true },
        });
        for (const row of rows) {
          localBookedByRoom[row.roomTypeId] = (localBookedByRoom[row.roomTypeId] || 0) + 1;
        }
      } catch { /* ignore */ }
    }

    const data = await Promise.all(
      rooms.map(async (room) => {
        const totalRooms = Number(room.totalRooms ?? 0);
        const reservedRooms = Math.min(Math.max(Number((room as { reservedRooms?: number }).reservedRooms || 0), 0), totalRooms);
        const localBooked = localBookedByRoom[room.id] || 0;

        let centralRhinoBooked = 0;
        try {
          centralRhinoBooked = await getCentralRhinoBookedRoomCount({
            gorillaRoomTypeId: room.id,
            checkIn: checkIn!,
            checkOut: checkOut!,
          });
        } catch { /* ignore */ }

        const bookedRooms = reservedRooms + localBooked + centralRhinoBooked;
        const availableRooms = Math.max(totalRooms - bookedRooms, 0);

        return {
          ...room,
          totalRooms,
          reservedRooms,
          localBookedRooms: localBooked,
          centralRhinoBookedRooms: centralRhinoBooked,
          bookedRooms,
          availableRooms,
          isAvailable: availableRooms > 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data,
      checkIn: searchParams.get("checkIn"),
      checkOut: searchParams.get("checkOut"),
    });
  } catch (error) {
    console.error("GET ADMIN ROOMS ERROR:", error);
    return NextResponse.json({
      success: true,
      data: FALLBACK_GORILLA_ROOMS,
      warning: "ใช้ข้อมูลสำรองของ Gorilla เนื่องจากโหลดรายการห้องพักไม่สำเร็จ",
    });
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่มีสิทธิ์ใช้งานส่วนนี้",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const name = cleanString(body.name);
    const description = cleanString(body.description);
    const pricePerNight = cleanNumber(body.pricePerNight);
    const capacity = cleanNumber(body.capacity);
    const totalRooms = cleanNumber(body.totalRooms || 1);
    const reservedRooms = Math.max(cleanNumber(body.reservedRooms || 0), 0);
    const imageUrl = cleanString(body.imageUrl);
    const isActive = body.isActive !== false;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณากรอกชื่อห้องพัก",
        },
        { status: 400 }
      );
    }

    if (!pricePerNight || pricePerNight <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ราคาต่อคืนไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    if (!capacity || capacity <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "จำนวนผู้เข้าพักไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    if (!totalRooms || totalRooms <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "จำนวนห้องไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    if (reservedRooms > totalRooms) {
      return NextResponse.json(
        {
          success: false,
          message: "จำนวนห้องที่ล็อกไว้ต้องไม่มากกว่าจำนวนห้องทั้งหมด",
        },
        { status: 400 }
      );
    }

    const room = await prisma.roomType.create({
      data: {
        name,
        description,
        pricePerNight,
        capacity,
        totalRooms,
        reservedRooms,
        imageUrl,
        isActive,
      },
    });
    const syncResult = await syncRoomLocksAfterSave({
      roomId: room.id,
      reservedRooms,
      totalRooms,
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่มห้องพักสำเร็จ",
      data: room,
      syncRoomLocks: syncResult,
    });
  } catch (error) {
    console.error("POST ADMIN ROOMS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถเพิ่มห้องพักได้",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่มีสิทธิ์ใช้งานส่วนนี้",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = Number(body.id);
    const name = cleanString(body.name);
    const description = cleanString(body.description);
    const pricePerNight = cleanNumber(body.pricePerNight);
    const capacity = cleanNumber(body.capacity);
    const totalRooms = cleanNumber(body.totalRooms || 1);
    const reservedRooms = Math.max(cleanNumber(body.reservedRooms || 0), 0);
    const imageUrl = cleanString(body.imageUrl);
    const isActive = body.isActive !== false;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบรหัสห้องพัก",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณากรอกชื่อห้องพัก",
        },
        { status: 400 }
      );
    }

    if (!pricePerNight || pricePerNight <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ราคาต่อคืนไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    if (!capacity || capacity <= 0) {
      return NextResponse.json(
        { success: false, message: "จำนวนผู้เข้าพักไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (!totalRooms || totalRooms <= 0) {
      return NextResponse.json(
        { success: false, message: "จำนวนห้องไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (reservedRooms > totalRooms) {
      return NextResponse.json(
        { success: false, message: "จำนวนห้องที่ล็อกไว้ต้องไม่มากกว่าจำนวนห้องทั้งหมด" },
        { status: 400 }
      );
    }

    const room = await prisma.roomType.update({
      where: { id },
      data: {
        name,
        description,
        pricePerNight,
        capacity,
        totalRooms,
        reservedRooms,
        imageUrl,
        isActive,
      },
    });
    const syncResult = await syncRoomLocksAfterSave({
      roomId: room.id,
      reservedRooms,
      totalRooms,
    });

    return NextResponse.json({
      success: true,
      message: "อัปเดตห้องพักสำเร็จ",
      data: room,
      syncRoomLocks: syncResult,
    });
  } catch (error) {
    console.error("PATCH ADMIN ROOMS ERROR:", error);

    return NextResponse.json(
      { success: false, message: "ไม่สามารถอัปเดตห้องพักได้" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json(
        { success: false, message: "ไม่มีสิทธิ์ใช้งานส่วนนี้" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ไม่พบรหัสห้องพัก" },
        { status: 400 }
      );
    }

    await prisma.roomType.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "ลบห้องพักสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE ADMIN ROOMS ERROR:", error);

    return NextResponse.json(
      { success: false, message: "ไม่สามารถลบห้องพักได้ หากห้องนี้มีรายการจองอยู่ แนะนำให้ปิดใช้งานแทน" },
      { status: 500 }
    );
  }
}
