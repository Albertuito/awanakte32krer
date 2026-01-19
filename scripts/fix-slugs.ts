import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import slugify from "slugify";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapterFactory } as any);

async function generateCleanSlug(name: string, citySlug: string, placeId: string): Promise<string> {
    const baseSlug = slugify(name, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });

    // 1. Try name only
    const existingName = await prisma.provider.findFirst({ where: { slug: baseSlug } });
    if (!existingName) return baseSlug;
    if (existingName.placeId === placeId) return baseSlug; // Same provider

    // 2. Try name-city
    const cityBaseSlug = slugify(`${name}-${citySlug}`, { lower: true, strict: true });
    const existingCity = await prisma.provider.findFirst({ where: { slug: cityBaseSlug } });
    if (!existingCity) return cityBaseSlug;
    if (existingCity.placeId === placeId) return cityBaseSlug;

    // 3. Last resort: name-city-shortid (using last 4 of placeID for stability)
    return `${cityBaseSlug}-${placeId.slice(-4)}`;
}

async function main() {
    console.log("🐌 Starting slug repair...");

    // Get all providers including city info
    const providers = await prisma.provider.findMany({
        include: { city: true }
    });

    let updated = 0;

    for (const provider of providers) {
        if (!provider.city) continue;

        // Check if slug looks ugly (contains long hash suffix generally > 5 chars, usually 8 from previous script)
        // OR simply force regenerate for everyone to be consistent

        // Let's check regex for strict clean name. 
        // My previous script generated: slugify(name + id.slice(-8))
        // New clean slug should match /^[a-z0-9-]+$/ and ideally not have huge random suffix

        // I will just attempt to generate a new clean slug. If it's different/shorter, I update.
        // Actually, prisma `slug` is unique. I need to be careful not to collision with myself if I don't change it.
        // But `generateCleanSlug` handles "if (existingName.placeId === placeId) return baseSlug".

        // However, if the current slug is "ugly" (e.g. name-12345678) and "name" is available, `generateCleanSlug` will return "name".
        // If "name" is NOT available (taken by someone else), it returns something else.

        const newSlug = await generateCleanSlug(provider.name, provider.city.slug, provider.placeId);

        if (newSlug !== provider.slug) {
            console.log(`Fixing: ${provider.slug} -> ${newSlug}`);
            try {
                await prisma.provider.update({
                    where: { id: provider.id },
                    data: { slug: newSlug }
                });
                updated++;
            } catch (e) {
                console.error(`Failed to update ${provider.name}:`, e);
            }
        }
    }

    console.log(`✅ Slug repair complete. Fixed ${updated} providers.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
