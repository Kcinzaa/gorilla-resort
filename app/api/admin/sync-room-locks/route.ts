import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type SyncLockBody = {
  gorillaRoomTypeId: number;
  lockedRooms: number;
  totalRooms: number;
  reason?: string;
};

function mapGorillaRoomToRhinoSlug(gorillaRoomTypeId: number) {
  if (gorillaRoomTypeId === 1) return "resort-2-person";
  if (gorillaRoomTypeId === 5) return "gorilla-king-double";
  if (gorillaRoomTypeId === 6) return "gorilla-king-single";

  return null;
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const body = (await request.json()) as SyncLockBody;

    const gorillaRoomTypeId = Number(body.gorillaRoomTypeId);
    const lockedRooms = Number(body.lockedRooms || 0);
    const totalRooms = Number(body.totalRooms || 0);
    const reason = body.reason || "ล็อกจากแอดมิน Gorilla";


    if (!gorillaRoomTypeId) {
      return NextResponse.json(
        { message: "Missing gorillaRoomTypeId" },
        { status: 400 }
      );
    }

    if (lockedRooms < 0) {
      return NextResponse.json(
        { message: "จำนวนห้องที่ล็อกไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (totalRooms > 0 && lockedRooms > totalRooms) {
      return NextResponse.json(
        { message: "จำนวนห้องที่ล็อกมากกว่าจำนวนห้องทั้งหมด" },
        { status: 400 }
      );
    }

    const slug = mapGorillaRoomToRhinoSlug(gorillaRoomTypeId);

    if (!slug) {
      return NextResponse.json(
        { message: "ไม่พบ mapping ห้องระหว่าง Gorilla กับ Rhino" },
        { status: 404 }
      );
    }

    const { data: roomType, error: roomTypeError } = await supabaseAdmin
      .from("room_types")
      .select("id, name, slug")
      .eq("slug", slug)
      .single();

    if (roomTypeError || !roomType) {
      return NextResponse.json(
        {
          message: "ไม่พบประเภทห้องในฐานกลาง",
          error: roomTypeError?.message,
        },
        { status: 404 }
      );
    }

    const { error: resetError } = await supabaseAdmin
      .from("room_units")
      .update({
        status: "AVAILABLE",
        locked_by: null,
        locked_reason: null,
        locked_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("room_type_id", roomType.id)
      .eq("status", "LOCKED")
      .eq("locked_by", "GORILLA_ADMIN");

    if (resetError) {
      return NextResponse.json(
        {
          message: "รีเซ็ตห้องที่ล็อกเดิมไม่สำเร็จ",
          error: resetError.message,
        },
        { status: 500 }
      );
    }

    if (lockedRooms === 0) {
      return NextResponse.json({
        message: "ปลดล็อกห้องทั้งหมดแล้ว",
        roomType,
        lockedCount: 0,
      });
    }

    const { data: availableUnits, error: availableError } = await supabaseAdmin
      .from("room_units")
      .select("id, name")
      .eq("room_type_id", roomType.id)
      .eq("status", "AVAILABLE")
      .order("name", { ascending: true })
      .limit(lockedRooms);

    if (availableError) {
      return NextResponse.json(
        {
          message: "โหลดห้องว่างไม่สำเร็จ",
          error: availableError.message,
        },
        { status: 500 }
      );
    }

    const unitIds = (availableUnits || []).map((unit) => unit.id);

    if (unitIds.length < lockedRooms) {
      return NextResponse.json(
        {
          message: `ห้องว่างไม่พอ ต้องการล็อก ${lockedRooms} ห้อง แต่มีว่าง ${unitIds.length} ห้อง`,
        },
        { status: 400 }
      );
    }

    const { error: lockError } = await supabaseAdmin
      .from("room_units")
      .update({
        status: "LOCKED",
        locked_by: "GORILLA_ADMIN",
        locked_reason: reason,
        locked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in("id", unitIds);

    if (lockError) {
      return NextResponse.json(
        {
          message: "ล็อกห้องไม่สำเร็จ",
          error: lockError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "ซิงก์ห้องที่ล็อกสำเร็จ",
      roomType,
      lockedCount: unitIds.length,
      lockedUnits: availableUnits,
    });
  } catch (error) {
    console.error("SYNC_ROOM_LOCKS_ERROR", error);

    return NextResponse.json(
      {
        message: "ซิงก์ห้องที่ล็อกไม่สำเร็จ",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}