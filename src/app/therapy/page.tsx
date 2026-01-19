import Link from "next/link";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Therapy Types | Browse Mental Health Treatments",
    description:
        "Explore different types of therapy including CBT, EMDR, couples therapy, and more. Find specialists for each therapy type near you.",
};

export default async function TherapyIndexPage() {
    const therapies = await prisma.therapy.findMany({
        orderBy: { name: "asc" },
    });

    return (
        <div className="min-h-screen py-12">
            <div className="container">
                <nav className="mb-8 text-sm text-muted">
                    <Link href="/" className="hover:text-foreground">Home</Link>
                    <span className="mx-2">/</span>
                    <span className="text-foreground">Therapy Types</span>
                </nav>

                <header className="mb-12">
                    <h1 className="mb-4 text-3xl font-bold md:text-4xl">
                        <span className="gradient-text">Therapy Types</span>
                    </h1>
                    <p className="max-w-2xl text-lg text-muted">
                        Explore different approaches to mental health treatment.
                        Each therapy type addresses specific needs and conditions.
                    </p>
                </header>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {therapies.map((therapy) => {
                        const synonyms: string[] = therapy.synonyms
                            ? JSON.parse(therapy.synonyms)
                            : [];

                        return (
                            <Link
                                key={therapy.id}
                                href={`/therapy/${therapy.slug}`}
                                className="glass-card p-6"
                            >
                                <h2 className="mb-2 text-lg font-semibold">{therapy.name}</h2>
                                {synonyms.length > 0 && (
                                    <p className="mb-3 text-sm text-muted">
                                        Also: {synonyms.slice(0, 2).join(", ")}
                                    </p>
                                )}
                                <span className="text-sm text-primary">Learn more →</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
