'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { HERO_CONTENT, CTA_TEXT } from '@/lib/landing-constants'

export function HeroSection() {
  return (
    <section id="product" className="relative bg-[#f1f5f0] pt-20 pb-16 lg:pt-24 lg:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="text-center lg:text-left"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#284b31] leading-[1.1] tracking-[-0.02em]">
              {HERO_CONTENT.headline}
            </h1>
            <p className="mt-6 text-lg text-[#2D2A26]/70 max-w-lg mx-auto lg:mx-0 tracking-[-0.02em]">
              {HERO_CONTENT.subheadline}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href={CTA_TEXT.pricing}
                className="inline-flex items-center justify-center px-6 py-3 bg-[#284b31] text-white font-semibold rounded-xl hover:bg-[#284b31]/90 transition-all duration-150"
              >
                {CTA_TEXT.primary}
              </Link>
            </div>
          </motion.div>

          {/* CRM Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15, delay: 0.1, ease: 'easeOut' }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              {/* CRM Interface Skeleton */}
              <div className="flex h-[340px]">
                {/* Sidebar */}
                <div className="w-44 bg-[#14261a] p-3 hidden sm:block">
                  {/* Logo */}
                  <div className="mb-5">
                    <span className="text-sm font-extrabold tracking-[-0.02em]">
                      <span className="text-white">my</span>
                      <span className="text-[#F7931A]">21</span>
                      <span className="text-white">staff</span>
                    </span>
                  </div>
                  {/* Workspace skeleton */}
                  <div className="h-9 bg-white/10 rounded-lg mb-4"></div>
                  {/* Nav skeleton */}
                  <div className="space-y-2">
                    <div className="h-8 bg-white/5 rounded"></div>
                    <div className="h-8 bg-white/5 rounded"></div>
                    <div className="h-8 bg-[#284b31] rounded"></div>
                    <div className="h-8 bg-white/5 rounded"></div>
                  </div>
                </div>

                {/* Conversation List */}
                <div className="w-48 border-r border-gray-200 bg-white hidden md:block">
                  <div className="p-3 border-b border-gray-100">
                    <div className="h-8 bg-gray-100 rounded-lg"></div>
                  </div>
                  <div className="p-2 space-y-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={`p-2.5 rounded-lg ${i === 0 ? 'bg-gray-50' : ''}`}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-full ${
                            i === 0 ? 'bg-[#284b31]' :
                            i === 1 ? 'bg-purple-500' :
                            i === 2 ? 'bg-blue-500' : 'bg-pink-500'
                          }`}></div>
                          <div className="flex-1 space-y-1.5">
                            <div className="h-2.5 bg-gray-200 rounded w-20"></div>
                            <div className="h-2 bg-gray-100 rounded w-24"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat View */}
                <div className="flex-1 flex flex-col bg-[#e8e0d5]">
                  {/* Chat header */}
                  <div className="bg-white px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#284b31] rounded-full"></div>
                      <div className="space-y-1.5">
                        <div className="h-3 bg-gray-200 rounded w-28"></div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-[#22c55e] rounded-full"></div>
                          <div className="h-2 bg-gray-100 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 space-y-3">
                    <div className="flex justify-end">
                      <div className="bg-[#dcf8c6] rounded-xl px-4 py-2.5 max-w-[65%]">
                        <div className="h-2.5 bg-[#c5e8b3] rounded w-full mb-1.5"></div>
                        <div className="h-2.5 bg-[#c5e8b3] rounded w-3/4"></div>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-white rounded-xl px-4 py-2.5 max-w-[55%] shadow-sm">
                        <div className="h-2.5 bg-gray-100 rounded w-full mb-1.5"></div>
                        <div className="h-2.5 bg-gray-100 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-[#dcf8c6] rounded-xl px-4 py-2.5 max-w-[60%]">
                        <div className="h-2.5 bg-[#c5e8b3] rounded w-full mb-1.5"></div>
                        <div className="h-2.5 bg-[#c5e8b3] rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>

                  {/* Input */}
                  <div className="bg-white p-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-10 bg-gray-100 rounded-full"></div>
                      <div className="w-10 h-10 bg-[#284b31] rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status bar */}
              <div className="bg-white px-4 py-1.5 flex items-center justify-end gap-2 border-t border-gray-100">
                <span className="w-2 h-2 bg-[#22c55e] rounded-full"></span>
                <span className="text-[10px] text-gray-500 tracking-[-0.02em]">Network Stable</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
