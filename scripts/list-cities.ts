import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapterFactory } as any);

async function main() {
    const cities = await prisma.city.findMany({ include: { state: true } });
    console.table(cities.map(c => ({
        city: c.name,
        slug: c.slug,
        state: c.state.name,
        abbr: c.state.abbreviation
    })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
