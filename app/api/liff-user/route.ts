import { NextResponse } from "next/server";
import { getFriendlyDbErrorMessage, prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type LiffUserPayload = {
  lineUserId: string;
  displayName?: string | null;
  pictureUrl?: string | null;
  phone?: string | null;
};

async function upsertLiffUserViaSupabase({
  lineUserId,
  displayName,
  pictureUrl,
  phone,
}: LiffUserPayload) {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("User")
    .upsert(
      {
        lineUserId,
        displayName,
        pictureUrl,
        phone,
        updatedAt: now,
      },
      { onConflict: "lineUserId" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(`Supabase User upsert fallback failed: ${error.message}`);
  }

  return data;
}

async function getLiffUserViaSupabase(lineUserId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("User")
    .select("*, bookings:Booking(*, roomType:RoomType(*))")
    .eq("lineUserId", lineUserId)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase User fallback failed: ${error.message}`);
  }

  return data;
}

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

    let user;

    try {
      user = await prisma.user.upsert({
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
    } catch (error) {
      const { category } = getFriendlyDbErrorMessage(error);
      if (category !== "unreachable") {
        throw error;
      }

      console.error("SAVE_LIFF_USER_PRISMA_UNREACHABLE_FALLBACK:", error);
      user = await upsertLiffUserViaSupabase({
        lineUserId,
        displayName,
        pictureUrl,
        phone,
      });
    }

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

    let user;

    try {
      user = await prisma.user.findUnique({
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
    } catch (error) {
      const { category } = getFriendlyDbErrorMessage(error);
      if (category !== "unreachable") {
        throw error;
      }

      console.error("GET_LIFF_USER_PRISMA_UNREACHABLE_FALLBACK:", error);
      user = await getLiffUserViaSupabase(lineUserId);
    }

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
