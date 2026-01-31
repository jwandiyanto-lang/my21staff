'use client'

import { motion } from 'framer-motion'
import { Bot, Brain, UserCheck } from 'lucide-react'

export function FeaturesSection() {
  return (
    <section className="relative bg-white py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column - Features */}
          <div className="space-y-8">
            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1B4332] leading-tight">
              Here's what you'll love about my21staff
            </h2>

            {/* Feature 1 - DETAILED */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                  <Bot className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1B4332] mb-3">
                  24/7 AI Sales Team That Never Sleeps
                </h3>
                <p className="text-base text-[#6B7280] leading-relaxed">
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
              className="flex gap-4"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1B4332] mb-2">
                  Long-Term Memory, Not Just Transactional Responses
                </h3>
                <p className="text-base text-[#6B7280] leading-relaxed">
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
              className="flex gap-4"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1B4332] mb-2">
                  Human Handoff When It Matters
                </h3>
                <p className="text-base text-[#6B7280] leading-relaxed">
                  Qualified leads get routed to you automatically. Focus your energy on the deals that actually close.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right column - CRM Screenshot (blurred/animated) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative lg:ml-auto"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
              {/* Blur overlay for mysterious effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent backdrop-blur-[2px] z-10"></div>

              {/* Mock CRM table interface */}
              <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="absolute inset-0 p-6 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-300">
                    <div className="text-sm font-bold text-[#1B4332]">Leads Dashboard</div>
                    <div className="flex gap-2">
                      <div className="w-16 h-6 bg-gray-300 rounded"></div>
                      <div className="w-16 h-6 bg-gray-300 rounded"></div>
                    </div>
                  </div>

                  {/* Table rows - Indonesian names */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-green-200"></div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[#1B4332]">Bambang Supriadi</div>
                        <div className="text-xs text-gray-600">Toko Elektronik</div>
                      </div>
                      <div className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded">Hot</div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-blue-200"></div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[#1B4332]">Budi Santoso</div>
                        <div className="text-xs text-gray-600">Warung Makan</div>
                      </div>
                      <div className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">Warm</div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-purple-200"></div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[#1B4332]">Putri Maharani</div>
                        <div className="text-xs text-gray-600">Salon Kecantikan</div>
                      </div>
                      <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">New</div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg shadow-sm opacity-60">
                      <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[#1B4332]">Ahmad Fauzi</div>
                        <div className="text-xs text-gray-600">Bengkel Motor</div>
                      </div>
                      <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">Cold</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400/20 to-orange-400/20 blur-xl -z-10"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
