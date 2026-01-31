'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Brain, Users, Quote, Circle } from 'lucide-react'
import Image from 'next/image'

export function FeaturesSection() {
  return (
    <section className="relative bg-white py-16 lg:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left column - Features */}
          <div className="space-y-8 relative z-10">
            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black leading-tight">
              Here's what you'll love about my21staff
            </h2>

            {/* Feature 1 - DETAILED (shortened) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0 pt-1">
                <CheckCircle className="w-6 h-6 text-black" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">
                  24/7 AI Sales Team That Never Sleeps
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Sarah engages every lead instantly—even at 3 AM. She qualifies prospects and captures key info automatically. You focus on closing, she handles the routine.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 - SUMMARY (shortened) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0 pt-1">
                <Brain className="w-6 h-6 text-black" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">
                  Long-Term Memory, Not Just Transactional Responses
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  The Brain remembers every conversation. No more "siapa ya?" moments.
                </p>
              </div>
            </motion.div>

            {/* Feature 3 - SUMMARY (shortened) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0 pt-1">
                <Users className="w-6 h-6 text-black" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">
                  Human Handoff When It Matters
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Qualified leads get routed to you automatically.
                </p>
              </div>
            </motion.div>

            {/* Yellow quotation mark - bottom left */}
            <div className="absolute -bottom-8 -left-8 lg:-left-12 opacity-20">
              <Quote className="w-24 h-24 lg:w-32 lg:h-32 text-yellow-400 fill-yellow-400" strokeWidth={1} />
            </div>
          </div>

          {/* Right column - CRM Screenshot with Browser Frame */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative lg:ml-auto self-end"
            style={{ perspective: '1000px' }}
          >
            {/* Browser window mockup */}
            <div
              className="relative bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-200"
              style={{ transform: 'rotateY(-5deg) rotateX(2deg)' }}
            >
              {/* Browser chrome - top bar */}
              <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                <div className="flex gap-2">
                  <Circle className="w-3 h-3 fill-red-400 text-red-400" />
                  <Circle className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <Circle className="w-3 h-3 fill-green-400 text-green-400" />
                </div>
                <div className="flex-1 ml-2">
                  <div className="bg-white rounded px-3 py-1 text-xs text-gray-500 font-mono max-w-xs">
                    app.my21staff.com/leads
                  </div>
                </div>
              </div>

              {/* Screenshot content */}
              <div className="relative w-full bg-white">
                <Image
                  src="/crm-screenshot.png"
                  alt="my21staff CRM Dashboard"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
              </div>

              {/* Subtle glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-xl -z-10 opacity-50"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
