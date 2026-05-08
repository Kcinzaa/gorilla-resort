import { getCentralSupabaseAdmin } from "@/lib/centralSupabaseAdmin";
import { mapGorillaRoomToRhinoSlug } from "@/lib/roomLockSync";

type CentralBookingItem = {
  roomTypeId?: string;
  room_type_id?: string;
  roomSlug?: string;
  room_slug?: string;
  slug?: string;
  quantity?: number;
};

type CentralBookingRow = {
  check_in?: string | null;
  check_out?: string | null;
  booking_status?: string | null;
  payment_status?: string | null;
  cart_data?: {
    source?: string;
    checkIn?: string;
    checkOut?: string;
    items?: CentralBookingItem[];
  } | null;
};

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isActiveCentralBooking(booking: CentralBookingRow) {
  const bookingStatus = String(booking.booking_status || "").toUpperCase();
  const paymentStatus = String(booking.payment_status || "").toUpperCase();

  return (
    bookingStatus !== "CANCELLED" &&
    bookingStatus !== "REJECTED" &&
    paymentStatus !== "CANCELLED" &&
    paymentStatus !== "REJECTED" &&
    paymentStatus !== "EXPIRED"
  );
}

function overlaps(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
  rangeStart: string,
  rangeEnd: string
) {
  if (!checkIn || !checkOut) return false;
  return checkIn < rangeEnd && checkOut > rangeStart;
}

function getItemRoomSlug(item: CentralBookingItem) {
  return String(item.roomSlug || item.room_slug || item.slug || "")
    .trim()
    .toLowerCase();
}

function getItemRoomTypeId(item: CentralBookingItem) {
  return String(item.roomTypeId || item.room_type_id || "").trim();
}

export async function getCentralRhinoBookedRoomCount({
  gorillaRoomTypeId,
  checkIn,
  checkOut,
}: {
  gorillaRoomTypeId: number;
  checkIn: Date;
  checkOut: Date;
}) {
  const central = getCentralSupabaseAdmin();
  const roomSlug = mapGorillaRoomToRhinoSlug(gorillaRoomTypeId);

  if (!central || !roomSlug) return 0;

  const checkInText = toDateOnly(checkIn);
  const checkOutText = toDateOnly(checkOut);

  const { data: roomType, error: roomTypeError } = await central
    .from("room_types")
    .select("id, slug")
    .eq("slug", roomSlug)
    .maybeSingle();

  if (roomTypeError) {
    console.error("LOAD_CENTRAL_ROOM_FOR_AVAILABILITY_ERROR", roomTypeError);
    return 0;
  }

  const centralRoomId = String(roomType?.id || "");

  const { data, error } = await central
    .from("bookings")
    .select("check_in, check_out, booking_status, payment_status, cart_data")
    .lt("check_in", checkOutText)
    .gt("check_out", checkInText);

  if (error) {
    console.error("LOAD_CENTRAL_BOOKINGS_FOR_AVAILABILITY_ERROR", error);
    return 0;
  }

  return ((data || []) as CentralBookingRow[]).reduce((sum, booking) => {
    const source = String(booking.cart_data?.source || "").toLowerCase();

    if (source === "gorilla") return sum;
    if (!isActiveCentralBooking(booking)) return sum;
    if (
      !overlaps(
        booking.check_in || booking.cart_data?.checkIn,
        booking.check_out || booking.cart_data?.checkOut,
        checkInText,
        checkOutText
      )
    ) {
      return sum;
    }

    const matchedQuantity = (booking.cart_data?.items || []).reduce(
      (itemSum, item) => {
        const itemSlug = getItemRoomSlug(item);
        const itemRoomTypeId = getItemRoomTypeId(item);
        const isSameRoom =
          itemSlug === roomSlug || Boolean(centralRoomId && itemRoomTypeId === centralRoomId);

        if (!isSameRoom) return itemSum;

        return itemSum + Math.max(Number(item.quantity || 1), 1);
      },
      0
    );

    return sum + matchedQuantity;
  }, 0);
}
