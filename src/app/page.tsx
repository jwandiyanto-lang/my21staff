"use client";

import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono, Inter } from "next/font/google";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  MessageCircle,
  Zap,
  Users,
} from "lucide-react";
import { WaveAnimation } from "@/components/ui/wave-animation";
import { StaffDeck } from "@/components/ui/staff-deck";

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

export default function Home() {
  return (
    <div
      className={`${plusJakartaSans.variable} ${jetBrainsMono.variable} ${inter.variable} bg-landing-bg text-landing-text antialiased`}
      style={{ fontFamily: "var(--font-inter)" }}
    >
      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Navigation - Blends with sections */}
      <nav className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
        <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-black text-white">21</span>
            </Link>
            <div className="hidden md:flex gap-6 text-sm text-white/90">
              <a className="hover:text-white transition-colors" href="#">
                Harga
              </a>
              <a className="hover:text-white transition-colors" href="#">
                Layanan Kita
              </a>
              <a className="hover:text-white transition-colors" href="#">
                Kenapa Harus
              </a>
            </div>
          </div>
          <Link
            href="/auth/login"
            className="text-sm text-white px-4 py-1.5 rounded-full border border-white/30 hover:bg-white/10 transition-all"
          >
            Login
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 bg-landing-hero notion-grid overflow-hidden border-b border-notion">
          <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              className="max-w-2xl relative flex"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {/* Wave Animation beside text */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="hidden lg:block w-16 h-[400px] mr-8 shrink-0 rounded-lg overflow-hidden"
              >
                <WaveAnimation
                  color="rgba(255, 255, 255, 0.5)"
                  lineCount={8}
                  speed={0.018}
                />
              </motion.div>

              <div>
              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white/20 border border-white/30 mb-8 backdrop-blur-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-white font-mono">
                  WhatsApp CRM untuk UMKM
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-5xl lg:text-7xl font-extrabold tracking-tighter leading-[0.9] mb-8 text-white text-shadow-pop"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Kelola Leads <br />
                dari <span className="italic font-normal">WhatsApp.</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg md:text-xl text-white/90 max-w-lg mb-10 leading-relaxed font-medium"
              >
                CRM yang terhubung langsung ke WhatsApp & Meta Ads.
                Tangkap leads, kelola percakapan, dan tutup penjualan — semua dari satu dashboard.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
                <button className="px-10 py-4 rounded-notion bg-white text-landing-hero font-black uppercase tracking-widest hover:bg-white/90 transition-all flex items-center gap-2 shadow-xl">
                  Mulai Gratis
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
              </div>
            </motion.div>

            {/* Hero Visual - Animated Staff Deck */}
            <div className="relative flex justify-center items-center py-12">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <StaffDeck />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Core Features Section - Greenhouse Style */}
        <section className="py-24 border-b border-notion bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Semua yang Anda butuhkan untuk{" "}
                <span className="italic">scale</span>
              </motion.h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {[
                {
                  icon: Users,
                  title: "Database CRM",
                  desc: "Kelola kontak & leads dengan status tracking",
                  image: "bg-gradient-to-br from-amber-100 to-orange-200",
                  emoji: "📊",
                },
                {
                  icon: MessageCircle,
                  title: "WhatsApp Messaging",
                  desc: "Kirim & terima pesan langsung dari CRM",
                  image: "bg-gradient-to-br from-emerald-100 to-teal-200",
                  emoji: "💬",
                },
                {
                  icon: Zap,
                  title: "Website & Webinar",
                  desc: "Buat halaman publik untuk tangkap leads",
                  image: "bg-gradient-to-br from-blue-100 to-indigo-200",
                  emoji: "🌐",
                },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  variants={fadeInUp}
                  className="group cursor-pointer"
                >
                  {/* Image Area */}
                  <div className={`${feature.image} rounded-2xl h-[220px] mb-5 relative overflow-hidden`}>
                    {/* Floating UI Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="absolute bottom-4 right-4 bg-white rounded-xl shadow-lg p-3 flex items-center gap-2"
                    >
                      <span className="text-2xl">{feature.emoji}</span>
                      <div className="text-xs">
                        <div className="font-bold text-landing-text">Active</div>
                        <div className="text-landing-text-muted">Live now</div>
                      </div>
                    </motion.div>
                    {/* Person silhouette placeholder */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-40 bg-gradient-to-t from-black/10 to-transparent rounded-t-full" />
                  </div>
                  <h3
                    className="text-xl font-bold mb-2 group-hover:text-landing-cta transition-colors"
                    style={{ fontFamily: "var(--font-jakarta)" }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-landing-text-muted leading-relaxed text-sm">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Free Support Section - Two Column Greenhouse Style */}
        <section className="py-24 border-b border-notion bg-[#FDF8F3]">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image Area */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-amber-200 via-orange-100 to-yellow-100 rounded-3xl h-[450px] relative overflow-hidden">
                  {/* Decorative circles */}
                  <div className="absolute top-10 right-10 w-20 h-20 bg-white/40 rounded-full" />
                  <div className="absolute bottom-20 left-10 w-12 h-12 bg-white/30 rounded-full" />

                  {/* Person placeholder */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-72 bg-gradient-to-t from-amber-900/20 to-transparent rounded-t-full" />

                  {/* Floating Chat Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20, x: 20 }}
                    whileInView={{ opacity: 1, y: 0, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="absolute top-8 right-8 bg-white rounded-2xl shadow-xl p-4 max-w-[200px]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-landing-cta flex items-center justify-center text-white text-sm">💬</div>
                      <span className="text-xs font-bold">WhatsApp Support</span>
                    </div>
                    <p className="text-[11px] text-landing-text-muted">Halo! Ada yang bisa kami bantu?</p>
                  </motion.div>

                  {/* Floating Status Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20, x: -20 }}
                    whileInView={{ opacity: 1, y: 0, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="absolute bottom-24 left-6 bg-white rounded-xl shadow-lg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-bold">Online 24/7</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Right - Content */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                <motion.p
                  variants={fadeInUp}
                  className="text-landing-cta font-bold text-sm uppercase tracking-widest mb-4"
                >
                  Gratis Selamanya
                </motion.p>
                <motion.h2
                  variants={fadeInUp}
                  className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  Support 24/7 dari tim kami.
                </motion.h2>
                <motion.p
                  variants={fadeInUp}
                  className="text-lg text-landing-text-muted mb-8"
                >
                  Anda tanya, kami kerjakan, Anda lanjut. Response dalam hitungan menit via WhatsApp.
                </motion.p>

                <motion.div variants={fadeInUp} className="space-y-4">
                  {[
                    { title: "Website Support", desc: "Setup halaman, upload konten, perbaiki layout" },
                    { title: "WhatsApp Support", desc: "Konfigurasi bot, setup auto-reply, troubleshoot" },
                    { title: "CRM Support", desc: "Atur kontak, setup pipeline, bersihkan data" },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-landing-cta/10 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-landing-cta" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold mb-1">{item.title}</h4>
                        <p className="text-sm text-landing-text-muted">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>

                <motion.div variants={fadeInUp} className="mt-8">
                  <button className="px-6 py-3 rounded-full border-2 border-landing-text text-landing-text font-bold text-sm hover:bg-landing-text hover:text-white transition-all">
                    Chat dengan Tim Kami
                  </button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Final CTA Section - Greenhouse Style */}
        <section className="py-24 bg-[#FDF8F3]">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2
                  className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  Siap scale bisnis Anda dengan <span className="italic">WhatsApp?</span>
                </h2>
                <p className="text-lg text-landing-text-muted mb-8">
                  Mulai gratis hari ini. Setup dalam 5 menit. Tim kami siap bantu 24/7.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="px-8 py-4 rounded-full bg-landing-cta text-white font-bold hover:bg-landing-cta-dark transition-all shadow-lg">
                    Mulai Gratis Sekarang
                  </button>
                  <button className="px-8 py-4 rounded-full border-2 border-landing-text text-landing-text font-bold hover:bg-landing-text hover:text-white transition-all">
                    Chat via WhatsApp
                  </button>
                </div>
              </motion.div>

              {/* Right Image Area */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-landing-cta/20 via-orange-100 to-amber-100 rounded-3xl h-[400px] relative overflow-hidden">
                  {/* Decorative elements */}
                  <div className="absolute top-8 left-8 w-16 h-16 bg-white/50 rounded-full" />
                  <div className="absolute bottom-16 right-16 w-12 h-12 bg-white/40 rounded-full" />

                  {/* Person placeholder */}
                  <div className="absolute bottom-0 right-1/4 w-40 h-64 bg-gradient-to-t from-landing-cta/20 to-transparent rounded-t-full" />

                  {/* Floating Success Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="absolute top-8 right-8 bg-white rounded-2xl shadow-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-bold">Lead Closed!</div>
                        <div className="text-xs text-landing-text-muted">Rp 5.000.000</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Floating Stats Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className="absolute bottom-8 left-8 bg-white rounded-2xl shadow-xl p-4"
                  >
                    <div className="text-xs text-landing-text-muted mb-1">Leads Bulan Ini</div>
                    <div className="text-2xl font-black text-landing-cta">+247</div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Compact */}
      <footer className="bg-white border-t border-notion py-6">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo & Copyright */}
            <div className="flex items-center gap-3">
              <span className="text-lg font-black text-landing-cta">21</span>
              <span className="text-xs text-landing-text-muted">&copy; 2024</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-xs text-landing-text-muted">
              <a className="hover:text-landing-cta transition-colors" href="#">Fitur</a>
              <a className="hover:text-landing-cta transition-colors" href="#">Harga</a>
              <a className="hover:text-landing-cta transition-colors" href="#">Syarat</a>
              <a className="hover:text-landing-cta transition-colors" href="#">Privasi</a>
            </div>

            {/* Social */}
            <div className="flex items-center gap-4 text-xs text-landing-text-muted">
              <a className="hover:text-landing-cta transition-colors" href="#">Instagram</a>
              <a className="hover:text-landing-cta transition-colors" href="#">WhatsApp</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
