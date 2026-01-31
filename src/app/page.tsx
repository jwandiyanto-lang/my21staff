"use client";

import Link from "next/link";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import {
  NavBar,
  HeroSection,
  WorkforceSection,
  FeaturesSection,
  HowToStartSection,
  CTASection,
  Footer,
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

        {/* 2. What you will love about us (Features) */}
        <FeaturesSection />

        {/* 3. How to Get Started Section (White) */}
        <HowToStartSection />

        {/* 4. Imagine your team is always working (Workforce) */}
        <WorkforceSection />

        {/* 5. Ready to Automate your next million (CTA) */}
        <CTASection />
      </main>

      {/* Footer - Full with sections */}
      <Footer />
    </div>
  );
}
