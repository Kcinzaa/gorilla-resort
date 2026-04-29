import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function GET() {
  try {
    const rooms = await prisma.roomType.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

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