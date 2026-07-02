import { PrismaClient } from "@prisma/client";

/**
 * Single Prisma client instance for the whole app. In dev, hot-reload via
 * tsx watch can otherwise spawn multiple clients and exhaust MySQL
 * connections — guard with a global singleton.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
