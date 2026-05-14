import { getCentralSupabaseAdmin } from "@/lib/centralSupabaseAdmin";

type CentralBookingCartItem = {
  roomTypeId?: string;
  room_type_id?: string;
  roomSlug?: string;
  room_slug?: string;
  slug?: string;
  quantity?: number;
};

type CentralBookingRow = {
  id: string;
  check_in?: string | null;
  check_out?: string | null;
  booking_status?: string | null;
  payment_status?: string | null;
  status?: string | null;
  cart_data?: unknown;
};

type CentralRoomTypeRow = {
  id: string;
  name?: string | null;
  slug?: string | null;
};

type GetCentralRhinoBookedRoomCountParams = {
  gorillaRoomTypeId: number;
  checkIn: Date;
  checkOut: Date;
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function overlaps(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
  rangeStart: string,
  rangeEnd: string,
) {
  if (!checkIn || !checkOut) return false;
  return checkIn < rangeEnd && checkOut > rangeStart;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value) return {};

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function normalizeCentralCartData(value: unknown) {
  const cart = asRecord(value);
  const rawItems = Array.isArray(cart.items) ? cart.items : [];

  return {
    checkIn: typeof cart.checkIn === "string" ? cart.checkIn : "",
    checkOut: typeof cart.checkOut === "string" ? cart.checkOut : "",
    items: rawItems
      .filter((item) => item && typeof item === "object")
      .map((item) => item as CentralBookingCartItem),
  };
}

function mapGorillaRoomTypeIdToRhinoSlugs(gorillaRoomTypeId: number) {
  if (gorillaRoomTypeId === 1) {
    return ["resort-2-person"];
  }

  if (gorillaRoomTypeId === 5) {
    return ["gorilla-king-double"];
  }

  if (gorillaRoomTypeId === 6) {
    return ["gorilla-king-single"];
  }

  return [];
}

function isBookingStillHoldingRoom(booking: CentralBookingRow) {
  const bookingStatus = String(
    booking.booking_status || booking.status || "",
  ).toUpperCase();

  const paymentStatus = String(booking.payment_status || "").toUpperCase();

  if (
    bookingStatus === "CANCELLED" ||
    bookingStatus === "CANCELED" ||
    bookingStatus === "EXPIRED"
  ) {
    return false;
  }

  if (
    paymentStatus === "CANCELLED" ||
    paymentStatus === "CANCELED" ||
    paymentStatus === "EXPIRED"
  ) {
    return false;
  }

  return true;
}

function getItemSlug(
  item: CentralBookingCartItem,
  roomSlugById: Map<string, string>,
) {
  const directSlug = item.roomSlug || item.room_slug || item.slug;

  if (directSlug) {
    return String(directSlug).trim().toLowerCase();
  }

  const roomTypeId = item.roomTypeId || item.room_type_id;

  if (!roomTypeId) return "";

  return roomSlugById.get(roomTypeId) || "";
}

async function getRoomSlugByIdMap() {
  const supabaseAdmin = getCentralSupabaseAdmin();

  if (!supabaseAdmin) {
    console.error("CENTRAL_SUPABASE_ENV_MISSING_FOR_ROOM_TYPES");
    return new Map<string, string>();
  }

  const { data, error } = await supabaseAdmin
    .from("room_types")
    .select("id, name, slug");

  if (error) {
    console.error("CENTRAL_GET_ROOM_TYPES_ERROR", error);
    return new Map<string, string>();
  }

  return new Map(
    ((data || []) as CentralRoomTypeRow[]).map((room) => [
      room.id,
      String(room.slug || "").toLowerCase(),
    ]),
  );
}

export async function getCentralRhinoBookedRoomCount({
  gorillaRoomTypeId,
  checkIn,
  checkOut,
}: GetCentralRhinoBookedRoomCountParams) {
  try {
    const supabaseAdmin = getCentralSupabaseAdmin();

    if (!supabaseAdmin) {
      console.error("CENTRAL_SUPABASE_ENV_MISSING", {
        hint:
          "Set CENTRAL_SUPABASE_URL and CENTRAL_SUPABASE_SERVICE_ROLE_KEY in .env so gorilla can read rhino's bookings.",
      });

      return 0;
    }

    const targetSlugs = mapGorillaRoomTypeIdToRhinoSlugs(gorillaRoomTypeId);

    if (targetSlugs.length === 0) {
      return 0;
    }

    const checkInText = toDateInputValue(checkIn);
    const checkOutText = toDateInputValue(checkOut);

    const roomSlugById = await getRoomSlugByIdMap();

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select(
        "id, check_in, check_out, booking_status, payment_status, status, cart_data",
      )
      .lt("check_in", checkOutText)
      .gt("check_out", checkInText);

    if (error) {
      console.error("CENTRAL_GET_RHINO_BOOKINGS_ERROR", error);
      return 0;
    }

    let total = 0;

    ((data || []) as CentralBookingRow[]).forEach((booking) => {
      const cartData = normalizeCentralCartData(booking.cart_data);
      const bookingCheckIn = booking.check_in || cartData.checkIn;
      const bookingCheckOut = booking.check_out || cartData.checkOut;

      // Gorilla already counts its own local Booking rows. Central rows synced
      // from Gorilla are kept for Rhino, but must not be counted again here.
      if (String(asRecord(booking.cart_data).source || "").toLowerCase() === "gorilla") {
        return;
      }

      if (!isBookingStillHoldingRoom(booking)) return;

      if (!overlaps(bookingCheckIn, bookingCheckOut, checkInText, checkOutText)) {
        return;
      }

      cartData.items.forEach((item) => {
        const slug = getItemSlug(item, roomSlugById);

        if (!targetSlugs.includes(slug)) return;

        total += Math.max(Number(item.quantity || 1), 1);
      });
    });

    return total;
  } catch (error) {
    console.error("GET_CENTRAL_RHINO_BOOKED_ROOM_COUNT_ERROR", error);
    return 0;
  }
}
