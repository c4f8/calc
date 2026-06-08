'use client'

import { animate, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { formatRubles } from '@/lib/calc'

export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const previous = useRef(value)
  const [displayValue, setDisplayValue] = useState(value)
  const shouldReduceMotion = useReducedMotion()
  const renderedValue = shouldReduceMotion ? value : displayValue

  useEffect(() => {
    if (shouldReduceMotion) {
      previous.current = value
      const frame = window.requestAnimationFrame(() => setDisplayValue(value))
      return () => window.cancelAnimationFrame(frame)
    }

    const controls = animate(previous.current, value, {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplayValue(latest),
    })

    previous.current = value
    return () => controls.stop()
  }, [shouldReduceMotion, value])

  return (
    <motion.span className={className} layout="position">
      {formatRubles(renderedValue)}
    </motion.span>
  )
}
