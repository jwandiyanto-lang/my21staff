'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Circle } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative bg-[#FCFCFB] pt-12 pb-24 lg:pt-16 lg:pb-32 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Main hero card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative bg-white rounded-3xl border border-[rgba(55,53,47,0.08)] shadow-lg overflow-hidden"
        >
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 p-8 lg:p-12">
            {/* Left column - Content */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-[#E8F5E9] text-[#1B4332] px-3 py-1.5 rounded-full text-sm font-medium mb-6 w-fit">
                <Check className="w-4 h-4" />
                <span className="font-mono">Trusted by 50+ Indonesian SMEs</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-4">
                <span className="text-[#1B4332]">Kejar Chat WhatsApp, </span>
                <span className="text-[#F7931A]">Atau Kejar Closing?</span>
              </h1>

              {/* English subtitle */}
              <p className="text-base sm:text-lg text-[#6B7280] italic mb-6">
                Chase WhatsApp Messages, Or Chase Deals?
              </p>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-[#37352F] leading-relaxed mb-2 max-w-2xl font-medium">
                AI Sales Team yang kelola chat 24/7. Kamu fokus closing, Sarah & The Brain yang handle sisanya.
              </p>

              {/* English subtitle for subheadline */}
              <p className="text-sm sm:text-base text-[#6B7280] italic mb-8 max-w-2xl">
                AI Sales Team managing chats 24/7. You focus on closing, Sarah & The Brain handle the rest.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#F7931A] text-white font-semibold rounded-full hover:bg-[#e08515] transition-all duration-200 shadow-md hover:shadow-lg text-base"
                >
                  Deploy Console
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#1B4332] font-semibold rounded-full border-2 border-[#1B4332] hover:bg-gray-50 transition-all duration-200 text-base"
                >
                  View Demo
                </Link>
              </div>
            </div>

            {/* Right column - WhatsApp Chat in Browser Card */}
            <div className="lg:col-span-5 flex items-center">
              <div className="w-full bg-white rounded-2xl border border-[rgba(55,53,47,0.08)] shadow-lg overflow-hidden">
                {/* Browser-style header */}
                <div className="bg-[#F5F5F5] px-4 py-3 flex items-center gap-2 border-b border-[rgba(55,53,47,0.08)]">
                  <div className="flex gap-1.5">
                    <Circle className="w-3 h-3 fill-red-400 text-red-400" />
                    <Circle className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <Circle className="w-3 h-3 fill-green-400 text-green-400" />
                  </div>
                </div>

                {/* Console header */}
                <div className="bg-white px-5 py-4 border-b border-[rgba(55,53,47,0.08)]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#1B4332] font-mono">Your Daily Report</h3>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-2 h-2 bg-[#F7931A] rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-2 h-2 bg-[#F7931A] rounded-full animate-ping opacity-75"></div>
                      </div>
                      <span className="text-xs text-[#6B7280] font-mono">Live</span>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Chat messages - with blur effect */}
                <div className="p-4 space-y-3 bg-[#FCFCFB] backdrop-blur-sm relative">
                  {/* Blur overlay - extremely strong blur to make content completely invisible */}
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-[20px] pointer-events-none z-20"></div>

                  {/* Message 1 - Customer (text completely hidden) */}
                  <div className="relative z-10 flex items-start gap-3 justify-end">
                    <div className="bg-white rounded-lg px-4 py-3 border border-[rgba(55,53,47,0.08)] shadow-sm max-w-[80%] h-12">
                      {/* No text - just empty bubble shape */}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0 opacity-0">
                      C
                    </div>
                  </div>

                  {/* Message 2 - Sarah (text completely hidden) */}
                  <div className="relative z-10 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center text-xs font-bold text-white flex-shrink-0 opacity-0">
                      S
                    </div>
                    <div className="bg-[#DCF8C6] rounded-lg px-4 py-3 border border-[rgba(55,53,47,0.08)] shadow-sm max-w-[80%] h-16">
                      {/* No text - just empty bubble shape */}
                    </div>
                  </div>

                  {/* Message 3 - Customer (text completely hidden) */}
                  <div className="relative z-10 flex items-start gap-3 justify-end">
                    <div className="bg-white rounded-lg px-4 py-3 border border-[rgba(55,53,47,0.08)] shadow-sm max-w-[80%] h-10">
                      {/* No text - just empty bubble shape */}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0 opacity-0">
                      C
                    </div>
                  </div>
                </div>

                {/* Stats footer */}
                <div className="bg-[#1B4332] px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-[10px] text-white/60 font-mono uppercase tracking-wide">Revenue</p>
                      <p className="text-sm font-bold text-white font-mono">$12.4k</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/60 font-mono uppercase tracking-wide">Avg Res.</p>
                      <p className="text-sm font-bold text-white font-mono">0.8s</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-white/40 font-mono">Today</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
