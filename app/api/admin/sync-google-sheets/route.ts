import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { syncBookingsToSheets } from "@/lib/googleSheetsSync";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      { success: false, message: "ไม่มีสิทธิ์ใช้งานส่วนนี้" },
      { status: 401 }
    );
  }

  const result = await syncBookingsToSheets();
  return NextResponse.json(result, { status: result.status });
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      { success: false, message: "ไม่มีสิทธิ์ใช้งานส่วนนี้" },
      { status: 401 }
    );
  }

  const result = await syncBookingsToSheets();
  return NextResponse.json(result, { status: result.status });
}
