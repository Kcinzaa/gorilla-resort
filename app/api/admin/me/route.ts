import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";

export async function GET() {
  const loggedIn = await isAdminLoggedIn();

  return NextResponse.json({
    success: true,
    loggedIn,
  });
}