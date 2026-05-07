import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import {
  mapGorillaRoomToRhinoSlug,
  syncGorillaRoomLocks,
} from "@/lib/roomLockSync";

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

export async function GET(request: Request) {
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

    let rooms;
    try {
      rooms = await prisma.roomType.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error) {
      if (!isReservedRoomsColumnError(error)) throw error;
      rooms = (await prisma.roomType.findMany({
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

    return NextResponse.json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    console.error("GET ADMIN ROOMS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถโหลดรายการห้องพักได้",
      },
      { status: 500 }
    );
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

    const room = await prisma.roomType.update({
      where: {
        id,
      },
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
      {
        success: false,
        message: "ไม่สามารถอัปเดตห้องพักได้",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบรหัสห้องพัก",
        },
        { status: 400 }
      );
    }

    await prisma.roomType.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "ลบห้องพักสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE ADMIN ROOMS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "ไม่สามารถลบห้องพักได้ หากห้องนี้มีรายการจองอยู่ แนะนำให้ปิดใช้งานแทน",
      },
      { status: 500 }
    );
  }
}
