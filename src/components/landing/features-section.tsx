'use client'

import { motion } from 'framer-motion'
import { Layers, Link2, Users } from 'lucide-react'

const GROWTH_FEATURES = [
  {
    icon: Layers,
    focus: 'Beyond Templates',
    title: 'Modular Foundation',
    description: 'Unlike rigid CRMs, our database is a flexible foundation designed to scale with your business complexity, not force you into a box.',
  },
  {
    icon: Link2,
    focus: 'Meta & Web Integration',
    title: 'Unified Channels',
    description: 'Every growth channel—from Meta Ads to high-converting landing pages—feeds directly into your central console. Zero chaos, total tracking.',
  },
  {
    icon: Users,
    focus: 'Digital Workforce',
    title: 'Scale via AI Staff',
    description: 'Scale your staff, not your headcount. Deploy digital agents to handle routine lead intake and 24/7 support while you stay lean.',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.15 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-[#284b31]/60 uppercase tracking-wider mb-3">
            The Growth Engine
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#284b31] tracking-[-0.02em]">
            The CRM that evolves as you do.
          </h2>
          <p className="mt-4 text-lg text-[#2D2A26]/70 max-w-3xl mx-auto tracking-[-0.02em]">
            Stop adjusting your business to fit a template. my21staff is built on an adaptive architecture that wraps around your unique workflows, ensuring your system never becomes a bottleneck for your growth.
          </p>
        </motion.div>

        {/* Adaptive Grid - 3 columns with whitespace */}
        <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
          {GROWTH_FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.15, delay: 0.05 * index }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-[#284b31] rounded-xl flex items-center justify-center mx-auto mb-5">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <span className="inline-block text-xs font-semibold text-[#F7931A] uppercase tracking-wider mb-2">
                {feature.focus}
              </span>
              <h3 className="text-xl font-bold text-[#284b31] mb-3 tracking-[-0.02em]">
                {feature.title}
              </h3>
              <p className="text-sm text-[#2D2A26]/70 leading-relaxed tracking-[-0.02em]">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
