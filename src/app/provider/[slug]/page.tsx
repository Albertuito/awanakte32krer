import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";

type Props = {
    params: Promise<{ slug: string }>;
};

export const revalidate = 86400; // Revalidate every 24 hours (providers change less often)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    const provider = await prisma.provider.findFirst({
        where: { slug },
        include: { city: true, state: true },
    });

    if (!provider) return { title: "Provider Not Found" };

    const location = provider.city && provider.state
        ? `${provider.city.name}, ${provider.state.abbreviation}`
        : "";

    return {
        title: `${provider.name} ${location ? `| ${location}` : ""} | Therapist Profile`,
        description: `View profile for ${provider.name}${location ? ` in ${location}` : ""}. Read reviews, view specialties, and get contact information.`,
    };
}

export default async function ProviderPage({ params }: Props) {
    const { slug } = await params;

    const provider = await prisma.provider.findFirst({
        where: { slug },
        include: {
            city: {
                include: { state: true },
            },
            state: true,
            therapies: {
                include: { therapy: true },
            },
        },
    });

    if (!provider) notFound();

    const city = provider.city;
    const state = provider.state || city?.state;

    return (
        <div className="min-h-screen py-12">
            <div className="container max-w-4xl">
                {/* Breadcrumb */}
                <nav className="mb-8 text-sm text-muted">
                    <Link href="/" className="hover:text-foreground">Home</Link>
                    <span className="mx-2">/</span>
                    <Link href="/therapists" className="hover:text-foreground">Therapists</Link>
                    {state && (
                        <>
                            <span className="mx-2">/</span>
                            <Link
                                href={`/therapists/${state.abbreviation.toLowerCase()}`}
                                className="hover:text-foreground"
                            >
                                {state.name}
                            </Link>
                        </>
                    )}
                    {city && (
                        <>
                            <span className="mx-2">/</span>
                            <Link
                                href={`/therapists/${state?.abbreviation.toLowerCase()}/${city.slug}`}
                                className="hover:text-foreground"
                            >
                                {city.name}
                            </Link>
                        </>
                    )}
                    <span className="mx-2">/</span>
                    <span className="text-foreground">{provider.name}</span>
                </nav>

                {/* Provider Card with Schema.org */}
                <article
                    className="glass-card overflow-hidden animate-pulse-glow"
                    itemScope
                    itemType="https://schema.org/LocalBusiness"
                >
                    <div className="relative h-64 w-full md:h-80 bg-gray-100">
                        {provider.photoUrl ? (
                            <Image
                                src={provider.photoUrl.startsWith("/images/")
                                    ? provider.photoUrl
                                    : `/api/place-photo?name=${provider.photoUrl}`}
                                alt={provider.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                priority
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
                                <div className="text-center">
                                    <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <span className="text-4xl font-bold text-primary">
                                            {provider.name.charAt(0)}
                                        </span>
                                    </div>
                                    <span className="text-muted text-lg font-medium">Verified Provider</span>
                                </div>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-8 text-white">
                            <span className="mb-2 inline-block rounded-full bg-primary/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                                Verified Provider
                            </span>
                        </div>
                    </div>

                    <div className="p-8">
                        <header className="mb-6">
                            <h1 className="mb-2 text-3xl font-bold md:text-4xl" itemProp="name">
                                {provider.name}
                            </h1>
                            {provider.address && (
                                <p className="flex items-center gap-2 text-muted" itemProp="address">
                                    <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {provider.address}
                                </p>
                            )}
                        </header>

                        {/* Rating */}
                        {provider.rating && (
                            <div
                                className="mb-6 flex items-center gap-4"
                                itemProp="aggregateRating"
                                itemScope
                                itemType="https://schema.org/AggregateRating"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-3xl font-bold text-accent" itemProp="ratingValue">
                                        {provider.rating.toFixed(1)}
                                    </span>
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <svg
                                                key={i}
                                                className={`h-5 w-5 ${i < Math.round(provider.rating || 0)
                                                    ? "text-yellow-400"
                                                    : "text-gray-600"
                                                    }`}
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                </div>
                                <span className="text-sm text-muted">
                                    <span itemProp="reviewCount">{provider.reviewCount}</span> reviews
                                </span>
                                <meta itemProp="bestRating" content="5" />
                            </div>
                        )}

                        {/* Specialties */}
                        {provider.therapies.length > 0 && (
                            <section className="mb-6">
                                <h2 className="mb-3 text-sm font-medium text-muted">Specialties</h2>
                                <div className="flex flex-wrap gap-2">
                                    {provider.therapies.map((pt) => (
                                        <Link
                                            key={pt.therapyId}
                                            href={`/therapy/${pt.therapy.slug}`}
                                            className="rounded-full bg-primary/10 px-4 py-2 text-sm text-primary hover:bg-primary/20 transition-colors"
                                        >
                                            {pt.therapy.name}
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Contact Info */}
                        <section className="mb-6 grid gap-4 sm:grid-cols-2">
                            {provider.phone && (
                                <a
                                    href={`tel:${provider.phone}`}
                                    className="flex items-center gap-3 rounded-lg border border-border/50 p-4 transition-colors hover:border-primary/50"
                                    itemProp="telephone"
                                >
                                    <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span>{provider.phone}</span>
                                </a>
                            )}
                            {provider.website && (
                                <a
                                    href={provider.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 rounded-lg border border-border/50 p-4 transition-colors hover:border-primary/50"
                                    itemProp="url"
                                >
                                    <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                    </svg>
                                    <span>Visit Website</span>
                                </a>
                            )}
                        </section>

                        {/* Description */}
                        {provider.description && (
                            <section>
                                <h2 className="mb-3 text-sm font-medium text-muted">About</h2>
                                <p className="text-foreground leading-relaxed" itemProp="description">
                                    {provider.description}
                                </p>
                            </section>
                        )}
                    </div>
                </article>

                {/* Back Link */}
                {city && state && (
                    <div className="mt-8 text-center">
                        <Link
                            href={`/therapists/${state.abbreviation.toLowerCase()}/${city.slug}`}
                            className="text-primary hover:underline"
                        >
                            ← Back to therapists in {city.name}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
