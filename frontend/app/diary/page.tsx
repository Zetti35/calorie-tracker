'use client'
import { useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Search, Plus, Trash2, X, ChevronLeft, ChevronRight, CalendarDays, Droplets, Star, Clock, Globe, Loader2, ScanLine } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { FoodItem, DiaryEntry } from '@/types'
import foodsData from '@/data/foods.json'
import dynamic from 'next/dynamic'

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false })

const foods = foodsData as FoodItem[]

// Open Food Facts API search
async function searchOpenFoodFacts(query: string): Promise<FoodItem[]> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&fields=product_name,nutriments,brands`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return []
    const data = await res.json()
    return (data.products ?? [])
      .filter((p: Record<string, unknown>) => {
        const n = p.nutriments as Record<string, number> | undefined
        return p.product_name && n?.['energy-kcal_100g'] != null
      })
      .map((p: Record<string, unknown>) => {
        const n = p.nutriments as Record<string, number>
        const brand = p.brands ? ` (${String(p.brands).split(',')[0].trim()})` : ''
        return {
          name: `${p.product_name}${brand}`,
          calories: Math.round(n['energy-kcal_100g'] ?? 0),
          protein:  Math.round((n['proteins_100g'] ?? 0) * 10) / 10,
          fat:      Math.round((n['fat_100g'] ?? 0) * 10) / 10,
          carbs:    Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
        } as FoodItem
      })
  } catch {
    return []
  }
}

function calcMacros(food: FoodItem, grams: number) {
  const f = grams / 100
  return {
    calories: Math.round(food.calories * f * 10) / 10,
    protein:  Math.round(food.protein  * f * 10) / 10,
    fat:      Math.round(food.fat      * f * 10) / 10,
    carbs:    Math.round(food.carbs    * f * 10) / 10,
  }
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

function formatDateLabel(dateStr: string): string {
  const today = toDateStr(new Date())
  const yesterday = toDateStr(new Date(Date.now() - 86400000))
  if (dateStr === today) return 'Сегодня'
  if (dateStr === yesterday) return 'Вчера'
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

const MEAL_LABELS = [
  { label: 'Завтрак',       range: [5, 11],  color: 'text-yellow-400',  bg: 'bg-yellow-500/15', border: 'border-yellow-500/25' },
  { label: 'Обед',          range: [11, 15], color: 'text-orange-400',  bg: 'bg-orange-500/15', border: 'border-orange-500/25' },
  { label: 'Полдник',       range: [15, 18], color: 'text-green-400',   bg: 'bg-green-500/15',  border: 'border-green-500/25' },
  { label: 'Ужин',          range: [18, 22], color: 'text-blue-400',    bg: 'bg-blue-500/15',   border: 'border-blue-500/25' },
  { label: 'Поздний приём', range: [22, 5],  color: 'text-purple-400',  bg: 'bg-purple-500/15', border: 'border-purple-500/25' },
]

function getMealLabel(timestamp: string) {
  const h = new Date(timestamp).getHours()
  return MEAL_LABELS.find(m => {
    const [s, e] = m.range
    return s < e ? h >= s && h < e : h >= s || h < e
  }) ?? MEAL_LABELS[4]
}

function DonutChart({ protein, fat, carbs }: { protein: number; fat: number; carbs: number }) {
  const total = protein + fat + carbs
  if (total === 0) return null
  const r = 36, cx = 44, cy = 44, stroke = 10, circ = 2 * Math.PI * r
  const pPct = protein / total, fPct = fat / total, cPct = carbs / total
  const segments = [
    { pct: pPct, color: '#f87171', offset: 0 },
    { pct: fPct, color: '#fbbf24', offset: pPct },
    { pct: cPct, color: '#34d399', offset: pPct + fPct },
  ]
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      {segments.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
          strokeDasharray={`${s.pct * circ} ${circ}`} strokeDashoffset={-s.offset * circ}
          strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }} />
      ))}
    </svg>
  )
}

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

export default function DiaryPage() {
  const { entries, addEntry, removeEntry, clearDayEntries, nutritionPlan, water, addWater, removeWater, resetWater, favorites, toggleFavorite, recentFoods, addRecentFood } = useAppStore()

  const todayStr = toDateStr(new Date())
  const [activeDate, setActiveDate] = useState(todayStr)
  const [query, setQuery]           = useState('')
  const [selected, setSelected]     = useState<FoodItem | null>(null)
  const [grams, setGrams]           = useState(100)
  const [isFocused, setIsFocused]   = useState(false)
  const [waterAdded, setWaterAdded] = useState<Record<number, number>>({})
  const [editingGrams, setEditingGrams] = useState(false)
  const [gramsInput, setGramsInput] = useState('')
  const [apiResults, setApiResults] = useState<FoodItem[]>([])
  const [apiLoading, setApiLoading] = useState(false)
  const [apiSearched, setApiSearched] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleApiSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setApiResults([]); setApiSearched(false); return }
    setApiLoading(true)
    setApiSearched(false)
    const results = await searchOpenFoodFacts(q)
    setApiResults(results)
    setApiSearched(true)
    setApiLoading(false)
  }, []) // ml → count

  // Earliest date with entries (or 30 days назад)
  const minDate = useMemo(() => {
    const thirtyDaysAgo = toDateStr(new Date(Date.now() - 30 * 86400000))
    if (entries.length === 0) return thirtyDaysAgo
    const earliest = entries.map(e => e.timestamp.slice(0, 10)).sort()[0]
    return earliest < thirtyDaysAgo ? earliest : thirtyDaysAgo
  }, [entries])

  function shiftDate(dateStr: string, days: number): string {
    const d = new Date(dateStr)
    d.setDate(d.getDate() + days)
    return toDateStr(d)
  }

  const canGoBack = activeDate > minDate
  const canGoForward = activeDate < todayStr

  // Last 7 days tab strip
  const tabDates = useMemo(() => {
    const result: string[] = []
    for (let i = 6; i >= 0; i--) {
      result.push(toDateStr(new Date(Date.now() - i * 86400000)))
    }
    return result
  }, [])

  const dayEntries = useMemo(
    () => entries.filter(e => e.timestamp.slice(0, 10) === activeDate),
    [entries, activeDate]
  )

  const results = useMemo(() => {
    const normalize = (s: string) => s.toLowerCase().replace(/ё/g, 'е')
    const q = normalize(query.trim())
    if (!q) return foods
    const words = q.split(/\s+/).filter(Boolean)
    return foods.filter(f => words.every(w => normalize(f.name).includes(w)))
  }, [query])

  const preview = selected ? calcMacros(selected, grams) : null

  const totals = useMemo(() => dayEntries.reduce(
    (acc, e) => {
      const m = calcMacros(e.food, e.grams)
      return { calories: acc.calories + m.calories, protein: acc.protein + m.protein, fat: acc.fat + m.fat, carbs: acc.carbs + m.carbs }
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  ), [dayEntries])

  function handleAdd() {
    if (!selected || grams <= 0) return
    // Для прошлых дат ставим полдень выбранного дня, для сегодня — текущее время
    const timestamp = activeDate === todayStr
      ? new Date().toISOString()
      : new Date(`${activeDate}T12:00:00`).toISOString()
    const entry: DiaryEntry = { id: crypto.randomUUID(), food: selected, grams, timestamp }
    addEntry(entry)
    addRecentFood(selected.name)
    setQuery(''); setSelected(null); setGrams(100)
  }

  const progress = nutritionPlan ? Math.min((totals.calories / nutritionPlan.calories) * 100, 100) : null
  const macroTargets = nutritionPlan ? {
    protein: Math.round((nutritionPlan.calories * 0.30) / 4),
    fat:     Math.round((nutritionPlan.calories * 0.25) / 9),
    carbs:   Math.round((nutritionPlan.calories * 0.45) / 4),
  } : null

  // Средние показатели за последние 7 дней
  const weeklyStats = useMemo(() => {
    const days: string[] = []
    for (let i = 6; i >= 0; i--) {
      days.push(toDateStr(new Date(Date.now() - i * 86400000)))
    }
    const daysWithData = days.filter(d => entries.some(e => e.timestamp.slice(0, 10) === d))
    if (daysWithData.length === 0) return null
    const sums = daysWithData.reduce((acc, d) => {
      const dayE = entries.filter(e => e.timestamp.slice(0, 10) === d)
      const t = dayE.reduce((a, e) => {
        const m = calcMacros(e.food, e.grams)
        return { calories: a.calories + m.calories, protein: a.protein + m.protein, fat: a.fat + m.fat, carbs: a.carbs + m.carbs }
      }, { calories: 0, protein: 0, fat: 0, carbs: 0 })
      return { calories: acc.calories + t.calories, protein: acc.protein + t.protein, fat: acc.fat + t.fat, carbs: acc.carbs + t.carbs }
    }, { calories: 0, protein: 0, fat: 0, carbs: 0 })
    const n = daysWithData.length
    return {
      days: n,
      calories: Math.round(sums.calories / n),
      protein:  Math.round(sums.protein / n),
      fat:      Math.round(sums.fat / n),
      carbs:    Math.round(sums.carbs / n),
    }
  }, [entries])
  const isToday = activeDate === todayStr

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="px-4 sm:px-10 py-8 sm:py-12 max-w-4xl">

      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-green-500/15 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Дневник питания</h1>
          <p className="text-sm text-white/40">Добавляй продукты и следи за суточным КБЖУ</p>
        </div>
      </div>

      <div className="h-px bg-white/[0.06] my-8" />

      {/* Date navigator */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setActiveDate(d => shiftDate(d, -1))}
          disabled={!canGoBack}
          className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-white/40 hover:text-white/70 hover:border-white/20 disabled:opacity-25 disabled:cursor-not-allowed transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex gap-2 flex-1 overflow-x-auto scrollbar-none">
          {tabDates.map(d => {
            const count = entries.filter(e => e.timestamp.slice(0, 10) === d).length
            const isActive = d === activeDate
            return (
              <motion.button key={d} onClick={() => setActiveDate(d)}
                whileTap={{ scale: 0.95 }}
                className={['shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-green-500/20 border-green-500/40 text-green-400'
                    : 'bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'].join(' ')}>
                <CalendarDays className="w-3.5 h-3.5" />
                {formatDateLabel(d)}
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-green-500/30 text-green-300' : 'bg-white/10 text-white/30'}`}>
                    {count}
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>

        <button onClick={() => setActiveDate(d => shiftDate(d, 1))}
          disabled={!canGoForward}
          className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-white/40 hover:text-white/70 hover:border-white/20 disabled:opacity-25 disabled:cursor-not-allowed transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Add form — available for all dates */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/60 rounded-3xl p-7 mb-6">
          <p className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-5">Добавить продукт</p>

        {/* Favorites */}
        {favorites.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-white/30 mb-2">⭐ Быстрый доступ</p>
            <div className="flex flex-wrap gap-2">
              {favorites.map(name => {
                const food = foods.find(f => f.name === name)
                if (!food) return null
                return (
                  <motion.button key={name}
                    onClick={() => { setSelected(food); setQuery(food.name) }}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                    className={['px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200',
                      selected?.name === name
                        ? 'bg-green-500/20 border-green-500/40 text-green-400'
                        : 'bg-white/[0.04] border-white/10 text-white/60 hover:border-white/25 hover:text-white/80'
                    ].join(' ')}>
                    {name}
                  </motion.button>
                )
              })}
            </div>
          </div>
        )}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input type="text" value={query}
              onChange={e => {
              const val = e.target.value
              setQuery(val); setSelected(null)
              setApiResults([]); setApiSearched(false)
              if (debounceRef.current) clearTimeout(debounceRef.current)
              if (val.trim().length >= 2) {
                debounceRef.current = setTimeout(() => handleApiSearch(val), 600)
              }
            }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 150)}
              placeholder="Поиск продукта... (курица, овсянка, яйцо)"
              className="w-full h-14 bg-white/[0.06] border border-white/10 rounded-2xl pl-12 pr-24 text-sm text-white placeholder:text-white/30 outline-none focus:border-green-500/50 transition-colors" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {query && (
                <button onClick={() => { setQuery(''); setSelected(null); setApiResults([]); setApiSearched(false) }}>
                  <X className="w-4 h-4 text-white/30 hover:text-white/60" />
                </button>
              )}
              <motion.button onClick={() => setShowScanner(true)}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                title="Сканировать штрихкод"
                className="w-8 h-8 rounded-xl bg-green-500/15 border border-green-500/25 flex items-center justify-center text-green-400 hover:bg-green-500/25 transition-all">
                <ScanLine className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
          <AnimatePresence>
            {isFocused && !selected && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="bg-zinc-800/90 border border-zinc-700/60 rounded-2xl overflow-y-auto max-h-72 mb-4">
                {!query.trim() && recentFoods.length > 0 && (
                  <div className="px-5 py-2 border-b border-white/[0.06]">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Недавние</p>
                  </div>
                )}
                {(query.trim() ? results : [
                  ...recentFoods.map(n => foods.find(f => f.name === n)).filter(Boolean) as typeof foods,
                  ...foods.filter(f => !recentFoods.includes(f.name)),
                ]).map(food => (
                  <button key={food.name} onClick={() => { setSelected(food); setQuery(food.name) }}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.06] transition-colors text-left border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2">
                      {!query.trim() && recentFoods.includes(food.name) && (
                        <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border text-sky-400 bg-sky-500/15 border-sky-500/25">
                          <Clock className="w-2.5 h-2.5" />
                          недавнее
                        </span>
                      )}
                      <span className="text-sm text-white">{food.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-orange-300">{food.calories} ккал/100г</span>
                      <span onClick={e => { e.stopPropagation(); toggleFavorite(food.name) }}
                        className="transition-colors cursor-pointer hover:scale-110 active:scale-95 inline-block">
                        <Star className={`w-4 h-4 transition-colors ${favorites.includes(food.name) ? 'fill-yellow-400 text-yellow-400' : 'text-white/30 hover:text-yellow-400'}`} />
                      </span>
                    </div>
                  </button>
                ))}

                {/* API results */}
                {query.trim().length >= 2 && (
                  <>
                    {apiLoading && (
                      <div className="flex items-center gap-2 px-5 py-3 border-t border-white/[0.06]">
                        <Loader2 className="w-3.5 h-3.5 text-white/30 animate-spin" />
                        <span className="text-xs text-white/30">Ищем в мировой базе...</span>
                      </div>
                    )}
                    {!apiLoading && apiSearched && apiResults.length > 0 && (
                      <>
                        <div className="px-5 py-2 border-t border-white/[0.06] flex items-center gap-2">
                          <Globe className="w-3 h-3 text-purple-400" />
                          <p className="text-[10px] text-purple-400/70 uppercase tracking-wider">Open Food Facts</p>
                        </div>
                        {apiResults.map((food, i) => (
                          <button key={`api-${i}`} onClick={() => { setSelected(food); setQuery(food.name) }}
                            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.06] transition-colors text-left border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-2">
                              <Globe className="w-3 h-3 text-purple-400/50 shrink-0" />
                              <span className="text-sm text-white">{food.name}</span>
                            </div>
                            <span className="text-sm font-semibold text-orange-300 shrink-0 ml-3">{food.calories} ккал/100г</span>
                          </button>
                        ))}
                      </>
                    )}
                    {!apiLoading && apiSearched && apiResults.length === 0 && results.length === 0 && (
                      <div className="px-5 py-3 border-t border-white/[0.06] text-xs text-white/30">
                        Ничего не найдено
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {selected && preview && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mb-4">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Калории', value: `${preview.calories} ккал`, color: 'text-orange-300', grad: 'from-orange-500/20 to-orange-900/10', border: 'border-orange-500/20' },
                    { label: 'Белки',   value: `${preview.protein} г`,     color: 'text-red-300',    grad: 'from-red-500/20 to-red-900/10',       border: 'border-red-500/20' },
                    { label: 'Жиры',    value: `${preview.fat} г`,         color: 'text-yellow-300', grad: 'from-yellow-500/20 to-yellow-900/10', border: 'border-yellow-500/20' },
                    { label: 'Углеводы',value: `${preview.carbs} г`,       color: 'text-green-300',  grad: 'from-green-500/20 to-green-900/10',   border: 'border-green-500/20' },
                  ].map(m => (
                    <div key={m.label} className={`bg-gradient-to-br ${m.grad} backdrop-blur-md border ${m.border} rounded-xl p-3 text-center`}>
                      <p className="text-xs text-white/40 mb-1">{m.label}</p>
                      <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-white/40 mb-2">Количество (г)</p>
                    <div className="flex items-center bg-white/[0.06] border border-white/10 rounded-2xl overflow-hidden h-14">
                      <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={() => setGrams(g => Math.max(1, g - 10))}
                        className="w-14 h-full text-2xl text-white/40 hover:text-white hover:bg-white/[0.08] transition-all select-none flex items-center justify-center">−</motion.button>
                      <div className="flex-1 text-center">
                        {editingGrams ? (
                          <input
                            type="number"
                            value={gramsInput}
                            min={1}
                            max={5000}
                            autoFocus
                            onChange={e => setGramsInput(e.target.value)}
                            onBlur={() => {
                              const v = parseInt(gramsInput)
                              if (!isNaN(v) && v > 0 && v <= 5000) setGrams(v)
                              setEditingGrams(false)
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                const v = parseInt(gramsInput)
                                if (!isNaN(v) && v > 0 && v <= 5000) setGrams(v)
                                setEditingGrams(false)
                              }
                            }}
                            className="w-20 text-center text-xl font-bold text-white bg-transparent border-b border-green-500/60 outline-none"
                          />
                        ) : (
                          <span
                            onClick={() => { setGramsInput(String(grams)); setEditingGrams(true) }}
                            className="text-xl font-bold text-white cursor-text hover:text-green-400 transition-colors"
                            title="Нажми чтобы ввести вручную"
                          >
                            {grams}
                          </span>
                        )}
                        <span className="text-sm text-white/40 ml-1">г</span>
                      </div>
                      <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={() => setGrams(g => Math.min(5000, g + 10))}
                        className="w-14 h-full text-2xl text-white/40 hover:text-white hover:bg-white/[0.08] transition-all select-none flex items-center justify-center">+</motion.button>
                    </div>
                  </div>
                  <motion.button onClick={handleAdd} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="h-14 px-6 flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold text-sm rounded-2xl transition-colors shadow-lg shadow-green-500/20">
                    <Plus className="w-4 h-4" />Добавить
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      {/* Stats block */}
      {dayEntries.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/60 rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <DonutChart protein={totals.protein} fat={totals.fat} carbs={totals.carbs} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-white leading-none">{Math.round(totals.calories)}</span>
                <span className="text-[10px] text-white/35">ккал</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {[
                { label: 'Белки',    value: totals.protein, target: macroTargets?.protein, color: 'bg-red-400',    textColor: 'text-red-300' },
                { label: 'Жиры',     value: totals.fat,     target: macroTargets?.fat,     color: 'bg-yellow-400', textColor: 'text-yellow-300' },
                { label: 'Углеводы', value: totals.carbs,   target: macroTargets?.carbs,   color: 'bg-emerald-400',textColor: 'text-emerald-300' },
              ].map(m => {
                const pct = m.target ? Math.min((m.value / m.target) * 100, 100) : null
                return (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/50">{m.label}</span>
                      <span className={m.textColor}>{Math.round(m.value)}г{m.target ? ` / ${m.target}г` : ''}</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct ?? 50}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }} className={`h-full rounded-full ${m.color}`} />
                    </div>
                  </div>
                )
              })}
            </div>
            {nutritionPlan && (
              <div className="shrink-0 text-right">
                <p className="text-xs text-white/35 mb-1">Норма</p>
                <p className="text-2xl font-bold text-white">{nutritionPlan.calories}</p>
                <p className="text-xs text-white/35">ккал</p>
                <div className="mt-2 h-1.5 w-24 bg-white/[0.08] rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${progress! >= 100 ? 'bg-red-400' : 'bg-gradient-to-r from-green-400 to-emerald-500'}`} />
                </div>
                <p className="text-[10px] text-white/30 mt-1">
                  {totals.calories < (nutritionPlan?.calories ?? 0)
                    ? `−${Math.round((nutritionPlan?.calories ?? 0) - totals.calories)} ккал`
                    : `+${Math.round(totals.calories - (nutritionPlan?.calories ?? 0))} ккал`}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Water tracker */}
      {(() => {
        const waterMl = water[activeDate] ?? 0
        const goalMl = 2000
        const pct = Math.min((waterMl / goalMl) * 100, 100)
        const cups = Math.round(waterMl / 250)
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
            className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/60 rounded-3xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Вода</p>
                  <p className="text-xs text-white/35">Норма: {goalMl} мл · {goalMl / 250} стакана</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-400">{waterMl}</p>
                <p className="text-xs text-white/35">мл · {cups} ст.</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden mb-4">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full ${pct >= 100 ? 'bg-blue-300' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`} />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              {[
                { ml: 150, label: '+150мл' },
                { ml: 250, label: '+250мл' },
                { ml: 350, label: '+350мл' },
                { ml: 500, label: '+500мл' },
              ].map(({ ml, label }) => {
                const count = waterAdded[ml] ?? 0
                return (
                  <div key={ml} className="flex-1 flex flex-col gap-1.5">
                    <motion.button onClick={() => {
                        addWater(activeDate, ml)
                        setWaterAdded(prev => ({ ...prev, [ml]: (prev[ml] ?? 0) + 1 }))
                      }}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="w-full py-2.5 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 hover:border-blue-500/40 transition-all">
                      {label}
                    </motion.button>
                    <AnimatePresence>
                      {count > 0 && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.7 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          onClick={() => {
                            removeWater(activeDate, ml)
                            setWaterAdded(prev => ({ ...prev, [ml]: Math.max(0, (prev[ml] ?? 0) - 1) }))
                          }}
                          className="w-full py-1 rounded-xl text-base hover:opacity-70 transition-opacity"
                          title={`Убрать ${ml}мл`}>
                          🗑️
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
              {waterMl > 0 && (
                <motion.button onClick={() => { resetWater(activeDate); setWaterAdded({}) }}
                  whileTap={{ scale: 0.94 }}
                  className="py-2.5 px-3 rounded-xl border border-white/10 bg-white/[0.04] text-white/25 text-xs hover:text-red-400 hover:border-red-500/20 transition-all self-start">
                  ✕
                </motion.button>
              )}
            </div>

            {pct >= 100 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-xs text-blue-300 text-center mt-3">
                💧 Норма выполнена — отличная работа!
              </motion.p>
            )}
          </motion.div>
        )
      })()}

      {/* Entries */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/60 rounded-3xl overflow-hidden mb-6">
        <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.06]">
          <div>
            <h2 className="text-base font-semibold text-white">
              {formatDateLabel(activeDate)} · приёмы пищи
            </h2>
            <p className="text-xs text-white/40 mt-0.5">{dayEntries.length} записей</p>
          </div>
          {dayEntries.length > 0 && (
            <motion.button onClick={() => clearDayEntries(activeDate)} whileTap={{ scale: 0.95 }}
              className="text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-4 py-2 rounded-xl transition-all">
              Очистить день
            </motion.button>
          )}
        </div>

        {dayEntries.length === 0 ? (
          <div className="px-7 py-14 text-center text-white/30 text-sm">
            {isToday ? '📭 Дневник пуст — добавь первый продукт выше' : '📭 В этот день записей нет'}
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-6 px-7 py-3 text-xs font-semibold uppercase tracking-wider border-b border-white/[0.04]">
              <span className="col-span-2 text-white/30">Продукт</span>
              <span className="text-right text-white/30">Граммы</span>
              <span className="text-right text-orange-300/70">Ккал</span>
              <span className="text-right text-white/30">
                <span className="text-red-300/70">Б</span>
                <span className="text-white/20"> / </span>
                <span className="text-yellow-300/70">Ж</span>
                <span className="text-white/20"> / </span>
                <span className="text-green-300/70">У</span>
              </span>
              <span />
            </div>
            <AnimatePresence initial={false}>
              {dayEntries.map(entry => {
                const m = calcMacros(entry.food, entry.grams)
                const meal = getMealLabel(entry.timestamp)
                const repeatEntry = () => addEntry({ id: crypto.randomUUID(), food: entry.food, grams: entry.grams, timestamp: activeDate === todayStr ? new Date().toISOString() : new Date(`${activeDate}T12:00:00`).toISOString() })
                return (
                  <motion.div key={entry.id}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0, paddingTop: 0, paddingBottom: 0 }}
                    transition={{ duration: 0.25 }}>
                    {/* Desktop */}
                    <div className="hidden sm:grid grid-cols-6 items-center px-7 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors group">
                      <div className="col-span-2 flex items-center gap-2 pr-3 min-w-0">
                        <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${meal.color} ${meal.bg} ${meal.border}`}>{meal.label}</span>
                        <span className="text-sm font-medium text-white truncate">{entry.food.name}</span>
                      </div>
                      <span className="text-sm text-white/50 text-right">{entry.grams} г</span>
                      <span className="text-sm font-semibold text-orange-300 text-right">{m.calories}</span>
                      <span className="text-xs text-right">
                        <span className="text-red-300">{m.protein}г</span><span className="text-white/25"> / </span>
                        <span className="text-yellow-300">{m.fat}г</span><span className="text-white/25"> / </span>
                        <span className="text-green-300">{m.carbs}г</span>
                      </span>
                      <div className="flex justify-end gap-1">
                        <motion.button onClick={repeatEntry} whileTap={{ scale: 0.85 }} title="Повторить" className="p-2 rounded-xl bg-green-500/0 hover:bg-green-500/15 text-white/20 hover:text-green-400 transition-all opacity-0 group-hover:opacity-100"><Plus className="w-4 h-4" /></motion.button>
                        <motion.button onClick={() => removeEntry(entry.id)} whileTap={{ scale: 0.85 }} className="p-2 rounded-xl bg-red-500/0 hover:bg-red-500/15 text-white/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></motion.button>
                      </div>
                    </div>
                    {/* Mobile */}
                    <div className="sm:hidden px-4 py-3 border-b border-white/[0.04] last:border-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${meal.color} ${meal.bg} ${meal.border}`}>{meal.label}</span>
                          <span className="text-sm font-medium text-white truncate">{entry.food.name}</span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <motion.button onClick={repeatEntry} whileTap={{ scale: 0.85 }} className="p-1.5 rounded-lg bg-green-500/10 text-green-400"><Plus className="w-3.5 h-3.5" /></motion.button>
                          <motion.button onClick={() => removeEntry(entry.id)} whileTap={{ scale: 0.85 }} className="p-1.5 rounded-lg bg-red-500/10 text-red-400"><Trash2 className="w-3.5 h-3.5" /></motion.button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="text-white/40">{entry.grams} г</span>
                        <span className="text-orange-300 font-semibold">{m.calories} ккал</span>
                        <span className="text-red-300">Б {m.protein}г</span>
                        <span className="text-yellow-300">Ж {m.fat}г</span>
                        <span className="text-green-300">У {m.carbs}г</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Totals */}
      {dayEntries.length > 0 && (
        <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Калории',  value: Math.round(totals.calories), unit: 'ккал', color: 'text-orange-300', grad: 'from-orange-500/20 to-orange-900/10', border: 'border-orange-500/20' },
            { label: 'Белки',    value: Math.round(totals.protein),  unit: 'г',    color: 'text-red-300',    grad: 'from-red-500/20 to-red-900/10',       border: 'border-red-500/20' },
            { label: 'Жиры',     value: Math.round(totals.fat),      unit: 'г',    color: 'text-yellow-300', grad: 'from-yellow-500/20 to-yellow-900/10', border: 'border-yellow-500/20' },
            { label: 'Углеводы', value: Math.round(totals.carbs),    unit: 'г',    color: 'text-green-300',  grad: 'from-green-500/20 to-green-900/10',   border: 'border-green-500/20' },
          ].map(m => (
            <motion.div key={m.label} variants={fadeUp} whileHover={{ scale: 1.03, y: -3 }}
              className={`bg-gradient-to-br ${m.grad} backdrop-blur-md border ${m.border} rounded-2xl p-5 text-center hover:shadow-xl hover:shadow-black/40 transition-shadow`}>
              <p className="text-xs font-semibold text-white/50 mb-3 uppercase tracking-widest">{m.label}</p>
              <p className={`text-4xl font-black ${m.color} leading-none mb-2`}>{m.value}</p>
              <p className="text-xs text-white/40">{m.unit}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Weekly average */}
      {weeklyStats && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-6 bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/60 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-white">Средние показатели за неделю</p>
              <p className="text-xs text-white/35 mt-0.5">На основе {weeklyStats.days} {weeklyStats.days === 1 ? 'дня' : weeklyStats.days < 5 ? 'дней' : 'дней'} с записями</p>
            </div>
            {nutritionPlan && (
              <div className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${
                weeklyStats.calories > nutritionPlan.calories
                  ? 'text-red-400 bg-red-500/10 border-red-500/20'
                  : weeklyStats.calories >= nutritionPlan.calories * 0.9
                  ? 'text-green-400 bg-green-500/10 border-green-500/20'
                  : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
              }`}>
                {weeklyStats.calories > nutritionPlan.calories
                  ? `+${weeklyStats.calories - nutritionPlan.calories} ккал к норме`
                  : weeklyStats.calories >= nutritionPlan.calories * 0.9
                  ? 'В норме 👍'
                  : `−${nutritionPlan.calories - weeklyStats.calories} ккал от нормы`}
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Калории',  value: weeklyStats.calories, unit: 'ккал', color: 'text-orange-300', bar: 'bg-orange-400', target: nutritionPlan?.calories,  grad: 'from-orange-500/20 to-orange-900/10', border: 'border-orange-500/20' },
              { label: 'Белки',    value: weeklyStats.protein,  unit: 'г',    color: 'text-red-300',    bar: 'bg-red-400',    target: macroTargets?.protein,     grad: 'from-red-500/20 to-red-900/10',       border: 'border-red-500/20' },
              { label: 'Жиры',     value: weeklyStats.fat,      unit: 'г',    color: 'text-yellow-300', bar: 'bg-yellow-400', target: macroTargets?.fat,         grad: 'from-yellow-500/20 to-yellow-900/10', border: 'border-yellow-500/20' },
              { label: 'Углеводы', value: weeklyStats.carbs,    unit: 'г',    color: 'text-green-300',  bar: 'bg-emerald-400',target: macroTargets?.carbs,       grad: 'from-green-500/20 to-green-900/10',   border: 'border-green-500/20' },
            ].map(m => {
              const pct = m.target ? Math.min((m.value / m.target) * 100, 100) : null
              return (
                <motion.div key={m.label} variants={fadeUp} whileHover={{ scale: 1.03, y: -3 }}
                  className={`bg-gradient-to-br ${m.grad} backdrop-blur-md border ${m.border} rounded-2xl p-4 text-center hover:shadow-xl hover:shadow-black/40 transition-shadow`}>
                  <p className="text-xs font-semibold text-white/50 mb-2 uppercase tracking-widest">{m.label}</p>
                  <p className={`text-3xl font-black ${m.color} leading-none mb-1`}>{m.value}</p>
                  <p className="text-xs text-white/30 mb-3">{m.unit}/день</p>
                  {pct !== null && (
                    <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
                        className={`h-full rounded-full ${m.bar}`} />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}
      {/* Barcode scanner */}
      <AnimatePresence>
        {showScanner && (
          <BarcodeScanner
            onFound={food => {
              setSelected(food)
              setQuery(food.name)
              setShowScanner(false)
            }}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
