"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";

interface State {
    id: number;
    name: string;
    abbreviation: string;
    _count: {
        cities: number;
        providers: number;
    };
}

interface City {
    id: number;
    name: string;
    slug: string;
    state: {
        abbreviation: string;
        name: string;
    };
}

interface Props {
    states: State[];
    featuredCities: City[];
    totalProviders: number;
    totalCities: number;
}

export default function TherapistsPageClient({ states, featuredCities, totalProviders, totalCities }: Props) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRegion, setSelectedRegion] = useState<string>("all");

    const regions: Record<string, string[]> = {
        northeast: ["CT", "ME", "MA", "NH", "RI", "VT", "NJ", "NY", "PA"],
        midwest: ["IL", "IN", "MI", "OH", "WI", "IA", "KS", "MN", "MO", "NE", "ND", "SD"],
        south: ["DE", "FL", "GA", "MD", "NC", "SC", "VA", "WV", "AL", "KY", "MS", "TN", "AR", "LA", "OK", "TX"],
        west: ["AZ", "CO", "ID", "MT", "NV", "NM", "UT", "WY", "AK", "CA", "HI", "OR", "WA"],
    };

    const filteredStates = useMemo(() => {
        return states.filter((state) => {
            const matchesSearch = state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                state.abbreviation.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesRegion = selectedRegion === "all" ||
                regions[selectedRegion]?.includes(state.abbreviation);

            return matchesSearch && matchesRegion;
        });
    }, [states, searchQuery, selectedRegion]);

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-primary-light via-white to-green-50 py-16">
                <div className="container">
                    <nav className="mb-6 text-sm text-muted">
                        <Link href="/" className="hover:text-primary">Home</Link>
                        <span className="mx-2">/</span>
                        <span className="text-foreground font-medium">Find Therapists</span>
                    </nav>

                    <div className="max-w-3xl">
                        <span className="inline-block px-3 py-1 mb-4 text-sm font-medium text-primary bg-primary/10 rounded-full">
                            Nationwide Directory
                        </span>
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                            Find <span className="text-primary">Therapists</span> Near You
                        </h1>
                        <p className="text-lg text-muted mb-8">
                            Search our directory of licensed mental health professionals across all 50 US states.
                            Find the right therapist for your needs.
                        </p>

                        {/* Search Bar */}
                        <div className="relative">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search by state or city name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                                    />
                                </div>
                                <select
                                    value={selectedRegion}
                                    onChange={(e) => setSelectedRegion(e.target.value)}
                                    className="px-4 py-4 bg-white border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                                >
                                    <option value="all">All Regions</option>
                                    <option value="northeast">Northeast</option>
                                    <option value="midwest">Midwest</option>
                                    <option value="south">South</option>
                                    <option value="west">West</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="py-6 bg-white border-y border-border">
                <div className="container">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div>
                            <div className="text-3xl font-bold text-primary">{states.length}</div>
                            <div className="text-sm text-muted">States Covered</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary">{totalCities}</div>
                            <div className="text-sm text-muted">Cities Available</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary">{totalProviders || "Growing"}</div>
                            <div className="text-sm text-muted">Licensed Providers</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary">15</div>
                            <div className="text-sm text-muted">Therapy Types</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Cities */}
            {featuredCities.length > 0 && searchQuery === "" && selectedRegion === "all" && (
                <section className="py-12 bg-gray-50">
                    <div className="container">
                        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            Popular Cities
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {featuredCities.map((city) => (
                                <Link
                                    key={city.id}
                                    href={`/therapists/${city.state.abbreviation.toLowerCase()}/${city.slug}`}
                                    className="group bg-white rounded-xl border border-border p-5 hover:border-primary hover:shadow-lg transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold">
                                            {city.state.abbreviation}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{city.name}</h3>
                                            <p className="text-sm text-muted">{city.state.name}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* States Grid */}
            <section className="py-12">
                <div className="container">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-foreground">
                            {searchQuery || selectedRegion !== "all"
                                ? `${filteredStates.length} States Found`
                                : "Browse by State"}
                        </h2>
                        {filteredStates.length !== states.length && (
                            <button
                                onClick={() => { setSearchQuery(""); setSelectedRegion("all"); }}
                                className="text-primary hover:underline text-sm"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>

                    {filteredStates.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {filteredStates.map((state) => (
                                <Link
                                    key={state.id}
                                    href={`/therapists/${state.abbreviation.toLowerCase()}`}
                                    className="group bg-white rounded-xl border border-border p-5 hover:border-primary hover:shadow-lg transition-all"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <span className="text-lg font-bold text-primary">{state.abbreviation}</span>
                                        </div>
                                        <svg className="w-5 h-5 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{state.name}</h3>
                                    <div className="flex items-center gap-3 mt-2 text-sm text-muted">
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            {state._count.cities} cities
                                        </span>
                                        {state._count.providers > 0 && (
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {state._count.providers}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-border">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">No states found</h3>
                            <p className="text-muted mb-4">Try adjusting your search or filter</p>
                            <button
                                onClick={() => { setSearchQuery(""); setSelectedRegion("all"); }}
                                className="btn-primary"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* How It Works */}
            <section className="py-12 bg-white border-t border-border">
                <div className="container">
                    <h2 className="text-2xl font-bold text-foreground mb-8 text-center">How to Find Your Therapist</h2>
                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="text-center">
                            <div className="w-14 h-14 mx-auto mb-4 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold">1</div>
                            <h3 className="font-bold text-foreground mb-2">Choose Your Location</h3>
                            <p className="text-sm text-muted">Select your state and city from our comprehensive directory</p>
                        </div>
                        <div className="text-center">
                            <div className="w-14 h-14 mx-auto mb-4 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold">2</div>
                            <h3 className="font-bold text-foreground mb-2">Select Therapy Type</h3>
                            <p className="text-sm text-muted">Browse specialists by their area of expertise</p>
                        </div>
                        <div className="text-center">
                            <div className="w-14 h-14 mx-auto mb-4 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold">3</div>
                            <h3 className="font-bold text-foreground mb-2">Connect & Heal</h3>
                            <p className="text-sm text-muted">Review profiles and reach out to start your journey</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-12 bg-gradient-to-r from-primary to-secondary text-white">
                <div className="container text-center">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">Not Sure Where to Start?</h2>
                    <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                        Explore our therapy types to find the right approach for your needs.
                    </p>
                    <Link href="/therapy" className="inline-block px-8 py-4 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition-colors">
                        Explore Therapy Types
                    </Link>
                </div>
            </section>
        </div>
    );
}
