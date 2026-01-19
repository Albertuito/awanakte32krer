import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

// Configure SQLite adapter for Prisma 7
const dbPath = path.join(process.cwd(), "dev.db");
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ?? (new PrismaClient({ adapter: adapterFactory } as any) as PrismaClient);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
