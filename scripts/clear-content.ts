/**
 * Clear existing PageContent to regenerate with new structured prompts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapterFactory } as any);

async function main() {
    console.log("🗑️  Clearing old PageContent...");

    const deleted = await prisma.pageContent.deleteMany({});
    console.log(`   Deleted ${deleted.count} records`);

    // Also clear therapy descriptions to regenerate
    await prisma.therapy.updateMany({
        data: { description: null },
    });
    console.log("   Cleared therapy descriptions");

    console.log("✅ Done! Run generate-content.ts to regenerate with new prompts.");
}

main()
    .catch((e) => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
