import { createClient } from "@supabase/supabase-js";

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
  cart_data?: {
    checkIn?: string;
    checkOut?: string;
    items?: CentralBookingCartItem[];
  } | null;
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

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

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
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("CENTRAL_SUPABASE_ENV_MISSING", {
        hasUrl: Boolean(supabaseUrl),
        hasServiceKey: Boolean(supabaseServiceKey),
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
      const bookingCheckIn = booking.check_in || booking.cart_data?.checkIn;
      const bookingCheckOut = booking.check_out || booking.cart_data?.checkOut;

      if (!isBookingStillHoldingRoom(booking)) return;

      if (!overlaps(bookingCheckIn, bookingCheckOut, checkInText, checkOutText)) {
        return;
      }

      booking.cart_data?.items?.forEach((item) => {
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