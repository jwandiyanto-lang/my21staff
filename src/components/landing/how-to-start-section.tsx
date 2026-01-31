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
    <section className="relative bg-white pt-12 pb-20 lg:pt-16 lg:pb-28 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2D2A26] mb-4 tracking-tight">
              How to Get Started
            </h2>
            <p className="text-lg sm:text-xl text-[#2D2A26]/70 max-w-2xl mx-auto">
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
                index < steps.length - 1 ? 'md:border-r border-[#2D2A26]/10' : ''
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
                <span className="material-symbols-outlined text-[#2D2A26] text-[32px]">
                  {step.icon}
                </span>
              </div>

              {/* Title - bold and prominent */}
              <h3 className="text-xl lg:text-2xl font-bold text-[#2D2A26] mb-3 tracking-tight">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-base text-[#2D2A26]/70 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
