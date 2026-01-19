import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";

type Props = {
    params: Promise<{ state: string; city: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { state: stateParam, city: cityParam } = await params;

    const state = await prisma.state.findFirst({
        where: { abbreviation: stateParam.toUpperCase() },
    });
    if (!state) return { title: "Not Found" };

    const city = await prisma.city.findFirst({
        where: { stateId: state.id, slug: cityParam },
    });
    if (!city) return { title: "Not Found" };

    return {
        title: `Find Therapists in ${city.name}, ${state.abbreviation} | Mental Health Directory`,
        description: `Browse licensed therapists, psychologists, and mental health counselors in ${city.name}, ${state.name}. Find specialists in CBT, anxiety therapy, couples counseling, and more.`,
    };
}

export default async function CityPage({ params }: Props) {
    const { state: stateParam, city: cityParam } = await params;

    const state = await prisma.state.findFirst({
        where: { abbreviation: stateParam.toUpperCase() },
    });
    if (!state) notFound();

    const city = await prisma.city.findFirst({
        where: { stateId: state.id, slug: cityParam },
    });
    if (!city) notFound();

    const therapies = await prisma.therapy.findMany({
        orderBy: { name: "asc" },
    });

    const providers = await prisma.provider.findMany({
        where: { cityId: city.id },
        take: 10,
        orderBy: { rating: "desc" },
        include: {
            therapies: {
                include: { therapy: true },
            },
        },
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
                    <Link href={`/therapists/${state.abbreviation.toLowerCase()}`} className="hover:text-foreground">
                        {state.name}
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="text-foreground">{city.name}</span>
                </nav>

                {/* Header */}
                <header className="mb-12">
                    <h1 className="mb-4 text-3xl font-bold md:text-4xl">
                        Therapists in <span className="gradient-text">{city.name}, {state.abbreviation}</span>
                    </h1>
                    <p className="max-w-2xl text-lg text-muted">
                        Find licensed mental health professionals in {city.name}.
                        Browse by therapy type to find a specialist that matches your needs.
                    </p>
                </header>

                {/* Therapy Types Links */}
                <section className="mb-12">
                    <h2 className="mb-6 text-xl font-semibold">Find Specialists By Therapy Type</h2>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {therapies.map((therapy) => (
                            <Link
                                key={therapy.id}
                                href={`/therapists/${state.abbreviation.toLowerCase()}/${city.slug}/${therapy.slug}`}
                                className="glass-card p-4"
                            >
                                <h3 className="font-medium">{therapy.name}</h3>
                                <p className="text-sm text-muted">
                                    in {city.name} →
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Providers List */}
                {providers.length > 0 && (
                    <section>
                        <h2 className="mb-6 text-xl font-semibold">Top Rated Therapists</h2>
                        <div className="space-y-4">
                            {providers.map((provider) => (
                                <Link
                                    key={provider.id}
                                    href={`/provider/${provider.slug}`}
                                    className="glass-card block p-6"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="mb-1 text-lg font-semibold">{provider.name}</h3>
                                            <p className="mb-2 text-sm text-muted">{provider.address}</p>
                                            {provider.therapies.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {provider.therapies.slice(0, 3).map((pt) => (
                                                        <span
                                                            key={pt.therapyId}
                                                            className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
                                                        >
                                                            {pt.therapy.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {provider.rating && (
                                            <div className="text-right">
                                                <div className="text-xl font-bold text-accent">{provider.rating.toFixed(1)}</div>
                                                <div className="text-xs text-muted">
                                                    {provider.reviewCount} reviews
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {providers.length === 0 && (
                    <section className="rounded-lg border border-border/50 bg-card/50 p-8 text-center">
                        <p className="text-muted">
                            We're still building our directory for {city.name}.
                            Check back soon or browse nearby cities.
                        </p>
                    </section>
                )}
            </div>
        </div>
    );
}
