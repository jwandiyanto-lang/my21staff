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
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
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
        {/* Hero */}
        <section className="bg-landing-hero text-white pt-16 pb-12">
          <div className="mx-auto max-w-4xl px-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center"
            >
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight"
              >
                Leads <span className="text-landing-cta">kebanyakan</span>?<br />
                Closing <span className="text-white/50">minim</span>.
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg md:text-xl text-white/70 mt-6"
              >
                Balas semua orang. Tapi bukan yang tepat. Waktu habis. Revenue stagnan.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* No leads */}
        <section className="bg-landing-cta text-white py-12">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl lg:text-4xl font-extrabold"
            >
              Atau gak ada leads sama sekali?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-lg text-white/90 mt-3"
            >
              Kompetitor jalan. Anda diam.
            </motion.p>
          </div>
        </section>

        {/* The difference */}
        <section className="bg-black text-white py-16">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-white/50 text-sm uppercase tracking-widest mb-4"
            >
              Yang membedakan
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold mb-4"
            >
              Bisnis besar punya satu hal yang Anda belum punya:
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-landing-cta"
            >
              Sistem yang jalan.
            </motion.p>
          </div>
        </section>

        {/* The pain */}
        <section className="bg-white text-landing-text py-16">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold"
            >
              Bulan ini ramai. Tapi pas gajian...
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-extrabold text-landing-cta mt-4"
            >
              Uangnya kemana?
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-landing-text-muted mt-4"
            >
              Ramai di permukaan. Pas bayar — hilang.
            </motion.p>
          </div>
        </section>

        {/* Urgency */}
        <section className="bg-landing-hero text-white py-16">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold"
            >
              No system. <span className="text-landing-cta">No growth.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-lg text-white/70 mt-4"
            >
              Gak ada waktu tenggelam dalam masalah.
            </motion.p>
          </div>
        </section>

        {/* Filter */}
        <section className="bg-landing-cta text-white py-12">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-4"
            >
              Kami tidak terima semua orang.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-lg text-white/90"
            >
              Bukan CRM plug-and-play. Ini untuk yang sudah tau ada yang <span className="italic">broken</span>.
            </motion.p>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-[#FDF8F3] text-landing-text py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-extrabold">
                Pilih sistemnya.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {/* Solo */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold">Solo</h3>
                <p className="text-xs text-landing-text-muted mb-4">Founder & freelancer</p>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold">Rp2.5jt</span>
                  <span className="text-sm text-landing-text-muted">/bln</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  {["1 WhatsApp", "CRM integration", "Lead reminders", "Auto follow-up", "24/7 support"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-landing-cta" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://wa.me/6281234567890?text=Halo%2C%20saya%20tertarik%20paket%20Solo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3 rounded-full border-2 border-landing-text text-landing-text font-bold text-sm hover:bg-landing-text hover:text-white transition-all"
                >
                  Pilih Solo
                </a>
              </div>

              {/* Team */}
              <div className="bg-landing-cta rounded-2xl p-6 text-white relative md:-translate-y-2">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
                  POPULAR
                </span>
                <h3 className="text-xl font-bold mt-1">Team</h3>
                <p className="text-xs text-white/80 mb-4">Tim kecil & UMKM</p>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold">Rp5.5jt</span>
                  <span className="text-sm text-white/80">/bln</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  {["Semua Solo", "3 WhatsApp", "Proposal library", "Analytics", "Laporan mingguan"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-white" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://wa.me/6281234567890?text=Halo%2C%20saya%20tertarik%20paket%20Team"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3 rounded-full bg-white text-landing-cta font-bold text-sm hover:bg-white/90 transition-all"
                >
                  Pilih Team
                </a>
              </div>

              {/* Studio */}
              <div className="bg-landing-hero rounded-2xl p-6 text-white">
                <h3 className="text-xl font-bold">Studio</h3>
                <p className="text-xs text-white/80 mb-4">Bisnis bertumbuh</p>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold">Rp10jt</span>
                  <span className="text-sm text-white/80">/bln</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  {["Semua Team", "5 WhatsApp", "Marketing automation", "Ads management", "Dedicated support"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-white" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://wa.me/6281234567890?text=Halo%2C%20saya%20tertarik%20paket%20Studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3 rounded-full bg-white text-landing-hero font-bold text-sm hover:bg-white/90 transition-all"
                >
                  Pilih Studio
                </a>
              </div>
            </div>

            {/* Setup Fee */}
            <div className="text-center mt-10">
              <p className="text-sm text-landing-text-muted">
                Setup fee: <span className="font-bold text-landing-text">Rp7.5jt</span> (Website + WhatsApp + Guidance)
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-black text-white py-12">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h3 className="text-2xl md:text-3xl font-extrabold mb-3">
              Masih ragu?
            </h3>
            <p className="text-white/70 mb-6">
              Chat dulu. Ceritakan masalahnya.
            </p>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-10 py-4 rounded-full bg-landing-cta text-white font-bold hover:bg-landing-cta/90 transition-all"
            >
              Chat via WhatsApp
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-4">
        <div className="mx-auto max-w-7xl px-6 text-center text-xs text-white/50">
          <span className="font-bold text-landing-cta">21</span> &copy; 2026
        </div>
      </footer>
    </div>
  );
}
