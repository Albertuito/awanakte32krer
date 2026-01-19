import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";

type Props = {
    params: Promise<{ state: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { state: stateParam } = await params;
    const state = await prisma.state.findFirst({
        where: { abbreviation: stateParam.toUpperCase() },
    });

    if (!state) return { title: "State Not Found" };

    return {
        title: `Find Therapists in ${state.name} | Mental Health Directory`,
        description: `Browse licensed therapists, psychologists, and counselors in ${state.name}. Find mental health professionals in cities across ${state.abbreviation}.`,
    };
}

export default async function StatePage({ params }: Props) {
    const { state: stateParam } = await params;
    const state = await prisma.state.findFirst({
        where: { abbreviation: stateParam.toUpperCase() },
        include: {
            cities: {
                orderBy: { name: "asc" },
                include: {
                    _count: { select: { providers: true } },
                },
            },
        },
    });

    if (!state) notFound();

    const therapies = await prisma.therapy.findMany({
        orderBy: { name: "asc" },
    });

    return (
        <div className="min-h-screen py-12">
            <div className="container">
                {/* Breadcrumb */}
                <nav className="mb-8 text-sm text-muted">
                    <Link href="/" className="hover:text-foreground">Home</Link>
                    <span className="mx-2">/</span>
                    <Link href="/therapists" className="hover:text-foreground">Therapists</Link>
                    <span className="mx-2">/</span>
                    <span className="text-foreground">{state.name}</span>
                </nav>

                {/* Header */}
                <header className="mb-12">
                    <h1 className="mb-4 text-3xl font-bold md:text-4xl">
                        Therapists in <span className="gradient-text">{state.name}</span>
                    </h1>
                    <p className="max-w-2xl text-lg text-muted">
                        Find licensed mental health professionals across {state.cities.length} cities in {state.abbreviation}.
                        Browse by city or therapy type to find the right match.
                    </p>
                </header>

                {/* Cities Grid */}
                <section className="mb-16">
                    <h2 className="mb-6 text-xl font-semibold">Cities in {state.name}</h2>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {state.cities.map((city) => (
                            <Link
                                key={city.id}
                                href={`/therapists/${state.abbreviation.toLowerCase()}/${city.slug}`}
                                className="glass-card p-4"
                            >
                                <h3 className="font-medium">{city.name}</h3>
                                <p className="text-sm text-muted">
                                    {city._count.providers > 0
                                        ? `${city._count.providers} providers`
                                        : "Explore therapists"}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Therapy Types in State */}
                <section>
                    <h2 className="mb-6 text-xl font-semibold">
                        Therapy Types in {state.name}
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {therapies.map((therapy) => (
                            <Link
                                key={therapy.id}
                                href={`/therapists/${state.abbreviation.toLowerCase()}/${state.cities[0]?.slug}/${therapy.slug}`}
                                className="rounded-lg border border-border/50 p-3 transition-colors hover:border-primary/50 hover:bg-card"
                            >
                                <span className="text-sm">{therapy.name}</span>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
