'use client'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Droplets, Flame } from 'lucide-react'
import { useAppStore } from '@/lib/store'

function toDateStr(d: Date) { return d.toISOString().slice(0, 10) }

function getLast(n: number): string[] {
  return Array.from({ length: n }, (_, i) =>
    toDateStr(new Date(Date.now() - (n - 1 - i) * 86400000))
  )
}

import type { DiaryEntry } from '@/types'

function calcDayMacros(entries: DiaryEntry[], dateStr: string) {
  const dayEntries = entries.filter((e: DiaryEntry) => e.timestamp.slice(0, 10) === dateStr)
  return dayEntries.reduce((acc: { calories: number; protein: number; fat: number; carbs: number }, e: DiaryEntry) => {
    const f = e.grams / 100
    return {
      calories: acc.calories + e.food.calories * f,
      protein:  acc.protein  + e.food.protein  * f,
      fat:      acc.fat      + e.food.fat      * f,
      carbs:    acc.carbs    + e.food.carbs    * f,
    }
  }, { calories: 0, protein: 0, fat: 0, carbs: 0 })
}

type LineChartProps = {
  data: number[]
  labels: string[]
  color: string
  target?: number
  unit: string
  height?: number
}

function LineChart({ data, labels, color, target, unit, height = 120 }: LineChartProps) {
  const max = Math.max(...data, target ?? 0, 1)
  const min = 0
  const range = max - min
  const w = 600
  const h = height
  const pad = { top: 10, right: 10, bottom: 24, left: 40 }
  const chartW = w - pad.left - pad.right
  const chartH = h - pad.top - pad.bottom
  const n = data.length

  const points = data.map((v, i) => ({
    x: pad.left + (i / (n - 1)) * chartW,
    y: pad.top + chartH - ((v - min) / range) * chartH,
    v,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${points[n-1].x} ${pad.top + chartH} L ${points[0].x} ${pad.top + chartH} Z`

  const targetY = target ? pad.top + chartH - ((target - min) / range) * chartH : null

  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ minWidth: 280 }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = pad.top + chartH * (1 - t)
          const val = Math.round(min + range * t)
          return (
            <g key={t}>
              <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)">{val}</text>
            </g>
          )
        })}

        {/* Target line */}
        {targetY && (
          <line x1={pad.left} y1={targetY} x2={w - pad.right} y2={targetY}
            stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 3" />
        )}

        {/* Area */}
        <path d={areaD} fill={`${color}18`} />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={hovered === i ? 5 : 3}
            fill={color} opacity={data[i] > 0 ? 1 : 0.2}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer' }}
          />
        ))}

        {/* X labels */}
        {labels.map((l, i) => {
          if (n > 14 && i % 3 !== 0) return null
          const x = pad.left + (i / (n - 1)) * chartW
          return (
            <text key={i} x={x} y={h - 4} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.3)">{l}</text>
          )
        })}
      </svg>

      {/* HTML tooltip — positioned absolutely over the chart */}
      {hovered !== null && (() => {
        const p = points[hovered]
        const pctX = (p.x / w) * 100
        const pctY = ((p.y - pad.top) / (h - pad.top - pad.bottom)) * 100
        const alignRight = pctX > 70
        return (
          <div
            className="absolute pointer-events-none z-10 px-2.5 py-1.5 rounded-xl bg-zinc-900/95 border border-white/15 text-xs text-white whitespace-nowrap shadow-xl"
            style={{
              left: alignRight ? 'auto' : `calc(${pctX}% + 8px)`,
              right: alignRight ? `calc(${100 - pctX}% + 8px)` : 'auto',
              top: `calc(${Math.max(pctY, 5)}% - 12px)`,
            }}
          >
            <span style={{ color }}>{Math.round(data[hovered])} {unit}</span>
            <span className="text-white/40 ml-1">· {labels[hovered]}</span>
          </div>
        )
      })()}
    </div>
  )
}

const PERIODS = [
  { label: '7 дней', days: 7 },
  { label: '14 дней', days: 14 },
  { label: '30 дней', days: 30 },
]

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function ProgressPage() {
  const { entries, water, nutritionPlan } = useAppStore()
  const [period, setPeriod] = useState(7)

  const dates = useMemo(() => getLast(period), [period])

  const shortLabel = (d: string) => {
    const date = new Date(d)
    return `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  const caloriesData = useMemo(() => dates.map(d => Math.round(calcDayMacros(entries, d).calories)), [dates, entries])
  const proteinData  = useMemo(() => dates.map(d => Math.round(calcDayMacros(entries, d).protein)),  [dates, entries])
  const fatData      = useMemo(() => dates.map(d => Math.round(calcDayMacros(entries, d).fat)),      [dates, entries])
  const carbsData    = useMemo(() => dates.map(d => Math.round(calcDayMacros(entries, d).carbs)),    [dates, entries])
  const waterData    = useMemo(() => dates.map(d => water[d] ?? 0), [dates, water])

  const labels = dates.map(shortLabel)

  const avgCalories = Math.round(caloriesData.filter(v => v > 0).reduce((a, b) => a + b, 0) / (caloriesData.filter(v => v > 0).length || 1))
  const avgWater    = Math.round(waterData.filter(v => v > 0).reduce((a, b) => a + b, 0) / (waterData.filter(v => v > 0).length || 1))
  const daysLogged  = caloriesData.filter(v => v > 0).length

  const hasData = daysLogged > 0

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="px-4 sm:px-8 py-8 sm:py-10 max-w-4xl">

      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-green-500/15 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Прогресс</h1>
          <p className="text-sm text-white/40">Графики питания и воды</p>
        </div>
      </div>

      <div className="h-px bg-white/[0.06] my-8" />

      {/* Period selector */}
      <div className="flex gap-2 mb-8">
        {PERIODS.map(p => (
          <motion.button key={p.days} onClick={() => setPeriod(p.days)}
            whileTap={{ scale: 0.95 }}
            className={['px-4 py-2 rounded-xl border text-sm font-medium transition-all',
              period === p.days
                ? 'bg-green-500/20 border-green-500/40 text-green-400'
                : 'bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'
            ].join(' ')}>
            {p.label}
          </motion.button>
        ))}
      </div>

      {!hasData ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center text-white/25 text-sm">
          Нет данных за выбранный период. Начни вести дневник питания — и здесь появятся графики.
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Среднее ккал/день', value: avgCalories, unit: 'ккал', color: 'text-orange-300', grad: 'from-orange-500/20 to-orange-900/10', border: 'border-orange-500/20', icon: Flame },
              { label: 'Дней с записями', value: daysLogged, unit: `из ${period}`, color: 'text-green-300', grad: 'from-green-500/20 to-green-900/10', border: 'border-green-500/20', icon: TrendingUp },
              { label: 'Средняя вода/день', value: avgWater, unit: 'мл', color: 'text-blue-300', grad: 'from-blue-500/20 to-blue-900/10', border: 'border-blue-500/20', icon: Droplets },
            ].map(s => (
              <motion.div key={s.label} variants={fadeUp} whileHover={{ scale: 1.03, y: -3 }}
                className={`bg-gradient-to-br ${s.grad} border ${s.border} rounded-2xl p-4 text-center hover:shadow-xl hover:shadow-black/40 transition-shadow`}>
                <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-2 opacity-70`} />
                <p className={`text-3xl font-black ${s.color} leading-none mb-1`}>{s.value}</p>
                <p className="text-[10px] text-white/35 uppercase tracking-wider">{s.unit}</p>
                <p className="text-[10px] text-white/25 mt-1">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Charts */}
          <div className="space-y-6">
            {/* Calories */}
            <motion.div variants={fadeUp} initial="hidden" animate="show"
              className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <p className="text-sm font-semibold text-white">Калории</p>
                </div>
                {nutritionPlan && <span className="text-xs text-white/30">Норма: {nutritionPlan.calories} ккал</span>}
              </div>
              <LineChart data={caloriesData} labels={labels} color="#fb923c" target={nutritionPlan?.calories} unit="ккал" />
            </motion.div>

            {/* Macros */}
            <motion.div variants={fadeUp} initial="hidden" animate="show"
              className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5">
              <p className="text-sm font-semibold text-white mb-4">БЖУ</p>
              <div className="space-y-5">
                {[
                  { label: 'Белки', data: proteinData, color: '#f87171', unit: 'г', target: nutritionPlan ? Math.round((nutritionPlan.calories * 0.30) / 4) : undefined },
                  { label: 'Жиры', data: fatData, color: '#fbbf24', unit: 'г', target: nutritionPlan ? Math.round((nutritionPlan.calories * 0.25) / 9) : undefined },
                  { label: 'Углеводы', data: carbsData, color: '#34d399', unit: 'г', target: nutritionPlan ? Math.round((nutritionPlan.calories * 0.45) / 4) : undefined },
                ].map(m => (
                  <div key={m.label}>
                    <p className="text-xs text-white/40 mb-2">{m.label}</p>
                    <LineChart data={m.data} labels={labels} color={m.color} target={m.target} unit={m.unit} height={80} />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Water */}
            <motion.div variants={fadeUp} initial="hidden" animate="show"
              className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  <p className="text-sm font-semibold text-white">Вода</p>
                </div>
                <span className="text-xs text-white/30">Норма: 2000 мл</span>
              </div>
              <LineChart data={waterData} labels={labels} color="#60a5fa" target={2000} unit="мл" />
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  )
}
