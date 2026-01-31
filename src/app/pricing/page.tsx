"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowRight, Zap, Activity } from "lucide-react";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "600", "700"],
});

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
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

      setSubmitSuccess(true);
      resetForm();

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

  // Activity feed mock data
  const activities = [
    {
      type: "lead",
      icon: "psychology",
      title: "Lead Qualified",
      contact: "Sarah Chen",
      detail: "Hot lead • Education",
      time: "2m ago",
      color: "#F7931A",
    },
    {
      type: "message",
      icon: "smart_toy",
      title: "Auto-replied",
      contact: "Ahmad Rizki",
      detail: "FAQ: Pricing",
      time: "5m ago",
      color: "#1B4332",
    },
    {
      type: "update",
      icon: "sync",
      title: "CRM Updated",
      contact: "Maria Santos",
      detail: "Stage: Follow-up",
      time: "12m ago",
      color: "#6B7280",
    },
  ];

  return (
    <div
      className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen`}
      style={{ fontFamily: "var(--font-inter)" }}
    >
      {/* Navigation */}
      <nav className="bg-[#1B4332] border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-extrabold tracking-[-0.02em]">
              <span className="text-white/80">my</span>
              <span className="text-[#F7931A]">21</span>
              <span className="text-white/80">staff</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-white/80 hover:text-[#F7931A] transition-colors duration-150 font-medium tracking-[-0.02em]"
          >
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Grid Background */}
      <div className="relative bg-[#FCFCFB] notion-grid">
        {/* Hero Section */}
        <section className="relative px-6 py-20 md:py-28">
          <div className="mx-auto max-w-5xl text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#37352F14] bg-white/80 backdrop-blur-sm mb-6"
            >
              <span className="material-symbols-outlined text-[#1B4332] text-[20px]">
                verified
              </span>
              <span className="text-sm font-medium text-[#37352F]" style={{ fontFamily: "var(--font-jetbrains)" }}>
                Pricing Engine V3
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#1B4332] mb-6 tracking-tight"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Simple, sovereign pricing.
            </motion.h1>

            {/* Description + Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <p className="text-lg text-[#37352F]/60 mb-6 max-w-2xl mx-auto">
                Transparent pricing for Indonesian SMEs. Pay monthly or save 20% with yearly billing.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 ${
                    billingCycle === "monthly"
                      ? "bg-[#1B4332] text-white"
                      : "bg-transparent text-[#37352F] hover:bg-[#37352F0A]"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 ${
                    billingCycle === "yearly"
                      ? "bg-[#1B4332] text-white"
                      : "bg-transparent text-[#37352F] hover:bg-[#37352F0A]"
                  }`}
                >
                  Yearly
                </button>
              </div>

              {billingCycle === "yearly" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-[#F7931A]/10 border border-[#F7931A]/20"
                >
                  <Zap className="w-4 h-4 text-[#F7931A]" />
                  <span className="text-sm font-medium text-[#F7931A]">Save 20% with yearly</span>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="relative px-6 pb-20">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-3xl border border-[#37352F14] overflow-hidden shadow-lg"
            >
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#37352F14]">
                      <th className="text-left p-6 font-semibold text-[#37352F] w-1/4">
                        Features & Specs
                      </th>
                      <th className="p-6 text-center w-1/4">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-2xl font-bold text-[#1B4332] mb-1" style={{ fontFamily: "var(--font-jakarta)" }}>
                              Solo
                            </h3>
                            <p className="text-3xl font-bold text-[#1B4332]" style={{ fontFamily: "var(--font-jetbrains)" }}>
                              Rp3.9M
                              <span className="text-base text-[#6B7280] font-normal">/mo</span>
                            </p>
                            <p className="text-sm text-[#F7931A] font-medium mt-1">1st month FREE</p>
                          </div>
                          <button
                            onClick={() => openModal("Solo")}
                            className="w-full px-6 py-3 bg-[#1B4332] text-white font-semibold rounded-xl hover:bg-[#14261a] transition-all duration-200"
                          >
                            Get Started
                          </button>
                        </div>
                      </th>
                      <th className="p-6 text-center bg-[#1B4332]/5 w-1/4 relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#F7931A] text-white text-xs font-bold rounded-full">
                          MOST POPULAR
                        </div>
                        <div className="space-y-4 pt-2">
                          <div>
                            <h3 className="text-2xl font-bold text-[#1B4332] mb-1" style={{ fontFamily: "var(--font-jakarta)" }}>
                              Team
                            </h3>
                            <p className="text-3xl font-bold text-[#1B4332]" style={{ fontFamily: "var(--font-jetbrains)" }}>
                              Rp7.9M
                              <span className="text-base text-[#6B7280] font-normal">/mo</span>
                            </p>
                            <p className="text-sm text-[#F7931A] font-medium mt-1">1st month FREE</p>
                          </div>
                          <button
                            onClick={() => openModal("Team")}
                            className="w-full px-6 py-3 bg-[#F7931A] text-white font-semibold rounded-xl hover:bg-[#e8850f] transition-all duration-200"
                          >
                            Get Started
                          </button>
                        </div>
                      </th>
                      <th className="p-6 text-center w-1/4">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-2xl font-bold text-[#1B4332] mb-1" style={{ fontFamily: "var(--font-jakarta)" }}>
                              Enterprise
                            </h3>
                            <p className="text-3xl font-bold text-[#1B4332]" style={{ fontFamily: "var(--font-jetbrains)" }}>
                              Custom
                            </p>
                            <p className="text-sm text-[#6B7280] mt-1">Tailored to your needs</p>
                          </div>
                          <button
                            onClick={() => openModal("Enterprise")}
                            className="w-full px-6 py-3 bg-white text-[#1B4332] font-semibold rounded-xl border-2 border-[#1B4332] hover:bg-[#1B4332] hover:text-white transition-all duration-200"
                          >
                            Contact Sales
                          </button>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Bot A - The Mouth */}
                    <tr className="border-b border-[#37352F14] hover:bg-[#FCFCFB] transition-colors duration-150">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[#1B4332] text-[24px]">
                            smart_toy
                          </span>
                          <div>
                            <p className="font-semibold text-[#37352F]">Bot A - The Mouth</p>
                            <p className="text-sm text-[#6B7280]">24/7 auto-reply & FAQ handling</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <Check className="w-5 h-5 text-[#1B4332] mx-auto" />
                      </td>
                      <td className="p-6 text-center bg-[#1B4332]/5">
                        <Check className="w-5 h-5 text-[#1B4332] mx-auto" />
                      </td>
                      <td className="p-6 text-center">
                        <Check className="w-5 h-5 text-[#1B4332] mx-auto" />
                      </td>
                    </tr>

                    {/* Bot B - The Brain */}
                    <tr className="border-b border-[#37352F14] hover:bg-[#FCFCFB] transition-colors duration-150">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[#F7931A] text-[24px]">
                            psychology
                          </span>
                          <div>
                            <p className="font-semibold text-[#37352F]">Bot B - The Brain</p>
                            <p className="text-sm text-[#6B7280]">Lead scoring & CRM automation</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <Check className="w-5 h-5 text-[#1B4332] mx-auto" />
                      </td>
                      <td className="p-6 text-center bg-[#1B4332]/5">
                        <div className="space-y-1">
                          <Check className="w-5 h-5 text-[#1B4332] mx-auto" />
                          <p className="text-xs text-[#F7931A] font-medium">+ Priority support</p>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <div className="space-y-1">
                          <Check className="w-5 h-5 text-[#1B4332] mx-auto" />
                          <p className="text-xs text-[#F7931A] font-medium">+ Custom AI training</p>
                        </div>
                      </td>
                    </tr>

                    {/* WhatsApp Numbers */}
                    <tr className="border-b border-[#37352F14] hover:bg-[#FCFCFB] transition-colors duration-150">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[#1B4332] text-[24px]">
                            phone_android
                          </span>
                          <p className="font-semibold text-[#37352F]">WhatsApp Numbers</p>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <span className="font-mono font-semibold text-[#1B4332]">1</span>
                      </td>
                      <td className="p-6 text-center bg-[#1B4332]/5">
                        <span className="font-mono font-semibold text-[#1B4332]">3</span>
                      </td>
                      <td className="p-6 text-center">
                        <span className="font-mono font-semibold text-[#1B4332]">Unlimited</span>
                      </td>
                    </tr>

                    {/* AI Chats/Month */}
                    <tr className="border-b border-[#37352F14] hover:bg-[#FCFCFB] transition-colors duration-150">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[#1B4332] text-[24px]">
                            forum
                          </span>
                          <p className="font-semibold text-[#37352F]">AI Chats per Month</p>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <span className="font-mono font-semibold text-[#1B4332]">30,000</span>
                      </td>
                      <td className="p-6 text-center bg-[#1B4332]/5">
                        <span className="font-mono font-semibold text-[#1B4332]">60,000</span>
                      </td>
                      <td className="p-6 text-center">
                        <span className="font-mono font-semibold text-[#1B4332]">Custom</span>
                      </td>
                    </tr>

                    {/* Feature Unlock Frequency */}
                    <tr className="border-b border-[#37352F14] hover:bg-[#FCFCFB] transition-colors duration-150">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[#F7931A] text-[24px]">
                            rocket_launch
                          </span>
                          <p className="font-semibold text-[#37352F]">New Features</p>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <span className="font-mono text-sm text-[#6B7280]">Every 3 months</span>
                      </td>
                      <td className="p-6 text-center bg-[#1B4332]/5">
                        <span className="font-mono text-sm text-[#F7931A] font-semibold">Monthly updates</span>
                      </td>
                      <td className="p-6 text-center">
                        <span className="font-mono text-sm text-[#F7931A] font-semibold">Instant access</span>
                      </td>
                    </tr>

                    {/* Setup Fee */}
                    <tr className="hover:bg-[#FCFCFB] transition-colors duration-150">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[#1B4332] text-[24px]">
                            settings
                          </span>
                          <p className="font-semibold text-[#37352F]">Setup Fee (one-time)</p>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <span className="font-mono font-semibold text-[#1B4332]">Rp7.5M</span>
                      </td>
                      <td className="p-6 text-center bg-[#1B4332]/5">
                        <span className="font-mono font-semibold text-[#1B4332]">Rp7.5M</span>
                      </td>
                      <td className="p-6 text-center">
                        <span className="font-mono font-semibold text-[#1B4332]">Custom</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Infrastructure Health Section */}
        <section className="relative px-6 pb-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Left: Sticky Text */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:sticky lg:top-24 space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#37352F14] bg-white/80 backdrop-blur-sm">
                  <Activity className="w-4 h-4 text-[#1B4332]" />
                  <span className="text-sm font-medium text-[#37352F]" style={{ fontFamily: "var(--font-jetbrains)" }}>
                    Real-time monitoring
                  </span>
                </div>

                <h2 className="text-4xl sm:text-5xl font-bold text-[#1B4332] tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
                  Infrastructure Health
                </h2>

                <p className="text-lg text-[#37352F]/60 leading-relaxed">
                  Your AI team works around the clock. Monitor every conversation, lead score, and automation in real-time.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-4 rounded-xl border border-[#37352F14] bg-white/50">
                    <p className="text-3xl font-bold text-[#1B4332]" style={{ fontFamily: "var(--font-jetbrains)" }}>99.8%</p>
                    <p className="text-sm text-[#6B7280] font-mono mt-1">Live Load</p>
                  </div>
                  <div className="p-4 rounded-xl border border-[#37352F14] bg-white/50">
                    <p className="text-3xl font-bold text-[#1B4332]" style={{ fontFamily: "var(--font-jetbrains)" }}>0.02s</p>
                    <p className="text-sm text-[#6B7280] font-mono mt-1">Queue Sync</p>
                  </div>
                </div>
              </motion.div>

              {/* Right: Live Activity Feed Browser Mockup */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                {/* Browser Chrome */}
                <div className="bg-white rounded-2xl border border-[#37352F14] shadow-2xl overflow-hidden">
                  {/* Browser Header */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-[#37352F14] bg-[#F5F5F4]">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                    </div>
                    <div className="flex-1 mx-4 px-3 py-1 bg-white rounded-md border border-[#37352F14]">
                      <p className="text-xs text-[#6B7280] font-mono">my21staff.com/activity</p>
                    </div>
                  </div>

                  {/* Activity Feed */}
                  <div className="p-6 space-y-3 bg-gradient-to-b from-white to-[#FCFCFB]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-[#1B4332]">Live Activity</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#27C93F] animate-pulse"></div>
                        <span className="text-xs text-[#6B7280] font-mono">Live</span>
                      </div>
                    </div>

                    {activities.map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-start gap-3 p-4 rounded-xl border border-[#37352F14] bg-white hover:border-[#37352F29] transition-all duration-200"
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${activity.color}15` }}
                        >
                          <span className="material-symbols-outlined text-[20px]" style={{ color: activity.color }}>
                            {activity.icon}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#37352F]">{activity.title}</p>
                          <p className="text-sm text-[#1B4332] font-medium">{activity.contact}</p>
                          <p className="text-xs text-[#6B7280]">{activity.detail}</p>
                        </div>
                        <span className="text-xs text-[#6B7280] font-mono flex-shrink-0">{activity.time}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-[#1B4332] border-t border-white/10 py-8">
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
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            />

            <motion.div
              className="relative bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-150"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-2xl font-extrabold text-[#2D2A26] mb-2 tracking-[-0.02em]">
                Interested in {selectedPlan}?
              </h3>
              <p className="text-sm text-[#2D2A26]/60 mb-6 tracking-[-0.02em]">
                Fill this form and we'll contact you shortly.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="hidden" name="paket" value={selectedPlan} />

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
