'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StaffMember {
  name: string
  role: string
  department: string
  color: string
  avatar: React.ReactNode
}

// Notion-style avatar SVGs
const avatars = {
  budi: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="48" fill="white" stroke="black" strokeWidth="3"/>
      <path d="M25 35 Q25 15 50 15 Q75 15 75 35 L75 40 Q65 35 50 35 Q35 35 25 40 Z" fill="black"/>
      <ellipse cx="50" cy="55" rx="22" ry="26" fill="white" stroke="black" strokeWidth="2.5"/>
      <ellipse cx="42" cy="50" rx="3" ry="2" fill="black"/>
      <ellipse cx="58" cy="50" rx="3" ry="2" fill="black"/>
      <path d="M37 45 Q42 43 47 45" stroke="black" strokeWidth="2" fill="none"/>
      <path d="M53 45 Q58 43 63 45" stroke="black" strokeWidth="2" fill="none"/>
      <path d="M50 52 L50 58 Q48 60 50 60 Q52 60 50 58" stroke="black" strokeWidth="1.5" fill="none"/>
      <path d="M43 66 Q50 72 57 66" stroke="black" strokeWidth="2" fill="none"/>
      <path d="M35 82 L45 75 L50 80 L55 75 L65 82" stroke="black" strokeWidth="2" fill="none"/>
    </svg>
  ),
  sari: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="48" fill="white" stroke="black" strokeWidth="3"/>
      <path d="M20 45 Q15 15 50 10 Q85 15 80 45 L80 75 Q75 85 70 80 L70 50 Q70 35 50 30 Q30 35 30 50 L30 80 Q25 85 20 75 Z" fill="black"/>
      <ellipse cx="50" cy="52" rx="20" ry="24" fill="white" stroke="black" strokeWidth="2.5"/>
      <ellipse cx="43" cy="48" rx="3" ry="2.5" fill="black"/>
      <ellipse cx="57" cy="48" rx="3" ry="2.5" fill="black"/>
      <path d="M39 46 L43 44 L47 46" stroke="black" strokeWidth="1" fill="none"/>
      <path d="M53 46 L57 44 L61 46" stroke="black" strokeWidth="1" fill="none"/>
      <path d="M38 42 Q43 40 48 42" stroke="black" strokeWidth="1.5" fill="none"/>
      <path d="M52 42 Q57 40 62 42" stroke="black" strokeWidth="1.5" fill="none"/>
      <path d="M50 50 L50 56 Q48 57 50 57" stroke="black" strokeWidth="1.5" fill="none"/>
      <path d="M44 64 Q50 70 56 64" stroke="black" strokeWidth="2" fill="none"/>
    </svg>
  ),
  rian: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="48" fill="white" stroke="black" strokeWidth="3"/>
      <path d="M22 40 Q22 12 50 12 Q78 12 78 40 L78 35 Q50 30 22 35 Z" fill="black"/>
      <path d="M22 35 Q50 30 78 35" stroke="black" strokeWidth="4" fill="none"/>
      <ellipse cx="50" cy="55" rx="24" ry="28" fill="white" stroke="black" strokeWidth="2.5"/>
      <path d="M30 60 Q30 85 50 88 Q70 85 70 60 Q70 70 50 75 Q30 70 30 60" fill="black"/>
      <ellipse cx="40" cy="48" rx="3" ry="2" fill="black"/>
      <ellipse cx="60" cy="48" rx="3" ry="2" fill="black"/>
      <path d="M35 43 Q40 40 45 43" stroke="black" strokeWidth="2.5" fill="none"/>
      <path d="M55 43 Q60 40 65 43" stroke="black" strokeWidth="2.5" fill="none"/>
      <path d="M50 50 L50 56" stroke="black" strokeWidth="2" fill="none"/>
      <path d="M42 62 Q50 65 58 62" stroke="black" strokeWidth="2" fill="none"/>
    </svg>
  ),
  maya: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="48" fill="white" stroke="black" strokeWidth="3"/>
      <path d="M25 45 Q20 15 50 12 Q80 15 75 45 Q72 30 50 25 Q28 30 25 45" fill="black"/>
      <path d="M25 45 Q22 50 25 55 L30 45 Z" fill="black"/>
      <ellipse cx="50" cy="55" rx="21" ry="25" fill="white" stroke="black" strokeWidth="2.5"/>
      <ellipse cx="42" cy="52" rx="3" ry="2.5" fill="black"/>
      <ellipse cx="58" cy="52" rx="3" ry="2.5" fill="black"/>
      <path d="M37 47 Q42 45 47 47" stroke="black" strokeWidth="1.5" fill="none"/>
      <path d="M53 47 Q58 45 63 47" stroke="black" strokeWidth="1.5" fill="none"/>
      <path d="M50 54 L50 60" stroke="black" strokeWidth="1.5" fill="none"/>
      <path d="M43 68 Q50 73 57 68" stroke="black" strokeWidth="2" fill="none"/>
      <circle cx="28" cy="55" r="2" fill="black"/>
      <circle cx="72" cy="55" r="2" fill="black"/>
    </svg>
  ),
  dewi: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="48" fill="white" stroke="black" strokeWidth="3"/>
      <path d="M20 45 Q15 25 50 20 Q85 25 80 45 L80 80 Q70 90 50 90 Q30 90 20 80 Z" fill="black"/>
      <ellipse cx="50" cy="52" rx="18" ry="22" fill="white" stroke="black" strokeWidth="2"/>
      <ellipse cx="43" cy="50" rx="3" ry="2.5" fill="black"/>
      <ellipse cx="57" cy="50" rx="3" ry="2.5" fill="black"/>
      <path d="M38 45 Q43 43 48 45" stroke="black" strokeWidth="1.5" fill="none"/>
      <path d="M52 45 Q57 43 62 45" stroke="black" strokeWidth="1.5" fill="none"/>
      <path d="M50 52 L50 57" stroke="black" strokeWidth="1.5" fill="none"/>
      <path d="M44 63 Q50 68 56 63" stroke="black" strokeWidth="2" fill="none"/>
    </svg>
  ),
  adi: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="48" fill="white" stroke="black" strokeWidth="3"/>
      <path d="M28 42 Q20 20 50 15 Q80 20 72 42 Q70 30 50 28 Q30 30 28 42" fill="black"/>
      <ellipse cx="50" cy="55" rx="22" ry="26" fill="white" stroke="black" strokeWidth="2.5"/>
      <ellipse cx="42" cy="50" rx="3" ry="2.5" fill="black"/>
      <ellipse cx="58" cy="50" rx="3" ry="2.5" fill="black"/>
      <path d="M36 44 Q42 42 48 45" stroke="black" strokeWidth="2" fill="none"/>
      <path d="M52 45 Q58 42 64 44" stroke="black" strokeWidth="2" fill="none"/>
      <path d="M50 52 L50 58 Q48 60 50 60" stroke="black" strokeWidth="1.5" fill="none"/>
      <path d="M40 65 Q50 74 60 65" stroke="black" strokeWidth="2" fill="none"/>
      <path d="M30 85 Q40 78 50 82 Q60 78 70 85" fill="black"/>
    </svg>
  ),
  fajar: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="48" fill="white" stroke="black" strokeWidth="3"/>
      <path d="M28 38 Q25 15 50 12 Q75 15 72 38 Q70 25 50 22 Q30 25 28 38" fill="black"/>
      <ellipse cx="50" cy="52" rx="20" ry="24" fill="white" stroke="black" strokeWidth="2.5"/>
      <ellipse cx="43" cy="48" rx="2.5" ry="2" fill="black"/>
      <ellipse cx="57" cy="48" rx="2.5" ry="2" fill="black"/>
      <path d="M38 43 Q43 41 48 44" stroke="black" strokeWidth="2" fill="none"/>
      <path d="M52 44 Q57 41 62 43" stroke="black" strokeWidth="2" fill="none"/>
      <path d="M50 50 L50 56" stroke="black" strokeWidth="1.5" fill="none"/>
      <path d="M44 64 L56 64" stroke="black" strokeWidth="2" fill="none"/>
      <path d="M25 95 L35 78 L50 85 L65 78 L75 95" fill="black"/>
      <path d="M47 78 L50 95 L53 78 Z" fill="white" stroke="black" strokeWidth="1"/>
      <path d="M40 78 L50 72 L60 78" stroke="black" strokeWidth="2" fill="none"/>
    </svg>
  ),
  putri: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="48" fill="white" stroke="black" strokeWidth="3"/>
      <path d="M28 42 Q22 15 50 12 Q78 15 72 42 Q70 28 50 25 Q30 28 28 42" fill="black"/>
      <path d="M70 30 Q85 25 88 40 Q90 55 80 60" stroke="black" strokeWidth="6" fill="none"/>
      <ellipse cx="50" cy="55" rx="21" ry="25" fill="white" stroke="black" strokeWidth="2.5"/>
      <ellipse cx="42" cy="52" rx="3" ry="2.5" fill="black"/>
      <ellipse cx="58" cy="52" rx="3" ry="2.5" fill="black"/>
      <path d="M37 47 Q42 45 47 48" stroke="black" strokeWidth="1.5" fill="none"/>
      <path d="M53 48 Q58 45 63 47" stroke="black" strokeWidth="1.5" fill="none"/>
      <path d="M50 54 L50 59" stroke="black" strokeWidth="1.5" fill="none"/>
      <path d="M44 67 Q50 72 56 67" stroke="black" strokeWidth="2" fill="none"/>
    </svg>
  ),
}

const staffMembers: StaffMember[] = [
  { name: 'Budi', role: 'Pembukuan', department: 'Akuntansi', color: '#E85D4C', avatar: avatars.budi },
  { name: 'Sari', role: 'Laporan Keuangan', department: 'Akuntansi', color: '#E85D4C', avatar: avatars.sari },
  { name: 'Rian', role: 'Content Marketing', department: 'Marketing', color: '#3B82F6', avatar: avatars.rian },
  { name: 'Maya', role: 'Ads Manager', department: 'Marketing', color: '#3B82F6', avatar: avatars.maya },
  { name: 'Dewi', role: 'Customer Support', department: 'Pelayanan', color: '#10B981', avatar: avatars.dewi },
  { name: 'Adi', role: 'Sales Follow-up', department: 'Pelayanan', color: '#10B981', avatar: avatars.adi },
  { name: 'Fajar', role: 'Bantuan Produk', department: 'Teknis', color: '#1F2937', avatar: avatars.fajar },
  { name: 'Putri', role: 'Integrasi', department: 'Teknis', color: '#1F2937', avatar: avatars.putri },
]

// Wave animation for card background
function CardWave({ color }: { color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let time = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    resize()

    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      ctx.clearRect(0, 0, width, height)

      const lineCount = 8
      const lineSpacing = width / (lineCount + 1)

      for (let i = 0; i < lineCount; i++) {
        const x = lineSpacing * (i + 1)

        ctx.beginPath()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
        ctx.lineWidth = 1.5
        ctx.lineCap = 'round'

        for (let y = 0; y <= height; y += 2) {
          const wave1 = Math.sin((y * 0.03) + time + (i * 0.4)) * 5
          const wave2 = Math.sin((y * 0.02) + time * 1.3 + (i * 0.3)) * 3

          const offsetX = wave1 + wave2

          if (y === 0) {
            ctx.moveTo(x + offsetX, y)
          } else {
            ctx.lineTo(x + offsetX, y)
          }
        }

        ctx.stroke()
      }

      time += 0.025
      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [color])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

export function StaffDeck() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % staffMembers.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Get indices for the deck stack (current and next 2)
  const getStackIndices = () => {
    const indices = []
    for (let i = 0; i < 4; i++) {
      indices.push((currentIndex + i) % staffMembers.length)
    }
    return indices
  }

  const stackIndices = getStackIndices()

  return (
    <div className="relative w-[280px] h-[380px] mx-auto">
      {/* Background cards (stack effect) */}
      {stackIndices.slice(1, 4).reverse().map((staffIndex, i) => {
        const staff = staffMembers[staffIndex]
        const reverseI = 2 - i // 2, 1, 0

        return (
          <motion.div
            key={`bg-${staffIndex}-${i}`}
            className="absolute inset-0 rounded-2xl shadow-lg overflow-hidden"
            style={{
              backgroundColor: staff.color,
              zIndex: reverseI,
            }}
            initial={false}
            animate={{
              x: (reverseI + 1) * 12,
              y: (reverseI + 1) * -8,
              scale: 1 - (reverseI + 1) * 0.05,
              opacity: 1 - (reverseI + 1) * 0.2,
              rotateZ: (reverseI + 1) * 2,
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        )
      })}

      {/* Front card (animated) */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentIndex}
          className="absolute inset-0 rounded-2xl shadow-2xl overflow-hidden"
          style={{ backgroundColor: staffMembers[currentIndex].color, zIndex: 10 }}
          initial={{
            x: 0,
            y: 0,
            scale: 0.9,
            opacity: 0,
            rotateZ: -5,
          }}
          animate={{
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
            rotateZ: 0,
          }}
          exit={{
            x: -300,
            y: -50,
            scale: 0.8,
            opacity: 0,
            rotateZ: -15,
          }}
          transition={{
            duration: 0.5,
            ease: [0.32, 0.72, 0, 1],
          }}
        >
          <CardWave color={staffMembers[currentIndex].color} />

          <div className="relative z-10 h-full flex flex-col p-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-xl bg-white shadow-lg overflow-hidden">
              {staffMembers[currentIndex].avatar}
            </div>

            {/* Info */}
            <div className="mt-auto">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">
                {staffMembers[currentIndex].department}
              </div>
              <h4 className="text-2xl font-bold text-white mb-1">
                {staffMembers[currentIndex].role}
              </h4>
              <p className="text-sm text-white/80">
                {staffMembers[currentIndex].name}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
        {staffMembers.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentIndex
                ? 'bg-white scale-125'
                : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
