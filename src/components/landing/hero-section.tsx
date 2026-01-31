'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Circle, Bot, Zap, User } from 'lucide-react'

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

            {/* Right column - Activity Feed Mockup */}
            <div className="lg:col-span-5 flex items-center">
              <div className="w-full bg-white rounded-2xl border border-[rgba(55,53,47,0.08)] shadow-lg overflow-hidden">
                {/* Browser-style header - very subtle */}
                <div className="bg-[#F8F8F8] px-4 py-2.5 flex items-center gap-2 border-b border-[rgba(55,53,47,0.06)]">
                  <div className="flex gap-1.5">
                    <Circle className="w-2.5 h-2.5 fill-gray-300 text-gray-300" />
                    <Circle className="w-2.5 h-2.5 fill-gray-300 text-gray-300" />
                    <Circle className="w-2.5 h-2.5 fill-gray-300 text-gray-300" />
                  </div>
                </div>

                {/* Console Stream header */}
                <div className="bg-white px-5 py-3 border-b border-[rgba(55,53,47,0.08)]">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Console Stream</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-[#F7931A] rounded-full"></div>
                      <span className="text-[9px] text-[#F7931A] font-bold uppercase tracking-wide">Live</span>
                    </div>
                  </div>
                </div>

                {/* Activity items */}
                <div className="p-4 space-y-3 bg-[#FCFCFB]">
                  {/* Item 1 - AI Staff #21 */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-[#1B4332] mb-0.5">AI Staff #21</h4>
                        <p className="text-xs text-[#6B7280] leading-relaxed">
                          Processed order #8842 from WhatsApp
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Item 2 - System Automations */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-[#1B4332] mb-0.5">System Automations</h4>
                        <p className="text-xs text-[#6B7280] leading-relaxed">
                          Inventory sync completed with Shopify
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Item 3 - New Lead Captured */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-[#1B4332] mb-0.5">New Lead Captured</h4>
                        <p className="text-xs text-[#6B7280] leading-relaxed">
                          Sarah J. initiated a product inquiry via QR code
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats grid - 2 columns */}
                <div className="grid grid-cols-2 gap-0 border-t border-[rgba(55,53,47,0.08)]">
                  {/* Revenue box - dark green */}
                  <div className="bg-[#1B4332] px-5 py-4">
                    <p className="text-[9px] text-white/60 font-bold uppercase tracking-wider mb-1">Revenue</p>
                    <p className="text-2xl font-bold text-white">$12.4k</p>
                  </div>

                  {/* Avg Response box - light orange */}
                  <div className="bg-[#FFF4E6] px-5 py-4">
                    <p className="text-[9px] text-[#F7931A] font-bold uppercase tracking-wider mb-1">Avg. Res.</p>
                    <p className="text-2xl font-bold text-[#1B4332]">0.8s</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
