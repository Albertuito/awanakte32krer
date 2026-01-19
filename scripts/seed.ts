import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import slugify from "slugify";
import path from "path";

// Configure SQLite adapter factory for Prisma 7
// Prisma CLI creates dev.db in the root directory
const dbPath = path.join(process.cwd(), "dev.db");
console.log("📁 Connecting to DB at:", dbPath);
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapterFactory } as any);

// Canonical therapy slugs with SEO-friendly naming
const therapies = [
    { name: "Cognitive Behavioral Therapy", slug: "cbt-therapy", synonyms: ["CBT", "cognitive therapy", "behavioral therapy"] },
    { name: "EMDR Therapy", slug: "emdr-therapy", synonyms: ["EMDR", "eye movement desensitization"] },
    { name: "Couples Therapy", slug: "couples-therapy", synonyms: ["marriage counseling", "relationship therapy", "couples counseling"] },
    { name: "Family Therapy", slug: "family-therapy", synonyms: ["family counseling", "systemic therapy"] },
    { name: "Anxiety Therapy", slug: "anxiety-therapy", synonyms: ["anxiety treatment", "anxiety counseling", "GAD therapy"] },
    { name: "Depression Therapy", slug: "depression-therapy", synonyms: ["depression treatment", "depression counseling"] },
    { name: "Trauma Therapy", slug: "trauma-therapy", synonyms: ["trauma treatment", "PTSD therapy", "trauma counseling"] },
    { name: "Child Therapy", slug: "child-therapy", synonyms: ["child counseling", "play therapy", "pediatric therapy"] },
    { name: "Teen Therapy", slug: "teen-therapy", synonyms: ["adolescent therapy", "teen counseling"] },
    { name: "Group Therapy", slug: "group-therapy", synonyms: ["group counseling", "support groups"] },
    { name: "Addiction Therapy", slug: "addiction-therapy", synonyms: ["substance abuse therapy", "addiction counseling", "rehab therapy"] },
    { name: "Grief Therapy", slug: "grief-therapy", synonyms: ["grief counseling", "bereavement therapy", "loss counseling"] },
    { name: "Psychotherapy", slug: "psychotherapy", synonyms: ["talk therapy", "psychoanalysis"] },
    { name: "Art Therapy", slug: "art-therapy", synonyms: ["creative arts therapy", "expressive therapy"] },
    { name: "Online Therapy", slug: "online-therapy", synonyms: ["teletherapy", "virtual therapy", "remote counseling"] },
];

// Top 30 US cities by population for initial seed
const citiesData: { state: string; stateAbbr: string; cities: string[] }[] = [
    { state: "California", stateAbbr: "CA", cities: ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Fresno", "Sacramento", "Long Beach", "Oakland", "Santa Monica", "Irvine"] },
    { state: "Texas", stateAbbr: "TX", cities: ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington", "Plano"] },
    { state: "Florida", stateAbbr: "FL", cities: ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Fort Lauderdale"] },
    { state: "New York", stateAbbr: "NY", cities: ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany"] },
    { state: "Pennsylvania", stateAbbr: "PA", cities: ["Philadelphia", "Pittsburgh", "Allentown", "Reading"] },
    { state: "Illinois", stateAbbr: "IL", cities: ["Chicago", "Aurora", "Naperville", "Joliet"] },
    { state: "Ohio", stateAbbr: "OH", cities: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron"] },
    { state: "Georgia", stateAbbr: "GA", cities: ["Atlanta", "Augusta", "Columbus", "Savannah"] },
    { state: "North Carolina", stateAbbr: "NC", cities: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem"] },
    { state: "Michigan", stateAbbr: "MI", cities: ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Ann Arbor"] },
    { state: "New Jersey", stateAbbr: "NJ", cities: ["Newark", "Jersey City", "Paterson", "Elizabeth"] },
    { state: "Virginia", stateAbbr: "VA", cities: ["Virginia Beach", "Norfolk", "Chesapeake", "Richmond", "Arlington"] },
    { state: "Washington", stateAbbr: "WA", cities: ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue"] },
    { state: "Arizona", stateAbbr: "AZ", cities: ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Gilbert"] },
    { state: "Massachusetts", stateAbbr: "MA", cities: ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell"] },
    { state: "Tennessee", stateAbbr: "TN", cities: ["Nashville", "Memphis", "Knoxville", "Chattanooga"] },
    { state: "Indiana", stateAbbr: "IN", cities: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend"] },
    { state: "Missouri", stateAbbr: "MO", cities: ["Kansas City", "St. Louis", "Springfield", "Columbia"] },
    { state: "Maryland", stateAbbr: "MD", cities: ["Baltimore", "Frederick", "Rockville", "Gaithersburg"] },
    { state: "Wisconsin", stateAbbr: "WI", cities: ["Milwaukee", "Madison", "Green Bay", "Kenosha"] },
    { state: "Colorado", stateAbbr: "CO", cities: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Boulder"] },
    { state: "Minnesota", stateAbbr: "MN", cities: ["Minneapolis", "St. Paul", "Rochester", "Duluth"] },
    { state: "South Carolina", stateAbbr: "SC", cities: ["Charleston", "Columbia", "North Charleston", "Greenville"] },
    { state: "Alabama", stateAbbr: "AL", cities: ["Birmingham", "Montgomery", "Huntsville", "Mobile"] },
    { state: "Louisiana", stateAbbr: "LA", cities: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette"] },
    { state: "Kentucky", stateAbbr: "KY", cities: ["Louisville", "Lexington", "Bowling Green"] },
    { state: "Oregon", stateAbbr: "OR", cities: ["Portland", "Salem", "Eugene", "Gresham"] },
    { state: "Oklahoma", stateAbbr: "OK", cities: ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow"] },
    { state: "Connecticut", stateAbbr: "CT", cities: ["Bridgeport", "New Haven", "Stamford", "Hartford"] },
    { state: "Nevada", stateAbbr: "NV", cities: ["Las Vegas", "Henderson", "Reno", "North Las Vegas"] },
];

async function main() {
    console.log("🌱 Starting seed...");

    // Seed Therapies
    console.log("📋 Seeding therapies...");
    for (const therapy of therapies) {
        await prisma.therapy.upsert({
            where: { slug: therapy.slug },
            update: { name: therapy.name, synonyms: JSON.stringify(therapy.synonyms) },
            create: { name: therapy.name, slug: therapy.slug, synonyms: JSON.stringify(therapy.synonyms) },
        });
    }
    console.log(`✅ Seeded ${therapies.length} therapies`);

    // Seed States and Cities
    console.log("🏙️ Seeding states and cities...");
    let totalCities = 0;
    for (const stateData of citiesData) {
        const stateSlug = slugify(stateData.state, { lower: true, strict: true });

        const state = await prisma.state.upsert({
            where: { abbreviation: stateData.stateAbbr },
            update: { name: stateData.state, slug: stateSlug },
            create: { name: stateData.state, slug: stateSlug, abbreviation: stateData.stateAbbr },
        });

        for (const cityName of stateData.cities) {
            const citySlug = slugify(cityName, { lower: true, strict: true });
            await prisma.city.upsert({
                where: { stateId_slug: { stateId: state.id, slug: citySlug } },
                update: { name: cityName },
                create: { name: cityName, slug: citySlug, stateId: state.id },
            });
            totalCities++;
        }
    }
    console.log(`✅ Seeded ${citiesData.length} states and ${totalCities} cities`);

    console.log("🎉 Seed completed!");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
