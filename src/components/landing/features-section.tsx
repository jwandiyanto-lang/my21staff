'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Brain, Users, Quote } from 'lucide-react'
import Image from 'next/image'

export function FeaturesSection() {
  return (
    <section className="relative bg-white py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Left column - Features */}
          <div className="space-y-12 relative z-10">
            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black leading-tight">
              Here's what you'll love about my21staff
            </h2>

            {/* Feature 1 - DETAILED */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex gap-5"
            >
              <div className="flex-shrink-0 pt-1">
                <CheckCircle className="w-7 h-7 text-black" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-black mb-4">
                  24/7 AI Sales Team That Never Sleeps
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Sarah, your AI staff, engages every lead instantly—even at 3 AM. She qualifies prospects, answers FAQs, and captures critical info (name, business type, pain points) without you lifting a finger. No more "Berapa harganya?" messages drowning your phone. Sarah handles the routine, you handle the closing.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 - SUMMARY */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex gap-5"
            >
              <div className="flex-shrink-0 pt-1">
                <Brain className="w-7 h-7 text-black" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">
                  Long-Term Memory, Not Just Transactional Responses
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  The Brain (Claude 3.5) remembers every conversation from 6 months ago. No more "siapa ya?" moments.
                </p>
              </div>
            </motion.div>

            {/* Feature 3 - SUMMARY */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex gap-5"
            >
              <div className="flex-shrink-0 pt-1">
                <Users className="w-7 h-7 text-black" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">
                  Human Handoff When It Matters
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Qualified leads get routed to you automatically. Focus your energy on the deals that actually close.
                </p>
              </div>
            </motion.div>

            {/* Yellow quotation mark - bottom left */}
            <div className="absolute -bottom-12 -left-8 lg:-left-16 opacity-20">
              <Quote className="w-32 h-32 lg:w-48 lg:h-48 text-yellow-400 fill-yellow-400" strokeWidth={1} />
            </div>
          </div>

          {/* Right column - CRM Screenshot */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative lg:ml-auto self-end"
          >
            <div className="relative rounded-xl overflow-hidden shadow-xl">
              {/* Actual screenshot */}
              <div className="relative w-full">
                <Image
                  src="/crm-screenshot.png"
                  alt="my21staff CRM Dashboard"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  priority
                />

                {/* Subtle blur overlay */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-[0.5px]"></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
