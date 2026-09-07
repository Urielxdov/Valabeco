import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  sharedPrisma?: PrismaClient;
};

export function getPrisma(): PrismaClient {
  if (globalForPrisma.sharedPrisma) {
    return globalForPrisma.sharedPrisma;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.sharedPrisma = prisma;
  }

  return prisma;
}
