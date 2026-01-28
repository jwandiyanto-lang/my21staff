"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, MessageCircle, BarChart3, ArrowRight, Building2 } from "lucide-react";

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
      {/* Navigation */}
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
            href="#comparison"
            className="text-sm text-white/80 hover:text-[#F7931A] transition-colors duration-150 font-medium tracking-[-0.02em]"
          >
            Get Started
          </a>
        </div>
      </nav>

      <main>
        {/* SECTION 1: Differentiation — Two Bots */}
        <section className="bg-white px-6 py-16 md:py-20">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.15 }}
              className="text-center mb-12"
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#284b31] mb-4 tracking-[-0.02em]">
                YOU GET A TEAM, NOT JUST A CHATBOT
              </h1>
              <p className="text-lg md:text-xl text-[#2D2A26]/70 tracking-[-0.02em]">
                One handles chat. The other makes sense of it.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              {/* Bot A */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.15 }}
                className="bg-[#f1f5f0] rounded-2xl p-8 border-2 border-[#284b31]/10"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-[#284b31] rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#284b31] tracking-[-0.02em]">
                      BOT A — THE MOUTH
                    </h2>
                  </div>
                </div>
                <ul className="space-y-3">
                  {[
                    "Replies 24/7, never sleeps",
                    "Handles FAQs automatically",
                    "Captures leads instantly",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[#2D2A26] tracking-[-0.02em]">
                      <span className="text-[#284b31]">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Bot B */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.15, delay: 0.1 }}
                className="bg-[#f1f5f0] rounded-2xl p-8 border-2 border-[#284b31]/10"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-[#F7931A] rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#284b31] tracking-[-0.02em]">
                      BOT B — THE BRAIN
                    </h2>
                  </div>
                </div>
                <ul className="space-y-3">
                  {[
                    "Analyzes every conversation",
                    "Scores leads Hot/Cold",
                    "Updates CRM automatically",
                    "Flags urgent conversations",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[#2D2A26] tracking-[-0.02em]">
                      <span className="text-[#F7931A]">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* The Kicker */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.15, delay: 0.2 }}
              className="mt-12 text-center"
            >
              <div className="inline-block bg-[#F7931A]/10 border-2 border-[#F7931A] rounded-2xl px-8 py-6">
                <p className="text-sm font-semibold text-[#F7931A] uppercase tracking-wider mb-2">
                  THE KICKER?
                </p>
                <p className="text-2xl md:text-3xl font-extrabold text-[#284b31] tracking-[-0.02em] mb-4">
                  It's always developing for you.
                </p>
                <a
                  href="#comparison"
                  className="inline-flex items-center gap-2 text-[#284b31] font-semibold hover:text-[#F7931A] transition-colors duration-150 tracking-[-0.02em]"
                >
                  Don't believe it? Chat with us! <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 2: 3-Step Process + Free Month */}
        <section className="bg-[#284b31] text-white px-6 py-16 md:py-20">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.15 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-[-0.02em] mb-4">
                YOUR DIGITAL STAFF, IN 3 STEPS
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-4 mb-10">
              {[
                { step: "STEP 1", title: "Discover", desc: "We discuss your business", icon: "1" },
                { step: "STEP 2", title: "Setup", desc: "We build your system", icon: "2" },
                { step: "STEP 3", title: "Go Live", desc: "They work 24/7", icon: "3" },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.15, delay: 0.05 * index }}
                  className="relative bg-[#f1f5f0] rounded-xl p-5 border-2 border-[#284b31]/10 hover:border-[#284b31]/30 transition-colors duration-150"
                >
                  {/* Step label and number */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-[#284b31] uppercase tracking-wider">
                      {item.step}
                    </span>
                    <span className="w-12 h-12 bg-[#284b31] rounded-xl flex items-center justify-center text-white font-extrabold text-xl">
                      {item.icon}
                    </span>
                  </div>

                  {/* Content */}
                  <div>
                    <p className="text-xl font-bold text-[#284b31] mb-1">
                      {item.title}
                    </p>
                    <p className="text-sm text-[#2D2A26]/70">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.15, delay: 0.2 }}
              className="max-w-2xl mx-auto text-center"
            >
              <p className="text-base md:text-lg mb-3 tracking-[-0.02em] text-white/90">
                30 days setup → You test & adjust → Go live
              </p>
              <div className="inline-block bg-[#F7931A] rounded-xl px-6 py-4">
                <p className="text-xl md:text-2xl font-extrabold tracking-[-0.02em] mb-1">
                  🎁 FREE 1ST MONTH ON US!
                </p>
                <p className="text-sm tracking-[-0.02em]">
                  Pay setup fee. First month free. You're in control.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 3: Solo vs Team Comparison */}
        <section id="comparison" className="bg-white px-6 py-16 md:py-20">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.15 }}
              className="grid md:grid-cols-2 gap-8 lg:gap-12"
            >
              {/* Solo */}
              <motion.div
                className="bg-[#f1f5f0] rounded-2xl p-8 border-2 border-[#284b31]/10"
                variants={fadeInUp}
              >
                <div className="mb-6 pb-6 border-b-2 border-[#284b31]/10">
                  <h2 className="text-2xl font-extrabold text-[#284b31] tracking-[-0.02em]">
                    SOLO
                  </h2>
                  <p className="text-3xl font-extrabold text-[#284b31] mt-2 tracking-[-0.02em]">
                    Rp3,900,000
                    <span className="text-lg text-[#2D2A26]/60 font-normal">/mo</span>
                  </p>
                  <p className="text-sm text-[#F7931A] font-semibold mt-1 tracking-[-0.02em]">
                    1st month: FREE
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold text-[#2D2A26]/60 uppercase tracking-wider mb-3">
                      📦 WHAT YOU GET:
                    </p>

                    <div className="mb-4">
                      <p className="text-sm font-semibold text-[#284b31] mb-2">🤖 Bot A (The Mouth)</p>
                      <ul className="space-y-1 text-sm text-[#2D2A26]/80">
                        {["24/7 auto-reply", "FAQ handling", "Lead capture"].map((item) => (
                          <li key={item} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-[#284b31]" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-semibold text-[#284b31] mb-2">🧠 Bot B (The Brain)</p>
                      <ul className="space-y-1 text-sm text-[#2D2A26]/80">
                        {["Lead scoring", "CRM updates", "Weekly reports"].map((item) => (
                          <li key={item} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-[#284b31]" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-semibold text-[#284b31] mb-2">📊 QUOTA:</p>
                      <ul className="space-y-1 text-sm text-[#2D2A26]/80">
                        {["1 WhatsApp number", "30,000 AI chats/mo", "200 marketing msgs", "100 utility msgs"].map((item) => (
                          <li key={item} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-[#284b31]" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-semibold text-[#284b31] mb-2">🚀 FEATURE UNLOCK:</p>
                      <p className="text-sm text-[#2D2A26]/80">
                        Every <strong>3 months</strong>
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-[#284b31]/10">
                    <p className="text-sm text-[#2D2A26]/80 mb-4">
                      💰 SETUP: <span className="font-semibold text-[#284b31]">Rp7,500,000</span>
                      <span className="text-xs text-[#2D2A26]/60 ml-1">(one-time)</span>
                    </p>
                    <button
                      onClick={() => openModal("Solo")}
                      className="block w-full text-center py-4 rounded-xl bg-[#284b31] text-white font-bold text-sm hover:bg-[#1e3a23] transition-all duration-150"
                    >
                      CHOOSE SOLO
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Team */}
              <motion.div
                className="bg-[#F7931A] text-white rounded-2xl p-8 relative md:-translate-y-2 border-2 border-[#284b31]"
                variants={fadeInUp}
              >
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#284b31] text-white text-xs font-bold px-4 py-1.5 rounded-full tracking-[-0.02em]">
                  POPULAR
                </span>

                <div className="mb-6 pb-6 border-b-2 border-white/20">
                  <h2 className="text-2xl font-extrabold tracking-[-0.02em]">
                    TEAM
                  </h2>
                  <p className="text-3xl font-extrabold mt-2 tracking-[-0.02em]">
                    Rp7,900,000
                    <span className="text-lg text-white/80 font-normal">/mo</span>
                  </p>
                  <p className="text-sm font-semibold mt-1 tracking-[-0.02em]">
                    1st month: FREE
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">
                      📦 WHAT YOU GET:
                    </p>

                    <div className="mb-4">
                      <p className="text-sm font-semibold mb-2">🤖 Bot A (The Mouth)</p>
                      <ul className="space-y-1 text-sm text-white/90">
                        {["24/7 auto-reply", "FAQ handling", "Lead capture"].map((item) => (
                          <li key={item} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-semibold mb-2">🧠 Bot B (The Brain)</p>
                      <ul className="space-y-1 text-sm text-white/90">
                        {["Lead scoring", "CRM updates", "Weekly reports", "Priority support", "Multi-agent sync"].map((item) => (
                          <li key={item} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-semibold mb-2">📊 QUOTA:</p>
                      <ul className="space-y-1 text-sm text-white/90">
                        {["3 WhatsApp numbers", "60,000 AI chats/mo", "500 marketing msgs", "300 utility msgs"].map((item) => (
                          <li key={item} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-semibold mb-2">🚀 FEATURE UNLOCK:</p>
                      <p className="text-sm text-white/90">
                        Every <strong>1 month</strong>
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-white/20">
                    <p className="text-sm text-white/80 mb-4">
                      💰 SETUP: <span className="font-semibold">Rp7,500,000</span>
                      <span className="text-xs text-white/70 ml-1">(one-time)</span>
                    </p>
                    <button
                      onClick={() => openModal("Team")}
                      className="block w-full text-center py-4 rounded-xl bg-white text-[#F7931A] font-bold text-sm hover:bg-white/90 transition-all duration-150"
                    >
                      CHOOSE TEAM
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 4: Enterprise Small Box */}
        <section className="bg-[#f1f5f0] px-6 py-12">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl p-8 text-center border-2 border-[#284b31]/10"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <Building2 className="w-8 h-8 text-[#284b31]" />
                <h2 className="text-xl font-bold text-[#284b31] tracking-[-0.02em]">
                  NEED MORE THAN TEAM?
                </h2>
              </div>
              <p className="text-[#2D2A26]/70 mb-6 tracking-[-0.02em]">
                Enterprise and custom plans available.<br />
                High-volume, multi-location, or custom workflows.
              </p>
              <button
                onClick={() => openModal("Enterprise")}
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#284b31] text-white font-bold text-sm rounded-xl hover:bg-[#1e3a23] transition-all duration-150"
              >
                CONTACT US FOR ENTERPRISE <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
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
                Fill this form and we'll contact you shortly.
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
                We'll contact you via WhatsApp within 24 hours.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
