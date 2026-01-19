/**
 * Google Places Scraper for Therapy Directory - Enhanced
 * 
 * Improvements:
 * - Better slug generation (cleaner URLs)
 * - Photo reference extraction
 * - Robust error handling
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import slugify from "slugify";
import path from "path";
import fs from "fs";

// Setup Prisma
const dbPath = path.join(process.cwd(), "dev.db");
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapterFactory } as any);

// Config
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

const THERAPY_SEARCH_QUERIES = [
    "therapist", "psychologist", "counselor", "psychotherapy",
    "mental health clinic", "family therapist"
];

const VALID_PLACE_TYPES = [
    "health", "mental_health_clinic", "psychologist",
    "counselor", "therapist", "doctor", "health_establishment"
];

interface PlaceResult {
    id: string;
    displayName: { text: string };
    formattedAddress: string;
    location: { latitude: number; longitude: number };
    rating?: number;
    userRatingCount?: number;
    websiteUri?: string;
    nationalPhoneNumber?: string;
    types?: string[];
    primaryType?: string;
    photos?: { name: string; widthPx: number; heightPx: number }[];
}

interface SearchResponse {
    places?: PlaceResult[];
}

async function searchPlaces(query: string, city: string, state: string): Promise<PlaceResult[]> {
    const textQuery = `${query} in ${city}, ${state}`;

    // Add photos to field mask
    const fieldMask = "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.websiteUri,places.nationalPhoneNumber,places.types,places.primaryType,places.photos";

    const response = await fetch(PLACES_TEXT_SEARCH_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_API_KEY!,
            "X-Goog-FieldMask": fieldMask,
        },
        body: JSON.stringify({ textQuery, maxResultCount: 20 }),
    });

    if (!response.ok) throw new Error(`API Error: ${response.status} ${await response.text()}`);
    const data: SearchResponse = await response.json();
    return data.places || [];
}

function calculateConfidenceScore(place: PlaceResult): number {
    let score = 0.5;
    if (place.types?.some(t => VALID_PLACE_TYPES.includes(t))) score += 0.2;
    if ((place.rating || 0) >= 4.0) score += 0.1;
    if ((place.userRatingCount || 0) > 10) score += 0.1;
    if (place.websiteUri) score += 0.1;
    return Math.min(score, 1.0);
}

// Generates a clean slug, handling collisions
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

async function upsertProvider(place: PlaceResult, cityId: number, stateId: number, citySlug: string) {
    const slug = await generateCleanSlug(place.displayName.text, citySlug, place.id);

    // Get first photo reference if available
    const photoUrl = place.photos && place.photos.length > 0 ? place.photos[0].name : null;

    return await prisma.provider.upsert({
        where: { placeId: place.id },
        update: {
            name: place.displayName.text,
            address: place.formattedAddress,
            lat: place.location.latitude,
            lng: place.location.longitude,
            rating: place.rating,
            reviewCount: place.userRatingCount,
            website: place.websiteUri,
            phone: place.nationalPhoneNumber,
            sourceData: JSON.stringify(place),
            photoUrl: photoUrl,
        },
        create: {
            placeId: place.id,
            slug,
            name: place.displayName.text,
            address: place.formattedAddress,
            cityId,
            stateId,
            lat: place.location.latitude,
            lng: place.location.longitude,
            rating: place.rating,
            reviewCount: place.userRatingCount,
            website: place.websiteUri,
            phone: place.nationalPhoneNumber,
            sourceData: JSON.stringify(place),
            photoUrl: photoUrl,
        },
    });
}

// ... linking logic remains similar but simplified ...
async function linkProviderToTherapies(providerId: string, place: PlaceResult, therapies: any[]) {
    const placeText = `${place.displayName.text} ${place.types?.join(" ") || ""}`.toLowerCase();

    for (const therapy of therapies) {
        const synonyms = therapy.synonyms ? JSON.parse(therapy.synonyms) : [];
        const allKeywords = [therapy.name.toLowerCase(), ...synonyms];

        if (allKeywords.some(k => placeText.includes(k.toLowerCase()))) {
            const confidence = calculateConfidenceScore(place);
            await prisma.providerTherapy.upsert({
                where: { providerId_therapyId: { providerId, therapyId: therapy.id } },
                update: { confidenceScore: confidence },
                create: { providerId, therapyId: therapy.id, confidenceScore: confidence },
            });
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    const cityArg = args.find((_, i) => args[i - 1] === "--city");
    const stateArg = args.find((_, i) => args[i - 1] === "--state");

    if (!cityArg || !stateArg || !GOOGLE_API_KEY) {
        console.error("Usage with API KEY: npx tsx scripts/scrape-places.ts --city City --state State");
        process.exit(1);
    }

    console.log(`🔍 Searching in ${cityArg}, ${stateArg}...`);

    const state = await prisma.state.findFirst({ where: { OR: [{ abbreviation: stateArg }, { name: stateArg }] } });
    if (!state) throw new Error("State not found");

    const citySlug = slugify(cityArg, { lower: true, strict: true });
    const city = await prisma.city.findFirst({ where: { stateId: state.id, slug: citySlug } });
    if (!city) throw new Error("City not found");

    const therapies = await prisma.therapy.findMany();
    const allPlaces = new Map<string, PlaceResult>();

    // Search
    for (const query of THERAPY_SEARCH_QUERIES) {
        try {
            const places = await searchPlaces(query, city.name, state.abbreviation);
            places.forEach(p => allPlaces.set(p.id, p));
            await new Promise(r => setTimeout(r, 200));
        } catch (e) {
            console.error(e);
        }
    }

    console.log(`📊 Saving ${allPlaces.size} providers...`);

    for (const place of allPlaces.values()) {
        try {
            const provider = await upsertProvider(place, city.id, state.id, city.slug);
            await linkProviderToTherapies(provider.id, place, therapies);
        } catch (error) {
            console.error(`Error saving ${place.displayName.text}:`, error);
        }
    }

    console.log("✅ Done.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
