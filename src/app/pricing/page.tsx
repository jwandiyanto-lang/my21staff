"use client";

import Link from "next/link";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

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
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

export default function PricingPage() {
  return (
    <div
      className={`${plusJakartaSans.variable} ${inter.variable} antialiased`}
      style={{ fontFamily: "var(--font-jakarta)" }}
    >
      {/* Navigation - Transparent */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-extrabold text-white">21</span>
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero Story Section - Dark */}
        <section className="bg-landing-hero text-white min-h-screen flex items-center py-32">
          <div className="mx-auto max-w-4xl px-6 w-full">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center"
            >
              <motion.p
                variants={fadeInUp}
                className="text-landing-cta font-bold text-sm uppercase tracking-widest mb-8"
              >
                Kenapa bisnis Anda stuck?
              </motion.p>

              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-8"
              >
                Leads <span className="text-landing-cta">kebanyakan</span>?<br />
                Tapi closing <span className="text-white/50">minim</span>.
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mb-12"
              >
                Anda balas semua orang. Tapi bukan yang tepat. Waktu habis. Revenue stagnan.
              </motion.p>

              <motion.div variants={fadeInUp}>
                <a
                  href="#pricing"
                  className="inline-block px-10 py-4 rounded-full bg-landing-cta text-white font-bold text-lg hover:bg-landing-cta/90 transition-all"
                >
                  Lihat Solusinya
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Pain Point Section - Orange */}
        <section className="bg-landing-cta text-white py-20">
          <div className="mx-auto max-w-4xl px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-6"
              >
                Atau malah gak ada leads sama sekali?
              </motion.h2>

              <motion.p
                variants={fadeInUp}
                className="text-xl md:text-2xl text-white/90"
              >
                Kompetitor sudah jalan. Anda masih diam.<br />
                <span className="font-bold">Mungkin saatnya evaluasi.</span>
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* The Insight - Dark */}
        <section className="bg-black text-white py-24">
          <div className="mx-auto max-w-4xl px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center"
            >
              <motion.p
                variants={fadeInUp}
                className="text-landing-cta font-bold text-sm uppercase tracking-widest mb-8"
              >
                Yang membedakan
              </motion.p>

              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-8"
              >
                Bisnis besar sukses karena satu hal:
              </motion.h2>

              <motion.p
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-landing-cta"
              >
                Sistem yang jalan.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* The Pain Point - White */}
        <section className="bg-white text-landing-text py-24">
          <div className="mx-auto max-w-4xl px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-6"
              >
                Bulan ini <span className="italic">ramai</span>...<br />
                tapi pas gajian?
              </motion.h2>

              <motion.p
                variants={fadeInUp}
                className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-landing-cta"
              >
                Uangnya kemana?
              </motion.p>

              <motion.p
                variants={fadeInUp}
                className="text-xl text-landing-text-muted mt-8 max-w-xl mx-auto"
              >
                Banyak bisnis terlihat oke di permukaan. Tapi pas waktunya bayar — hilang entah kemana.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* The Urgency - Dark */}
        <section className="bg-landing-hero text-white py-24">
          <div className="mx-auto max-w-4xl px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-none"
              >
                No system.
              </motion.h2>

              <motion.h2
                variants={fadeInUp}
                className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-landing-cta leading-none mt-2"
              >
                No growth.
              </motion.h2>

              <motion.p
                variants={fadeInUp}
                className="text-xl md:text-2xl text-white/70 mt-8"
              >
                Kita gak punya waktu untuk tenggelam dalam masalah, kan?
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Filter Section - Orange */}
        <section className="bg-landing-cta text-white py-20">
          <div className="mx-auto max-w-3xl px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-8"
              >
                Kami tidak menerima semua orang.
              </motion.h2>

              <motion.div variants={fadeInUp} className="text-lg md:text-xl text-white/90 space-y-4">
                <p>Ini <span className="font-bold text-white">bukan CRM plug-and-play</span>.</p>
                <p>Ini untuk yang <span className="font-bold text-white">sudah merasakan sakitnya</span>.</p>
                <p>Yang tau ada yang <span className="italic">broken</span>.</p>
              </motion.div>

              <motion.p
                variants={fadeInUp}
                className="mt-10 text-2xl font-bold"
              >
                Kalau itu Anda — lanjut ke bawah.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-[#FDF8F3] text-landing-text py-24">
          <div className="mx-auto max-w-7xl px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.p
                variants={fadeInUp}
                className="text-landing-cta font-bold text-sm uppercase tracking-widest mb-4"
              >
                Pilih sistemnya
              </motion.p>

              <motion.h2
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4"
              >
                Lebih banyak sistem.<br />
                <span className="text-landing-cta">Lebih banyak growth.</span>
              </motion.h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
            >
              {/* Solo Plan */}
              <motion.div
                variants={fadeInUp}
                className="bg-white rounded-3xl p-8 border-2 border-gray-200 relative"
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-extrabold mb-2">Solo</h3>
                  <p className="text-sm text-landing-text-muted">Untuk founder & freelancer</p>
                </div>
                <div className="mb-6">
                  <span className="text-5xl font-extrabold">Rp2.5jt</span>
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
                      <Check className="w-5 h-5 text-landing-cta shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://wa.me/6281234567890?text=Halo%2C%20saya%20tertarik%20dengan%20paket%20Solo%20(Rp2.5jt%2Fbulan)"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-6 py-4 rounded-full border-2 border-landing-text text-landing-text font-bold hover:bg-landing-text hover:text-white transition-all"
                >
                  Pilih Solo
                </a>
              </motion.div>

              {/* Team Plan */}
              <motion.div
                variants={fadeInUp}
                className="bg-landing-cta rounded-3xl p-8 relative text-white transform md:-translate-y-4"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white rounded-full px-4 py-1 text-sm font-bold">
                  POPULAR
                </div>
                <div className="mb-6 pt-2">
                  <h3 className="text-2xl font-extrabold mb-2">Team</h3>
                  <p className="text-sm text-white/80">Untuk tim kecil & UMKM</p>
                </div>
                <div className="mb-6">
                  <span className="text-5xl font-extrabold">Rp5.5jt</span>
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
                      <Check className="w-5 h-5 text-white shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://wa.me/6281234567890?text=Halo%2C%20saya%20tertarik%20dengan%20paket%20Team%20(Rp5.5jt%2Fbulan)"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-6 py-4 rounded-full bg-white text-landing-cta font-bold hover:bg-white/90 transition-all"
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
                  <h3 className="text-2xl font-extrabold mb-2">Studio</h3>
                  <p className="text-sm text-white/80">Untuk bisnis yang bertumbuh</p>
                </div>
                <div className="mb-6">
                  <span className="text-5xl font-extrabold">Rp10jt</span>
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
                      <Check className="w-5 h-5 text-white shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://wa.me/6281234567890?text=Halo%2C%20saya%20tertarik%20dengan%20paket%20Studio%20(Rp10jt%2Fbulan)"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-6 py-4 rounded-full bg-white text-landing-hero font-bold hover:bg-white/90 transition-all"
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
              className="text-center mt-16 max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200">
                <p className="text-landing-cta font-bold text-sm uppercase tracking-widest mb-2">
                  One-time Setup
                </p>
                <h4 className="text-2xl font-extrabold mb-2">
                  Kickstart: Rp7.5jt
                </h4>
                <p className="text-landing-text-muted">
                  Website + WhatsApp setup + Business approach + Guidance
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-black text-white py-24">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6">
                Masih ragu?
              </h3>
              <p className="text-white/70 text-lg md:text-xl mb-10">
                Chat dulu. Ceritakan bisnis Anda, saya bantu carikan solusinya.
              </p>
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-12 py-5 rounded-full bg-landing-cta text-white font-bold text-xl hover:bg-landing-cta/90 transition-all"
              >
                Chat via WhatsApp
              </a>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-6">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-center gap-4 text-xs text-white/50">
            <span className="font-extrabold text-landing-cta">21</span>
            <span>&copy; 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
