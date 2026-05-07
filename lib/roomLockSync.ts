import { getCentralSupabaseAdmin } from "@/lib/centralSupabaseAdmin";

type SyncRoomLocksParams = {
  gorillaRoomTypeId: number;
  lockedRooms: number;
  totalRooms: number;
  reason?: string;
};

export function mapGorillaRoomToRhinoSlug(gorillaRoomTypeId: number) {
  if (gorillaRoomTypeId === 1) return "resort-2-person";
  if (gorillaRoomTypeId === 5) return "gorilla-king-double";
  if (gorillaRoomTypeId === 6) return "gorilla-king-single";

  return null;
}

export async function syncGorillaRoomLocks({
  gorillaRoomTypeId,
  lockedRooms,
  totalRooms,
  reason = "Locked from Gorilla admin",
}: SyncRoomLocksParams) {
  const slug = mapGorillaRoomToRhinoSlug(gorillaRoomTypeId);

  if (!slug) {
    return {
      synced: false,
      skipped: true,
      message: "Room mapping not found",
    };
  }

  if (lockedRooms < 0) {
    throw new Error("Invalid locked room count");
  }

  if (totalRooms > 0 && lockedRooms > totalRooms) {
    throw new Error("Locked room count is greater than total room count");
  }

  const supabaseAdmin = getCentralSupabaseAdmin();

  if (!supabaseAdmin) {
    return {
      synced: false,
      skipped: true,
      message: "Missing CENTRAL_SUPABASE_URL or CENTRAL_SUPABASE_SERVICE_ROLE_KEY",
    };
  }

  const { data: roomType, error: roomTypeError } = await supabaseAdmin
    .from("room_types")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (roomTypeError || !roomType) {
    throw new Error(roomTypeError?.message || "Supabase room type not found");
  }

  const updatedAt = new Date().toISOString();

  const { error: resetError } = await supabaseAdmin
    .from("room_units")
    .update({
      status: "AVAILABLE",
      locked_by: null,
      locked_reason: null,
      locked_at: null,
      updated_at: updatedAt,
    })
    .eq("room_type_id", roomType.id)
    .eq("status", "LOCKED")
    .eq("locked_by", "GORILLA_ADMIN");

  if (resetError) {
    throw new Error(resetError.message);
  }

  if (lockedRooms === 0) {
    return {
      synced: true,
      skipped: false,
      roomType,
      lockedCount: 0,
      lockedUnits: [],
    };
  }

  const { data: availableUnits, error: availableError } = await supabaseAdmin
    .from("room_units")
    .select("id, name")
    .eq("room_type_id", roomType.id)
    .eq("status", "AVAILABLE")
    .order("name", { ascending: true })
    .limit(lockedRooms);

  if (availableError) {
    throw new Error(availableError.message);
  }

  const unitIds = (availableUnits || []).map((unit) => unit.id);

  if (unitIds.length < lockedRooms) {
    throw new Error(
      `Not enough available rooms. Need ${lockedRooms}, found ${unitIds.length}`
    );
  }

  const { error: lockError } = await supabaseAdmin
    .from("room_units")
    .update({
      status: "LOCKED",
      locked_by: "GORILLA_ADMIN",
      locked_reason: reason,
      locked_at: updatedAt,
      updated_at: updatedAt,
    })
    .in("id", unitIds);

  if (lockError) {
    throw new Error(lockError.message);
  }

  return {
    synced: true,
    skipped: false,
    roomType,
    lockedCount: unitIds.length,
    lockedUnits: availableUnits || [],
  };
}
