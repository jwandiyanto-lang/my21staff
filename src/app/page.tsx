"use client";

import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono, Inter } from "next/font/google";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Network,
  Bot,
  Cog,
  Wallet,
  MessageCircle,
  Zap,
  Users,
  Building2,
  Plug,
  Rocket,
  TrendingUp,
} from "lucide-react";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const floatIn = (delay: number) => ({
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay, ease: "easeOut" as const },
  },
});

export default function Home() {
  return (
    <div
      className={`${plusJakartaSans.variable} ${jetBrainsMono.variable} ${inter.variable} bg-landing-bg text-landing-text antialiased`}
      style={{ fontFamily: "var(--font-inter)" }}
    >
      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-notion">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-black flex items-center justify-center text-white text-[12px] font-bold">
                M
              </div>
              <span className="font-bold text-base tracking-tight">my21staff</span>
            </Link>
            <div className="hidden md:flex gap-6 text-xs font-bold uppercase tracking-widest text-landing-text-muted">
              <a className="hover:text-landing-text transition-colors" href="#">
                Product
              </a>
              <a className="hover:text-landing-text transition-colors" href="#">
                Templates
              </a>
              <a className="hover:text-landing-text transition-colors" href="#">
                Enterprise
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-xs font-bold uppercase tracking-widest text-landing-text-muted hover:text-landing-text transition-colors"
            >
              Log in
            </Link>
            <button className="px-5 py-2 rounded-notion bg-landing-cta text-white hover:bg-landing-cta-dark transition-all text-xs font-black uppercase tracking-widest shadow-sm">
              Join Beta
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 bg-landing-hero notion-grid overflow-hidden border-b border-notion">
          <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              className="max-w-2xl"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white/20 border border-white/30 mb-8 backdrop-blur-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-white font-mono">
                  v2.0 Productivity Engine
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-6xl lg:text-[100px] font-extrabold tracking-tighter leading-[0.85] mb-8 text-white text-shadow-pop"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Unified <br />
                OS for <span className="italic font-normal">WhatsApp.</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg md:text-xl text-white/90 max-w-lg mb-10 leading-relaxed font-medium"
              >
                A workspace for high-growth teams. Blend CRM automation with high-end
                editorial aesthetics and deep productivity.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
                <button className="px-10 py-4 rounded-notion bg-white text-landing-hero font-black uppercase tracking-widest hover:bg-white/90 transition-all flex items-center gap-2 shadow-xl">
                  Get started
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button className="px-10 py-4 rounded-notion border-2 border-white/50 text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                  Docs
                </button>
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <div className="relative flex justify-center py-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative w-[450px] h-[450px] bg-white/10 border border-white/20 rounded-full flex items-center justify-center"
              >
                {/* Central Hub */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1, rotate: 3 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  whileHover={{ rotate: 0 }}
                  className="z-20 bg-landing-coral w-32 h-32 rounded-3xl shadow-2xl flex items-center justify-center border-4 border-white"
                >
                  <Network className="w-12 h-12 text-white" />
                </motion.div>

                {/* Floating Cards */}
                <motion.div
                  variants={floatIn(0.6)}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ y: -4 }}
                  className="absolute -top-4 -right-8 z-10 bg-landing-lavender border-notion-thick p-5 rounded-notion shadow-xl flex items-center gap-4 w-56"
                >
                  <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-purple-600 shadow-sm">
                    <Bot className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-[12px] font-black uppercase tracking-widest">
                      AI Agent
                    </div>
                    <div className="text-[10px] font-bold text-landing-text-muted font-mono">
                      READY TO CHAT
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={floatIn(0.7)}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ x: -4 }}
                  className="absolute top-1/2 -left-32 -translate-y-1/2 z-10 bg-landing-blue-card border-notion-thick p-5 rounded-notion shadow-xl flex items-center gap-4 w-56"
                >
                  <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm">
                    <Cog className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-[12px] font-black uppercase tracking-widest">
                      Workflow Eng.
                    </div>
                    <div className="text-[10px] font-bold text-landing-text-muted font-mono">
                      SYNCING REPOS
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={floatIn(0.8)}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ y: 4 }}
                  className="absolute -bottom-6 right-0 z-10 bg-landing-mint border-notion-thick p-5 rounded-notion shadow-xl flex items-center gap-4 w-56"
                >
                  <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-green-600 shadow-sm">
                    <Wallet className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-[12px] font-black uppercase tracking-widest">
                      Sales Desk
                    </div>
                    <div className="text-[10px] font-bold text-landing-text-muted font-mono">
                      REVENUE LIVE
                    </div>
                  </div>
                </motion.div>

                {/* Inner Ring */}
                <div className="absolute w-[300px] h-[300px] border border-white/20 rounded-full" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Central Console Section */}
        <section className="py-24 border-b border-notion bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="flex flex-col md:flex-row items-baseline justify-between mb-16 gap-4"
            >
              <div>
                <motion.h2
                  variants={fadeInUp}
                  className="text-xs font-bold uppercase tracking-[0.3em] text-landing-text-muted mb-4 font-mono"
                >
                  Real-Time Operations
                </motion.h2>
                <motion.p
                  variants={fadeInUp}
                  className="text-4xl font-extrabold tracking-tight"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  The Central Console.
                </motion.p>
              </div>
              <motion.div
                variants={fadeInUp}
                className="w-full md:w-auto border-t md:border-t-0 border-notion pt-4 md:pt-0"
              >
                <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-landing-cta">
                  System Metrics <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-4 gap-1"
            >
              {[
                { icon: MessageCircle, label: "Conversations", value: "2.4k", change: "+12%", up: true },
                { icon: Wallet, label: "Revenue", value: "$48k", change: "+8.4%", up: true },
                { icon: Zap, label: "Latency", value: "1.2s", change: "Global Avg", up: false },
                { icon: Users, label: "Active Staff", value: "09", change: "Scaling Up", up: false, highlight: true },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={fadeInUp}
                  className="border-notion-thick p-8 bg-landing-bg hover:bg-white transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-8 text-landing-text-muted">
                    <stat.icon className="w-[18px] h-[18px]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                      {stat.label}
                    </span>
                  </div>
                  <div
                    className="text-5xl font-extrabold mb-2 tracking-tighter"
                    style={{ fontFamily: "var(--font-jakarta)" }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${
                      stat.up ? "text-green-600" : stat.highlight ? "text-landing-cta" : "text-landing-text-muted"
                    }`}
                  >
                    {stat.up && <TrendingUp className="w-3 h-3" />}
                    {stat.change}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Scale Section */}
        <section className="py-32 bg-landing-pale-peach border-b border-notion">
          <div className="mx-auto max-w-7xl px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="max-w-3xl mb-24"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-xs font-bold uppercase tracking-[0.3em] text-landing-cta mb-6 font-mono"
              >
                Scale Infrastructure
              </motion.h2>
              <motion.h3
                variants={fadeInUp}
                className="text-7xl font-extrabold tracking-tighter italic text-landing-text leading-tight"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                How we scale you.
              </motion.h3>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-16"
            >
              {[
                {
                  num: "01",
                  icon: Building2,
                  title: "Architecture Audit",
                  desc: "We document every manual touchpoint and redesign your workflow into a linear, automated sequence. Zero leakage.",
                },
                {
                  num: "02",
                  icon: Plug,
                  title: "Unified Integration",
                  desc: "Your CRM, payment gateways, and logistics are hard-wired into the core. Real-time sync across your entire OS.",
                },
                {
                  num: "03",
                  icon: Rocket,
                  title: "Scale Engine",
                  desc: "Deploy the AI Staff to handle high-volume inquiries while you monitor performance from the high-res command center.",
                },
              ].map((step) => (
                <motion.div key={step.num} variants={fadeInUp} className="group">
                  <div className="text-[120px] font-black text-landing-cta opacity-20 leading-none mb-4 -ml-2 select-none group-hover:opacity-40 transition-opacity">
                    {step.num}
                  </div>
                  <div className="border-t-2 border-landing-cta/20 pt-8">
                    <div className="w-12 h-12 rounded bg-landing-cta flex items-center justify-center text-white mb-6 shadow-lg shadow-landing-cta/20">
                      <step.icon className="w-5 h-5" />
                    </div>
                    <h4
                      className="text-2xl font-bold mb-4"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {step.title}
                    </h4>
                    <p className="text-landing-text-muted leading-relaxed font-medium">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="bg-landing-text text-white rounded-[40px] p-12 md:p-24 relative overflow-hidden shadow-2xl"
            >
              <div className="relative z-10 max-w-2xl">
                <h2
                  className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[0.9]"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  Ready to automate your{" "}
                  <span className="text-landing-cta italic">next million?</span>
                </h2>
                <p className="text-xl text-white/60 mb-12 font-medium">
                  Deploy the WhatsApp OS. Purpose-built for the world&apos;s most
                  ambitious storefronts.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="px-10 py-5 rounded-notion bg-landing-cta text-white font-black uppercase tracking-widest hover:bg-landing-cta-dark transition-all text-sm shadow-2xl">
                    Deploy Now
                  </button>
                  <button className="px-10 py-5 rounded-notion bg-white/10 text-white font-black uppercase tracking-widest hover:bg-white/20 transition-all text-sm backdrop-blur-md">
                    Engineering Docs
                  </button>
                </div>
              </div>
              {/* Glow Effects */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-landing-coral/20 blur-[120px] -mr-48 -mt-48" />
              <div className="absolute bottom-0 right-0 w-80 h-80 bg-landing-cta/30 blur-[80px]" />
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-landing-bg border-t border-notion py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-20">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-notion bg-black flex items-center justify-center text-white text-[14px] font-bold">
                  M
                </div>
                <span className="font-black text-xl tracking-tighter uppercase">
                  my21staff
                </span>
              </div>
              <p className="text-sm text-landing-text-muted max-w-xs mb-10 leading-relaxed font-medium">
                The sophisticated operating system for scaling business through
                WhatsApp messaging. Built for the modern web.
              </p>
              <div className="flex items-center gap-3 px-4 py-2 bg-white border-notion-thick rounded-notion w-fit">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-landing-text-muted font-mono">
                  Production Node: Active
                </span>
              </div>
            </div>

            <div>
              <h5 className="text-[11px] font-black text-landing-text uppercase tracking-widest mb-8">
                Platform
              </h5>
              <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-landing-text-muted">
                <li><a className="hover:text-landing-cta transition-colors" href="#">Features</a></li>
                <li><a className="hover:text-landing-cta transition-colors" href="#">Integrations</a></li>
                <li><a className="hover:text-landing-cta transition-colors" href="#">Pricing</a></li>
                <li><a className="hover:text-landing-cta transition-colors" href="#">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h5 className="text-[11px] font-black text-landing-text uppercase tracking-widest mb-8">
                Resources
              </h5>
              <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-landing-text-muted">
                <li><a className="hover:text-landing-cta transition-colors" href="#">Documentation</a></li>
                <li><a className="hover:text-landing-cta transition-colors" href="#">Staff Training</a></li>
                <li><a className="hover:text-landing-cta transition-colors" href="#">Help Center</a></li>
                <li><a className="hover:text-landing-cta transition-colors" href="#">API Status</a></li>
              </ul>
            </div>

            <div>
              <h5 className="text-[11px] font-black text-landing-text uppercase tracking-widest mb-8">
                Company
              </h5>
              <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-landing-text-muted">
                <li><a className="hover:text-landing-cta transition-colors" href="#">About</a></li>
                <li><a className="hover:text-landing-cta transition-colors" href="#">Security</a></li>
                <li><a className="hover:text-landing-cta transition-colors" href="#">Terms</a></li>
                <li><a className="hover:text-landing-cta transition-colors" href="#">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-notion pt-10 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold text-landing-text-muted uppercase tracking-[0.2em] font-mono">
            <p>&copy; 2024 MY21STAFF INC. DESIGNED FOR PERFORMANCE.</p>
            <div className="flex gap-8 mt-6 md:mt-0">
              <a className="hover:text-landing-cta transition-colors" href="#">Twitter</a>
              <a className="hover:text-landing-cta transition-colors" href="#">LinkedIn</a>
              <a className="hover:text-landing-cta transition-colors" href="#">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
