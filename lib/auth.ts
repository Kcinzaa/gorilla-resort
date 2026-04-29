import { cookies } from "next/headers";

export async function isAdminLoggedIn() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  return token === process.env.ADMIN_TOKEN_SECRET;
}

export async function requireAdmin() {
  const loggedIn = await isAdminLoggedIn();

  if (!loggedIn) {
    throw new Error("UNAUTHORIZED");
  }
}