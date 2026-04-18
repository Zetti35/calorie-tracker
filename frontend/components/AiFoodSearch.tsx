'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Plus, Loader2, AlertCircle } from 'lucide-react'
import type { FoodItem } from '@/types'

type Props = {
  onAdd: (food: FoodItem) => void
}

export default function AiFoodSearch({ onAdd }: Props) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FoodItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [grams, setGrams] = useState(100)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function search(q: string) {
    if (q.trim().length < 2) { setResult(null); setError(null); return }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/ai/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      if (res.status === 404) { setError('Продукт не найден'); return }
      if (!res.ok) { setError('Ошибка AI'); return }
      const data = await res.json()
      setResult(data.food)
    } catch {
      setError('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  function handleInput(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 800)
  }

  function handleAdd() {
    if (!result) return
    onAdd(result)
    setQuery('')
    setResult(null)
    setGrams(100)
  }

  const preview = result ? {
    calories: Math.round(result.calories * grams / 100 * 10) / 10,
    protein: Math.round(result.protein * grams / 100 * 10) / 10,
    fat: Math.round(result.fat * grams / 100 * 10) / 10,
    carbs: Math.round(result.carbs * grams / 100 * 10) / 10,
  } : null

  return (
    <div className="bg-zinc-900/60 border border-purple-500/20 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">AI поиск продукта</p>
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          placeholder="Введите название продукта..."
          className="w-full h-12 bg-white/[0.06] border border-white/10 rounded-xl px-4 pr-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500/50 transition-colors"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 animate-spin" />
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 mt-3 text-xs text-red-400">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </motion.div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-3 space-y-3">
            <div className="bg-white/[0.04] rounded-xl p-3">
              <p className="text-sm font-semibold text-white mb-2">{result.name}</p>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <p className="text-orange-300 font-bold">{preview?.calories}</p>
                  <p className="text-white/30">ккал</p>
                </div>
                <div>
                  <p className="text-red-300 font-bold">{preview?.protein}г</p>
                  <p className="text-white/30">белки</p>
                </div>
                <div>
                  <p className="text-yellow-300 font-bold">{preview?.fat}г</p>
                  <p className="text-white/30">жиры</p>
                </div>
                <div>
                  <p className="text-green-300 font-bold">{preview?.carbs}г</p>
                  <p className="text-white/30">углев.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white/[0.06] border border-white/10 rounded-xl overflow-hidden h-10 flex-1">
                <button onClick={() => setGrams(g => Math.max(1, g - 10))}
                  className="w-10 h-full text-white/40 hover:text-white hover:bg-white/[0.08] transition-all text-lg">−</button>
                <span className="flex-1 text-center text-sm font-bold text-white">{grams}г</span>
                <button onClick={() => setGrams(g => Math.min(2000, g + 10))}
                  className="w-10 h-full text-white/40 hover:text-white hover:bg-white/[0.08] transition-all text-lg">+</button>
              </div>
              <motion.button onClick={handleAdd}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 h-10 bg-purple-500 hover:bg-purple-400 text-white text-sm font-semibold rounded-xl transition-colors">
                <Plus className="w-4 h-4" />
                Добавить
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
