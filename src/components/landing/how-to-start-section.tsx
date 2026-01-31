'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    icon: 'web',
    title: 'We Build Your Website',
    description: 'A beautiful, conversion-focused site designed to attract and capture leads.',
  },
  {
    number: '02',
    icon: 'chat',
    title: 'We Connect WhatsApp + Set Up Your CRM',
    description: 'Your WhatsApp integrated with a custom CRM. Track every lead, every conversation, every opportunity.',
  },
  {
    number: '03',
    icon: 'settings_suggest',
    title: 'We Keep It Running',
    description: "Ongoing updates and improvements. See what works, fix what doesn't. You focus on your business.",
  },
]

export function HowToStartSection() {
  return (
    <section className="relative bg-white pt-20 pb-24 lg:pt-28 lg:pb-32 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16 lg:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1B4332] mb-4 tracking-tight">
              Your Path to Automation
            </h2>
            <p className="text-lg sm:text-xl text-[#37352F] max-w-2xl mx-auto">
              Three simple steps. We handle everything.
            </p>
          </motion.div>
        </div>

        {/* Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Vertical connecting line (hidden on mobile) */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#1B4332]/20 via-[#1B4332]/10 to-transparent -translate-x-1/2" />

          {/* Steps Grid */}
          <div className="space-y-12 lg:space-y-20">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className={`relative flex flex-col lg:flex-row items-center gap-8 ${
                    isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}
                >
                  {/* Content Card - Left or Right */}
                  <div
                    className={`flex-1 ${
                      isEven ? 'lg:text-right lg:pr-12' : 'lg:text-left lg:pl-12'
                    }`}
                  >
                    <div className="group relative bg-white rounded-2xl border border-[#37352F14] p-8 lg:p-10 hover:border-[#37352F29] transition-all duration-300 hover:shadow-lg">
                      {/* Accent border */}
                      <div
                        className={`absolute top-0 bottom-0 w-1 bg-gradient-to-b from-[#1B4332] to-[#F7931A] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                          isEven ? 'right-0 rounded-r-2xl' : 'left-0 rounded-l-2xl'
                        }`}
                      />

                      {/* Step number - Large and prominent */}
                      <div
                        className={`flex items-center gap-4 mb-6 ${
                          isEven ? 'lg:justify-end' : 'lg:justify-start'
                        }`}
                      >
                        <div className="text-7xl lg:text-8xl font-bold text-[#1B4332]/10 font-mono leading-none">
                          {step.number}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl lg:text-3xl font-bold text-[#1B4332] mb-4 tracking-tight">
                        {step.title}
                      </h3>

                      {/* Description */}
                      <p className="text-base lg:text-lg text-[#37352F] leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Center Icon Circle */}
                  <div className="relative z-10 shrink-0">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.15 + 0.2 }}
                      className="relative"
                    >
                      {/* Outer glow ring */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#1B4332] to-[#F7931A] rounded-full blur-xl opacity-20 animate-pulse" />

                      {/* Icon container */}
                      <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br from-[#1B4332] to-[#284b31] flex items-center justify-center shadow-2xl border-4 border-white">
                        <span className="material-symbols-outlined text-white text-[32px] lg:text-[40px]">
                          {step.icon}
                        </span>
                      </div>

                      {/* Connecting dots (mobile only) */}
                      {index < steps.length - 1 && (
                        <div className="lg:hidden absolute left-1/2 top-full -translate-x-1/2 mt-6 mb-6 flex flex-col items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#1B4332]/30" />
                          <div className="w-1.5 h-1.5 rounded-full bg-[#1B4332]/30" />
                          <div className="w-1.5 h-1.5 rounded-full bg-[#1B4332]/30" />
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* Spacer for alignment (desktop only) */}
                  <div className="hidden lg:block flex-1" />
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-16 lg:mt-20"
        >
          <a
            href="https://wa.me/971585968691?text=I%20want%20to%20automate%20my%20business"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#1B4332] to-[#284b31] text-white text-lg font-semibold rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <span className="material-symbols-outlined text-[24px]">
              chat
            </span>
            Let&apos;s Get Started
          </a>
        </motion.div>
      </div>
    </section>
  )
}
