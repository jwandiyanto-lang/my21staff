"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");

  // Form state
  const [nama, setNama] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [jenisBisnis, setJenisBisnis] = useState("");
  const [masalah, setMasalah] = useState("");
  const [teamSize, setTeamSize] = useState("");

  const openModal = (plan: string) => {
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const resetForm = () => {
    setNama("");
    setWhatsapp("");
    setJenisBisnis("");
    setMasalah("");
    setTeamSize("");
  };

  return (
    <div
      className={`${plusJakartaSans.variable} ${inter.variable} antialiased`}
      style={{ fontFamily: "var(--font-jakarta)" }}
    >
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
        <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-black text-white">21</span>
          </Link>
          <a
            href="#pricing"
            className="text-sm text-white px-5 py-2 rounded-full bg-white/20 backdrop-blur-sm font-semibold hover:bg-white/30 transition-all"
          >
            Mulai
          </a>
        </div>
      </nav>

      <main>
        {/* The Letter */}
        <section className="bg-[#FDFBF7] text-landing-text pt-20 pb-16">
          <div className="mx-auto max-w-2xl px-6">
            {/* Quote block - letter from future self */}
            <blockquote className="border-l-4 border-landing-cta/30 pl-6 md:pl-8">
              <p className="text-landing-text/60 text-sm mb-6 italic">
                Surat dari dirimu, 6 bulan dari sekarang
              </p>

              <div className="space-y-6 text-lg leading-relaxed">
                <div>
                  <p className="font-semibold text-landing-hero mb-3">Dulu...</p>
                  <p>
                    Kemarin ada yang chat. Tanya harga. Sudah mau DP.
                  </p>
                  <p className="mt-3">
                    Tapi karena saya lagi sibuk urusin customer langganan, jadi kelupaan bales. Saya chat lagi — dia sudah <strong>ghosting</strong>.
                  </p>
                  <p className="mt-3">
                    Lalu kadang saya bisa urusin client baru, tapi gak beli-beli. Sampai keluarga teriak kalau saya tidak ada waktu untuk mereka.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-landing-hero mb-3">Sekarang...</p>
                  <p>
                    Setelah pakai sistem, setiap leads masuk sudah otomatis dinilai dan ada yang follow up.
                  </p>
                  <p className="mt-3">
                    Ketika ada leads bagus, saya terima notif dan bisa ambil alih chatnya.
                  </p>
                  <p className="mt-3">
                    Hasilnya jauh lebih bagus — dan saya bisa gunakan energi saya untuk susun planning bisnis dan bangun relasi.
                  </p>
                </div>
              </div>

              <p className="text-landing-cta font-semibold mt-10 text-right">
                — Kamu, 6 bulan dari sekarang
              </p>
            </blockquote>
          </div>
        </section>

        {/* Header - Dark green */}
        <section className="bg-landing-hero text-white px-6 py-12 md:py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center">
              No system = <span className="text-landing-cta">No growth.</span>
            </h2>
          </div>
        </section>

        {/* Story - Cream background */}
        <section className="bg-[#FDFBF7] px-6 py-12 md:py-16">
          <div className="mx-auto max-w-3xl">
            {/* Problem */}
            <div className="space-y-6 text-lg md:text-xl text-landing-text leading-relaxed">
              <p>
                Bisnis mau maju, tapi <strong className="text-landing-text">kepala sudah penuh</strong>.
              </p>

              <p>
                Setiap lead yang masuk harus <strong className="text-landing-text">diurus manual</strong>.
                Setiap follow-up harus <strong className="text-landing-text">diingat sendiri</strong>.
                Setiap peluang yang datang — <strong className="text-landing-text">lewat</strong>, karena tidak sempat.
              </p>

              <p>
                Mau hire orang? <strong className="text-landing-text">Ribet</strong>. Harus training, harus awasi, harus bayar tiap bulan.
                Dan kalau resign? <strong className="text-landing-text">Mulai dari nol lagi</strong>.
              </p>

              <p>
                Mau kasih ke orang lain? <strong className="text-landing-text">Takut salah</strong>. Takut tidak sesuai standar.
              </p>

              <p>
                Ujung-ujungnya <strong className="text-landing-text">harus kerja sendiri</strong>.
                Belum lagi <strong className="text-landing-text">tukang pajak</strong> yang tiba-tiba datang.
              </p>

              <p className="text-landing-text font-medium">
                Rasanya tidak adil. Susah berbisnis.<br />
                Tapi mau kerja sama siapa?
              </p>
            </div>

            {/* Divider */}
            <hr className="my-12 border-landing-text/10" />

            {/* Solution */}
            <div className="space-y-6 text-lg md:text-xl text-landing-text leading-relaxed">
              <p className="text-2xl md:text-3xl font-bold text-landing-hero">
                Solusinya bukan tambah tenaga.<br />
                Solusinya adalah <span className="text-landing-cta">sistem</span> — dengan <span className="text-landing-cta">staff digital</span>.
              </p>

              <p>
                Staff digital <strong className="text-landing-text">tidak sakit</strong>. <strong className="text-landing-text">Tidak resign</strong>. <strong className="text-landing-text">Tidak perlu diawasi</strong>.
              </p>

              <p>
                Mereka ikut instruksi <strong className="text-landing-text">persis seperti yang kamu mau</strong>.
                Dan semua aktivitas bisa <strong className="text-landing-text">di-track kapan saja</strong>.
              </p>

              <p className="text-landing-text font-medium">
                Kamu tetap pegang kontrol. Tapi tidak perlu pegang semuanya sendiri.
              </p>
            </div>

            {/* Why we exist */}
            <div className="mt-12 p-8 md:p-10 bg-landing-cta/90 rounded-2xl shadow-lg max-w-4xl mx-auto">
              <p className="text-2xl md:text-3xl font-bold text-white mb-4">
                Ini alasan kami ada.
              </p>
              <p className="text-lg md:text-xl text-white leading-relaxed">
                Kami <strong className="text-black">tidak jual software dan kamu ikut aturan kita</strong>.
              </p>
              <p className="text-lg md:text-xl text-white leading-relaxed mt-3">
                Kami <strong className="text-black">diskusi dan bangun sistem dari awal</strong> seiring bisnis kamu bertumbuh.
              </p>
            </div>
          </div>
        </section>

        {/* 5 Problems Section */}
        <section className="bg-[#FDFBF7] py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-landing-text mb-4">
              Masalah yang sering kami temui
            </h2>
            <p className="text-center text-landing-text/60 mb-12">
              Dan bagaimana <span className="text-landing-cta font-semibold">my21staff</span> membantu
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Problem 1 */}
              <div className="border-2 border-landing-text/20 rounded-2xl p-6 bg-white">
                <div className="text-3xl mb-3">💬</div>
                <h3 className="text-lg font-bold text-landing-text mb-2">WhatsApp Overwhelm</h3>
                <p className="text-landing-text/60 text-sm mb-4">
                  Terlalu banyak chat masuk, tidak bisa fokus ke hal lain. Balas satu, masuk lima.
                </p>
                <div className="border-t border-landing-text/10 pt-4">
                  <p className="text-xs text-landing-cta font-semibold mb-2">SISTEM KAMI:</p>
                  <ul className="text-sm text-landing-text space-y-1">
                    <li>→ WhatsApp Bot balas otomatis 24/7</li>
                    <li>→ Grading score setiap lead di CRM</li>
                    <li>→ Kamu di-info mana yang serius</li>
                  </ul>
                </div>
              </div>

              {/* Problem 2 */}
              <div className="border-2 border-landing-text/20 rounded-2xl p-6 bg-white">
                <div className="text-3xl mb-3">🔄</div>
                <h3 className="text-lg font-bold text-landing-text mb-2">Stuck di Day-to-Day</h3>
                <p className="text-landing-text/60 text-sm mb-4">
                  Sibuk operasional terus, tidak sempat pikirkan produk baru atau kembangkan relasi.
                </p>
                <div className="border-t border-landing-text/10 pt-4">
                  <p className="text-xs text-landing-cta font-semibold mb-2">SISTEM KAMI:</p>
                  <ul className="text-sm text-landing-text space-y-1">
                    <li>→ Task otomatis dari AI</li>
                    <li>→ Reminder follow-up partner</li>
                    <li>→ Waktu untuk kamu atur strategi</li>
                  </ul>
                </div>
              </div>

              {/* Problem 3 */}
              <div className="border-2 border-landing-text/20 rounded-2xl p-6 bg-white">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="text-lg font-bold text-landing-text mb-2">Pembukuan Berantakan</h3>
                <p className="text-landing-text/60 text-sm mb-4">
                  Tidak ada catatan rapi. Waktu pajak datang, panik cari data.
                </p>
                <div className="border-t border-landing-text/10 pt-4">
                  <p className="text-xs text-landing-cta font-semibold mb-2">SISTEM KAMI:</p>
                  <ul className="text-sm text-landing-text space-y-1">
                    <li>→ Transaksi tercatat otomatis</li>
                    <li>→ Laporan mingguan ke chat kamu</li>
                    <li>→ Pembukuan rapi untuk kamu</li>
                  </ul>
                </div>
              </div>

              {/* Problem 4 */}
              <div className="border-2 border-landing-text/20 rounded-2xl p-6 bg-white">
                <div className="text-3xl mb-3">❄️</div>
                <h3 className="text-lg font-bold text-landing-text mb-2">Leads Jadi Dingin</h3>
                <p className="text-landing-text/60 text-sm mb-4">
                  Sudah balas sekali, lalu lupa follow up. Customer beli di tempat lain.
                </p>
                <div className="border-t border-landing-text/10 pt-4">
                  <p className="text-xs text-landing-cta font-semibold mb-2">SISTEM KAMI:</p>
                  <ul className="text-sm text-landing-text space-y-1">
                    <li>→ Auto follow-up di waktu tepat</li>
                    <li>→ Task muncul di CRM</li>
                    <li>→ Tidak ada yang terlewat</li>
                  </ul>
                </div>
              </div>

              {/* Problem 5 */}
              <div className="border-2 border-landing-text/20 rounded-2xl p-6 bg-white">
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="text-lg font-bold text-landing-text mb-2">Tidak Bisa Lepas</h3>
                <p className="text-landing-text/60 text-sm mb-4">
                  Mau libur? Tidak bisa. Bisnis berhenti kalau kamu berhenti.
                </p>
                <div className="border-t border-landing-text/10 pt-4">
                  <p className="text-xs text-landing-cta font-semibold mb-2">SISTEM KAMI:</p>
                  <ul className="text-sm text-landing-text space-y-1">
                    <li>→ AI jalan terus 24/7</li>
                    <li>→ Semua aktivitas di-track</li>
                    <li>→ Kamu di notif yang penting-penting aja</li>
                    <li>→ Kamu bisa ambil alih kapan saja</li>
                  </ul>
                </div>
              </div>

              {/* CTA Card */}
              <div className="border-2 border-landing-cta bg-landing-cta/10 rounded-2xl p-6 flex flex-col justify-center">
                <p className="text-xl font-bold text-landing-text mb-2">Punya masalah serupa?</p>
                <p className="text-landing-text/70 text-sm">
                  Apa masalah kamu? Kita atur sistemnya.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-landing-hero text-white py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Siap untuk buat <span className="text-landing-cta">Sistem Kamu</span>?
            </h2>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {/* Solo */}
              <motion.div
                className="bg-white text-landing-text rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                variants={fadeInUp}
              >
                <h3 className="text-xl font-bold">Solo</h3>
                <p className="text-xs text-landing-text-muted mb-4">Founder & freelancer</p>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold">Rp3.9jt</span>
                  <span className="text-sm text-landing-text-muted">/bln</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  {["1 WhatsApp Number", "200 Marketing Messages/mo", "100 Utility Messages/mo", "30,000 AI Chats/mo"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-landing-hero" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => openModal("Solo")}
                  className="block w-full text-center py-3 rounded-full border-2 border-landing-hero text-landing-hero font-bold text-sm hover:bg-landing-hero hover:text-white transition-all cursor-pointer"
                >
                  Pilih Solo
                </button>
              </motion.div>

              {/* Team */}
              <motion.div
                className="bg-landing-cta text-white rounded-2xl p-6 relative md:-translate-y-2 hover:shadow-xl hover:-translate-y-3 transition-all duration-300"
                variants={fadeInUp}
              >
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-landing-hero text-white text-xs font-bold px-3 py-1 rounded-full">
                  POPULAR
                </span>
                <h3 className="text-xl font-bold mt-1">Team</h3>
                <p className="text-xs text-white/80 mb-4">Tim kecil & UMKM</p>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold">Rp7.9jt</span>
                  <span className="text-sm text-white/80">/bln</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  {["3 WhatsApp Numbers", "500 Marketing Messages/mo", "300 Utility Messages/mo", "60,000 AI Chats/mo"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-white" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => openModal("Team")}
                  className="block w-full text-center py-3 rounded-full bg-white text-landing-cta font-bold text-sm hover:bg-white/90 transition-all cursor-pointer"
                >
                  Pilih Team
                </button>
              </motion.div>

              {/* Studio */}
              <motion.div
                className="bg-white text-landing-text rounded-2xl p-6 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                variants={fadeInUp}
              >
                <h3 className="text-xl font-bold">Studio</h3>
                <p className="text-xs text-landing-text-muted mb-4">Enterprise & custom</p>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold">Custom</span>
                </div>
                <p className="text-sm text-landing-text/70 mb-6 flex-1">
                  Butuh lebih dari Solo atau Team? Yuk ngobrol dulu, kita sesuaikan dengan kebutuhan bisnis kamu.
                </p>
                <button
                  onClick={() => openModal("Studio")}
                  className="block w-full text-center py-3 rounded-full border-2 border-landing-hero text-landing-hero font-bold text-sm hover:bg-landing-hero hover:text-white transition-all cursor-pointer"
                >
                  Hubungi Kami
                </button>
              </motion.div>
            </motion.div>

            {/* Setup Fee Box */}
            <div className="mt-8 max-w-xl mx-auto bg-gray-100 rounded-lg py-3 px-6 text-center">
              <p className="text-sm text-gray-500">One-time setup fee: <span className="font-bold text-gray-800">Rp7.5jt</span> — Website / Web App + Business Consultation</p>
            </div>
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
              className="relative bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
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
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Form Header */}
              <h3 className="text-2xl font-bold text-landing-text mb-2">
                Tertarik paket {selectedPlan}?
              </h3>
              <p className="text-sm text-landing-text/60 mb-6">
                Isi form ini, kami akan hubungi kamu segera.
              </p>

              {/* Form */}
              <form className="space-y-4">
                {/* Hidden field for selected plan */}
                <input type="hidden" name="paket" value={selectedPlan} />

                <div>
                  <label className="block text-sm font-medium text-landing-text mb-1">
                    Nama
                  </label>
                  <input
                    type="text"
                    placeholder="Nama lengkap"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-landing-cta focus:ring-1 focus:ring-landing-cta outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-landing-text mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="08123456789"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-landing-cta focus:ring-1 focus:ring-landing-cta outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-landing-text mb-1">
                    Jenis Bisnis
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Konsultan pendidikan, Toko online"
                    value={jenisBisnis}
                    onChange={(e) => setJenisBisnis(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-landing-cta focus:ring-1 focus:ring-landing-cta outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-landing-text mb-1">
                    Masalah apa yang ingin diselesaikan?
                  </label>
                  <textarea
                    placeholder="Contoh: Follow-up manual, leads terlewat"
                    value={masalah}
                    onChange={(e) => setMasalah(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-landing-cta focus:ring-1 focus:ring-landing-cta outline-none transition-all text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-landing-text mb-1">
                    Berapa orang yang akan pakai sistem ini?
                  </label>
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-landing-cta focus:ring-1 focus:ring-landing-cta outline-none transition-all text-sm bg-white"
                  >
                    <option value="">Pilih...</option>
                    <option value="Hanya saya">Hanya saya</option>
                    <option value="2-5 orang">2-5 orang</option>
                    <option value="6-10 orang">6-10 orang</option>
                    <option value="Lebih dari 10">Lebih dari 10</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-landing-cta text-white font-bold text-sm hover:bg-landing-cta/90 transition-all mt-2"
                >
                  Kirim
                </button>
              </form>

              <p className="text-xs text-center text-gray-400 mt-4">
                Kami akan menghubungi via WhatsApp dalam 24 jam.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
