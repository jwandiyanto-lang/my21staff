'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function CTASection() {
  return (
    <section className="relative py-20 lg:py-28 bg-white overflow-hidden">
      {/* Orange accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#F7931A]"></div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.15 }}
          className="text-center"
        >
          {/* Main headline with orange accent */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#2D2A26] tracking-[-0.02em] leading-[1.1] mb-6">
            Ready to automate your{' '}
            <span className="text-[#F7931A] italic">next million?</span>
          </h2>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-[#2D2A26]/70 max-w-3xl mx-auto mb-10 tracking-[-0.02em]">
            Deploy the minimal OS for the world&apos;s most ambitious WhatsApp storefronts.
          </p>

          {/* CTA Button - Large and prominent */}
          <Link
            href="https://wa.me/971585938811?text=Hi%2C%20I'm%20interested%20in%20my21staff!"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-5 bg-[#F7931A] text-white text-lg font-bold rounded-2xl hover:bg-[#e8850f] hover:scale-105 transition-all duration-150 shadow-lg hover:shadow-xl"
          >
            Deploy Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
