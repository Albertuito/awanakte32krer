import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";

type Props = {
    params: Promise<{ therapy: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { therapy: therapyParam } = await params;

    const therapy = await prisma.therapy.findFirst({
        where: { slug: therapyParam },
    });

    if (!therapy) return { title: "Therapy Not Found" };

    return {
        title: `${therapy.name} | Complete Guide & Find Specialists`,
        description: `Comprehensive guide to ${therapy.name}. Learn how it works, who it helps, what to expect, and find licensed specialists near you.`,
    };
}

export default async function TherapyHubPage({ params }: Props) {
    const { therapy: therapyParam } = await params;

    const therapy = await prisma.therapy.findFirst({
        where: { slug: therapyParam },
    });

    if (!therapy) notFound();

    const states = await prisma.state.findMany({
        orderBy: { name: "asc" },
        include: {
            cities: {
                orderBy: { name: "asc" },
                take: 5,
            },
        },
    });

    const otherTherapies = await prisma.therapy.findMany({
        where: { id: { not: therapy.id } },
        take: 6,
    });

    const synonyms: string[] = therapy.synonyms ? JSON.parse(therapy.synonyms) : [];

    return (
        <div className="min-h-screen">
            {/* Hero Section with Image */}
            <section className="relative bg-gradient-to-br from-primary-light via-white to-green-50 py-16">
                <div className="container">
                    <nav className="mb-6 text-sm text-muted">
                        <Link href="/" className="hover:text-primary">Home</Link>
                        <span className="mx-2">/</span>
                        <Link href="/therapy" className="hover:text-primary">Therapy Types</Link>
                        <span className="mx-2">/</span>
                        <span className="text-foreground font-medium">{therapy.name}</span>
                    </nav>

                    <div className="grid gap-8 md:grid-cols-2 items-center">
                        <div>
                            <span className="inline-block px-3 py-1 mb-4 text-sm font-medium text-primary bg-primary/10 rounded-full">
                                Therapy Guide
                            </span>
                            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                                {therapy.name}
                            </h1>
                            <p className="text-lg text-muted mb-6">
                                Discover how {therapy.name.toLowerCase()} can help you achieve better mental health and emotional well-being.
                            </p>
                            {synonyms.length > 0 && (
                                <p className="text-sm text-muted mb-6">
                                    <strong>Also known as:</strong> {synonyms.join(", ")}
                                </p>
                            )}
                            <div className="flex flex-wrap gap-3">
                                <Link href="#find-specialist" className="btn-primary">
                                    Find a Specialist
                                </Link>
                                <Link href="#how-it-works" className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-white transition-colors">
                                    Learn More
                                </Link>
                            </div>
                        </div>
                        <div className="relative">
                            <Image
                                src="/images/therapy-hero.png"
                                alt={`${therapy.name} - Mental Health Support`}
                                width={600}
                                height={400}
                                className="rounded-2xl shadow-lg"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Stats */}
            <section className="py-8 bg-white border-y border-border">
                <div className="container">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div>
                            <div className="text-3xl font-bold text-primary">30+</div>
                            <div className="text-sm text-muted">States Covered</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary">143</div>
                            <div className="text-sm text-muted">Cities Available</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary">Licensed</div>
                            <div className="text-sm text-muted">Verified Providers</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary">Free</div>
                            <div className="text-sm text-muted">To Search & Compare</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* What is This Therapy - Card Design */}
            <section id="how-it-works" className="py-16">
                <div className="container">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-foreground mb-4">
                                What is {therapy.name}?
                            </h2>
                            <p className="text-lg text-muted">
                                Understanding this evidence-based approach to mental wellness
                            </p>
                        </div>

                        {/* Info Cards Grid */}
                        <div className="grid md:grid-cols-2 gap-6 mb-12">
                            {/* Definition Card */}
                            <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">Definition</h3>
                                <p className="text-muted leading-relaxed">
                                    {therapy.name} is a specialized form of psychotherapy designed to help individuals understand and manage their thoughts, emotions, and behaviors. This evidence-based approach is tailored to address specific mental health challenges.
                                </p>
                            </div>

                            {/* How It Works Card */}
                            <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">How It Works</h3>
                                <p className="text-muted leading-relaxed">
                                    Through regular sessions with a licensed therapist, you&apos;ll work together to identify patterns, develop coping strategies, and create lasting positive changes. Sessions typically last 45-60 minutes.
                                </p>
                            </div>
                        </div>

                        {/* Who Can Benefit - Featured Box */}
                        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 border border-primary/20">
                            <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Who Can Benefit
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-foreground">Individuals experiencing <strong>anxiety</strong> or excessive worry</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-foreground">Those dealing with <strong>depression</strong> or low mood</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-foreground">People navigating <strong>relationship</strong> challenges</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-foreground">Anyone seeking <strong>personal growth</strong></span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-foreground">Those coping with <strong>trauma</strong> or past experiences</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-foreground">Individuals managing <strong>stress</strong> and burnout</span>
                                </div>
                            </div>
                        </div>

                        {/* What to Expect */}
                        <div className="mt-12 bg-white rounded-xl border border-border p-8 shadow-sm">
                            <h3 className="text-2xl font-bold text-foreground mb-6">What to Expect in Sessions</h3>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                                    <div>
                                        <h4 className="font-semibold text-foreground">Initial Assessment</h4>
                                        <p className="text-muted">Your therapist will learn about your history, concerns, and goals for treatment.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                                    <div>
                                        <h4 className="font-semibold text-foreground">Personalized Plan</h4>
                                        <p className="text-muted">Together, you&apos;ll create a treatment plan tailored to your specific needs.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                                    <div>
                                        <h4 className="font-semibold text-foreground">Regular Sessions</h4>
                                        <p className="text-muted">Weekly or bi-weekly sessions to work through challenges and build skills.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
                                    <div>
                                        <h4 className="font-semibold text-foreground">Progress & Growth</h4>
                                        <p className="text-muted">Track your improvement and adjust strategies as you develop new capabilities.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Find Specialists Section */}
            <section id="find-specialist" className="py-16 bg-gray-50">
                <div className="container">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-foreground mb-4">
                            Find {therapy.name} Specialists
                        </h2>
                        <p className="text-lg text-muted">
                            Browse licensed providers by state and city
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {states.slice(0, 12).map((state) => (
                            <div key={state.id} className="bg-white rounded-xl border border-border p-5 hover:border-primary hover:shadow-md transition-all">
                                <h3 className="font-bold text-foreground mb-3">{state.name}</h3>
                                <ul className="space-y-2 text-sm mb-3">
                                    {state.cities.slice(0, 3).map((city) => (
                                        <li key={city.id}>
                                            <Link
                                                href={`/therapists/${state.abbreviation.toLowerCase()}/${city.slug}/${therapy.slug}`}
                                                className="text-primary hover:underline flex items-center gap-1"
                                            >
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                </svg>
                                                {city.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href={`/therapists/${state.abbreviation.toLowerCase()}`}
                                    className="text-xs text-muted hover:text-primary"
                                >
                                    View all cities →
                                </Link>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 text-center">
                        <Link href="/therapists" className="btn-primary">
                            Browse All States
                        </Link>
                    </div>
                </div>
            </section>

            {/* Related Therapies */}
            <section className="py-16">
                <div className="container">
                    <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
                        Explore Related Therapy Types
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {otherTherapies.map((t) => (
                            <Link
                                key={t.id}
                                href={`/therapy/${t.slug}`}
                                className="bg-white rounded-xl border border-border p-6 hover:border-primary hover:shadow-md transition-all group"
                            >
                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{t.name}</h3>
                                <p className="text-sm text-muted mt-1">Learn more about this therapy →</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gradient-to-r from-primary to-secondary text-white">
                <div className="container text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
                    <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                        Take the first step toward better mental health. Find a licensed {therapy.name.toLowerCase()} specialist in your area today.
                    </p>
                    <Link href="/therapists" className="inline-block px-8 py-4 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition-colors">
                        Find a Therapist Now
                    </Link>
                </div>
            </section>
        </div>
    );
}
