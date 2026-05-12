import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { syncGorillaRoomLocks } from "@/lib/roomLockSync";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SyncLockBody = {
  gorillaRoomTypeId: number;
  lockedRooms: number;
  totalRooms: number;
  reason?: string;
};

function toSafeNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return fallback;
  }

  return numberValue;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = (await request.json()) as Partial<SyncLockBody>;

    const gorillaRoomTypeId = toSafeNumber(body.gorillaRoomTypeId);
    const totalRooms = Math.max(toSafeNumber(body.totalRooms), 0);
    const lockedRooms = Math.min(
      Math.max(toSafeNumber(body.lockedRooms), 0),
      totalRooms,
    );

    const reason = String(body.reason || "Locked from Gorilla admin").trim();

    if (!gorillaRoomTypeId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing gorillaRoomTypeId",
        },
        { status: 400 },
      );
    }

    if (totalRooms <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "totalRooms ต้องมากกว่า 0",
        },
        { status: 400 },
      );
    }

    const syncResult = await syncGorillaRoomLocks({
      gorillaRoomTypeId,
      lockedRooms,
      totalRooms,
      reason,
    });

    if (syncResult.skipped) {
      return NextResponse.json(
        {
          success: false,
          message: syncResult.message || "Skipped sync locked rooms",
          ...syncResult,
        },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          },
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Synced locked rooms successfully",
        ...syncResult,
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

    console.error("SYNC_ROOM_LOCKS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to sync locked rooms",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}