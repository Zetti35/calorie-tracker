'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Clock, CreditCard, CheckCircle2 } from 'lucide-react'

type Props = {
  onAccept: () => Promise<void>
}

export default function ConsentScreen({ onAccept }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleAccept() {
    setLoading(true)
    try {
      await onAccept()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Иконка */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center">
            <Shield className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Добро пожаловать
        </h1>
        <p className="text-white/40 text-sm text-center mb-8">
          Калорийный трекер — твой помощник в здоровом питании
        </p>

        {/* Условия */}
        <div className="bg-zinc-900/80 border border-zinc-700/60 rounded-2xl p-5 mb-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">3 дня бесплатно</p>
              <p className="text-xs text-white/40 mt-0.5">
                Полный доступ ко всем функциям без ограничений
              </p>
            </div>
          </div>

          <div className="h-px bg-white/[0.06]" />

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <CreditCard className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">50 рублей — навсегда</p>
              <p className="text-xs text-white/40 mt-0.5">
                После пробного периода функционал приостанавливается — разблокируй разовой оплатой
              </p>
            </div>
          </div>

          <div className="h-px bg-white/[0.06]" />

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Без подписки</p>
              <p className="text-xs text-white/40 mt-0.5">
                Платишь один раз — пользуешься всегда
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-white/25 text-center mb-5">
          3 дня — полный бесплатный доступ. После этого функционал будет приостановлен, пока не оплатишь 50 ₽ — без обязательств прямо сейчас
        </p>

        <motion.button
          onClick={handleAccept}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full h-14 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-semibold text-base rounded-2xl transition-colors shadow-lg shadow-green-500/20"
        >
          {loading ? 'Загрузка...' : 'Начать бесплатно'}
        </motion.button>
      </motion.div>
    </div>
  )
}
