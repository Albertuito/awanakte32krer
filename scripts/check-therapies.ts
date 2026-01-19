import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapterFactory } as any);

async function main() {
    const therapies = await prisma.therapy.findMany();
    console.log(JSON.stringify(therapies, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
