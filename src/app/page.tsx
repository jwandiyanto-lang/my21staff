"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus_Jakarta_Sans, JetBrains_Mono, Inter } from "next/font/google";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
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
          </div>
          <Link
            href="/login"
            className="text-sm text-white px-5 py-2 rounded-full bg-white/20 backdrop-blur-sm font-semibold hover:bg-white/30 transition-all"
          >
            Login
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 bg-landing-hero notion-grid overflow-hidden border-b border-notion">
          <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              className="max-w-2xl"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.h1
                variants={fadeInUp}
                className="tracking-tight leading-[1.05] mb-8 text-white text-shadow-pop"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                <span className="block text-4xl lg:text-5xl font-medium text-white/80">No System,</span>
                <span className="block text-5xl lg:text-7xl font-extrabold">No Growth.</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg md:text-xl text-white/90 max-w-lg mb-10 leading-relaxed"
              >
                Dari berantakan menjadi satu sistem. Software yang bertumbuh bersama bisnis Anda.
              </motion.p>

              <motion.div variants={fadeInUp}>
                <Link
                  href="/pricing"
                  className="inline-flex px-10 py-4 rounded-full bg-landing-cta text-white text-lg font-bold hover:bg-landing-cta-dark transition-all items-center gap-3 shadow-xl"
                >
                  Dapatkan Sistemnya
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Hero Visual - Animated Staff Deck with Toko Background */}
            <div className="relative flex justify-center items-center min-h-[400px]">
              {/* Toko/Ruko Silhouette Behind Cards */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg
                  viewBox="0 0 300 420"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full max-w-[350px] max-h-[450px]"
                  style={{ opacity: 0.18 }}
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Triangular Roof (Ruko style) */}
                  <path d="M0 70 L150 0 L300 70 Z" fill="white" />
                  {/* Roof edge/overhang */}
                  <path d="M-5 75 L150 -5 L305 75" stroke="white" strokeWidth="6" fill="none" />

                  {/* Main building body */}
                  <rect x="20" y="70" width="260" height="350" fill="white" />

                  {/* Signboard */}
                  <rect x="35" y="85" width="230" height="40" rx="3" fill="white" style={{ opacity: 0.7 }} />

                  {/* Upper floor windows - row 1 */}
                  <rect x="35" y="145" width="50" height="40" rx="2" fill="white" style={{ opacity: 0.5 }} />
                  <rect x="100" y="145" width="50" height="40" rx="2" fill="white" style={{ opacity: 0.5 }} />
                  <rect x="165" y="145" width="50" height="40" rx="2" fill="white" style={{ opacity: 0.5 }} />
                  <rect x="230" y="145" width="50" height="40" rx="2" fill="white" style={{ opacity: 0.5 }} />

                  {/* Upper floor windows - row 2 */}
                  <rect x="35" y="205" width="50" height="40" rx="2" fill="white" style={{ opacity: 0.5 }} />
                  <rect x="100" y="205" width="50" height="40" rx="2" fill="white" style={{ opacity: 0.5 }} />
                  <rect x="165" y="205" width="50" height="40" rx="2" fill="white" style={{ opacity: 0.5 }} />
                  <rect x="230" y="205" width="50" height="40" rx="2" fill="white" style={{ opacity: 0.5 }} />

                  {/* Rolling door frame */}
                  <rect x="45" y="280" width="210" height="140" fill="white" style={{ opacity: 0.6 }} />
                  {/* Rolling door horizontal lines */}
                  <line x1="50" y1="300" x2="250" y2="300" stroke="white" strokeWidth="3" style={{ opacity: 0.35 }} />
                  <line x1="50" y1="325" x2="250" y2="325" stroke="white" strokeWidth="3" style={{ opacity: 0.35 }} />
                  <line x1="50" y1="350" x2="250" y2="350" stroke="white" strokeWidth="3" style={{ opacity: 0.35 }} />
                  <line x1="50" y1="375" x2="250" y2="375" stroke="white" strokeWidth="3" style={{ opacity: 0.35 }} />
                  <line x1="50" y1="400" x2="250" y2="400" stroke="white" strokeWidth="3" style={{ opacity: 0.35 }} />
                </svg>
              </div>

              {/* Staff Deck - positioned on top */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative z-10"
              >
                <StaffDeck />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Problem Cards Section */}
        <section id="kenapa" className="py-16 border-b border-notion bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center mb-10"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
                style={{ fontFamily: "var(--font-jakarta)" }}
                whileInView={{
                  x: [0, -3, 3, -3, 3, 0],
                }}
                transition={{ delay: 0.5, duration: 0.5 }}
                viewport={{ once: true }}
              >
                Katanya bisnis itu{" "}
                <motion.span
                  className="italic relative inline-block"
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                >
                  enak...
                  <motion.span
                    className="absolute left-0 top-1/2 h-[3px] bg-landing-cta rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 0.4 }}
                  />
                </motion.span>
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
                  title: "Mau Kualitas, Harga Murah",
                  desc: "Dibandingkan dengan kompetitor yang banting harga.",
                  image: "/assets/problems/problem-harga-murah.jpg",
                },
                {
                  title: "Kerja Sampai Begadang",
                  desc: "Tidak ada waktu untuk keluarga.",
                  image: "/assets/problems/problem-begadang.jpg",
                },
                {
                  title: "Susah Cari Orang",
                  desc: "Banyak tuntutan, kualitas tidak sesuai ekspektasi.",
                  image: "/assets/problems/problem-cari-orang.jpg",
                },
              ].map((problem, i) => (
                <motion.div
                  key={problem.title}
                  variants={fadeInUp}
                  className="group cursor-pointer"
                  whileHover={{
                    y: -8,
                    rotateX: 5,
                    rotateY: i === 0 ? 5 : i === 2 ? -5 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ transformPerspective: 1000 }}
                >
                  {/* Image Area */}
                  <div className="rounded-2xl h-[220px] mb-5 overflow-hidden relative">
                    <motion.div
                      className="w-full h-full"
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Image
                        src={problem.image}
                        alt={problem.title}
                        width={400}
                        height={220}
                        className="object-cover w-full h-full grayscale-[30%] sepia-[20%] brightness-[0.95] contrast-[1.05] transition-all duration-300 group-hover:grayscale-0 group-hover:sepia-0"
                      />
                    </motion.div>
                    {/* Warm overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-900/5 to-amber-900/15 mix-blend-multiply group-hover:opacity-0 transition-opacity duration-300" />
                  </div>
                  <h3
                    className="text-xl font-bold mb-2 group-hover:text-landing-cta transition-colors duration-300"
                    style={{ fontFamily: "var(--font-jakarta)" }}
                  >
                    {problem.title}
                  </h3>
                  <p className="text-landing-text-muted leading-relaxed text-sm">
                    {problem.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Bottom Quote */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center mt-12"
            >
              <p className="text-lg text-landing-text-muted italic">
                &ldquo;Apa memang saya tidak cocok jadi pengusaha?&rdquo;
              </p>
            </motion.div>
          </div>
        </section>

        {/* The System Section */}
        <section id="layanan" className="py-24 border-b border-notion bg-[#FDF8F3]">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - CRM Preview */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                {/* CRM Mockup - Matching real UI */}
                <div className="bg-[#FDF8F3] rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex">
                  {/* Sidebar */}
                  <div className="w-[140px] bg-[#FDF8F3] border-r border-gray-200 p-3 hidden sm:block">
                    {/* Logo */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-[#2D4B3E] flex items-center justify-center">
                        <span className="text-white text-xs font-bold">M</span>
                      </div>
                      <span className="text-xs font-bold text-gray-800">my21staff</span>
                    </div>

                    {/* Workspace */}
                    <div className="bg-white/60 rounded-lg p-2 mb-4">
                      <p className="text-[10px] font-semibold text-gray-700">Bisnis Anda</p>
                      <p className="text-[8px] text-gray-400">1 workspace</p>
                    </div>

                    {/* Nav */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-gray-500">
                        <div className="w-3 h-3 bg-gray-300 rounded" />
                        Dashboard
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-semibold text-[#2D4B3E] bg-[#2D4B3E]/10 rounded-lg">
                        <div className="w-3 h-3 bg-[#2D4B3E] rounded" />
                        Lead Management
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-gray-500">
                        <div className="w-3 h-3 bg-gray-300 rounded" />
                        Conversations
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 bg-white p-4">
                    {/* Header */}
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-gray-900">Lead Management</h3>
                      <p className="text-[10px] text-gray-400">158 of 158 contacts</p>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 mb-3">
                      <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded text-[9px] text-gray-600">
                        <span>All Status</span>
                        <span className="bg-gray-200 px-1 rounded text-[8px]">158</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded text-[9px] text-gray-600">
                        Tags
                      </div>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-2 py-1 text-[9px] font-semibold text-gray-500 border-b border-gray-100">
                      <span>Name</span>
                      <span className="w-14 text-center">Status</span>
                      <span className="w-12 text-center">Score</span>
                    </div>

                    {/* Lead Rows with Animation */}
                    <div className="space-y-0">
                      {[
                        { name: "Ibu Rina", phone: "+6281234567890", status: "New Lead", score: 85, delay: 0.3 },
                        { name: "Pak Budi", phone: "+6289876543210", status: "New Lead", score: 72, delay: 0.4 },
                        { name: "Dewi Sartika", phone: "+6285133933898", status: "New Lead", score: 45, delay: 0.5 },
                        { name: "Ahmad Fauzi", phone: "+6281371471454", status: "Contacted", score: 30, delay: 0.6 },
                      ].map((lead, i) => (
                        <motion.div
                          key={lead.name}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: lead.delay, duration: 0.3 }}
                          className="grid grid-cols-[1fr_auto_auto] gap-2 px-2 py-2 items-center border-b border-gray-50 hover:bg-gray-50/50"
                        >
                          <div>
                            <p className="text-[11px] font-medium text-gray-900">{lead.name}</p>
                            <p className="text-[9px] text-gray-400">{lead.phone}</p>
                          </div>
                          <motion.span
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                            className="w-14 text-center px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[8px] font-medium rounded border border-amber-200"
                          >
                            {lead.status}
                          </motion.span>
                          <div className="w-12 flex items-center gap-1">
                            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${lead.score}%` }}
                                viewport={{ once: true }}
                                transition={{ delay: lead.delay + 0.2, duration: 0.5 }}
                                className="h-full bg-[#2D4B3E] rounded-full"
                              />
                            </div>
                            <span className="text-[8px] text-gray-500">{lead.score}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating Notification Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 20, x: 20 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7 }}
                  className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-3 border border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Auto follow-up sent</p>
                      <p className="text-[10px] text-gray-500">Ibu Rina • just now</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20, x: -20 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 }}
                  className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3 border border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-landing-cta/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-landing-cta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Conversion rate</p>
                      <p className="text-[10px] text-landing-cta font-bold">+23% this week</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.9 }}
                  className="absolute top-1/2 -right-6 bg-white rounded-xl shadow-lg p-3 border border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">New message</p>
                      <p className="text-[10px] text-gray-500">3 unread chats</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right - Content */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                <motion.h2
                  variants={fadeInUp}
                  className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  Satu sistem. <br /><span className="italic">Semua terurus.</span>
                </motion.h2>

                <motion.div variants={fadeInUp} className="space-y-4 mb-8">
                  {[
                    { title: "CRM yang Bertumbuh Bersama Bisnis Anda", desc: "Lead Management • Website • Staff Infrastructure" },
                    { title: "Staff Digital 24/7", desc: "Respons otomatis • Follow-up tanpa terlewat" },
                    { title: "Keputusan Berbasis Data", desc: "Lihat mana yang hot • Track conversion • Laporan mingguan" },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-landing-cta/10 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-landing-cta" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold mb-0.5">{item.title}</h4>
                        <p className="text-sm text-landing-text-muted">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>

                <motion.p
                  variants={fadeInUp}
                  className="text-sm text-landing-text-muted mt-6"
                >
                  + Support 24/7 dari tim kami — <span className="font-bold text-landing-text">selalu siap bantu</span>
                </motion.p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Final CTA Section - Ready to Grow */}
        <section className="py-16 bg-landing-hero relative overflow-hidden">
          {/* Animated background elements */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.05, 0.1, 0.05]
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.1, 1, 1.1],
              opacity: [0.05, 0.1, 0.05]
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-0 left-0 w-48 h-48 bg-landing-cta/20 rounded-full blur-3xl"
          />

          <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col md:flex-row items-center justify-center gap-8"
            >
              <h2
                className="text-5xl md:text-6xl font-extrabold tracking-tight text-white flex flex-wrap justify-center gap-x-4"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                {["Ready", "to"].map((word) => (
                  <motion.span
                    key={word}
                    className="cursor-default transition-all duration-300"
                    whileHover={{
                      textShadow: "0 0 30px rgba(255,255,255,0.8)",
                      scale: 1.05
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
                <motion.span
                  className="italic text-landing-cta cursor-default transition-all duration-300"
                  whileHover={{
                    textShadow: "0 0 40px rgba(247,147,26,0.9)",
                    scale: 1.05
                  }}
                >
                  Grow?
                </motion.span>
              </h2>

              <Link href="/pricing">
                <motion.div
                  className="px-8 py-4 rounded-full bg-landing-cta text-white font-bold shadow-xl flex items-center gap-2 cursor-pointer"
                  whileHover={{
                    boxShadow: "0 0 40px rgba(247,147,26,0.6)",
                    scale: 1.05
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {["Mulai", "Sekarang"].map((word) => (
                    <motion.span
                      key={word}
                      className="transition-all duration-200"
                      whileHover={{
                        textShadow: "0 0 20px rgba(255,255,255,0.9)"
                      }}
                    >
                      {word}
                    </motion.span>
                  ))}
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.span>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer - Compact One-liner */}
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
