"use client";

import { useState } from "react";
import Link from "next/link";
import { LoginModal } from "@/components/auth/login-modal";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { HeroSection, FeaturesGrid, CTASection, StickyCTA } from "@/components/landing";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function Home() {
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div
      className={`${plusJakartaSans.variable} ${inter.variable} bg-landing-bg text-landing-text antialiased`}
      style={{ fontFamily: "var(--font-inter)" }}
    >
      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Login Modal */}
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />

      {/* Navigation - Blends with sections */}
      <nav className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
        <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-black text-white">21</span>
            </Link>
          </div>
          <button
            onClick={() => setLoginOpen(true)}
            className="text-sm text-white px-5 py-2 rounded-full bg-white/20 backdrop-blur-sm font-semibold hover:bg-white/30 transition-all"
          >
            Login
          </button>
        </div>
      </nav>

      <main>
        {/* Hero Section - New English version */}
        <section className="pt-14">
          <HeroSection />
        </section>

        {/* Features Grid */}
        <FeaturesGrid />

        {/* Final CTA Section */}
        <CTASection />
      </main>

      {/* Footer - Compact One-liner */}
      <footer className="bg-white border-t border-notion py-4">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-center gap-4 text-xs text-landing-text-muted">
            <span className="font-black text-landing-cta">21</span>
            <span>&copy; 2026</span>
            <Link href="/keamanan" className="hover:text-landing-text transition-colors">
              Keamanan Data
            </Link>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky CTA */}
      <StickyCTA />
    </div>
  );
}
