'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface StaffMember {
  name: string
  role: string
  department: string
  color: string
  avatar: string // Now a path to image
}

// Staff members with image paths
const staffMembers: StaffMember[] = [
  { name: 'Budi', role: 'Pembukuan', department: 'Akuntansi', color: '#E85D4C', avatar: '/assets/avatars/avatar-budi.jpg' },
  { name: 'Sari', role: 'Laporan Keuangan', department: 'Akuntansi', color: '#E85D4C', avatar: '/assets/avatars/avatar-sari.jpg' },
  { name: 'Rian', role: 'Content Marketing', department: 'Marketing', color: '#3B82F6', avatar: '/assets/avatars/avatar-rian.jpg' },
  { name: 'Maya', role: 'Ads Manager', department: 'Marketing', color: '#3B82F6', avatar: '/assets/avatars/avatar-maya.jpg' },
  { name: 'Dewi', role: 'Customer Support', department: 'Pelayanan', color: '#10B981', avatar: '/assets/avatars/avatar-dewi.jpg' },
  { name: 'Adi', role: 'Sales Follow-up', department: 'Pelayanan', color: '#10B981', avatar: '/assets/avatars/avatar-adi.jpg' },
  { name: 'Fajar', role: 'Bantuan Produk', department: 'Teknis', color: '#1F2937', avatar: '/assets/avatars/avatar-fajar.jpg' },
  { name: 'Putri', role: 'Integrasi', department: 'Teknis', color: '#1F2937', avatar: '/assets/avatars/avatar-putri.jpg' },
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
    <div className="relative w-[200px] h-[280px] mx-auto">
      {/* Background cards (stack effect) - Badge style */}
      {stackIndices.slice(1, 4).reverse().map((staffIndex, i) => {
        const staff = staffMembers[staffIndex]
        const reverseI = 2 - i // 2, 1, 0

        return (
          <motion.div
            key={`bg-${staffIndex}-${i}`}
            className="absolute inset-0 rounded-xl shadow-lg overflow-hidden bg-white border border-gray-200"
            style={{
              zIndex: reverseI,
            }}
            initial={false}
            animate={{
              x: (reverseI + 1) * 10,
              y: (reverseI + 1) * -6,
              scale: 1 - (reverseI + 1) * 0.05,
              opacity: 1 - (reverseI + 1) * 0.2,
              rotateZ: (reverseI + 1) * 2,
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Top colored accent bar */}
            <div
              className="h-2 w-full"
              style={{ backgroundColor: staff.color }}
            />
          </motion.div>
        )
      })}

      {/* Front card (animated) - Employee Badge Style */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentIndex}
          className="absolute inset-0 rounded-xl shadow-2xl overflow-hidden bg-white border border-gray-200"
          style={{ zIndex: 10 }}
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
          {/* Top colored accent bar */}
          <div
            className="h-2 w-full"
            style={{ backgroundColor: staffMembers[currentIndex].color }}
          />

          <div className="relative z-10 h-full flex flex-col items-center pt-3 pb-4 px-4">
            {/* Company Brand */}
            <div className="text-center mb-3">
              <span className="text-xs font-black text-gray-400 tracking-wide">my<span className="text-[#F7931A]">21</span>staff</span>
            </div>

            {/* Avatar - centered, ID badge style */}
            <div className="w-24 h-24 rounded-full bg-white border-3 border-gray-200 shadow-md overflow-hidden">
              <Image
                src={staffMembers[currentIndex].avatar}
                alt={staffMembers[currentIndex].name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Name & Role - centered */}
            <div className="mt-3 text-center">
              <h4 className="text-lg font-bold text-gray-900 tracking-tight">
                {staffMembers[currentIndex].name}
              </h4>
              <p className="text-sm text-gray-600 mt-0.5">
                {staffMembers[currentIndex].role}
              </p>
            </div>

            {/* Department badge at bottom */}
            <div className="mt-auto">
              <div
                className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: staffMembers[currentIndex].color }}
              >
                {staffMembers[currentIndex].department}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
