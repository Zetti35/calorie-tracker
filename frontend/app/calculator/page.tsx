'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, ChevronDown, ArrowRight, History, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { calculateNutrition, ACTIVITY_LABELS, GOAL_LABELS } from '@/lib/calculator'
import type { UserProfile } from '@/types'

const GENDER_LABELS = { male: 'Мужской', female: 'Женский' } as const

function Stepper({ label, value, unit, min, max, step = 1, onChange }: {
  label: string; value: number; unit: string
  min: number; max: number; step?: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <p className="text-sm font-medium text-white/60 mb-3">{label}</p>
      <div className="flex items-center bg-white/[0.06] border border-white/10 rounded-2xl overflow-hidden h-16">
        <motion.button type="button" whileTap={{ scale: 0.85 }}
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-16 h-full text-3xl font-thin text-white/40 hover:text-white hover:bg-white/[0.08] transition-all select-none flex items-center justify-center">
          −
        </motion.button>
        <div className="flex-1 text-center">
          <span className="text-2xl font-bold text-white">{value}</span>
          <span className="text-sm text-white/40 ml-1.5">{unit}</span>
        </div>
        <motion.button type="button" whileTap={{ scale: 0.85 }}
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-16 h-full text-3xl font-thin text-white/40 hover:text-white hover:bg-white/[0.08] transition-all select-none flex items-center justify-center">
          +
        </motion.button>
      </div>
    </div>
  )
}

function StyledSelect<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: Record<T, string>; onChange: (v: T) => void
}) {
  return (
    <div>
      <p className="text-sm font-medium text-white/60 mb-3">{label}</p>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value as T)}
          className="w-full h-16 appearance-none bg-white/[0.06] border border-white/10 rounded-2xl px-5 text-sm font-medium text-white outline-none focus:border-blue-500/50 transition-colors cursor-pointer pr-12">
          {(Object.entries(options) as [T, string][]).map(([k, v]) => (
            <option key={k} value={k} className="bg-zinc-900 text-white">{v}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
      </div>
    </div>
  )
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function CalculatorPage() {
  const router = useRouter()
  const { setNutritionPlan, nutritionPlan, userProfile, calcHistory, clearCalcHistory } = useAppStore()

  const [gender, setGender]     = useState<'male' | 'female'>(userProfile?.gender ?? 'male')
  const [age, setAge]           = useState(userProfile?.age ?? 25)
  const [weight, setWeight]     = useState(userProfile?.weight ?? 75)
  const [height, setHeight]     = useState(userProfile?.height ?? 175)
  const [activity, setActivity] = useState<keyof typeof ACTIVITY_LABELS>(userProfile?.activity ?? 'moderate')
  const [goal, setGoal]         = useState<'loss' | 'maintain' | 'gain'>(userProfile?.goal ?? 'maintain')

  useEffect(() => {
    if (!userProfile) return
    setGender(userProfile.gender)
    setAge(userProfile.age)
    setWeight(userProfile.weight)
    setHeight(userProfile.height)
    setActivity(userProfile.activity)
    setGoal(userProfile.goal)
  }, [userProfile])

  function handleCalculate() {
    const profile: UserProfile = { gender, age, weight, height, activity, goal }
    const plan = { ...calculateNutrition(profile), goal } as ReturnType<typeof calculateNutrition> & { goal: string }
    setNutritionPlan(plan, profile)
  }

  const macros = nutritionPlan ? [
    { label: 'Калории',  value: nutritionPlan.calories, unit: 'ккал', color: 'text-orange-300', grad: 'from-orange-500/25 to-orange-900/20', border: 'border-orange-500/25' },
    { label: 'Белки',    value: nutritionPlan.protein,  unit: 'г',    color: 'text-red-300',    grad: 'from-red-500/25 to-red-900/20',       border: 'border-red-500/25',    pct: '30%' },
    { label: 'Жиры',     value: nutritionPlan.fat,      unit: 'г',    color: 'text-yellow-300', grad: 'from-yellow-500/25 to-yellow-900/20', border: 'border-yellow-500/25', pct: '25%' },
    { label: 'Углеводы', value: nutritionPlan.carbs,    unit: 'г',    color: 'text-green-300',  grad: 'from-green-500/25 to-green-900/20',   border: 'border-green-500/25',  pct: '45%' },
  ] : []

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }} className="px-4 sm:px-10 py-8 sm:py-12 max-w-3xl">

      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center">
          <Calculator className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Калькулятор КБЖУ</h1>
          <p className="text-sm text-white/40">Формула Mifflin-St Jeor</p>
        </div>
      </div>

      <div className="h-px bg-white/[0.06] my-8" />

      {/* Form */}
      <div className="space-y-7 mb-10">
        {/* Gender */}
        <div>
          <p className="text-sm font-medium text-white/60 mb-3">Пол</p>
          <div className="flex gap-3">
            {(['male', 'female'] as const).map(g => (
              <motion.button key={g} type="button" onClick={() => setGender(g)}
                whileTap={{ scale: 0.97 }}
                className={`flex-1 h-16 rounded-2xl text-base font-semibold transition-all ${
                  gender === g
                    ? 'bg-blue-500/20 border-2 border-blue-500/60 text-blue-200 shadow-lg shadow-blue-500/10'
                    : 'bg-white/[0.04] border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/[0.07]'
                }`}>
                {GENDER_LABELS[g]}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Steppers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stepper label="Возраст" value={age}    unit="лет" min={10}  max={120} onChange={setAge} />
          <Stepper label="Вес"     value={weight} unit="кг"  min={20}  max={300} onChange={setWeight} />
          <Stepper label="Рост"    value={height} unit="см"  min={100} max={250} onChange={setHeight} />
        </div>

        {/* Selects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StyledSelect label="Уровень активности" value={activity} options={ACTIVITY_LABELS} onChange={setActivity} />
          <StyledSelect label="Цель"               value={goal}     options={GOAL_LABELS}     onChange={setGoal} />
        </div>

        {/* Calculate */}
        <motion.button onClick={handleCalculate}
          whileHover={{ scale: 1.01, boxShadow: '0 0 40px rgba(59,130,246,0.3)' }}
          whileTap={{ scale: 0.98 }}
          className="w-full h-16 bg-blue-500 hover:bg-blue-400 text-white font-bold text-base rounded-2xl transition-colors shadow-xl shadow-blue-500/25">
          Рассчитать норму КБЖУ
        </motion.button>
      </div>

      {/* Calc history */}
      {calcHistory.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-white/40" />
              <p className="text-sm text-white/40">История расчётов</p>
            </div>
            <button onClick={clearCalcHistory} className="flex items-center gap-1 text-xs text-white/25 hover:text-red-400 transition-colors">
              <Trash2 className="w-3 h-3" />
              Очистить
            </button>
          </div>
          <div className="space-y-2">
            {calcHistory.map((h, i) => (
              <motion.button key={i}
                onClick={() => {
                  setGender(h.profile.gender)
                  setAge(h.profile.age)
                  setWeight(h.profile.weight)
                  setHeight(h.profile.height)
                  setActivity(h.profile.activity as keyof typeof ACTIVITY_LABELS)
                  setGoal(h.profile.goal)
                  setNutritionPlan(h.plan, h.profile)
                }}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all text-left">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {GENDER_LABELS[h.profile.gender]}, {h.profile.age} лет · {h.profile.weight} кг · {h.profile.height} см
                    </p>
                    <p className="text-xs text-white/35 mt-0.5">
                      {GOAL_LABELS[h.profile.goal as keyof typeof GOAL_LABELS]} · {h.date}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-base font-bold text-orange-300">{h.plan.calories} ккал</p>
                  <p className="text-xs text-white/30">
                    <span className="text-red-300">{h.plan.protein}г</span>
                    <span className="text-white/20"> / </span>
                    <span className="text-yellow-300">{h.plan.fat}г</span>
                    <span className="text-white/20"> / </span>
                    <span className="text-green-300">{h.plan.carbs}г</span>
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {nutritionPlan && (
          <motion.div variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }}>

            {/* BMR / TDEE / Goal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              {[
                { label: 'BMR',           sub: 'Базовый обмен',      value: nutritionPlan.bmr },
                { label: 'TDEE',          sub: 'С учётом активности', value: nutritionPlan.tdee },
                { label: 'Норма по цели', sub: GOAL_LABELS[nutritionPlan.goal as keyof typeof GOAL_LABELS] ?? '', value: nutritionPlan.calories },
              ].map(m => (
                <motion.div key={m.label} variants={fadeUp}
                  whileHover={{ scale: 1.02, y: -3 }}
                  className="bg-zinc-900/80 backdrop-blur-md border border-zinc-700/60 rounded-2xl p-7 text-center hover:shadow-2xl hover:shadow-black/50 transition-shadow">
                  <p className="text-xs font-semibold text-white/40 mb-4 uppercase tracking-widest">{m.label}</p>
                  <p className="text-6xl font-black text-white leading-none mb-3">{m.value}</p>
                  <p className="text-xs text-white/30">{m.sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Macros */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {macros.map(m => (
                <motion.div key={m.label} variants={fadeUp}
                  whileHover={{ scale: 1.03, y: -4 }}
                  className={`bg-gradient-to-br ${m.grad} backdrop-blur-md border ${m.border} rounded-2xl p-5 text-center hover:shadow-2xl hover:shadow-black/50 transition-shadow`}>
                  <p className="text-xs font-semibold text-white/50 mb-4 uppercase tracking-widest">{m.label}</p>
                  <p className={`text-5xl font-black ${m.color} leading-none mb-3`}>{m.value}</p>
                  <p className="text-xs text-white/40">{m.unit}{'pct' in m && m.pct ? ` · ${m.pct}` : ''}</p>
                </motion.div>
              ))}
            </div>

            {/* Save button */}
            <motion.div variants={fadeUp}>
              <motion.button onClick={() => router.push('/diary')}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="w-full h-16 flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600/30 to-blue-500/20 hover:from-blue-600/40 hover:to-blue-500/30 border border-blue-500/40 text-blue-200 font-semibold text-base rounded-2xl transition-all shadow-lg shadow-blue-500/10">
                Сохранить норму и перейти в Дневник питания
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
