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
    </div>
  );
}
