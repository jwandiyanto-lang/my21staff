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
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FDFBF7]/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 h-14 flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-extrabold text-landing-cta">21</span>
          </Link>
        </div>
      </nav>

      <main>
        {/* The Letter */}
        <section className="bg-[#FDFBF7] text-landing-text pt-24 pb-16">
          <div className="mx-auto max-w-2xl px-6">
            <motion.article
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-6 text-lg md:text-xl leading-relaxed"
            >
              <motion.p variants={fadeInUp} className="text-landing-text-muted italic">
                Sebelum pakai 21...
              </motion.p>

              <motion.p variants={fadeInUp}>
                Kemarin ada yang chat. Tanya harga. Serius mau beli.
              </motion.p>

              <motion.p variants={fadeInUp}>
                Tapi saya lagi sibuk. Belum sempat balas.
              </motion.p>

              <motion.p variants={fadeInUp} className="font-semibold">
                Hari ini dia sudah closing sama kompetitor.
              </motion.p>

              <motion.p variants={fadeInUp} className="pt-4">
                Jam 11 malam masih balas WhatsApp. Keluarga sudah tidur. Besok pagi bangun, cek HP — tetap ada yang kelewat.
              </motion.p>

              <motion.p variants={fadeInUp}>
                Bulan lalu ramai. Chat masuk terus. Sibuk dari pagi sampai malam.
              </motion.p>

              <motion.p variants={fadeInUp}>
                Tapi pas akhir bulan, cek rekening...
              </motion.p>

              <motion.p variants={fadeInUp} className="text-2xl md:text-3xl font-bold text-landing-cta">
                Uangnya kemana?
              </motion.p>

              <motion.div variants={fadeInUp} className="pt-8 border-t border-landing-text/10">
                <p className="text-landing-text-muted mb-4">
                  Sekarang setelah pakai 21:
                </p>
                <p>
                  Leads masuk, langsung ada yang follow up. Gak ada yang kelewat. Gak perlu begadang.
                </p>
                <p className="mt-4">
                  Akhir bulan? Tau persis mana yang closing, mana yang pending, mana yang butuh di-push.
                </p>
                <p className="mt-4 font-semibold">
                  Bukan kerja lebih keras. Tapi kerja dengan sistem.
                </p>
              </motion.div>

              <motion.div variants={fadeInUp} className="pt-8">
                <p className="text-landing-text-muted text-base">
                  — Klien 21
                </p>
              </motion.div>
            </motion.article>
          </div>
        </section>

        {/* Not for everyone */}
        <section className="bg-[#FDFBF7] text-landing-text pb-16">
          <div className="mx-auto max-w-2xl px-6">
            <p className="text-center text-landing-text-muted">
              Ini bukan untuk semua orang. Ini untuk yang sudah tau ada yang <span className="italic">broken</span>.
            </p>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-[#FDFBF7] text-landing-text py-12">
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
        <section className="bg-[#FDFBF7] text-landing-text py-12">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="text-landing-text-muted mb-4">
              Masih ragu? Chat dulu.
            </p>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 rounded-full bg-landing-cta text-white font-bold hover:bg-landing-cta/90 transition-all"
            >
              Chat via WhatsApp
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#FDFBF7] border-t border-landing-text/10 py-4">
        <div className="mx-auto max-w-7xl px-6 text-center text-xs text-landing-text-muted">
          <span className="font-bold text-landing-cta">21</span> &copy; 2026
        </div>
      </footer>
    </div>
  );
}
