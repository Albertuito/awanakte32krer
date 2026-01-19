
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapterFactory } as any);

async function main() {
    const total = await prisma.provider.count();
    const withGoogleRef = await prisma.provider.count({ where: { googlePhotoRef: { not: null } } });
    const localPhotos = await prisma.provider.count({ where: { photoUrl: { startsWith: "/images/providers/" } } });

    console.log(`Total Providers: ${total}`);
    console.log(`With Google Photo Ref: ${withGoogleRef}`);
    console.log(`With Local Photo: ${localPhotos}`);
    console.log(`Missing Local Photo (Pending): ${withGoogleRef - localPhotos}`);

    // Check density per hood sample
    const hood = await prisma.neighborhood.findFirst({
        include: { _count: { select: { providers: true } } }
    });
    if (hood) {
        console.log(`Sample Neighborhood (${hood.name}): ${hood._count.providers} providers.`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
