'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { WHATSAPP_LINK } from '@/lib/landing-constants'
import { StaffDeck } from '@/components/ui/staff-deck'

export function HeroSection() {
  return (
    <section className="relative min-h-[80vh] md:min-h-screen bg-landing-hero">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center md:text-left"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
              24/7 Digital Workforce
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/90 max-w-lg mx-auto md:mx-0">
              WhatsApp automation that works while you sleep.
              A CRM that grows with your business, not against it.
            </p>
            <div className="mt-8">
              <Link
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 px-8 py-4 bg-landing-cta text-white font-bold rounded-full hover:bg-landing-cta-dark transition-colors shadow-lg hover:shadow-xl"
              >
                <MessageCircle className="w-5 h-5" />
                Chat with Us
              </Link>
            </div>
          </motion.div>

          {/* StaffDeck visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="flex justify-center md:justify-end"
          >
            <StaffDeck />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
