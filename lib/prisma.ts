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
