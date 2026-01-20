'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
export function CTASection() {
  return (
    <section className="py-6 bg-[#284b31]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.15 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-[-0.02em]">
            Ready to grow your business?
          </h2>

          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F7931A] text-white font-bold rounded-xl hover:bg-[#e8850f] transition-all duration-150 flex-shrink-0"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
