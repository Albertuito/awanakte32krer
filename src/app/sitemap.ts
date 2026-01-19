import prisma from "@/lib/prisma";
import { MetadataRoute } from "next";

const BASE_URL = "https://therapydb.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const states = await prisma.state.findMany({
        include: {
            cities: {
                include: {
                    neighborhoods: true,
                },
            },
        },
    });

    const therapies = await prisma.therapy.findMany();

    const routes: MetadataRoute.Sitemap = [];

    // Static pages
    routes.push(
        { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
        { url: `${BASE_URL}/therapists`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
        { url: `${BASE_URL}/therapy`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 }
    );

    // Therapy hub pages
    for (const therapy of therapies) {
        routes.push({
            url: `${BASE_URL}/therapy/${therapy.slug}`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.8,
        });
    }

    // State, city, and neighborhood pages
    for (const state of states) {
        const stateAbbr = state.abbreviation.toLowerCase();

        // State page
        routes.push({
            url: `${BASE_URL}/therapists/${stateAbbr}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
        });

        // City pages
        for (const city of state.cities) {
            routes.push({
                url: `${BASE_URL}/therapists/${stateAbbr}/${city.slug}`,
                lastModified: new Date(),
                changeFrequency: "weekly",
                priority: 0.7,
            });

            // Neighborhood pages
            for (const hood of city.neighborhoods) {
                routes.push({
                    url: `${BASE_URL}/therapists/${stateAbbr}/${city.slug}/${hood.slug}`,
                    lastModified: new Date(),
                    changeFrequency: "weekly",
                    priority: 0.7, // Neighborhood page priority
                });
            }

            // City + Therapy pages (pillar pages - highest SEO value)
            for (const therapy of therapies) {
                routes.push({
                    url: `${BASE_URL}/therapists/${stateAbbr}/${city.slug}/${therapy.slug}`,
                    lastModified: new Date(),
                    changeFrequency: "weekly",
                    priority: 0.9,
                });
            }
        }
    }

    return routes;
}
