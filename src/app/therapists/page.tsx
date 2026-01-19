import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import TherapistsPageClient from "./TherapistsPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Find Therapists by State | TherapyDB Directory",
    description:
        "Browse licensed therapists across all 50 US states. Search by state, city, or therapy type to find mental health professionals near you.",
};

export default async function TherapistsIndexPage() {
    const states = await prisma.state.findMany({
        orderBy: { name: "asc" },
        include: {
            _count: { select: { cities: true, providers: true } },
        },
    });

    // Get featured cities (major metro areas)
    const featuredCities = await prisma.city.findMany({
        where: {
            name: {
                in: ["Los Angeles", "New York City", "Chicago", "Houston", "Miami", "San Francisco", "Boston", "Seattle"]
            }
        },
        include: {
            state: {
                select: { abbreviation: true, name: true }
            }
        },
        take: 8
    });

    // Get totals
    const totalProviders = await prisma.provider.count();
    const totalCities = await prisma.city.count();

    return (
        <TherapistsPageClient
            states={states}
            featuredCities={featuredCities}
            totalProviders={totalProviders}
            totalCities={totalCities}
        />
    );
}
