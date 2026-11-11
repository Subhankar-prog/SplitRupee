import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    transactionOptions: {
      maxWait: 15_000,
      timeout: 30_000,
    },
  });

globalForPrisma.prisma = prisma;
