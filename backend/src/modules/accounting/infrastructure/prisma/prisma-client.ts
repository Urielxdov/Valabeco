import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  accountingPrisma?: PrismaClient;
};

export function getPrisma(): PrismaClient {
  if (globalForPrisma.accountingPrisma) {
    return globalForPrisma.accountingPrisma;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.accountingPrisma = prisma;
  }

  return prisma;
}
