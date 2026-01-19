
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import axios from "axios";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapterFactory } as any);

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

function slugify(text: string) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function scrapeNeighborhood(neighborhood: any, city: any, state: any) {
    console.log(`🔍 Scraping for: ${neighborhood.name}, ${city.name}, ${state.abbreviation}`);

    // Check existing count
    const count = await prisma.provider.count({
        where: { neighborhoodId: neighborhood.id }
    });

    if (count >= 50) {
        console.log(`   ⏭️  Already has ${count} providers. Skipping.`);
        return;
    }

    const query = `mental health therapists in ${neighborhood.name}, ${city.name}, ${state.abbreviation}`;
    const url = "https://places.googleapis.com/v1/places:searchText";

    let nextPageToken = "";
    let totalFetched = 0;

    do {
        try {
            const response = await axios.post(url, {
                textQuery: query,
                pageToken: nextPageToken || undefined,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_API_KEY,
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.photos,places.location,places.types'
                }
            });

            const places = response.data.places || [];
            console.log(`   ⬇️  Fetched ${places.length} places...`);

            for (const place of places) {
                const name = place.displayName?.text;
                if (!name) continue;

                // Basic Filtering
                if (name.includes("Starbucks") || name.includes("Grocery")) continue;

                let slug = slugify(`${name} in ${city.slug}`);
                // Ensure uniqueness slightly? Upsert handles unique constraint on slug usually, but collision might fail

                // Photo Ref
                const photoRef = place.photos && place.photos.length > 0 ? place.photos[0].name : null;

                // Create/Update
                try {
                    await prisma.provider.upsert({
                        where: { slug: slug }, // This assumes slug is unique enough. If collision, we might overwrite defined provider in another hood. Risk accepted for now.
                        update: {
                            neighborhoodId: neighborhood.id, // Assign to this hood
                            googlePhotoRef: photoRef || undefined, // Only update if new ref
                            // If photoUrl is missing, maybe set it to ref for now? Download script handles migration.
                        },
                        create: {
                            name,
                            slug,
                            placeId: place.id, // V1 API returns strict ID here
                            address: place.formattedAddress,
                            phone: place.nationalPhoneNumber,
                            website: place.websiteUri,
                            rating: place.rating,
                            reviewCount: place.userRatingCount,
                            lat: place.location?.latitude,
                            lng: place.location?.longitude,
                            cityId: city.id,
                            stateId: state.id,
                            neighborhoodId: neighborhood.id,
                            googlePhotoRef: photoRef,
                            photoUrl: photoRef, // Temp until download
                            description: "", // To be filled by enrich script
                            sourceData: JSON.stringify(place)
                        }
                    });
                    totalFetched++;
                } catch (e: any) {
                    // Slug collision? Try unique slug
                    if (e.code === 'P2002') {
                        slug = slugify(`${name} ${neighborhood.slug}`);
                        try {
                            // Retry create only
                            await prisma.provider.create({
                                data: {
                                    name,
                                    slug,
                                    placeId: place.id,
                                    address: place.formattedAddress,
                                    phone: place.nationalPhoneNumber,
                                    website: place.websiteUri,
                                    rating: place.rating,
                                    reviewCount: place.userRatingCount,
                                    lat: place.location?.latitude,
                                    lng: place.location?.longitude,
                                    cityId: city.id,
                                    stateId: state.id,
                                    neighborhoodId: neighborhood.id,
                                    googlePhotoRef: photoRef,
                                    photoUrl: photoRef,
                                    description: "",
                                    sourceData: JSON.stringify(place)
                                }
                            });
                            totalFetched++;
                        } catch (e2) { }
                    }
                }
            }

            nextPageToken = response.data.nextPageToken;

            // Wait a bit if paging
            if (nextPageToken) await new Promise(r => setTimeout(r, 2000));

        } catch (error: any) {
            console.error("   ❌ API Error:", error.message);
            break;
        }
    } while (nextPageToken && totalFetched < 60);
}

async function main() {
    console.log("🚀 Starting neighborhood scraper...");

    // Get all neighborhoods
    const hoods = await prisma.neighborhood.findMany({
        include: {
            city: {
                include: { state: true }
            }
        }
    });

    console.log(`Found ${hoods.length} neighborhoods to check.`);

    // Iterate
    for (const hood of hoods) {
        if (!hood.city || !hood.city.state) continue;
        await scrapeNeighborhood(hood, hood.city, hood.city.state);
        // Delay between hoods
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log("✅ Scraping complete.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
