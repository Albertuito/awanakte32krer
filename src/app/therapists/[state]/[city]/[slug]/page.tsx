import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";

type Props = {
    params: Promise<{ state: string; city: string; slug: string }>;
};

export const revalidate = 3600; // Revalidate every hour
export const dynamicParams = true; // Allow new pages to be generated on demand

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { state: stateParam, city: cityParam, slug: slugParam } = await params;

    const state = await prisma.state.findFirst({
        where: { abbreviation: stateParam.toUpperCase() },
    });
    if (!state) return { title: "Not Found" };

    const city = await prisma.city.findFirst({
        where: { stateId: state.id, slug: cityParam },
    });
    if (!city) return { title: "Not Found" };

    // 1. Try Therapy
    const therapy = await prisma.therapy.findFirst({ where: { slug: slugParam } });
    if (therapy) {
        return {
            title: `${therapy.name} in ${city.name}, ${state.abbreviation} | Find Local Specialists`,
            description: `Find licensed ${therapy.name} specialists in ${city.name}, ${state.name}. Compare ratings, read reviews, and connect with the right therapist for you.`,
        };
    }

    // 2. Try Neighborhood
    const neighborhood = await prisma.neighborhood.findFirst({
        where: { cityId: city.id, slug: slugParam }
    });
    if (neighborhood) {
        return {
            title: `Therapists in ${neighborhood.name} (${city.name}) | Find Local Specialists`,
            description: `Find top-rated therapists and counselors in ${neighborhood.name}, ${city.name}. Local experts for anxiety, depression, and more in ${neighborhood.name}.`,
        };
    }

    return { title: "Not Found" };
}

export default async function CitySlugPage({ params }: Props) {
    const { state: stateParam, city: cityParam, slug: slugParam } = await params;

    const state = await prisma.state.findFirst({
        where: { abbreviation: stateParam.toUpperCase() },
    });
    if (!state) notFound();

    const city = await prisma.city.findFirst({
        where: { stateId: state.id, slug: cityParam },
    });
    if (!city) notFound();

    // Check if it is a Therapy
    const therapy = await prisma.therapy.findFirst({
        where: { slug: slugParam },
    });

    // Check if it is a Neighborhood
    const neighborhood = !therapy ? await prisma.neighborhood.findFirst({
        where: { cityId: city.id, slug: slugParam }
    }) : null;

    if (!therapy && !neighborhood) {
        notFound();
    }

    // Fetch AI Content if it's a therapy page
    // Construct Key: /therapists/[state]/[city]/[therapy-slug]
    const contentKey = therapy
        ? `/therapists/${state.abbreviation.toLowerCase()}/${city.slug}/${therapy.slug}`
        : null;

    const aiContent = contentKey ? await prisma.pageContent.findUnique({
        where: { key: contentKey }
    }) : null;

    // Fetch Providers
    let providers: any[] = [];
    let title = "";
    let subtitle = "";

    if (therapy) {
        title = `${therapy.name} in ${city.name}`;
        subtitle = `Find licensed ${therapy.name.toLowerCase()} specialists in ${city.name}, ${state.name}.`;
        providers = await prisma.provider.findMany({
            where: {
                cityId: city.id,
                therapies: { some: { therapyId: therapy.id } },
            },
            orderBy: { rating: "desc" },
            include: { therapies: { include: { therapy: true } } },
        });
    } else if (neighborhood) {
        title = `Therapists in ${neighborhood.name}`;
        subtitle = `Top rated mental health professionals serving the ${neighborhood.name} area in ${city.name}.`;
        providers = await prisma.provider.findMany({
            where: {
                cityId: city.id,
                neighborhoodId: neighborhood.id
            },
            orderBy: { rating: "desc" },
            include: { therapies: { include: { therapy: true } } },
        });
    }

    // If generic neighborhood page, generic related therapies
    const relatedTherapies = await prisma.therapy.findMany({
        where: therapy ? { id: { not: therapy.id } } : {},
        take: 6,
    });

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-primary-light via-white to-green-50 py-12">
                <div className="container">
                    {/* Breadcrumb */}
                    <nav className="mb-6 text-sm" aria-label="Breadcrumb">
                        <ol className="flex flex-wrap items-center gap-2" itemScope itemType="https://schema.org/BreadcrumbList">
                            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                                <Link href="/" itemProp="item" className="text-muted hover:text-primary">
                                    <span itemProp="name">Home</span>
                                </Link>
                                <meta itemProp="position" content="1" />
                            </li>
                            <span className="text-muted">/</span>
                            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                                <Link href={`/therapists/${state.abbreviation.toLowerCase()}`} itemProp="item" className="text-muted hover:text-primary">
                                    <span itemProp="name">{state.name}</span>
                                </Link>
                                <meta itemProp="position" content="2" />
                            </li>
                            <span className="text-muted">/</span>
                            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                                <Link href={`/therapists/${state.abbreviation.toLowerCase()}/${city.slug}`} itemProp="item" className="text-muted hover:text-primary">
                                    <span itemProp="name">{city.name}</span>
                                </Link>
                                <meta itemProp="position" content="3" />
                            </li>
                            <span className="text-muted">/</span>
                            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                                <span itemProp="name" className="text-foreground font-medium">
                                    {therapy ? therapy.name : neighborhood?.name}
                                </span>
                                <meta itemProp="position" content="4" />
                            </li>
                        </ol>
                    </nav>

                    <div className="grid gap-8 md:grid-cols-2 items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-full">
                                    {city.name}, {state.abbreviation}
                                    {neighborhood && ` • ${neighborhood.name}`}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                                {therapy ? <span className="text-primary">{therapy.name}</span> : <span className="text-primary">Therapists</span>}
                                {therapy ? ` in ${city.name}` : ` in ${neighborhood!.name}`}
                            </h1>
                            <p className="text-lg text-muted mb-6">
                                {subtitle}
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <a href="#providers" className="btn-primary">
                                    View {providers?.length || 0} Providers
                                </a>
                                {therapy && (
                                    <Link href={`/therapy/${therapy.slug}`} className="px-6 py-3 border border-border bg-white rounded-lg font-medium hover:border-primary transition-colors">
                                        Learn About {therapy.name}
                                    </Link>
                                )}
                            </div>
                        </div>
                        {therapy && (
                            <div className="relative hidden md:block">
                                <Image
                                    src="/images/therapy-hero.png"
                                    alt={`${therapy.name} in ${city.name}`}
                                    width={500}
                                    height={350}
                                    className="rounded-2xl shadow-lg"
                                />
                            </div>
                        )}
                        {!therapy && (
                            <div className="relative hidden md:block bg-gradient-to-br from-teal-50 to-green-100 rounded-2xl h-[300px] w-full flex items-center justify-center border border-primary/5">
                                <div className="text-center p-8">
                                    <h3 className="text-2xl font-bold text-primary/40 mb-2">{city.name}</h3>
                                    <div className="text-4xl font-bold text-primary/60">{neighborhood?.name}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Quick Info Bar */}
            <section className="py-6 bg-white border-y border-border">
                <div className="container">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-bold text-foreground">{providers?.length || "Coming Soon"}</div>
                                <div className="text-sm text-muted">Local Providers</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-bold text-foreground">Licensed</div>
                                <div className="text-sm text-muted">& Verified</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-bold text-foreground">Top Rated</div>
                                <div className="text-sm text-muted">Professionals</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-bold text-foreground">Quick</div>
                                <div className="text-sm text-muted">Appointments</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Content or Static Fallback */}
            {therapy && (
                <section className="py-12">
                    <div className="container">
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
                                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                                    <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    About {therapy.name} in {city.name}
                                </h2>

                                {aiContent ? (
                                    <div
                                        className="prose prose-slate max-w-none prose-headings:text-foreground prose-p:text-muted prose-strong:text-foreground prose-li:text-muted"
                                        dangerouslySetInnerHTML={{ __html: aiContent.html }}
                                    />
                                ) : (
                                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                                        <div className="bg-gray-50 rounded-xl p-5">
                                            <h3 className="font-semibold text-foreground mb-2">What is {therapy.name}?</h3>
                                            <p className="text-muted text-sm leading-relaxed">
                                                {therapy.name} is a specialized form of psychotherapy that helps individuals understand and manage their thoughts, emotions, and behaviors through evidence-based techniques.
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-5">
                                            <h3 className="font-semibold text-foreground mb-2">Why {city.name}?</h3>
                                            <p className="text-muted text-sm leading-relaxed">
                                                {city.name} offers a range of licensed {therapy.name.toLowerCase()} specialists who understand the unique needs and challenges of the local community.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Providers List (Common) */}
            <section id="providers" className="py-12 bg-gray-50">
                <div className="container">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-foreground mb-3">
                            Local Specialists
                        </h2>
                        <p className="text-muted">
                            {providers && providers.length > 0
                                ? `Found ${providers.length} providers matching your criteria`
                                : `No providers found in this specific area yet.`}
                        </p>
                    </div>

                    {providers && providers.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" itemScope itemType="https://schema.org/ItemList">
                            {providers.map((provider, index) => (
                                <article
                                    key={provider.id}
                                    className="bg-white rounded-xl border border-border p-6 hover:border-primary hover:shadow-lg transition-all"
                                    itemProp="itemListElement"
                                    itemScope
                                    itemType="https://schema.org/ListItem"
                                >
                                    <meta itemProp="position" content={String(index + 1)} />
                                    <div itemProp="item" itemScope itemType="https://schema.org/LocalBusiness">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                                                <span className="text-xl font-bold text-primary">
                                                    {provider.name.charAt(0)}
                                                </span>
                                            </div>
                                            {provider.rating && (
                                                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg" itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
                                                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                    <span className="font-semibold text-foreground" itemProp="ratingValue">{provider.rating.toFixed(1)}</span>
                                                    <span className="text-xs text-muted">(<span itemProp="reviewCount">{provider.reviewCount}</span>)</span>
                                                    <meta itemProp="bestRating" content="5" />
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-lg text-foreground mb-1" itemProp="name">{provider.name}</h3>
                                        <p className="text-sm text-muted mb-3" itemProp="address">{provider.address}</p>
                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {provider.therapies.slice(0, 3).map((pt: any) => (
                                                <span key={pt.therapyId} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                                    {pt.therapy.name}
                                                </span>
                                            ))}
                                        </div>
                                        <Link href={`/provider/${provider.slug}`} className="block w-full text-center py-2 border border-primary text-primary font-medium rounded-lg hover:bg-primary hover:text-white transition-colors">
                                            View Profile
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-border p-8 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Building Our Directory</h3>
                            <p className="text-muted mb-6">
                                We&apos;re actively adding {therapy ? therapy.name.toLowerCase() : neighborhood!.name} specialists in {city.name}.
                                Check back soon or explore other therapy types.
                            </p>
                            <Link href={`/therapists/${stateParam}/${cityParam}`} className="btn-primary inline-block">
                                Browse All Therapists in {city.name}
                            </Link>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
