'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageCircle, ArrowRight } from 'lucide-react'
import { WHATSAPP_LINK } from '@/lib/landing-constants'

export function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-landing-hero relative overflow-hidden">
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

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4">
            Ready to{' '}
            <span className="italic text-landing-cta">Grow?</span>
          </h2>
          <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto mb-8">
            Let&apos;s build a system that works while you sleep.
            Your 24/7 digital workforce awaits.
          </p>
          <Link
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 px-8 py-4 bg-landing-cta text-white font-bold rounded-full hover:shadow-lg hover:shadow-landing-cta/40 transition-all shadow-xl"
          >
            <MessageCircle className="w-5 h-5" />
            Chat with Us
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
