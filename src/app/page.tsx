import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const pricingTiers = [
  {
    name: "Core",
    price: 2500000,
    staff: 5,
    target: "Solo founders",
    features: ["5 Digital Staff", "Basic automation", "WhatsApp integration", "Email support"],
    recommended: false,
  },
  {
    name: "Pro",
    price: 5730000,
    staff: 10,
    target: "Growing SMBs",
    features: ["10 Digital Staff", "Advanced automation", "Priority support", "Custom workflows"],
    recommended: true,
    badge: "UMR Price",
  },
  {
    name: "Max",
    price: 10500000,
    staff: 21,
    target: "Established businesses",
    features: ["21 Digital Staff (Full Team)", "Enterprise automation", "Dedicated support", "White-label options"],
    recommended: false,
  },
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const departments = [
  {
    name: "THE BRAIN",
    count: 1,
    highlight: true,
    staff: ["Executive Assistant"],
  },
  {
    name: "SALES",
    count: 5,
    staff: ["Lead Greeter", "Qualifier", "Follow-up Agent", "Proposal Sender", "Deal Closer"],
  },
  {
    name: "MARKETING",
    count: 4,
    staff: ["Content Publisher", "Campaign Broadcaster", "Social Scheduler", "Promo Announcer"],
  },
  {
    name: "OPERATIONS",
    count: 4,
    staff: ["Appointment Scheduler", "Document Collector", "Task Router", "Status Updater"],
  },
  {
    name: "FINANCE",
    count: 3,
    staff: ["Invoice Sender", "Payment Logger", "Payment Reminder"],
  },
  {
    name: "SERVICE",
    count: 3,
    staff: ["FAQ Responder", "Complaint Handler", "Feedback Collector"],
  },
  {
    name: "ANALYTICS",
    count: 1,
    staff: ["ROI Analyst"],
  },
];

export default function Home() {
  return (
    <div className={`${plusJakartaSans.variable} ${jetBrainsMono.variable} min-h-screen bg-landing-bg`}>
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

      {/* Features Section */}
      <section className="py-24 px-8 bg-landing-bg">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-bold text-landing-text text-center mb-4"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Meet Your 21 Digital Staff
          </h2>
          <p
            className="text-lg text-landing-text-muted text-center mb-16 max-w-2xl mx-auto"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            A complete team working 24/7 to grow your business
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => (
              <div
                key={dept.name}
                className={`p-6 bg-white border-notion-thick ${
                  dept.highlight ? "border-landing-cta" : ""
                }`}
                style={{ borderColor: dept.highlight ? "var(--landing-cta)" : undefined }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className={`text-sm font-bold uppercase tracking-widest ${
                      dept.highlight ? "text-landing-cta" : "text-landing-text"
                    }`}
                    style={{ fontFamily: "var(--font-jakarta)" }}
                  >
                    {dept.name}
                  </h3>
                  <span
                    className="text-xs px-2 py-1 bg-landing-text text-white rounded-notion"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {dept.count} staff
                  </span>
                </div>
                <ul className="space-y-2">
                  {dept.staff.map((role) => (
                    <li
                      key={role}
                      className="text-sm text-landing-text-muted"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {role}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-bold text-landing-text text-center mb-4"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Simple Pricing
          </h2>
          <p
            className="text-lg text-landing-text-muted text-center mb-16 max-w-2xl mx-auto"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            A full digital department for the price of one entry-level employee
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`p-8 border-notion-thick relative ${
                  tier.recommended
                    ? "scale-105 shadow-lg"
                    : ""
                }`}
                style={{
                  borderColor: tier.recommended ? "var(--landing-cta)" : undefined,
                }}
              >
                {tier.recommended && (
                  <div
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-landing-cta text-white text-xs uppercase tracking-widest rounded-notion"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {tier.badge}
                  </div>
                )}

                <h3
                  className="text-sm font-bold uppercase tracking-widest text-landing-text mb-2"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  {tier.name}
                </h3>
                <p
                  className="text-xs text-landing-text-muted mb-6"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  {tier.target}
                </p>

                <div className="mb-6">
                  <span
                    className="text-3xl font-bold text-landing-text"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {formatPrice(tier.price)}
                  </span>
                  <span
                    className="text-sm text-landing-text-muted ml-1"
                    style={{ fontFamily: "var(--font-jakarta)" }}
                  >
                    /month
                  </span>
                </div>

                <div
                  className="text-sm text-landing-cta font-medium mb-6"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {tier.staff} Digital Staff
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="text-sm text-landing-text-muted flex items-start"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      <span className="text-landing-cta mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`block text-center py-3 rounded-notion uppercase tracking-widest text-sm font-medium transition-opacity hover:opacity-90 ${
                    tier.recommended
                      ? "bg-landing-cta text-white"
                      : "bg-landing-text text-white"
                  }`}
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
