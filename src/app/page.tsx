import Link from "next/link";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const states = await prisma.state.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { cities: true, providers: true },
      },
    },
  });

  const therapies = await prisma.therapy.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div>
      {/* Hero Section - Healthcare Style */}
      <section className="hero-gradient py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            {/* Trust Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border border-border">
              <svg className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span className="text-sm font-medium text-foreground">Licensed & Verified Professionals</span>
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Find a <span className="gradient-text">Therapist</span> You Can Trust
            </h1>
            <p className="mb-8 text-lg text-muted md:text-xl">
              Connect with licensed mental health professionals in your area.
              Browse by location or specialty to find the right care for you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/therapists" className="btn-primary">
                Find a Therapist
              </Link>
              <Link
                href="/therapy"
                className="rounded-lg border border-border bg-white px-6 py-3 font-semibold text-foreground transition-colors hover:bg-card-hover hover:border-primary"
              >
                Explore Therapy Types
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-8 border-t border-border/50 pt-8">
              <div>
                <div className="text-3xl font-bold text-primary">30+</div>
                <div className="text-sm text-muted">States Covered</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">143</div>
                <div className="text-sm text-muted">Cities Available</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">15</div>
                <div className="text-sm text-muted">Therapy Types</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container">
          <h2 className="text-center text-2xl font-bold text-foreground mb-12 md:text-3xl">
            How to Find the Right Therapist
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-primary">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">1. Choose Your Location</h3>
              <p className="text-muted">Select your state and city to find therapists nearby.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-primary">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">2. Select Your Needs</h3>
              <p className="text-muted">Filter by therapy type, specialty, or specific concerns.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-primary">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">3. Connect with Care</h3>
              <p className="text-muted">Review profiles and reach out to schedule an appointment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* States Grid */}
      <section className="py-16">
        <div className="container">
          <h2 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
            Browse Therapists by State
          </h2>
          <p className="mb-8 text-muted">Select your state to find licensed mental health professionals near you.</p>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {states.map((state) => (
              <Link
                key={state.id}
                href={`/therapists/${state.abbreviation.toLowerCase()}`}
                className="glass-card p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{state.name}</h3>
                    <p className="text-sm text-muted">
                      {state._count.cities} cities
                    </p>
                  </div>
                  <span className="text-xl font-bold text-primary/40">
                    {state.abbreviation}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Therapy Types */}
      <section className="py-16 bg-white">
        <div className="container">
          <h2 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
            Explore Therapy Types
          </h2>
          <p className="mb-8 text-muted">Find specialists for your specific needs.</p>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {therapies.slice(0, 8).map((therapy) => (
              <Link
                key={therapy.id}
                href={`/therapy/${therapy.slug}`}
                className="gradient-border p-5"
              >
                <h3 className="font-semibold text-foreground">{therapy.name}</h3>
                <p className="mt-1 text-sm text-muted">
                  Learn more →
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/therapy"
              className="text-primary font-medium hover:underline"
            >
              View all {therapies.length} therapy types →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container">
          <div className="info-box mx-auto max-w-2xl p-8 text-center">
            <h2 className="mb-4 text-2xl font-bold text-foreground">
              Ready to Start Your Journey?
            </h2>
            <p className="mb-6 text-muted">
              Taking the first step towards mental wellness is a sign of strength.
              Find a licensed therapist who can support you.
            </p>
            <Link href="/therapists" className="btn-primary inline-block">
              Find a Therapist Today
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
