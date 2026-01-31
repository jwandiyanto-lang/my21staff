'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Zap, Clock } from 'lucide-react'

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

            {/* Right column - WhatsApp Phone Mockup */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="relative w-full max-w-[320px]">
                {/* Phone frame */}
                <div className="relative bg-[#1F1F1F] rounded-[3rem] p-3 shadow-2xl">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#1F1F1F] rounded-b-3xl z-10"></div>

                  {/* Screen */}
                  <div className="relative bg-[#E5DDD5] rounded-[2.5rem] overflow-hidden">
                    {/* WhatsApp Header */}
                    <div className="bg-[#25D366] px-4 py-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#25D366] font-bold text-lg">
                        S
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-sm">Sarah - Staff Digital</h3>
                        <p className="text-white/80 text-xs">online</p>
                      </div>
                    </div>

                    {/* Chat area */}
                    <div className="p-4 space-y-3 min-h-[500px] bg-[url('/whatsapp-bg.png')] bg-[#E5DDD5]">
                      {/* Customer message 1 */}
                      <div className="flex justify-end">
                        <div className="bg-white rounded-lg rounded-tr-sm px-3 py-2 max-w-[75%] shadow-sm">
                          <p className="text-sm text-[#1F1F1F]">Berapa harganya untuk paket basic?</p>
                          <span className="text-[10px] text-[#667781] float-right mt-1">10:23</span>
                        </div>
                      </div>

                      {/* Sarah message 1 */}
                      <div className="flex justify-start">
                        <div className="bg-[#DCF8C6] rounded-lg rounded-tl-sm px-3 py-2 max-w-[75%] shadow-sm">
                          <p className="text-sm text-[#1F1F1F]">Halo! Saya Sarah dari tim di sini. Boleh tau nama kamu dulu?</p>
                          <span className="text-[10px] text-[#667781] float-right mt-1">10:23</span>
                        </div>
                      </div>

                      {/* Customer message 2 */}
                      <div className="flex justify-end">
                        <div className="bg-white rounded-lg rounded-tr-sm px-3 py-2 max-w-[75%] shadow-sm">
                          <p className="text-sm text-[#1F1F1F]">Budi</p>
                          <span className="text-[10px] text-[#667781] float-right mt-1">10:24</span>
                        </div>
                      </div>

                      {/* Sarah message 2 */}
                      <div className="flex justify-start">
                        <div className="bg-[#DCF8C6] rounded-lg rounded-tl-sm px-3 py-2 max-w-[75%] shadow-sm">
                          <p className="text-sm text-[#1F1F1F]">Salam kenal Budi. Bisnisnya di bidang apa?</p>
                          <span className="text-[10px] text-[#667781] float-right mt-1">10:24</span>
                        </div>
                      </div>

                      {/* Typing indicator */}
                      <div className="flex justify-start">
                        <div className="bg-[#DCF8C6] rounded-lg rounded-tl-sm px-4 py-3 shadow-sm">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-[#667781] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-[#667781] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-[#667781] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom metrics overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1B4332] to-transparent p-4 pt-8">
                      <div className="flex items-center justify-center gap-6 text-white">
                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <Zap className="w-3 h-3" />
                          <span className="text-xs font-mono font-semibold">0.8s avg response</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs font-mono font-semibold">24/7 Available</span>
                        </div>
                      </div>
                    </div>
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
