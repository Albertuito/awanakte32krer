import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapterFactory } as any);

async function main() {
    const total = await prisma.provider.count();
    console.log("📊 Total providers:", total);

    const byCity = await prisma.$queryRaw`
        SELECT c.name as city, s.abbreviation as state, COUNT(*) as count 
        FROM Provider p 
        JOIN City c ON p.cityId = c.id 
        JOIN State s ON p.stateId = s.id 
        GROUP BY c.id 
        ORDER BY count DESC
    ` as any[];

    console.log("\n🏙️  By city:");
    for (const row of byCity) {
        console.log(`   ${row.city}, ${row.state}: ${row.count} providers`);
    }

    const therapyLinks = await prisma.providerTherapy.count();
    console.log("\n🔗 Provider-Therapy links:", therapyLinks);

    const withPhotos = await prisma.provider.count({
        where: { photoUrl: { not: null } }
    });
    console.log("📸 Providers with photos:", withPhotos);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
