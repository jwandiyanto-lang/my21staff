"use client";

import Link from "next/link";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import {
  NavBar,
  HeroSection,
  WorkforceSection,
  FeaturesSection,
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

        {/* 3. Digital Workforce Section (White) */}
        <WorkforceSection />

        {/* 4. Final CTA Section (White with Orange Accents) */}
        <CTASection />
      </main>

      {/* Footer - Minimal */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold">
              <span className="text-[#2D2A26]">my</span>
              <span className="text-[#F7931A]">21</span>
              <span className="text-[#2D2A26]">staff</span>
            </span>
            <Link
              href="https://wa.me/message/WMW65Q7UGTDNE1"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#F7931A] text-white font-semibold rounded-full hover:bg-[#e08315] transition-all duration-150"
            >
              Chat Now
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
