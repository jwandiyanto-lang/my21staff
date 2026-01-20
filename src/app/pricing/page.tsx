"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, MessageCircle, RefreshCw, BarChart3, Snowflake, Lock } from "lucide-react";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.15 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const PROBLEMS = [
  {
    icon: MessageCircle,
    title: "WhatsApp Overwhelm",
    problem: "Too many chats coming in, can't focus on anything else. Reply to one, five more come in.",
    solutions: [
      "WhatsApp Bot auto-replies 24/7",
      "Lead scoring in CRM",
      "Get notified only for serious leads",
    ],
  },
  {
    icon: RefreshCw,
    title: "Stuck in Day-to-Day",
    problem: "Always busy with operations, no time to think about new products or build relationships.",
    solutions: [
      "Automated tasks from AI",
      "Partner follow-up reminders",
      "Time for you to plan strategy",
    ],
  },
  {
    icon: BarChart3,
    title: "Messy Bookkeeping",
    problem: "No proper records. When tax season comes, panic looking for data.",
    solutions: [
      "Transactions recorded automatically",
      "Weekly reports to your WhatsApp",
      "Clean books ready for you",
    ],
  },
  {
    icon: Snowflake,
    title: "Leads Go Cold",
    problem: "Replied once, then forgot to follow up. Customer buys elsewhere.",
    solutions: [
      "Auto follow-up at the right time",
      "Tasks appear in CRM",
      "Nothing slips through",
    ],
  },
  {
    icon: Lock,
    title: "Can't Step Away",
    problem: "Want a day off? Can't. Business stops when you stop.",
    solutions: [
      "AI runs 24/7",
      "All activity tracked",
      "Notified only for important things",
      "Take over anytime you want",
    ],
  },
];

export default function PricingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+62");
  const [whatsapp, setWhatsapp] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [leadSources, setLeadSources] = useState<string[]>([]);
  const [currentTracking, setCurrentTracking] = useState("");
  const [leadsPerMonth, setLeadsPerMonth] = useState("");
  const [biggestProblem, setBiggestProblem] = useState("");
  const [teamSize, setTeamSize] = useState("");

  // Country codes for WhatsApp
  const countryCodes = [
    { code: "+62", flag: "ID", country: "Indonesia" },
    { code: "+971", flag: "AE", country: "UAE" },
    { code: "+65", flag: "SG", country: "Singapore" },
    { code: "+60", flag: "MY", country: "Malaysia" },
    { code: "+1", flag: "US", country: "USA" },
  ];

  // Toggle lead source checkbox
  const toggleLeadSource = (source: string) => {
    setLeadSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const openModal = (plan: string) => {
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const resetForm = () => {
    setName("");
    setCountryCode("+62");
    setWhatsapp("");
    setBusinessType("");
    setReferralSource("");
    setLeadSources([]);
    setCurrentTracking("");
    setLeadsPerMonth("");
    setBiggestProblem("");
    setTeamSize("");
  };

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama: name,
          whatsapp: `${countryCode}${whatsapp}`,
          jenisBisnis: businessType,
          dariManaTahu: referralSource,
          leadSources: leadSources.join(", "),
          currentTracking,
          leadsPerMonth,
          masalahBisnis: biggestProblem,
          teamSize,
          paket: selectedPlan,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit form");
      }

      // Success
      setSubmitSuccess(true);
      resetForm();

      // Close modal after brief success state
      setTimeout(() => {
        setModalOpen(false);
        setSubmitSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Form submission error:", error);
      alert("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`${plusJakartaSans.variable} ${inter.variable} antialiased bg-[#f1f5f0]`}
      style={{ fontFamily: "var(--font-inter)" }}
    >
      {/* Navigation - blends into hero */}
      <nav className="bg-[#284b31]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-extrabold tracking-[-0.02em]">
              <span className="text-white/80">my</span>
              <span className="text-[#F7931A]">21</span>
              <span className="text-white/80">staff</span>
            </span>
          </Link>
          <a
            href="#pricing"
            className="text-sm text-white/80 hover:text-[#F7931A] transition-colors duration-150 font-medium tracking-[-0.02em]"
          >
            Get Started
          </a>
        </div>
      </nav>

      <main>
        {/* Hero Quote */}
        <section className="bg-[#284b31] text-white pt-16 pb-12 px-6">
          <div className="mx-auto max-w-2xl">
            <blockquote className="border-l-4 border-[#F7931A]/30 pl-6 md:pl-8">
              <p className="text-white/60 text-sm mb-6 italic tracking-[-0.02em]">
                A letter from yourself, 6 months from now
              </p>

              <div className="space-y-6 text-lg leading-relaxed tracking-[-0.02em]">
                <div>
                  <p className="font-semibold text-[#F7931A] mb-3">Before...</p>
                  <p>
                    Someone messaged yesterday. Asked about pricing. Ready to pay deposit.
                  </p>
                  <p className="mt-3">
                    But I was busy handling regular customers, so I forgot to reply.
                    When I messaged back — they had <strong>ghosted</strong>.
                  </p>
                  <p className="mt-3">
                    Sometimes I manage to handle new clients, but they don&apos;t buy either.
                    Meanwhile, family complains I have no time for them.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-[#F7931A] mb-3">Now...</p>
                  <p>
                    After using the system, every incoming lead is automatically scored and followed up.
                  </p>
                  <p className="mt-3">
                    When there&apos;s a good lead, I get notified and can take over the chat.
                  </p>
                  <p className="mt-3">
                    Results are much better — and I have energy for business planning and building relationships.
                  </p>
                </div>
              </div>

              <p className="text-[#F7931A] font-semibold mt-10 text-right tracking-[-0.02em]">
                — You, 6 months from now
              </p>
            </blockquote>
          </div>
        </section>

        {/* Tagline */}
        <section className="bg-[#284b31] text-white px-6 py-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center tracking-[-0.02em]">
              No system = <span className="text-[#F7931A]">No growth.</span>
            </h2>
          </div>
        </section>

        {/* Story / Problem */}
        <section className="bg-white px-6 py-12 md:py-16">
          <div className="mx-auto max-w-3xl">
            <div className="space-y-6 text-lg md:text-xl text-[#2D2A26] leading-relaxed tracking-[-0.02em]">
              <p>
                Business wants to grow, but <strong>your head is full</strong>.
              </p>

              <p>
                Every lead needs <strong>manual handling</strong>.
                Every follow-up needs <strong>remembering</strong>.
                Every opportunity that comes — <strong>slips away</strong> because no time.
              </p>

              <p>
                Want to hire? <strong>Complicated</strong>. Training, supervision, monthly salary.
                And if they quit? <strong>Start from zero again</strong>.
              </p>

              <p>
                Want to delegate? <strong>Scared of mistakes</strong>. Scared it won&apos;t meet standards.
              </p>

              <p>
                End up <strong>doing everything yourself</strong>. Not to mention the <strong>tax man</strong> who shows up unexpectedly.
              </p>

              <p className="text-[#2D2A26] font-medium">
                Feels unfair. Hard to do business.<br />
                But who can you work with?
              </p>
            </div>

            <hr className="my-12 border-[#2D2A26]/10" />

            <div className="space-y-6 text-lg md:text-xl text-[#2D2A26] leading-relaxed tracking-[-0.02em]">
              <p className="text-2xl md:text-3xl font-extrabold text-[#284b31]">
                The solution isn&apos;t more staff.<br />
                The solution is a <span className="text-[#F7931A]">system</span> — with <span className="text-[#F7931A]">digital staff</span>.
              </p>

              <p>
                Digital staff <strong>don&apos;t get sick</strong>. <strong>Don&apos;t resign</strong>. <strong>Don&apos;t need supervision</strong>.
              </p>

              <p>
                They follow instructions <strong>exactly as you want</strong>.
                And all activity can be <strong>tracked anytime</strong>.
              </p>

              <p className="text-[#2D2A26] font-medium">
                You stay in control. But you don&apos;t have to do everything yourself.
              </p>
            </div>

            {/* Why we exist */}
            <div className="mt-12 p-8 md:p-10 bg-[#F7931A] rounded-2xl shadow-lg max-w-4xl mx-auto">
              <p className="text-2xl md:text-3xl font-extrabold text-white mb-4 tracking-[-0.02em]">
                This is why we exist.
              </p>
              <p className="text-lg md:text-xl text-white leading-relaxed tracking-[-0.02em]">
                We <strong className="text-[#284b31]">don&apos;t sell software then make you follow our rules</strong>.
              </p>
              <p className="text-lg md:text-xl text-white leading-relaxed mt-3 tracking-[-0.02em]">
                We <strong className="text-[#284b31]">discuss and build your system from scratch</strong> as your business grows.
              </p>
            </div>
          </div>
        </section>

        {/* Problems & Solutions */}
        <section className="bg-[#f1f5f0] px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.15 }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#284b31] tracking-[-0.02em]">
                Problems we often see — And how my21staff helps
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PROBLEMS.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.15, delay: 0.05 * index }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-[#284b31]/5"
                >
                  <div className="w-10 h-10 bg-[#284b31] rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-[#284b31] mb-2 tracking-[-0.02em]">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#2D2A26]/70 mb-4 tracking-[-0.02em]">
                    {item.problem}
                  </p>
                  <div className="pt-4 border-t border-[#284b31]/10">
                    <p className="text-xs font-semibold text-[#F7931A] uppercase tracking-wider mb-2">
                      Our System
                    </p>
                    <ul className="space-y-1.5">
                      {item.solutions.map((solution) => (
                        <li key={solution} className="flex items-start gap-2 text-sm text-[#2D2A26]/80 tracking-[-0.02em]">
                          <span className="text-[#284b31] mt-0.5">→</span>
                          {solution}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}

              {/* CTA Card - fills the 6th spot */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.15, delay: 0.25 }}
                className="bg-[#284b31] rounded-2xl p-6 shadow-sm flex flex-col justify-center"
              >
                <h3 className="text-xl font-bold text-white mb-2 tracking-[-0.02em]">
                  Have similar problems?
                </h3>
                <p className="text-sm text-white/70 mb-6 tracking-[-0.02em]">
                  Tell us your challenges. Let&apos;s set up your system.
                </p>
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#F7931A] text-white font-bold text-sm rounded-xl hover:bg-[#e8850f] transition-colors duration-150"
                >
                  Get Started
                </a>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-[#284b31] text-white py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12 tracking-[-0.02em]">
              Ready to build <span className="text-[#F7931A]">Your System</span>?
            </h2>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {/* Solo */}
              <motion.div
                className="bg-white text-[#2D2A26] rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-150"
                variants={fadeInUp}
              >
                <h3 className="text-xl font-extrabold tracking-[-0.02em]">Solo</h3>
                <p className="text-xs text-[#2D2A26]/60 mb-4 tracking-[-0.02em]">Founders & freelancers</p>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold">$240</span>
                  <span className="text-sm text-[#2D2A26]/60">/mo</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm tracking-[-0.02em]">
                  {["1 WhatsApp Number", "200 Marketing Messages/mo", "100 Utility Messages/mo", "30,000 AI Chats/mo"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#284b31]" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => openModal("Solo")}
                  className="block w-full text-center py-3 rounded-xl border-2 border-[#284b31] text-[#284b31] font-bold text-sm hover:bg-[#284b31] hover:text-white transition-all duration-150 cursor-pointer"
                >
                  Choose Solo
                </button>
              </motion.div>

              {/* Team */}
              <motion.div
                className="bg-[#F7931A] text-white rounded-2xl p-6 relative md:-translate-y-2 hover:shadow-xl hover:-translate-y-3 transition-all duration-150"
                variants={fadeInUp}
              >
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#284b31] text-white text-xs font-bold px-3 py-1 rounded-full tracking-[-0.02em]">
                  POPULAR
                </span>
                <h3 className="text-xl font-extrabold mt-1 tracking-[-0.02em]">Team</h3>
                <p className="text-xs text-white/80 mb-4 tracking-[-0.02em]">Small teams & SMBs</p>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold">$490</span>
                  <span className="text-sm text-white/80">/mo</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm tracking-[-0.02em]">
                  {["3 WhatsApp Numbers", "500 Marketing Messages/mo", "300 Utility Messages/mo", "60,000 AI Chats/mo"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-white" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => openModal("Team")}
                  className="block w-full text-center py-3 rounded-xl bg-white text-[#F7931A] font-bold text-sm hover:bg-white/90 transition-all duration-150 cursor-pointer"
                >
                  Choose Team
                </button>
              </motion.div>

              {/* Studio */}
              <motion.div
                className="bg-white text-[#2D2A26] rounded-2xl p-6 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-150"
                variants={fadeInUp}
              >
                <h3 className="text-xl font-extrabold tracking-[-0.02em]">Studio</h3>
                <p className="text-xs text-[#2D2A26]/60 mb-4 tracking-[-0.02em]">Enterprise & custom</p>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold">Custom</span>
                </div>
                <p className="text-sm text-[#2D2A26]/70 mb-6 flex-1 tracking-[-0.02em]">
                  Need more than Solo or Team? Let&apos;s discuss and tailor the solution to your business needs.
                </p>
                <button
                  onClick={() => openModal("Studio")}
                  className="block w-full text-center py-3 rounded-xl border-2 border-[#284b31] text-[#284b31] font-bold text-sm hover:bg-[#284b31] hover:text-white transition-all duration-150 cursor-pointer"
                >
                  Contact Us
                </button>
              </motion.div>
            </motion.div>

            {/* Setup Fee Box */}
            <div className="mt-8 max-w-xl mx-auto bg-white/10 rounded-xl py-3 px-6 text-center">
              <p className="text-sm text-white/80 tracking-[-0.02em]">One-time setup fee: <span className="font-bold text-white">$465</span> — Website / Web App + Business Consultation</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - matches landing page */}
      <footer className="bg-[#284b31] border-t border-white/10 py-6">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-center gap-4 text-sm text-white/60 tracking-[-0.02em]">
            <span className="font-extrabold">
              <span className="text-white/60">my</span>
              <span className="text-[#F7931A]">21</span>
              <span className="text-white/60">staff</span>
            </span>
            <span>&copy; 2026</span>
            <Link href="/security" className="hover:text-white transition-colors duration-150">
              Security
            </Link>
          </div>
        </div>
      </footer>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            />

            {/* Modal Content */}
            <motion.div
              className="relative bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-150"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Form Header */}
              <h3 className="text-2xl font-extrabold text-[#2D2A26] mb-2 tracking-[-0.02em]">
                Interested in {selectedPlan}?
              </h3>
              <p className="text-sm text-[#2D2A26]/60 mb-6 tracking-[-0.02em]">
                Fill this form and we&apos;ll contact you shortly.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="hidden" name="paket" value={selectedPlan} />

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2A26] mb-1 tracking-[-0.02em]">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F7931A] focus:ring-1 focus:ring-[#F7931A] outline-none transition-all duration-150 text-sm"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2A26] mb-1 tracking-[-0.02em]">
                    WhatsApp
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="px-3 py-3 rounded-xl border border-gray-200 focus:border-[#F7931A] focus:ring-1 focus:ring-[#F7931A] outline-none transition-all duration-150 text-sm bg-white"
                    >
                      {countryCodes.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      placeholder="812345678"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      required
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F7931A] focus:ring-1 focus:ring-[#F7931A] outline-none transition-all duration-150 text-sm"
                    />
                  </div>
                </div>

                {/* Business Type */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2A26] mb-1 tracking-[-0.02em]">
                    Business Type
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Education consultant, E-commerce"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F7931A] focus:ring-1 focus:ring-[#F7931A] outline-none transition-all duration-150 text-sm"
                  />
                </div>

                {/* How did you hear about us */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2A26] mb-1 tracking-[-0.02em]">
                    How did you hear about us?
                  </label>
                  <select
                    value={referralSource}
                    onChange={(e) => setReferralSource(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F7931A] focus:ring-1 focus:ring-[#F7931A] outline-none transition-all duration-150 text-sm bg-white"
                  >
                    <option value="">Select...</option>
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Google Search">Google Search</option>
                    <option value="Friend/Colleague">Friend/Colleague</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Ads">Ads</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Lead Sources */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2A26] mb-2 tracking-[-0.02em]">
                    Where do your leads come from?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "WhatsApp direct",
                      "Instagram DM",
                      "Website/Form",
                      "Referral",
                      "Ads (Meta/Google)",
                      "Other",
                    ].map((source) => (
                      <label
                        key={source}
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all duration-150 text-sm ${
                          leadSources.includes(source)
                            ? "border-[#F7931A] bg-[#F7931A]/10"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={leadSources.includes(source)}
                          onChange={() => toggleLeadSource(source)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            leadSources.includes(source)
                              ? "bg-[#F7931A] border-[#F7931A]"
                              : "border-gray-300"
                          }`}
                        >
                          {leadSources.includes(source) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-[#2D2A26]">{source}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Current Tracking */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2A26] mb-1 tracking-[-0.02em]">
                    How do you track leads now?
                  </label>
                  <select
                    value={currentTracking}
                    onChange={(e) => setCurrentTracking(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F7931A] focus:ring-1 focus:ring-[#F7931A] outline-none transition-all duration-150 text-sm bg-white"
                  >
                    <option value="">Select...</option>
                    <option value="No system">No system (just memory)</option>
                    <option value="Notes app">Notes app</option>
                    <option value="Excel/Google Sheet">Excel/Google Sheet</option>
                    <option value="Other CRM">Other CRM</option>
                  </select>
                </div>

                {/* Leads per month */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2A26] mb-1 tracking-[-0.02em]">
                    How many leads per month?
                  </label>
                  <select
                    value={leadsPerMonth}
                    onChange={(e) => setLeadsPerMonth(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F7931A] focus:ring-1 focus:ring-[#F7931A] outline-none transition-all duration-150 text-sm bg-white"
                  >
                    <option value="">Select...</option>
                    <option value="< 10 leads">&lt; 10 leads</option>
                    <option value="10-30 leads">10-30 leads</option>
                    <option value="30-100 leads">30-100 leads</option>
                    <option value="> 100 leads">&gt; 100 leads</option>
                  </select>
                </div>

                {/* Biggest Problem */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2A26] mb-1 tracking-[-0.02em]">
                    Biggest business problem?
                  </label>
                  <select
                    value={biggestProblem}
                    onChange={(e) => setBiggestProblem(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F7931A] focus:ring-1 focus:ring-[#F7931A] outline-none transition-all duration-150 text-sm bg-white"
                  >
                    <option value="">Select...</option>
                    <option value="Forgetting to follow up">Forgetting to follow up</option>
                    <option value="No time to reply chats">No time to reply chats</option>
                    <option value="Messy bookkeeping">Messy bookkeeping</option>
                    <option value="Cannot step away from operations">Cannot step away from operations</option>
                    <option value="Cannot identify serious leads">Cannot identify serious leads</option>
                    <option value="All of the above">All of the above</option>
                  </select>
                </div>

                {/* Team Size */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2A26] mb-1 tracking-[-0.02em]">
                    How many people will use this?
                  </label>
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F7931A] focus:ring-1 focus:ring-[#F7931A] outline-none transition-all duration-150 text-sm bg-white"
                  >
                    <option value="">Select...</option>
                    <option value="Just me">Just me</option>
                    <option value="2-5 people">2-5 people</option>
                    <option value="6-10 people">6-10 people</option>
                    <option value="More than 10">More than 10</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || submitSuccess}
                  className="w-full py-3 rounded-xl bg-[#F7931A] text-white font-bold text-sm hover:bg-[#e8850f] transition-all duration-150 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitSuccess ? "Sent!" : isSubmitting ? "Sending..." : "Submit"}
                </button>
              </form>

              <p className="text-xs text-center text-gray-400 mt-4 tracking-[-0.02em]">
                We&apos;ll contact you via WhatsApp within 24 hours.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
