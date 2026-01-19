/**
 * Content Generation Script
 * 
 * Generates SEO content for therapy directory pages using OpenAI.
 * Stores results in the PageContent table with version tracking.
 * 
 * Usage: 
 *   npx tsx scripts/generate-content.ts --type therapy_hubs
 *   npx tsx scripts/generate-content.ts --type city_therapy --state CA --city los-angeles
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import {
    generateCityTherapyContent,
    generateTherapyHubContent,
    generateCityContent,
} from "../src/lib/openai";

// Setup Prisma
const dbPath = path.join(process.cwd(), "dev.db");
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapterFactory } as any);

async function generateTherapyHubs() {
    console.log("🧠 Generating Therapy Hub content...\n");

    const therapies = await prisma.therapy.findMany();
    let generated = 0;
    let totalTokens = 0;

    for (const therapy of therapies) {
        const key = `/therapy/${therapy.slug}`;

        // Check if content already exists
        const existing = await prisma.pageContent.findUnique({ where: { key } });
        if (existing) {
            console.log(`  ⏭️  Skipping ${therapy.name} (already exists)`);
            continue;
        }

        console.log(`  ✍️  Generating content for: ${therapy.name}`);

        try {
            const synonyms: string[] = therapy.synonyms ? JSON.parse(therapy.synonyms) : [];
            const result = await generateTherapyHubContent(therapy.name, synonyms);

            await prisma.pageContent.create({
                data: {
                    key,
                    pageType: "therapy_hub",
                    html: result.content,
                    version: result.version,
                    promptHash: result.promptHash,
                },
            });

            // Also update the therapy description
            await prisma.therapy.update({
                where: { id: therapy.id },
                data: { description: result.content },
            });

            generated++;
            totalTokens += result.tokensUsed;
            console.log(`     ✅ Generated (${result.tokensUsed} tokens)`);

            // Rate limiting
            await new Promise((r) => setTimeout(r, 500));
        } catch (error) {
            console.error(`     ❌ Error:`, error);
        }
    }

    console.log(`\n📊 Summary: Generated ${generated} therapy hubs using ${totalTokens} tokens`);
}

async function generateCityTherapyPages(stateAbbr: string, citySlug: string) {
    console.log(`🏙️  Generating City+Therapy content for ${citySlug}, ${stateAbbr}...\n`);

    const state = await prisma.state.findFirst({
        where: { abbreviation: stateAbbr.toUpperCase() },
    });
    if (!state) {
        console.error(`❌ State not found: ${stateAbbr}`);
        return;
    }

    const city = await prisma.city.findFirst({
        where: { stateId: state.id, slug: citySlug },
    });
    if (!city) {
        console.error(`❌ City not found: ${citySlug}`);
        return;
    }

    const therapies = await prisma.therapy.findMany();
    let generated = 0;
    let totalTokens = 0;

    for (const therapy of therapies) {
        const key = `/therapists/${stateAbbr.toLowerCase()}/${citySlug}/${therapy.slug}`;

        // Check if content already exists
        const existing = await prisma.pageContent.findUnique({ where: { key } });
        if (existing) {
            console.log(`  ⏭️  Skipping ${therapy.name} (already exists)`);
            continue;
        }

        console.log(`  ✍️  Generating: ${therapy.name} in ${city.name}`);

        try {
            const result = await generateCityTherapyContent(
                therapy.name,
                city.name,
                state.name,
                state.abbreviation
            );

            await prisma.pageContent.create({
                data: {
                    key,
                    pageType: "city_therapy",
                    html: result.content,
                    version: result.version,
                    promptHash: result.promptHash,
                },
            });

            generated++;
            totalTokens += result.tokensUsed;
            console.log(`     ✅ Generated (${result.tokensUsed} tokens)`);

            // Rate limiting
            await new Promise((r) => setTimeout(r, 500));
        } catch (error) {
            console.error(`     ❌ Error:`, error);
        }
    }

    console.log(`\n📊 Summary: Generated ${generated} city+therapy pages using ${totalTokens} tokens`);
}

async function generateCityPages(stateAbbr: string) {
    console.log(`🏙️  Generating City page content for ${stateAbbr}...\n`);

    const state = await prisma.state.findFirst({
        where: { abbreviation: stateAbbr.toUpperCase() },
        include: { cities: true },
    });
    if (!state) {
        console.error(`❌ State not found: ${stateAbbr}`);
        return;
    }

    const therapyCount = await prisma.therapy.count();
    let generated = 0;
    let totalTokens = 0;

    for (const city of state.cities) {
        const key = `/therapists/${stateAbbr.toLowerCase()}/${city.slug}`;

        // Check if content already exists
        const existing = await prisma.pageContent.findUnique({ where: { key } });
        if (existing) {
            console.log(`  ⏭️  Skipping ${city.name} (already exists)`);
            continue;
        }

        console.log(`  ✍️  Generating: ${city.name}`);

        try {
            const result = await generateCityContent(city.name, state.name, therapyCount);

            await prisma.pageContent.create({
                data: {
                    key,
                    pageType: "city",
                    html: result.content,
                    version: result.version,
                    promptHash: result.promptHash,
                },
            });

            generated++;
            totalTokens += result.tokensUsed;
            console.log(`     ✅ Generated (${result.tokensUsed} tokens)`);

            // Rate limiting
            await new Promise((r) => setTimeout(r, 300));
        } catch (error) {
            console.error(`     ❌ Error:`, error);
        }
    }

    console.log(`\n📊 Summary: Generated ${generated} city pages using ${totalTokens} tokens`);
}

async function main() {
    const args = process.argv.slice(2);
    const typeArg = args.find((_, i) => args[i - 1] === "--type");
    const stateArg = args.find((_, i) => args[i - 1] === "--state");
    const cityArg = args.find((_, i) => args[i - 1] === "--city");

    if (!typeArg) {
        console.log(`
Usage:
  npx tsx scripts/generate-content.ts --type therapy_hubs
  npx tsx scripts/generate-content.ts --type city_therapy --state CA --city los-angeles
  npx tsx scripts/generate-content.ts --type city_pages --state CA

Types:
  therapy_hubs  - Generate content for all /therapy/[slug] pages
  city_therapy  - Generate content for /therapists/[state]/[city]/[therapy] pages
  city_pages    - Generate content for /therapists/[state]/[city] pages
`);
        process.exit(1);
    }

    switch (typeArg) {
        case "therapy_hubs":
            await generateTherapyHubs();
            break;
        case "city_therapy":
            if (!stateArg || !cityArg) {
                console.error("❌ --state and --city are required for city_therapy");
                process.exit(1);
            }
            await generateCityTherapyPages(stateArg, cityArg);
            break;
        case "city_pages":
            if (!stateArg) {
                console.error("❌ --state is required for city_pages");
                process.exit(1);
            }
            await generateCityPages(stateArg);
            break;
        default:
            console.error(`❌ Unknown type: ${typeArg}`);
            process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error("❌ Generation failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
