import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import slugify from "slugify";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapterFactory } as any);

const NEIGHBORHOODS = {
    "new-york-city": ["Manhattan", "Brooklyn", "Queens", "SoHo", "Tribeca", "Williamsburg", "Upper East Side", "Greenwich Village"],
    "los-angeles": ["Hollywood", "Venice", "Silver Lake", "Echo Park", "Downtown", "Sherman Oaks", "Koreatown", "Westwood"],
    "chicago": ["Lincoln Park", "Lake View", "The Loop", "West Loop", "Logan Square", "Wicker Park", "River North"],
    "san-francisco": ["Mission District", "SoMa", "The Castro", "Marina District", "Noe Valley", "Pacific Heights", "Haight-Ashbury"],
    "miami": ["South Beach", "Brickell", "Wynwood", "Coral Gables", "Coconut Grove", "Little Havana"]
};

// Note: Coral Gables is technically a city, but often treated as neighborhood of Miami metro. 
// If it exists as City in DB, we skip.

async function main() {
    console.log("🌱 Seeding neighborhoods...");

    for (const [citySlug, hoods] of Object.entries(NEIGHBORHOODS)) {
        // Find city
        // Note: New York City might be stored as 'new-york-city' or 'new-york' depending on my fix list-cities. 
        // list-cities output said 'New York' -> 'new-york' (Wait: earlier output said new-york not found for city generation? I used 'new-york-city' for generation and it worked?
        // Let's check list-cities output again.
        // It wasn't shown fully. "58 Newark". "57 Ann Arbor".
        // I need to be sure about the City Slug.
        // I will allow strict check.

        let city = await prisma.city.findFirst({
            where: { slug: citySlug }
        });

        // Fallback for NYC naming confusion
        if (!city && citySlug === 'new-york-city') {
            city = await prisma.city.findFirst({ where: { slug: 'new-york' } });
        }
        if (!city && citySlug === 'new-york') {
            city = await prisma.city.findFirst({ where: { slug: 'new-york-city' } });
        }

        if (!city) {
            console.warn(`⚠️ City with slug '${citySlug}' not found. Skipping.`);
            continue;
        }

        console.log(`📍 Processing ${city.name} (${city.slug})...`);

        for (const hoodName of hoods) {
            const hoodSlug = slugify(hoodName, { lower: true, strict: true });

            await prisma.neighborhood.upsert({
                where: {
                    cityId_slug: {
                        cityId: city.id,
                        slug: hoodSlug,
                    }
                },
                update: {}, // No update needed
                create: {
                    name: hoodName,
                    slug: hoodSlug,
                    cityId: city.id
                }
            });
        }
    }

    console.log("✅ Neighborhoods seeded.");

    // Check counts
    const count = await prisma.neighborhood.count();
    console.log(`Total Neighborhoods in DB: ${count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
