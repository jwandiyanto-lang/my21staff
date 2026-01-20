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

export default function SecurityPage() {
  const waNumber = "6281287776289";
  const waMessage = encodeURIComponent(
    "Hi, I have a question about data security at my21staff"
  );

  return (
    <div
      className={`${plusJakartaSans.variable} ${inter.variable} antialiased`}
      style={{ fontFamily: "var(--font-inter)" }}
    >
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-extrabold">
              <span className="text-[#2D2A26]">my</span>
              <span className="text-[#F7931A]">21</span>
              <span className="text-[#2D2A26]">staff</span>
            </span>
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-[#2D2A26] hover:text-[#F7931A] transition-colors font-medium"
          >
            Pricing
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="bg-[#284b31] text-white pt-24 pb-16 px-6">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-[#F7931A]" />
                </div>
              </div>
              <h1
                className="text-4xl md:text-5xl font-bold mb-4"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Your Data Security
              </h1>
              <p className="text-lg text-white/80 max-w-xl mx-auto">
                We take your business data seriously. Here&apos;s a simple explanation
                of how your data is protected.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Section 1: Data Storage */}
        <section className="bg-white text-[#2D2A26] py-12 md:py-16">
          <div className="mx-auto max-w-3xl px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#284b31]/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-[#284b31]" />
                </div>
                <h2
                  className="text-2xl md:text-3xl font-bold text-[#284b31]"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  Where Data is Stored
                </h2>
              </div>

              <div className="space-y-6 text-lg leading-relaxed">
                <p>
                  Your data is stored in{" "}
                  <strong className="text-[#284b31]">Singapore</strong> —
                  the closest location for fast access from Indonesia and Southeast Asia.
                </p>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <p className="font-semibold mb-3">Data we store:</p>
                  <ul className="space-y-2 text-[#2D2A26]/80">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F7931A]" />
                      Contacts and customer data
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F7931A]" />
                      Messages and conversation history
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F7931A]" />
                      Team member data
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F7931A]" />
                      Attachments and files
                    </li>
                  </ul>
                </div>

                <div className="flex items-start gap-3 bg-[#284b31]/5 rounded-xl p-4">
                  <Lock className="w-5 h-5 text-[#284b31] mt-0.5 shrink-0" />
                  <p className="text-base">
                    <strong>All data is encrypted</strong> — both at rest
                    and in transit. Your data is safe from unauthorized access.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 2: Data Control */}
        <section className="bg-gray-50 text-[#2D2A26] py-12 md:py-16 border-t border-gray-100">
          <div className="mx-auto max-w-3xl px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#F7931A]/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#F7931A]" />
                </div>
                <h2
                  className="text-2xl md:text-3xl font-bold text-[#284b31]"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  Your Data Control
                </h2>
              </div>

              <div className="space-y-6 text-lg leading-relaxed">
                <p>
                  You have full control over your business data. This is your right.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <Download className="w-5 h-5 text-[#284b31]" />
                      <h3 className="font-bold">Export Data</h3>
                    </div>
                    <p className="text-base text-[#2D2A26]/70">
                      You can export all your business data anytime.
                      Your data belongs to you.
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <Trash2 className="w-5 h-5 text-[#284b31]" />
                      <h3 className="font-bold">Delete Data</h3>
                    </div>
                    <p className="text-base text-[#2D2A26]/70">
                      If you want to delete your data, contact us. We will
                      process your request.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 3: Contact */}
        <section className="bg-white text-[#2D2A26] py-12 md:py-16 border-t border-gray-100">
          <div className="mx-auto max-w-3xl px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center"
            >
              <h2
                className="text-2xl md:text-3xl font-bold text-[#284b31] mb-4"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Have Questions?
              </h2>
              <p className="text-lg text-[#2D2A26]/70 mb-8 max-w-lg mx-auto">
                If you have questions about data security or privacy, don&apos;t
                hesitate to reach out.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={`https://wa.me/${waNumber}?text=${waMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-lg font-bold hover:bg-[#20BD5A] transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp Us
                </a>

                <a
                  href="mailto:admin@my21staff.com"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#284b31] text-white rounded-lg font-bold hover:bg-[#284b31]/90 transition-all"
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
      <footer className="bg-[#284b31] py-6">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-center gap-4 text-sm text-white/60">
            <span className="font-extrabold">
              <span className="text-white/60">my</span>
              <span className="text-[#F7931A]">21</span>
              <span className="text-white/60">staff</span>
            </span>
            <span>&copy; 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
