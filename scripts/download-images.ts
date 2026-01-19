
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "fs";
import path from "path";
import axios from "axios";
import sharp from "sharp"; // Optional optimization

const dbPath = path.join(process.cwd(), "dev.db");
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapterFactory } as any);

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const MAX_WIDTH = 800; // Resize large images
const OUTPUT_DIR = path.join(process.cwd(), "public", "images", "providers");

async function ensureDir() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
}

async function downloadImage(photoRef: string, slug: string): Promise<string | null> {
    // Places API v1 (New) - photoRef is "places/.../photos/..."
    const url = `https://places.googleapis.com/v1/${photoRef}/media?key=${GOOGLE_API_KEY}&maxWidthPx=${MAX_WIDTH}&maxHeightPx=${MAX_WIDTH}`;

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
            maxRedirects: 5 // Ensure we follow redirects if any
        });

        // Determine extension (default jpg) but response headers might say otherwise
        // Actually Google Place Photo always returns image data, usually jpeg
        const filename = `${slug}.jpg`;
        const filepath = path.join(OUTPUT_DIR, filename);

        // Optional: Optimize with Sharp if installed, otherwise just write
        // To be safe and dependency-free, just write buffer for now, or use sharp if available
        // Let's assume standard write first to avoid deps issues
        fs.writeFileSync(filepath, response.data);

        return `/images/providers/${filename}`;
    } catch (error: any) {
        if (error.response?.status === 403 || error.response?.status === 429) {
            console.log("⚠️ Quota/Permission Error:", error.message);
            return "QUOTA_LIMIT"; // Signal to stop or pause
        }
        console.error(`❌ Failed to download for ${slug}:`, error.message);
        return null;
    }
}

async function main() {
    console.log("⬇️  Starting image download process...");

    if (!GOOGLE_API_KEY) {
        console.error("❌ Missing NEXT_PUBLIC_GOOGLE_MAPS_KEY env var");
        return;
    }

    await ensureDir();

    const loopArg = process.argv.includes("--loop");

    do {
        // Find verified providers with google ref but NO local photoUrl
        // OR photoUrl is still a remote URL (http...)
        // OR photoUrl is missing but we have googlePhotoRef
        const providers = await prisma.provider.findMany({
            where: {
                googlePhotoRef: { not: null },
                OR: [
                    { photoUrl: { startsWith: "http" } },
                    { photoUrl: null },
                    {
                        photoUrl: { not: { startsWith: "/images/providers/" } }
                    }
                ]
            },
            take: 10 // Small batch
        });

        if (providers.length === 0) {
            console.log("Rediscovering images... none found.");
            if (!loopArg) break;

            await new Promise(r => setTimeout(r, 10000)); // Wait 10s before checking again
            continue;
        }

        console.log(`Found ${providers.length} images to download.`);

        for (const p of providers) {
            if (!p.googlePhotoRef) continue;

            console.log(`📸 Downloading for: ${p.name}`);
            const localPath = await downloadImage(p.googlePhotoRef, p.slug);

            if (localPath === "QUOTA_LIMIT") {
                console.log("🛑 Stopping due to API limits.");
                process.exit(0); // Hard stop
            }

            if (localPath) {
                await prisma.provider.update({
                    where: { id: p.id },
                    data: { photoUrl: localPath }
                });
                console.log(`   ✅ Saved to ${localPath}`);
            }

            // Delay to be nice to API
            await new Promise(r => setTimeout(r, 1000));
        }

    } while (loopArg);

    console.log(`\n🎉 Processed batch.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

