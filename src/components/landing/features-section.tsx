'use client'

import { motion } from 'framer-motion'
import { Layers, Link2, Users } from 'lucide-react'

const GROWTH_FEATURES = [
  {
    icon: Layers,
    focus: 'Beyond Templates',
    title: 'Flexible Database',
    description: 'Most CRMs force you into their template. Our database grows with you — add fields, customize stages, track what matters to your business.',
  },
  {
    icon: Link2,
    focus: 'Meta & Web Integration',
    title: 'All Sources Connected',
    description: 'WhatsApp, Instagram, Facebook Ads, your website — all feed into your CRM database automatically.',
  },
  {
    icon: Users,
    focus: 'Scale with AI',
    title: 'Handle 10x More Leads',
    description: 'Add AI chatbots without hiring more people. Scale from 10 to 10,000+ customers seamlessly.',
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
            A Database That Grows With You
          </h2>
          <p className="mt-4 text-lg text-[#2D2A26]/70 max-w-3xl mx-auto tracking-[-0.02em]">
            Most CRMs lock you into their template. Our database is flexible — customize fields, add stages, track what matters. Build your own CRM as you grow.
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
