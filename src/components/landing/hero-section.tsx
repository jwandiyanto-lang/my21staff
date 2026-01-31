'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Circle } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative bg-[#FCFCFB] pt-32 pb-24 lg:pt-40 lg:pb-32 px-4 sm:px-6 lg:px-8">
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
                <span className="font-mono">Unified OS V3</span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
                <span className="text-[#1B4332]">Your Business, </span>
                <span className="text-[#F7931A]">Fully Automated.</span>
              </h1>

              {/* Description */}
              <p className="text-lg sm:text-xl text-[#6B7280] leading-relaxed mb-8 max-w-2xl">
                The minimalist workspace for ambitious small businesses. Convert complex workflows into a streamlined console that manages your WhatsApp storefront, AI staff, and CRM in one place.
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
                {/* Browser-style header */}
                <div className="bg-[#F5F5F5] px-4 py-3 flex items-center gap-2 border-b border-[rgba(55,53,47,0.08)]">
                  <div className="flex gap-1.5">
                    <Circle className="w-3 h-3 fill-red-400 text-red-400" />
                    <Circle className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <Circle className="w-3 h-3 fill-green-400 text-green-400" />
                  </div>
                  <span className="text-xs text-[#6B7280] font-mono ml-2">console.my21staff.com</span>
                </div>

                {/* Console header */}
                <div className="bg-white px-5 py-4 border-b border-[rgba(55,53,47,0.08)]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#1B4332] font-mono">Console Stream</h3>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-2 h-2 bg-[#F7931A] rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-2 h-2 bg-[#F7931A] rounded-full animate-ping opacity-75"></div>
                      </div>
                      <span className="text-xs text-[#6B7280] font-mono">Live</span>
                    </div>
                  </div>
                </div>

                {/* Activity items */}
                <div className="p-4 space-y-3 bg-[#FCFCFB]">
                  {/* Item 1 */}
                  <div className="bg-white rounded-lg p-4 border border-[rgba(55,53,47,0.08)] hover:border-[#F7931A] transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-[#37352F] leading-relaxed">
                          AI Staff #21 - Processed order #8842 from WhatsApp
                        </p>
                        <span className="text-[10px] text-[#6B7280] font-mono mt-1 block">2m ago</span>
                      </div>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="bg-white rounded-lg p-4 border border-[rgba(55,53,47,0.08)] hover:border-[#F7931A] transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-[#37352F] leading-relaxed">
                          System Automations - Inventory sync completed with Shopify
                        </p>
                        <span className="text-[10px] text-[#6B7280] font-mono mt-1 block">5m ago</span>
                      </div>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="bg-white rounded-lg p-4 border border-[rgba(55,53,47,0.08)] hover:border-[#F7931A] transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#F7931A] rounded-full mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-[#37352F] leading-relaxed">
                          New Lead Captured - Sarah J. initiated inquiry via QR code
                        </p>
                        <span className="text-[10px] text-[#6B7280] font-mono mt-1 block">8m ago</span>
                      </div>
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
