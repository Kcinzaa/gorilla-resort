import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { lineUserId, displayName, pictureUrl, phone } = body;

    if (!lineUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบ lineUserId",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.upsert({
      where: {
        lineUserId,
      },
      update: {
        displayName,
        pictureUrl,
        phone,
      },
      create: {
        lineUserId,
        displayName,
        pictureUrl,
        phone,
      },
    });

    return NextResponse.json({
      success: true,
      message: "บันทึกข้อมูลผู้ใช้สำเร็จ",
      data: user,
    });
  } catch (error) {
    console.error("SAVE_LIFF_USER_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถบันทึกข้อมูลผู้ใช้ได้",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const lineUserId = searchParams.get("lineUserId");

    if (!lineUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาระบุ lineUserId",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        lineUserId,
      },
      include: {
        bookings: {
          include: {
            roomType: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบข้อมูลผู้ใช้",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("GET_LIFF_USER_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถดึงข้อมูลผู้ใช้ได้",
      },
      { status: 500 }
    );
  }
}