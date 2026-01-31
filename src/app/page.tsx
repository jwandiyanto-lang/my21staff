"use client";

import Link from "next/link";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import {
  NavBar,
  HeroSection,
  WorkforceSection,
  ConsoleSection,
  FeaturesSection,
  HowToStartSection,
  CTASection,
} from "@/components/landing";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function Home() {
  return (
    <div
      className={`${plusJakartaSans.variable} ${inter.variable} bg-white text-[#2D2A26] antialiased`}
      style={{ fontFamily: "var(--font-inter)" }}
    >
      {/* Navigation */}
      <NavBar />

      <main>
        {/* 1. Hero Section (Off White) */}
        <HeroSection />

        {/* 2. Growth Engine Section (White) */}
        <FeaturesSection />

        {/* 3. How to Get Started Section (White) */}
        <HowToStartSection />

        {/* 4. Digital Workforce Section (White) */}
        <WorkforceSection />

        {/* 5. Central Console Section (Sage Green) */}
        <ConsoleSection />

        {/* 6. Final CTA Section (Light Sage) */}
        <CTASection />
      </main>

      {/* Footer - Compact */}
      <footer className="bg-white border-t border-gray-100 py-4">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-center gap-4 text-xs text-[#2D2A26]/50">
            <span className="font-extrabold">
              <span className="text-[#2D2A26]/50">my</span>
              <span className="text-[#F7931A]">21</span>
              <span className="text-[#2D2A26]/50">staff</span>
            </span>
            <span>&copy; 2026</span>
            <Link href="/security" className="hover:text-[#2D2A26] transition-colors">
              Security
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
