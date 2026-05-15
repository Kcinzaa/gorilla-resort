import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

// Limit pg pool to 2 connections per serverless function instance.
// Supabase free tier allows only 15 direct connections total.
// Without this cap, concurrent Vercel instances can exhaust the limit
// and produce EMAXCONNSESSION errors.
//
// Permanent fix: in Vercel, change DATABASE_URL to the Supabase
// Transaction Pooler URL (port 6543) from:
// Supabase Dashboard > Settings > Database > Connection Pooling
const adapter = new PrismaPg({
  connectionString,
  max: 2,
});

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * รายการ pattern ของ error ที่บ่งบอกว่าต่อ database ไม่ได้
 * (ตอนนี้ Supabase free-tier ใช้ IPv6 อย่างเดียวสำหรับ direct connection
 * → Vercel ติดต่อไม่ได้ ต้องใช้ Transaction Pooler ที่ port 6543)
 */
const DB_UNREACHABLE_PATTERNS = [
  "can't reach database server",
  "cannot reach database server",
  "connection refused",
  "econnrefused",
  "etimedout",
  "enotfound",
  "eai_again",
  "network unreachable",
  "timeout expired",
  "server has closed the connection",
  "terminating connection",
  "the database is not running",
  "tenant or user not found",
];

const DB_AUTH_PATTERNS = [
  "password authentication failed",
  "role does not exist",
  "no pg_hba.conf entry",
];

export function getFriendlyDbErrorMessage(error: unknown): {
  userMessage: string;
  category: "unreachable" | "auth" | "unknown";
} {
  const raw = error instanceof Error ? error.message : String(error);
  const text = raw.toLowerCase();

  if (DB_UNREACHABLE_PATTERNS.some((p) => text.includes(p))) {
    return {
      category: "unreachable",
      userMessage:
        "ระบบกำลังกลับมาให้บริการ กรุณาลองใหม่อีกครั้งในอีกสักครู่",
    };
  }

  if (DB_AUTH_PATTERNS.some((p) => text.includes(p))) {
    return {
      category: "auth",
      userMessage:
        "ระบบมีปัญหาการเชื่อมต่อภายใน กรุณาแจ้งผู้ดูแล",
    };
  }

  return {
    category: "unknown",
    userMessage: "เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง",
  };
}
