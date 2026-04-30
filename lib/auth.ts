import { cookies } from "next/headers";

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";

  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authHeader.slice(7).trim();
}

function getCookieValue(request: Request, name: string) {
  const cookie = request.headers.get("cookie") || "";
  const cookies = cookie.split(";").map((item) => item.trim());
  const target = cookies.find((item) => item.startsWith(`${name}=`));

  if (!target) return "";

  return decodeURIComponent(target.slice(name.length + 1));
}

function getAdminSecret() {
  return process.env.ADMIN_TOKEN_SECRET || "";
}

export async function isAdminLoggedIn() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  const secret = getAdminSecret();

  return Boolean(secret && token === secret);
}

export function isAdminRequest(request: Request) {
  const secret = getAdminSecret();

  if (!secret) return false;

  const token = getBearerToken(request) || getCookieValue(request, "admin_token");

  return token === secret;
}

export async function requireAdmin() {
  const loggedIn = await isAdminLoggedIn();

  if (!loggedIn) {
    throw new Error("UNAUTHORIZED");
  }
}
