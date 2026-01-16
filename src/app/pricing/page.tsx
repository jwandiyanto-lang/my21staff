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
      <nav className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
        <div className="mx-auto max-w-7xl px-6 h-14 flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-black text-white">21</span>
          </Link>
        </div>
      </nav>

      <main>
        {/* The Letter */}
        <section className="bg-[#FDFBF7] text-landing-text pt-20 pb-16">
          <div className="mx-auto max-w-2xl px-6">
            <article className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-bold text-landing-hero mb-8">Sebelum</h2>

              <p>
                Kemarin ada yang chat. Tanya harga. Sudah mau DP.
              </p>

              <p>
                Tapi karena saya lagi sibuk urusin customer langganan, jadi kelupaan bales. Saya chat lagi — dia sudah <strong>ghosting</strong>.
              </p>

              <p>
                Lalu kadang saya bisa urusin client baru, tapi gak beli-beli. Sampai keluarga teriak kalau saya tidak ada waktu untuk mereka.
              </p>

              <h2 className="text-2xl font-bold text-landing-hero mt-12 mb-8">Sesudah</h2>

              <p>
                Setelah pakai sistem, setiap leads masuk sudah otomatis dinilai dan ada yang follow up.
              </p>

              <p>
                Ketika ada leads bagus, saya terima notif dan bisa ambil alih chatnya.
              </p>

              <p>
                Hasilnya jauh lebih bagus — dan saya bisa gunakan energi saya untuk susun planning bisnis dan bangun relasi.
              </p>

              <p className="text-landing-cta font-semibold mt-12">
                Ini kamu nantinya.
              </p>

              <hr className="my-12 border-landing-text/10" />

              <p className="text-xl md:text-2xl font-bold text-landing-text leading-snug">
                Banyak yang punya masalah tapi ditutup-tutupin. Sampai suatu saat jadi terlalu besar.
              </p>
            </article>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-landing-hero text-white py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Pilih sistemnya.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Solo */}
              <div className="bg-white text-landing-text rounded-2xl p-6">
                <h3 className="text-xl font-bold">Solo</h3>
                <p className="text-xs text-landing-text-muted mb-4">Founder & freelancer</p>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold">Rp2.5jt</span>
                  <span className="text-sm text-landing-text-muted">/bln</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  {["1 WhatsApp", "CRM integration", "Lead reminders", "Auto follow-up", "24/7 support"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-landing-hero" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://wa.me/6281234567890?text=Halo%2C%20saya%20tertarik%20paket%20Solo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3 rounded-full border-2 border-landing-hero text-landing-hero font-bold text-sm hover:bg-landing-hero hover:text-white transition-all"
                >
                  Pilih Solo
                </a>
              </div>

              {/* Team */}
              <div className="bg-landing-cta text-white rounded-2xl p-6 relative md:-translate-y-2">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-landing-hero text-white text-xs font-bold px-3 py-1 rounded-full">
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
              <div className="bg-white text-landing-text rounded-2xl p-6">
                <h3 className="text-xl font-bold">Studio</h3>
                <p className="text-xs text-landing-text-muted mb-4">Bisnis bertumbuh</p>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold">Rp10jt</span>
                  <span className="text-sm text-landing-text-muted">/bln</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  {["Semua Team", "5 WhatsApp", "Marketing automation", "Ads management", "Dedicated support"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-landing-hero" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://wa.me/6281234567890?text=Halo%2C%20saya%20tertarik%20paket%20Studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3 rounded-full border-2 border-landing-hero text-landing-hero font-bold text-sm hover:bg-landing-hero hover:text-white transition-all"
                >
                  Pilih Studio
                </a>
              </div>
            </div>

            <p className="text-center mt-10 text-sm text-white/70">
              Setup fee: <span className="font-bold text-white">Rp7.5jt</span> (Website + WhatsApp + Guidance)
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-landing-hero text-white py-10">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="text-white/70 mb-4">
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
      <footer className="bg-landing-hero border-t border-white/10 py-4">
        <div className="mx-auto max-w-7xl px-6 text-center text-xs text-white/50">
          <span className="font-bold text-landing-cta">21</span> &copy; 2026
        </div>
      </footer>
    </div>
  );
}
