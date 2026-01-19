import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import OpenAI from "openai";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapterFactory } as any);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateDescription(name: string, city: string, state: string, types: string[], therapies: string[]) {
    const prompt = `
        Write a professional, welcoming, and unique "About Us" description (approx 100-150 words) for a mental health provider named "${name}" located in ${city}, ${state}.
        
        Context:
        - Provider Type: ${types.join(", ")}
        - Specialties/Therapies: ${therapies.join(", ")}
        
        Tone: Compassionate, professional, trustworthy, medical but accessible.
        Focus on their commitment to patient well-being and individualized care.
        Do not invent specific credentials unless implied by the title (e.g. Dr. implies doctorate).
        Write in the third person.
    `;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 250,
    });

    return completion.choices[0].message.content || "";
}

async function main() {
    console.log("✨ Starting provider enrichment...");

    const args = process.argv.slice(2);
    const slugArg = args.find((val, index) => args[index - 1] === "--slug") || args.find(a => a.startsWith("--slug="))?.split("=")[1];
    const loopArg = args.includes("--loop");

    const where: any = {
        OR: [
            { description: null },
            { description: "" }
        ]
    };

    if (slugArg) {
        // If slug is provided, ignore the empty description check to force update
        delete where.OR;
        where.slug = slugArg;
        console.log(`🎯 Targeting specific provider: ${slugArg}`);

        // Find providers
        const providers = await prisma.provider.findMany({
            where,
            include: {
                city: true,
                state: true,
                therapies: {
                    include: { therapy: true }
                }
            },
            take: 1
        });

        console.log(`Found ${providers.length} providers to enrich.`);

        for (const provider of providers) {
            if (!provider.city || !provider.state) continue;

            let types: string[] = [];
            try {
                if (provider.sourceData) {
                    const data = JSON.parse(provider.sourceData);
                    if (data.types) types = data.types;
                }
            } catch (e) { }

            const therapyNames = provider.therapies.map(t => t.therapy.name);

            console.log(`📝 Generating description for: ${provider.name}...`);

            try {
                const description = await generateDescription(
                    provider.name,
                    provider.city.name,
                    provider.state.name,
                    types,
                    therapyNames
                );

                await prisma.provider.update({
                    where: { id: provider.id },
                    data: { description }
                });

                // Respect rate limits slightly
                await new Promise(r => setTimeout(r, 200));

            } catch (error) {
                console.error(`Error enriching ${provider.name}:`, error);
            }
        }
    } else {
        // Loop mode or single run
        do {
            const count = await prisma.provider.count({ where });
            if (count === 0) {
                console.log("Rediscovering... no pending providers found.");
                if (!loopArg) break;
                await new Promise(r => setTimeout(r, 5000));
                continue;
            }

            const providers = await prisma.provider.findMany({
                where,
                include: {
                    city: true,
                    state: true,
                    therapies: {
                        include: { therapy: true }
                    }
                },
                take: 20 // Smaller batch for loop
            });

            console.log(`Processing batch of ${providers.length} (Remaining: ${count})...`);

            for (const provider of providers) {
                if (!provider.city || !provider.state) continue;

                let types: string[] = [];
                try {
                    if (provider.sourceData) {
                        const data = JSON.parse(provider.sourceData);
                        if (data.types) types = data.types;
                    }
                } catch (e) { }

                const therapyNames = provider.therapies.map(t => t.therapy.name);

                console.log(`📝 Generating description for: ${provider.name}...`);

                try {
                    const description = await generateDescription(
                        provider.name,
                        provider.city.name,
                        provider.state.name,
                        types,
                        therapyNames
                    );

                    await prisma.provider.update({
                        where: { id: provider.id },
                        data: { description }
                    });

                    // Respect rate limits slightly
                    await new Promise(r => setTimeout(r, 200));

                } catch (error) {
                    console.error(`Error enriching ${provider.name}:`, error);
                }
            }

            if (!loopArg) break;

        } while (true);
    }

    console.log("✅ Process complete.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
