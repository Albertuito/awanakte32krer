import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapterFactory } as any);

async function main() {
    console.log("🔗 Assigning providers to neighborhoods...");

    const neighborhoods = await prisma.neighborhood.findMany({
        include: { city: true }
    });

    let matches = 0;

    for (const hood of neighborhoods) {
        // Find providers in this city that match the hood name in address
        // Note: SQLite LIKE is case insensitive widely, but let's be safe
        // Warning: "Mission" matches "Mission Street". "West Loop" matches. "SoHo" matches.
        // False positives possible. "Venice" matches "Venice Blvd".
        // Strictness: Maybe check if address contains ", HoodName,"? Or " HoodName, "

        const providers = await prisma.provider.findMany({
            where: {
                cityId: hood.cityId,
                address: {
                    contains: hood.name
                }
            }
        });

        for (const provider of providers) {
            // Avoid false positives (e.g. "Main St" matching "Main") - though hoods are usually distinctive names
            // Simple string check
            if (provider.address && provider.address.toLowerCase().includes(hood.name.toLowerCase())) {
                await prisma.provider.update({
                    where: { id: provider.id },
                    data: { neighborhoodId: hood.id }
                });
                console.log(`Linked ${provider.name} -> ${hood.name} (${hood.city.name})`);
                matches++;
            }
        }
    }

    console.log(`✅ Assigned ${matches} providers to neighborhoods.`);

    // Check distribution
    const summary = await prisma.neighborhood.findMany({
        include: { _count: { select: { providers: true } } }
    });

    console.table(summary.filter(n => n._count.providers > 0).map(n => ({
        hood: n.name,
        city: n.cityId, // Just ID for brev
        count: n._count.providers
    })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
