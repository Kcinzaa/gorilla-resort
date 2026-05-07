import { NextResponse } from "next/server";
import { syncGorillaRoomLocks } from "@/lib/roomLockSync";

type SyncLockBody = {
  gorillaRoomTypeId: number;
  lockedRooms: number;
  totalRooms: number;
  reason?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SyncLockBody;

    const gorillaRoomTypeId = Number(body.gorillaRoomTypeId);
    const lockedRooms = Number(body.lockedRooms || 0);
    const totalRooms = Number(body.totalRooms || 0);
    const reason = body.reason || "Locked from Gorilla admin";

    if (!gorillaRoomTypeId) {
      return NextResponse.json(
        { message: "Missing gorillaRoomTypeId" },
        { status: 400 }
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
        { message: syncResult.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Synced locked rooms successfully",
      ...syncResult,
    });
  } catch (error) {
    console.error("SYNC_ROOM_LOCKS_ERROR", error);

    return NextResponse.json(
      {
        message: "Failed to sync locked rooms",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
