import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export default function Home() {
  return (
    <div className={`${plusJakartaSans.variable} min-h-screen bg-landing-bg`}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-landing-bg/80 backdrop-blur-sm border-notion">
        <Link
          href="/"
          className="text-2xl font-bold text-landing-text"
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          21
        </Link>
        <Link
          href="/auth/login"
          className="text-sm text-landing-text hover:text-landing-cta transition-colors uppercase tracking-widest"
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          Login
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-landing-hero notion-grid">
        <div className="text-center px-8 max-w-4xl mx-auto pt-16">
          <h1
            className="text-5xl md:text-6xl font-bold text-landing-text mb-6"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Your 21 Digital Staff
          </h1>
          <p
            className="text-xl text-landing-text-muted mb-10 max-w-2xl mx-auto"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            A full digital department for the price of one entry-level employee
          </p>
          <Link
            href="/signup"
            className="inline-block bg-landing-cta text-white uppercase tracking-widest px-8 py-3 rounded-notion font-medium hover:opacity-90 transition-opacity"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}
