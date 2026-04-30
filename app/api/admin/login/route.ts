import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { username, password } = body;
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminTokenSecret = process.env.ADMIN_TOKEN_SECRET;

    if (!adminUsername || !adminPassword || !adminTokenSecret) {
      return NextResponse.json(
        {
          success: false,
          message: "ยังไม่ได้ตั้งค่า ADMIN_USERNAME, ADMIN_PASSWORD หรือ ADMIN_TOKEN_SECRET",
        },
        { status: 500 }
      );
    }

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณากรอก username และ password",
        },
        { status: 400 }
      );
    }

    if (
      username !== adminUsername ||
      password !== adminPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Username หรือ Password ไม่ถูกต้อง",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
    });

    response.cookies.set("admin_token", adminTokenSecret, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("ADMIN_LOGIN_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถเข้าสู่ระบบได้",
      },
      { status: 500 }
    );
  }
}
