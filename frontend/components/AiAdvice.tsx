'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, RefreshCw } from 'lucide-react'

type Props = {
  calories: number
  protein: number
  fat: number
  carbs: number
  targetCalories?: number
  goal?: string
}

export default function AiAdvice({ calories, protein, fat, carbs, targetCalories, goal }: Props) {
  const [advice, setAdvice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function getAdvice() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calories, protein, fat, carbs, targetCalories, goal }),
      })
      if (!res.ok) {
        setAdvice('Не удалось получить совет. Попробуй позже.')
        return
      }
      const data = await res.json()
      setAdvice(data.advice || 'Нет данных.')
    } catch {
      setAdvice('Ошибка сети. Попробуй позже.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zinc-900/80 border border-zinc-700/60 rounded-3xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-sm font-semibold text-white">AI совет по питанию</p>
        </div>
        <motion.button
          onClick={getAdvice}
          disabled={loading}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-400 text-xs font-semibold hover:bg-purple-500/25 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {advice ? 'Обновить' : 'Получить совет'}
        </motion.button>
      </div>

      <AnimatePresence>
        {advice && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-white/70 leading-relaxed"
          >
            {advice}
          </motion.p>
        )}
        {!advice && !loading && (
          <p className="text-xs text-white/30">Нажми кнопку чтобы получить персональный совет на основе твоего рациона</p>
        )}
        {loading && (
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            <p className="text-xs text-white/40">AI анализирует твой рацион...</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
