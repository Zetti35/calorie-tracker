'use client'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'

type Props = {
  remainingHours: number
  onPayClick: () => void
}

export default function TrialBanner({ remainingHours, onPayClick }: Props) {
  const days = Math.floor(remainingHours / 24)
  const hours = remainingHours % 24

  const timeText = days > 0
    ? `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'} ${hours > 0 ? `${hours} ч` : ''}`
    : `${hours} ч`

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-3 mb-0 bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-blue-400 shrink-0" />
        <p className="text-xs text-blue-300">
          Пробный период: осталось <span className="font-semibold">{timeText}</span>
        </p>
      </div>
      <button
        onClick={onPayClick}
        className="text-xs font-semibold text-blue-400 hover:text-blue-300 shrink-0 transition-colors"
      >
        50 ₽ навсегда →
      </button>
    </motion.div>
  )
}
