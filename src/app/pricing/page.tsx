"use client";

import Link from "next/link";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
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

export default function PricingPage() {
  return (
    <div
      className={`${plusJakartaSans.variable} ${inter.variable} bg-white text-landing-text antialiased min-h-screen`}
      style={{ fontFamily: "var(--font-inter)" }}
    >
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-6 h-14 flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-black text-landing-cta">21</span>
          </Link>
        </div>
      </nav>

      <main className="pt-14">
        {/* Story Section */}
        <section className="py-20 bg-[#FDF8F3]">
          <div className="mx-auto max-w-2xl px-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.p variants={fadeInUp} className="text-xl md:text-2xl leading-relaxed text-landing-text">
                Leads <span className="font-bold">kebanyakan</span>? Anda balas semua orang, tapi bukan yang tepat. Waktu habis, closing minim.
              </motion.p>

              <motion.p variants={fadeInUp} className="text-xl md:text-2xl leading-relaxed text-landing-text">
                Atau malah <span className="font-bold text-landing-cta">gak ada leads</span>? Belum paham konten dan iklan online. Kompetitor sudah jalan, Anda masih diam.
              </motion.p>

              <motion.p variants={fadeInUp} className="text-xl md:text-2xl leading-relaxed text-landing-text-muted">
                Atau bahkan... gak ada sama sekali? Mungkin saatnya evaluasi.
              </motion.p>

              <motion.p variants={fadeInUp} className="text-xl md:text-2xl leading-relaxed text-landing-text pt-4">
                Bisnis besar sukses karena satu hal: <span className="font-bold text-landing-cta">mereka punya sistem yang jalan</span>.
              </motion.p>

              <motion.div variants={fadeInUp} className="pt-8">
                <p className="text-xl md:text-2xl leading-relaxed text-landing-text">
                  Pernah bulan ini <span className="italic">ramai</span>... tapi pas gajian atau pajak, <span className="font-bold text-landing-cta">uangnya kemana?</span>
                </p>
                <p className="text-lg text-landing-text-muted mt-4">
                  Banyak bisnis terlihat oke di permukaan. Tapi pas waktunya bayar — uangnya hilang entah kemana.
                </p>
              </motion.div>

              <motion.div variants={fadeInUp} className="pt-8">
                <p className="text-2xl md:text-3xl font-bold text-landing-text leading-relaxed" style={{ fontFamily: "var(--font-jakarta)" }}>
                  No system = <span className="text-landing-cta">No growth.</span>
                </p>
                <p className="text-xl text-landing-text-muted mt-4">
                  Anda bukan bertumbuh — Anda <span className="font-semibold text-landing-text">tenggelam</span> dalam masalah.
                </p>
                <p className="text-xl font-semibold text-landing-text mt-4">
                  Kita gak punya waktu untuk itu, kan?
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Filter Section - We Don't Accept Everyone */}
        <section className="py-16 bg-white border-b border-gray-100">
          <div className="mx-auto max-w-3xl px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center"
            >
              <motion.div variants={fadeInUp} className="mb-8">
                <p className="text-landing-cta font-bold text-sm uppercase tracking-widest mb-4">
                  Sebelum Lanjut
                </p>
                <h2
                  className="text-3xl md:text-4xl font-extrabold mb-4"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  Kami tidak menerima semua orang.
                </h2>
              </motion.div>

              <motion.div variants={fadeInUp} className="space-y-4 text-left max-w-xl mx-auto">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-landing-cta/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-landing-cta font-bold text-sm">×</span>
                  </div>
                  <p className="text-landing-text-muted">
                    Ini <span className="font-semibold text-landing-text">bukan CRM plug-and-play</span>.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-landing-cta/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-landing-cta" />
                  </div>
                  <p className="text-landing-text-muted">
                    Kami bantu Anda berkembang jadi <span className="font-semibold text-landing-text">bisnis resmi yang siap main di liga besar</span>.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-landing-cta/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-landing-cta" />
                  </div>
                  <p className="text-landing-text-muted">
                    Ini untuk bisnis yang <span className="font-semibold text-landing-text">sudah merasakan sakitnya</span> — yang tau ada sesuatu yang <span className="italic">broken</span>.
                  </p>
                </div>
              </motion.div>

              <motion.p
                variants={fadeInUp}
                className="mt-8 text-lg font-semibold text-landing-text"
              >
                Kalau itu Anda — <span className="text-landing-cta">mari bicara</span>.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-[#FDF8F3]">
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
                Pilih paket Anda
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-lg text-landing-text-muted"
              >
                Lebih banyak sistem = Lebih banyak pertumbuhan.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
            >
              {/* Solo Plan */}
              <motion.div
                variants={fadeInUp}
                className="bg-white rounded-3xl p-8 border border-gray-200 relative"
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-jakarta)" }}>Solo</h3>
                  <p className="text-sm text-landing-text-muted">Untuk founder & freelancer</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-black" style={{ fontFamily: "var(--font-jakarta)" }}>Rp2.5jt</span>
                  <span className="text-landing-text-muted">/bulan</span>
                </div>
                <p className="text-sm text-landing-text-muted mb-6 pb-6 border-b border-gray-100">
                  Lead system (WhatsApp + Reminders + Follow-up)
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "1 nomor WhatsApp",
                    "WhatsApp CRM integration",
                    "Lead reminders",
                    "Auto follow-up",
                    "Support 24/7",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-landing-cta/10 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-landing-cta" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://wa.me/6281234567890?text=Halo%2C%20saya%20tertarik%20dengan%20paket%20Solo%20(Rp2.5jt%2Fbulan)"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-6 py-3 rounded-full border-2 border-landing-text text-landing-text font-bold text-sm hover:bg-landing-text hover:text-white transition-all"
                >
                  Pilih Solo
                </a>
              </motion.div>

              {/* Team Plan */}
              <motion.div
                variants={fadeInUp}
                className="bg-landing-cta rounded-3xl p-8 relative text-white"
              >
                <div className="absolute top-4 right-4 bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
                  Popular
                </div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-jakarta)" }}>Team</h3>
                  <p className="text-sm text-white/80">Untuk tim kecil & UMKM</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-black" style={{ fontFamily: "var(--font-jakarta)" }}>Rp5.5jt</span>
                  <span className="text-white/80">/bulan</span>
                </div>
                <p className="text-sm text-white/80 mb-6 pb-6 border-b border-white/20">
                  Solo + Proposal system + Analytics
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Semua fitur Solo",
                    "3 nomor WhatsApp",
                    "Proposal library",
                    "Analytics dashboard",
                    "Laporan mingguan",
                    "Support prioritas",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://wa.me/6281234567890?text=Halo%2C%20saya%20tertarik%20dengan%20paket%20Team%20(Rp5.5jt%2Fbulan)"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-6 py-3 rounded-full bg-white text-landing-cta font-bold text-sm hover:bg-white/90 transition-all"
                >
                  Pilih Team
                </a>
              </motion.div>

              {/* Studio Plan */}
              <motion.div
                variants={fadeInUp}
                className="bg-landing-hero rounded-3xl p-8 relative text-white"
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-jakarta)" }}>Studio</h3>
                  <p className="text-sm text-white/80">Untuk bisnis yang bertumbuh</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-black" style={{ fontFamily: "var(--font-jakarta)" }}>Rp10jt</span>
                  <span className="text-white/80">/bulan</span>
                </div>
                <p className="text-sm text-white/80 mb-6 pb-6 border-b border-white/20">
                  Team + Marketing system + Ads
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Semua fitur Team",
                    "5 nomor WhatsApp",
                    "Marketing automation",
                    "Ads management",
                    "Content calendar",
                    "Dedicated support",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://wa.me/6281234567890?text=Halo%2C%20saya%20tertarik%20dengan%20paket%20Studio%20(Rp10jt%2Fbulan)"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-6 py-3 rounded-full bg-white text-landing-hero font-bold text-sm hover:bg-white/90 transition-all"
                >
                  Pilih Studio
                </a>
              </motion.div>
            </motion.div>

            {/* Setup Fee */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center mt-12 max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h4 className="font-bold mb-2" style={{ fontFamily: "var(--font-jakarta)" }}>
                  Kickstart: Rp7.5jt <span className="font-normal text-landing-text-muted">(sekali bayar)</span>
                </h4>
                <p className="text-sm text-landing-text-muted">
                  Website + WhatsApp setup + Business approach + Guidance
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: "var(--font-jakarta)" }}>
                Masih ragu?
              </h3>
              <p className="text-landing-text-muted mb-6">
                Chat dulu aja. Ceritakan bisnis Anda, saya bantu carikan solusinya.
              </p>
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-4 rounded-full border-2 border-landing-text text-landing-text font-bold hover:bg-landing-text hover:text-white transition-all"
              >
                Chat via WhatsApp
              </a>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-center gap-4 text-xs text-landing-text-muted">
            <span className="font-black text-landing-cta">21</span>
            <span>&copy; 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
