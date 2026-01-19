
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapterFactory } as any);

const NEW_CITIES = [
    {
        name: "Houston",
        state: "TX",
        slug: "houston",
        neighborhoods: ["Montrose", "The Heights", "River Oaks", "Rice Village", "Midtown", "Downtown"]
    },
    {
        name: "Phoenix",
        state: "AZ",
        slug: "phoenix",
        neighborhoods: ["Downtown", "Roosevelt Row", "Arcadia", "Biltmore", "Desert Ridge", "Paradise Valley"]
    },
    {
        name: "Philadelphia",
        state: "PA",
        slug: "philadelphia",
        neighborhoods: ["Center City", "Fishtown", "Rittenhouse Square", "Old City", "Manayunk", "University City"]
    },
    {
        name: "San Antonio",
        state: "TX",
        slug: "san-antonio",
        neighborhoods: ["Downtown", "Pearl", "Alamo Heights", "Stone Oak", "Southtown", "Medical Center"]
    },
    {
        name: "San Diego",
        state: "CA",
        slug: "san-diego",
        neighborhoods: ["Gaslamp Quarter", "North Park", "Hillcrest", "La Jolla", "Pacific Beach", "Little Italy"]
    },
    {
        name: "Dallas",
        state: "TX",
        slug: "dallas",
        neighborhoods: ["Uptown", "Deep Ellum", "Bishop Arts", "Preston Hollow", "Highland Park", "Oak Lawn"]
    },
    {
        name: "San Jose",
        state: "CA",
        slug: "san-jose",
        neighborhoods: ["Downtown", "Santana Row", "Willow Glen", "Japantown", "Rose Garden", "Almaden Valley"]
    }
];

// Helper to generate slug
function slugify(text: string) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

async function main() {
    console.log("🌱 Starting expansion seeding...");

    for (const cityData of NEW_CITIES) {
        // Ensure State
        let state = await prisma.state.findFirst({ where: { abbreviation: cityData.state } });
        if (!state) {
            // Need full name mapping or just use abbreviation as name for now?
            // Existing STATES mapping was in seed.ts.
            const stateNames: Record<string, string> = { "TX": "Texas", "AZ": "Arizona", "PA": "Pennsylvania", "CA": "California" };
            state = await prisma.state.create({
                data: {
                    name: stateNames[cityData.state] || cityData.state,
                    abbreviation: cityData.state,
                    slug: slugify(stateNames[cityData.state] || cityData.state)
                }
            });
            console.log(`   + Created State: ${state.name}`);
        } else {
            console.log(`   . State exists: ${state.name}`);
        }

        // Ensure City
        let city = await prisma.city.findFirst({
            where: { slug: cityData.slug, stateId: state.id }
        });

        if (!city) {
            city = await prisma.city.create({
                data: {
                    name: cityData.name,
                    slug: cityData.slug,
                    stateId: state.id
                }
            });
            console.log(`   + Created City: ${city.name}`);
        } else {
            console.log(`   . City exists: ${city.name}`);
        }

        // Ensure Neighborhoods
        for (const hoodName of cityData.neighborhoods) {
            const hoodSlug = slugify(hoodName);
            const exists = await prisma.neighborhood.findFirst({
                where: { slug: hoodSlug, cityId: city.id }
            });

            if (!exists) {
                await prisma.neighborhood.create({
                    data: {
                        name: hoodName,
                        slug: hoodSlug,
                        cityId: city.id
                    }
                });
                console.log(`     + Created Neighborhood: ${hoodName}`);
            }
        }
    }

    console.log("✅ Expansion seeding complete.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
