import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapterFactory } as any);

// Keywords that identify a general mental health professional
const GENERALIST_KEYWORDS = [
    "psychologist",
    "psychotherapist",
    "counselor",
    "therapist",
    "mental health",
    "social worker",
    "lcsw",
    "lmft",
    "psychiatrist"
];

// Therapies that most generalists likely treat (Core Therapies)
const CORE_THERAPIES = [
    "Anxiety Therapy",
    "Depression Therapy",
    "Stress Management",
    "Individual Therapy",
    "Cognitive Behavioral Therapy"
];

// Specific Keywords for other therapies
const SPECIFIC_THERAPY_KEYWORDS: Record<string, string[]> = {
    "Marriage Counseling": ["marriage", "couple", "relationship", "family", "marital", "divorce"],
    "Family Therapy": ["family", "parenting", "child", "adolescent", "teen", "youth"],
    "Child Therapy": ["child", "adolescent", "teen", "youth", "pediatric", "play therapy"],
    "Trauma Therapy": ["trauma", "ptsd", "emdr", "abuse"],
    "Addiction Therapy": ["addiction", "substance", "alcohol", "drug", "rehab", "recovery", "sobriety"],
    "Grief Counseling": ["grief", "loss", "bereavement"],
    "Eating Disorder Therapy": ["eating disorder", "anorexia", "bulimia", "binge"]
};

async function main() {
    console.log("🔄 Starting provider relinking process...");

    const providers = await prisma.provider.findMany();
    const therapies = await prisma.therapy.findMany();

    console.log(`Found ${providers.length} providers and ${therapies.length} therapies.`);

    let validConnects = 0;

    for (const provider of providers) {
        // Construct a search text blob from name and existing source data types (if feasible)
        // Note: provider.sourceData is a JSON string stringified from scraper
        let providerText = provider.name.toLowerCase();

        let types: string[] = [];
        try {
            if (provider.sourceData) {
                const data = JSON.parse(provider.sourceData);
                if (data.types) types = data.types;
                // Add types to text
                providerText += " " + types.join(" ").toLowerCase();
            }
        } catch (e) { }

        // Determine if provider is a generalist
        const isGeneralist = GENERALIST_KEYWORDS.some(k => providerText.includes(k.toLowerCase()));

        for (const therapy of therapies) {
            let score = 0;
            const tName = therapy.name;

            // 1. Direct Keyword Match (High Confidence)
            const synonyms: string[] = therapy.synonyms ? JSON.parse(therapy.synonyms) : [];
            const allKeywords = [tName.toLowerCase(), ...synonyms.map(s => s.toLowerCase()), ...(SPECIFIC_THERAPY_KEYWORDS[tName] || [])];

            const hasKeywordMatch = allKeywords.some(k => providerText.includes(k.toLowerCase()));

            if (hasKeywordMatch) {
                score = 0.9;
            }
            // 2. Generalist Inference (Medium Confidence for Core Therapies)
            else if (isGeneralist && CORE_THERAPIES.includes(tName)) {
                score = 0.6;
            }

            if (score > 0) {
                await prisma.providerTherapy.upsert({
                    where: {
                        providerId_therapyId: {
                            providerId: provider.id,
                            therapyId: therapy.id,
                        },
                    },
                    update: {
                        confidenceScore: { set: score } // Update score if we are re-running logic
                    },
                    create: {
                        providerId: provider.id,
                        therapyId: therapy.id,
                        confidenceScore: score,
                    },
                });
                validConnects++;
            }
        }
    }

    console.log(`✅ Relinking complete. Processed ${validConnects} potential links.`);

    // Check new counts
    const totalLinks = await prisma.providerTherapy.count();
    console.log(`🔗 Total active provider-therapy links in DB: ${totalLinks}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
