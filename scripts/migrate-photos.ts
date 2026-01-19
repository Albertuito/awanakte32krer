
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapterFactory } as any);

async function main() {
    console.log("🔄 Starting photo reference migration...");

    // Find all providers with photoUrl but no googlePhotoRef
    const providers = await prisma.provider.findMany({
        where: {
            photoUrl: { not: null },
            googlePhotoRef: null
        }
    });

    console.log(`Found ${providers.length} providers to migrate.`);

    let updated = 0;
    for (const p of providers) {
        if (!p.photoUrl) continue;

        // Skip if it already looks like a local path (just in case)
        if (p.photoUrl.startsWith("/images/")) continue;

        await prisma.provider.update({
            where: { id: p.id },
            data: {
                googlePhotoRef: p.photoUrl
            }
        });
        updated++;
        if (updated % 50 === 0) process.stdout.write(".");
    }

    console.log(`\n✅ Migrated ${updated} providers.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
