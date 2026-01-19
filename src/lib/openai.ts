/**
 * OpenAI Content Generation Service
 * 
 * Generates SEO-optimized, structured HTML content for therapy directory pages
 * with version tracking and prompt hashing for quality control.
 */

import OpenAI from "openai";
import crypto from "crypto";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Current version for tracking - increment when prompts change significantly
const CONTENT_VERSION = "2.0.0";

export type PageType = "city_therapy" | "therapy_hub" | "city" | "provider";

interface ContentGenerationResult {
    content: string;
    version: string;
    promptHash: string;
    tokensUsed: number;
}

function hashPrompt(prompt: string): string {
    return crypto.createHash("md5").update(prompt).digest("hex").slice(0, 12);
}

/**
 * Generate structured HTML content for a City + Therapy pillar page
 */
export async function generateCityTherapyContent(
    therapyName: string,
    cityName: string,
    stateName: string,
    stateAbbr: string
): Promise<ContentGenerationResult> {
    const prompt = `Write SEO-optimized HTML content for a page about "${therapyName}" services in ${cityName}, ${stateName}.

STRUCTURE REQUIREMENTS:
- Start with an <h3> subheading about ${therapyName} in ${cityName}
- Include 2-3 <p> paragraphs with specific, valuable information
- Use <strong> tags to highlight key terms and benefits
- Include a <ul> list with 3-4 common issues ${therapyName} helps with
- Add another <h3> about "Finding the Right ${therapyName} Specialist"
- End with an encouraging <p> paragraph

CONTENT REQUIREMENTS:
- Total length: 250-350 words
- Focus on helping people in ${cityName} understand ${therapyName}
- Include specific benefits and what to expect
- Use a warm, professional, empathetic tone
- Write in second person ("you") to connect with readers
- Do NOT invent statistics or specific provider names

EXAMPLE OUTPUT FORMAT:
<h3>Understanding [Therapy] in [City]</h3>
<p>Opening paragraph with <strong>key benefits</strong> highlighted...</p>
<p>Second paragraph about how it works...</p>
<h3>Common Issues Treated</h3>
<ul>
<li><strong>Issue 1</strong> - brief description</li>
<li><strong>Issue 2</strong> - brief description</li>
</ul>
<h3>Finding Your Specialist</h3>
<p>Closing paragraph with call to action...</p>

OUTPUT: Only the HTML content, no code blocks or markdown.`;

    const promptHash = hashPrompt(prompt);

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are a mental health content writer creating SEO-optimized, structured HTML content for a therapy directory. Output clean HTML with semantic tags. Never use markdown formatting.",
            },
            { role: "user", content: prompt },
        ],
        max_tokens: 800,
        temperature: 0.7,
    });

    return {
        content: completion.choices[0].message.content || "",
        version: CONTENT_VERSION,
        promptHash,
        tokensUsed: completion.usage?.total_tokens || 0,
    };
}

/**
 * Generate structured HTML content for a Therapy Hub page (evergreen guide)
 */
export async function generateTherapyHubContent(
    therapyName: string,
    synonyms: string[]
): Promise<ContentGenerationResult> {
    const prompt = `Write an SEO-optimized HTML guide about "${therapyName}" for a mental health directory.

Also known as: ${synonyms.length > 0 ? synonyms.join(", ") : "N/A"}

STRUCTURE REQUIREMENTS:
- Start with <h3>What is ${therapyName}?</h3>
- Include 2 informative <p> paragraphs with <strong> for key terms
- Add <h3>How ${therapyName} Works</h3> with explanation
- Include <h3>Who Can Benefit</h3> with a <ul> list of 4-5 conditions/situations
- Add <h3>What to Expect in Sessions</h3>
- End with encouraging paragraph

CONTENT REQUIREMENTS:
- Total length: 350-450 words
- Educational and informative tone
- Explain the therapy approach clearly
- Use <strong> for important terms
- Write in second person ("you")
- Do NOT make specific effectiveness claims with numbers

OUTPUT: Only clean HTML content, no code blocks or markdown.`;

    const promptHash = hashPrompt(prompt);

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are a mental health educator creating clear, structured HTML content about therapy types. Output semantic HTML with proper heading hierarchy. Never use markdown.",
            },
            { role: "user", content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
    });

    return {
        content: completion.choices[0].message.content || "",
        version: CONTENT_VERSION,
        promptHash,
        tokensUsed: completion.usage?.total_tokens || 0,
    };
}

/**
 * Generate a structured description for a provider profile
 */
export async function generateProviderDescription(
    providerName: string,
    therapyTypes: string[],
    cityName: string,
    stateName: string
): Promise<ContentGenerationResult> {
    const prompt = `Write a structured HTML description for a mental health provider profile.

Provider: ${providerName}
Specialties: ${therapyTypes.join(", ")}
Location: ${cityName}, ${stateName}

STRUCTURE REQUIREMENTS:
- One <p> paragraph introducing the practice (60-80 words)
- A <h4>Specialties</h4> with brief <ul> list
- One <p> paragraph about their approach (40-60 words)

CONTENT REQUIREMENTS:
- Professional and welcoming tone
- Do NOT invent credentials, degrees, or years
- Use <strong> for the practice name and key specialties
- Use third person

OUTPUT: Only clean HTML content.`;

    const promptHash = hashPrompt(prompt);

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are writing structured HTML descriptions for mental health provider profiles. Output clean HTML. Never invent specific credentials.",
            },
            { role: "user", content: prompt },
        ],
        max_tokens: 400,
        temperature: 0.6,
    });

    return {
        content: completion.choices[0].message.content || "",
        version: CONTENT_VERSION,
        promptHash,
        tokensUsed: completion.usage?.total_tokens || 0,
    };
}

/**
 * Generate structured content for a City page
 */
export async function generateCityContent(
    cityName: string,
    stateName: string,
    therapyCount: number
): Promise<ContentGenerationResult> {
    const prompt = `Write structured HTML introduction for a page listing mental health services in ${cityName}, ${stateName}.

STRUCTURE:
- <h3>Mental Health Services in ${cityName}</h3>
- One <p> paragraph (80-100 words) with <strong> for key points
- <ul> with 3-4 popular therapy types as <li> items

CONTENT:
- Mention ${therapyCount} types of therapy available
- Be welcoming as a professional healthcare resource
- Use "you" to connect with readers

OUTPUT: Only clean HTML.`;

    const promptHash = hashPrompt(prompt);

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are writing brief, structured HTML introductions for city pages in a mental health directory.",
            },
            { role: "user", content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
    });

    return {
        content: completion.choices[0].message.content || "",
        version: CONTENT_VERSION,
        promptHash,
        tokensUsed: completion.usage?.total_tokens || 0,
    };
}
