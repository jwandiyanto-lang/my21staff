"use client";

import Link from "next/link";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { motion } from "framer-motion";
import {
  Shield,
  Database,
  Lock,
  Download,
  Trash2,
  MessageCircle,
  Mail,
} from "lucide-react";

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
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function KeamananPage() {
  const waNumber = "6281287776289";
  const waMessage = encodeURIComponent(
    "Halo, saya ingin bertanya tentang keamanan data di my21staff"
  );

  return (
    <div
      className={`${plusJakartaSans.variable} ${inter.variable} antialiased`}
      style={{ fontFamily: "var(--font-inter)" }}
    >
      {/* Navigation - Matches pricing page */}
      <nav className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
        <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-black text-white">21</span>
            </Link>
          </div>
          <Link
            href="/pricing"
            className="text-sm text-white px-5 py-2 rounded-full bg-white/20 backdrop-blur-sm font-semibold hover:bg-white/30 transition-all"
          >
            Mulai
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="bg-landing-hero text-white pt-24 pb-16 px-6">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-landing-cta" />
                </div>
              </div>
              <h1
                className="text-4xl md:text-5xl font-bold mb-4"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Keamanan Data Anda
              </h1>
              <p className="text-lg text-white/80 max-w-xl mx-auto">
                Kami menjaga data bisnis Anda dengan serius. Berikut penjelasan
                sederhana tentang bagaimana data Anda dilindungi.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Section 1: Data Storage */}
        <section className="bg-[#FDFBF7] text-landing-text py-12 md:py-16">
          <div className="mx-auto max-w-3xl px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-landing-hero/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-landing-hero" />
                </div>
                <h2
                  className="text-2xl md:text-3xl font-bold text-landing-hero"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  Tempat Data Disimpan
                </h2>
              </div>

              <div className="space-y-6 text-lg leading-relaxed">
                <p>
                  Data Anda disimpan di{" "}
                  <strong className="text-landing-hero">Singapura</strong> —
                  lokasi terdekat untuk kecepatan akses dari Indonesia.
                </p>

                <div className="bg-white rounded-xl p-6 border border-landing-text/10">
                  <p className="font-semibold mb-3">Data yang kami simpan:</p>
                  <ul className="space-y-2 text-landing-text/80">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-landing-cta" />
                      Kontak dan data pelanggan
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-landing-cta" />
                      Pesan dan riwayat percakapan
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-landing-cta" />
                      Data anggota tim
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-landing-cta" />
                      Lampiran dan file
                    </li>
                  </ul>
                </div>

                <div className="flex items-start gap-3 bg-landing-hero/5 rounded-xl p-4">
                  <Lock className="w-5 h-5 text-landing-hero mt-0.5 shrink-0" />
                  <p className="text-base">
                    <strong>Semua data terenkripsi</strong> — baik saat disimpan
                    maupun saat dikirim. Data Anda aman dari akses yang tidak
                    sah.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 2: Data Control */}
        <section className="bg-white text-landing-text py-12 md:py-16 border-t border-landing-text/10">
          <div className="mx-auto max-w-3xl px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-landing-cta/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-landing-cta" />
                </div>
                <h2
                  className="text-2xl md:text-3xl font-bold text-landing-hero"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  Kontrol Data Anda
                </h2>
              </div>

              <div className="space-y-6 text-lg leading-relaxed">
                <p>
                  Anda memiliki kontrol penuh atas data bisnis Anda. Ini adalah
                  hak Anda.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-[#FDFBF7] rounded-xl p-6 border border-landing-text/10">
                    <div className="flex items-center gap-3 mb-3">
                      <Download className="w-5 h-5 text-landing-hero" />
                      <h3 className="font-bold">Ekspor Data</h3>
                    </div>
                    <p className="text-base text-landing-text/70">
                      Anda bisa mengekspor semua data bisnis Anda kapan saja.
                      Data Anda adalah milik Anda.
                    </p>
                  </div>

                  <div className="bg-[#FDFBF7] rounded-xl p-6 border border-landing-text/10">
                    <div className="flex items-center gap-3 mb-3">
                      <Trash2 className="w-5 h-5 text-landing-hero" />
                      <h3 className="font-bold">Hapus Data</h3>
                    </div>
                    <p className="text-base text-landing-text/70">
                      Jika Anda ingin menghapus data, hubungi kami. Kami akan
                      memproses permintaan Anda.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 3: Contact */}
        <section className="bg-[#FDFBF7] text-landing-text py-12 md:py-16 border-t border-landing-text/10">
          <div className="mx-auto max-w-3xl px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center"
            >
              <h2
                className="text-2xl md:text-3xl font-bold text-landing-hero mb-4"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Ada Pertanyaan?
              </h2>
              <p className="text-lg text-landing-text/70 mb-8 max-w-lg mx-auto">
                Jika ada pertanyaan tentang keamanan data atau privasi, jangan
                ragu untuk menghubungi kami.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={`https://wa.me/${waNumber}?text=${waMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-full font-bold hover:bg-[#20BD5A] transition-all shadow-lg"
                >
                  <MessageCircle className="w-5 h-5" />
                  Hubungi via WhatsApp
                </a>

                <a
                  href="mailto:admin@my21staff.com"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-landing-hero text-white rounded-full font-bold hover:bg-landing-hero/90 transition-all"
                >
                  <Mail className="w-5 h-5" />
                  admin@my21staff.com
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-notion py-4">
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
