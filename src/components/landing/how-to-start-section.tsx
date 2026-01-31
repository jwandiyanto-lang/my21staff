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
    <section className="relative bg-[#FCFCFB] pt-12 pb-20 lg:pt-16 lg:pb-28 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1B4332] mb-4 tracking-tight">
              How to Get Started
            </h2>
            <p className="text-lg sm:text-xl text-[#37352F] max-w-2xl mx-auto">
              Three simple steps. We handle everything.
            </p>
          </motion.div>
        </div>

        {/* Steps Grid - 3 columns with dividers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative px-8 py-10 ${
                index < steps.length - 1 ? 'md:border-r border-[#37352F14]' : ''
              }`}
            >
              {/* Step number label - small orange accent */}
              <div className="inline-block mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[#F7931A] font-semibold">
                  Step {step.number}
                </span>
              </div>

              {/* Icon - simple, minimal */}
              <div className="mb-4">
                <span className="material-symbols-outlined text-[#1B4332] text-[32px]">
                  {step.icon}
                </span>
              </div>

              {/* Title - bold and prominent */}
              <h3 className="text-xl lg:text-2xl font-bold text-[#1B4332] mb-3 tracking-tight">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-base text-[#37352F] leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-16"
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
