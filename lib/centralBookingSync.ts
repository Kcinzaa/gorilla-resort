import { getCentralSupabaseAdmin } from "@/lib/centralSupabaseAdmin";
import { mapGorillaRoomToRhinoSlug } from "@/lib/roomLockSync";

type GorillaBooking = {
  id: number;
  bookingCode: string;
  lineUserId: string;
  displayName?: string | null;
  phone?: string | null;
  note?: string | null;
  roomTypeId: number;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  roomCount?: number | null;
  totalPrice?: number | null;
  status?: string | null;
  depositAmount?: number | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  paymentSlipUrl?: string | null;
  paymentReference?: string | null;
  createdAt?: Date;
  roomType?: {
    id: number;
    name: string;
    capacity: number;
    imageUrl?: string | null;
  } | null;
};

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function calculateNights(checkIn: Date, checkOut: Date) {
  const diff = checkOut.getTime() - checkIn.getTime();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 1);
}

function mapBookingStatus(status?: string | null) {
  if (status === "CANCELLED") return "CANCELLED";
  if (status === "CONFIRMED") return "CONFIRMED";
  return "PENDING";
}

function mapPaymentStatus(status?: string | null) {
  if (status === "PAID") return "PAID";
  if (status === "REJECTED") return "REJECTED";
  if (status === "PENDING") return "WAITING_VERIFY";
  return "WAITING_PAYMENT";
}

export async function syncGorillaBookingToCentral(booking: GorillaBooking) {
  const central = getCentralSupabaseAdmin();

  if (!central) {
    return {
      synced: false,
      skipped: true,
      message: "Missing CENTRAL_SUPABASE_URL or CENTRAL_SUPABASE_SERVICE_ROLE_KEY",
    };
  }

  const roomSlug = mapGorillaRoomToRhinoSlug(booking.roomTypeId);

  if (!roomSlug) {
    return {
      synced: false,
      skipped: true,
      message: "Room mapping not found",
    };
  }

  const { data: centralRoom, error: roomError } = await central
    .from("room_types")
    .select("id, name, slug, capacity, cover_image")
    .eq("slug", roomSlug)
    .single();

  if (roomError || !centralRoom) {
    throw new Error(roomError?.message || "Central room type not found");
  }

  const quantity = Math.max(Number(booking.roomCount || 1), 1);
  const nights = calculateNights(booking.checkIn, booking.checkOut);
  const checkIn = toDateOnly(booking.checkIn);
  const checkOut = toDateOnly(booking.checkOut);
  const totalGuests = Math.max(Number(booking.guests || 1), 1);
  const totalAmount = Number(booking.totalPrice || 0);
  const paymentReference =
    booking.paymentReference || `GORILLA-${booking.id}-${booking.bookingCode}`;

  const cart = {
    source: "gorilla",
    checkIn,
    checkOut,
    nights,
    total: totalAmount,
    savedAt: new Date().toISOString(),
    items: [
      {
        cartId: `gorilla-${booking.id}`,
        roomTypeId: centralRoom.id,
        roomName: centralRoom.name,
        roomSlug: centralRoom.slug,
        quantity,
        adults: totalGuests,
        children: 0,
        totalGuests,
        nights,
        checkIn,
        checkOut,
        totalAmount,
        coverImage: centralRoom.cover_image || booking.roomType?.imageUrl || "",
        gorillaBookingId: booking.id,
        gorillaRoomTypeId: booking.roomTypeId,
        gorillaBookingCode: booking.bookingCode,
      },
    ],
  };

  const payload = {
    booking_no: booking.bookingCode,
    payment_reference: paymentReference,
    line_user_id: booking.lineUserId,
    customer_name: booking.displayName || "Gorilla Customer",
    customer_phone: booking.phone || "-",
    customer_email: "",
    customer_contact: booking.note || null,
    check_in: checkIn,
    check_out: checkOut,
    nights,
    total_rooms: quantity,
    total_adults: totalGuests,
    total_children: 0,
    total_guests: totalGuests,
    subtotal: totalAmount,
    discount_amount: 0,
    final_amount: totalAmount,
    total_amount: totalAmount,
    status: mapBookingStatus(booking.status),
    note: booking.note || null,
    payment_status: mapPaymentStatus(booking.paymentStatus),
    booking_status: mapBookingStatus(booking.status),
    payment_slip_url: booking.paymentSlipUrl || null,
    expire_at: null,
    cart_data: cart,
    guest_data: [],
    created_at: booking.createdAt?.toISOString() || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: existingBooking, error: existingError } = await central
    .from("bookings")
    .select("id")
    .eq("booking_no", booking.bookingCode)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const query = existingBooking?.id
    ? central.from("bookings").update(payload).eq("id", existingBooking.id)
    : central.from("bookings").insert(payload);

  const { data, error } = await query.select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    synced: true,
    skipped: false,
    booking: data,
  };
}
