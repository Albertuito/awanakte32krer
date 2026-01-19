import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "Find a Therapist Near You | Mental Health Directory",
  description:
    "Find licensed therapists, psychologists, and mental health professionals in your city. Browse by therapy type, location, and specialty.",
  keywords: [
    "therapist",
    "mental health",
    "counselor",
    "psychologist",
    "therapy",
    "CBT",
    "EMDR",
    "anxiety therapy",
    "depression therapy",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {/* Professional Healthcare Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm">
          <nav className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              {/* Healthcare Icon */}
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              <span className="text-xl font-bold text-foreground">
                Therapy<span className="text-primary">DB</span>
              </span>
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/therapists"
                className="text-sm font-medium text-muted hover:text-primary transition-colors"
              >
                Find Therapists
              </Link>
              <Link
                href="/therapy"
                className="text-sm font-medium text-muted hover:text-primary transition-colors"
              >
                Therapy Types
              </Link>
              <a
                href="tel:1-800-THERAPY"
                className="hidden md:flex items-center gap-2 text-sm font-semibold text-primary"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Need Help?
              </a>
            </div>
          </nav>
        </header>

        <main className="min-h-screen">{children}</main>

        {/* Professional Healthcare Footer */}
        <footer className="mt-20 border-t border-border bg-white py-12">
          <div className="container">
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                  <span className="font-bold text-foreground">TherapyDB</span>
                </div>
                <p className="text-sm text-muted">
                  Connecting you with licensed mental health professionals across the United States.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="trust-badge">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    Verified Providers
                  </span>
                </div>
              </div>
              <div>
                <h4 className="mb-4 font-semibold text-foreground">Popular Therapies</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/therapy/cbt-therapy" className="text-muted hover:text-primary transition-colors">
                      Cognitive Behavioral Therapy
                    </Link>
                  </li>
                  <li>
                    <Link href="/therapy/anxiety-therapy" className="text-muted hover:text-primary transition-colors">
                      Anxiety Therapy
                    </Link>
                  </li>
                  <li>
                    <Link href="/therapy/couples-therapy" className="text-muted hover:text-primary transition-colors">
                      Couples Therapy
                    </Link>
                  </li>
                  <li>
                    <Link href="/therapy/depression-therapy" className="text-muted hover:text-primary transition-colors">
                      Depression Therapy
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 font-semibold text-foreground">Top Cities</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/therapists/ca/los-angeles" className="text-muted hover:text-primary transition-colors">
                      Los Angeles, CA
                    </Link>
                  </li>
                  <li>
                    <Link href="/therapists/ny/new-york-city" className="text-muted hover:text-primary transition-colors">
                      New York City, NY
                    </Link>
                  </li>
                  <li>
                    <Link href="/therapists/tx/houston" className="text-muted hover:text-primary transition-colors">
                      Houston, TX
                    </Link>
                  </li>
                  <li>
                    <Link href="/therapists/fl/miami" className="text-muted hover:text-primary transition-colors">
                      Miami, FL
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 font-semibold text-foreground">Resources</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className="text-muted hover:text-primary transition-colors">
                      How to Choose a Therapist
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-muted hover:text-primary transition-colors">
                      Insurance & Costs
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-muted hover:text-primary transition-colors">
                      Mental Health Blog
                    </a>
                  </li>
                  <li>
                    <a href="tel:988" className="text-primary font-medium">
                      Crisis Line: 988
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-12 border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted">
              <p>© 2026 TherapyFinder. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-primary">Privacy Policy</a>
                <a href="#" className="hover:text-primary">Terms of Service</a>
                <a href="#" className="hover:text-primary">HIPAA Compliance</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
