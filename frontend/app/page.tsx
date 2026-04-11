'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Calculator, BookOpen, Dumbbell, Newspaper, Flame, TrendingUp, Droplets, CheckCircle2, Zap } from 'lucide-react'
import { useAppStore, getWeekKey } from '@/lib/store'
import { useState, useMemo } from 'react'

const CARDS = [
  { href: '/calculator', icon: Calculator, title: 'Калькулятор КБЖУ', desc: 'Рассчитай суточную норму калорий по формуле Mifflin-St Jeor', gradient: 'from-blue-500/[0.15] to-cyan-500/[0.07]', borderIdle: 'border-blue-500/20', borderHover: 'border-blue-500/50', iconColor: 'text-blue-400', iconBg: 'bg-blue-500/15', glow: 'shadow-blue-500/10' },
  { href: '/diary', icon: BookOpen, title: 'Дневник питания', desc: 'Добавляй продукты и следи за суточным потреблением КБЖУ', gradient: 'from-green-500/[0.15] to-emerald-500/[0.07]', borderIdle: 'border-green-500/20', borderHover: 'border-green-500/50', iconColor: 'text-green-400', iconBg: 'bg-green-500/15', glow: 'shadow-green-500/10' },
  { href: '/training', icon: Dumbbell, title: 'Планы тренировок', desc: 'Готовые планы на неделю для новичков, среднего и продвинутого уровня', gradient: 'from-orange-500/[0.15] to-red-500/[0.07]', borderIdle: 'border-orange-500/20', borderHover: 'border-orange-500/50', iconColor: 'text-orange-400', iconBg: 'bg-orange-500/15', glow: 'shadow-orange-500/10' },
  { href: '/news', icon: Newspaper, title: 'Новости ПП', desc: 'Советы по здоровому питанию и актуальные статьи', gradient: 'from-purple-500/[0.15] to-pink-500/[0.07]', borderIdle: 'border-purple-500/20', borderHover: 'border-purple-500/50', iconColor: 'text-purple-400', iconBg: 'bg-purple-500/15', glow: 'shadow-purple-500/10' },
]

const QUOTES = [
  { text: 'Каждый здоровый выбор — это инвестиция в себя будущего.', emoji: '💪' },
  { text: 'Не нужно быть идеальным. Нужно быть последовательным.', emoji: '🎯' },
  { text: 'Твоё тело — отражение твоего образа жизни. Начни сегодня.', emoji: '✨' },
  { text: 'Маленькие шаги каждый день приводят к большим результатам.', emoji: '🚀' },
  { text: 'Еда — это топливо. Выбирай качественное.', emoji: '⚡' },
  { text: 'Дисциплина — это мост между целями и достижениями.', emoji: '🌉' },
  { text: 'Лучшее время начать было вчера. Второе лучшее — сейчас.', emoji: '⏰' },
  { text: 'Сила воли — это мышца. Тренируй её каждый день.', emoji: '🧠' },
  { text: 'Здоровье — не цель, а образ жизни.', emoji: '🌿' },
  { text: 'Один шаг в правильном направлении лучше, чем стояние на месте.', emoji: '👣' },
  { text: 'Твои привычки сегодня — твоё здоровье завтра.', emoji: '🌅' },
  { text: 'Не сравнивай себя с другими. Сравнивай себя с собой вчерашним.', emoji: '📈' },
  { text: 'Вода, сон, движение — три кита здоровья.', emoji: '💧' },
  { text: 'Каждая тренировка делает тебя сильнее, даже если ты этого не чувствуешь.', emoji: '🏋️' },
  { text: 'Результат — это сумма всех маленьких решений.', emoji: '🔢' },
  { text: 'Не ешь меньше — ешь правильнее.', emoji: '🥗' },
  { text: 'Прогресс важнее совершенства.', emoji: '📊' },
  { text: 'Твоё тело слышит всё, что говорит твой разум.', emoji: '🧘' },
  { text: 'Хорошее питание — это уважение к себе.', emoji: '❤️' },
  { text: 'Каждый день — новый шанс стать лучше.', emoji: '🌟' },
  { text: 'Движение — это жизнь. Начни с малого.', emoji: '🏃' },
  { text: 'Белок строит мышцы. Сон их восстанавливает. Не пренебрегай ни тем, ни другим.', emoji: '😴' },
  { text: 'Ты не срываешься — ты учишься. Продолжай.', emoji: '🔄' },
  { text: 'Здоровое тело — это не награда. Это инструмент для жизни.', emoji: '🛠️' },
  { text: 'Один стакан воды прямо сейчас — уже хорошее решение.', emoji: '🥤' },
  { text: 'Не жди понедельника. Начни с этого момента.', emoji: '⚡' },
  { text: 'Твоя цель не похудеть — твоя цель стать здоровее.', emoji: '🎯' },
  { text: 'Сложные углеводы утром — энергия на весь день.', emoji: '🌾' },
  { text: 'Тело меняется медленно, но оно меняется. Доверяй процессу.', emoji: '🌱' },
  { text: 'Каждый приём пищи — возможность дать телу то, что ему нужно.', emoji: '🍽️' },
]

function getDailyQuote() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  return QUOTES[dayOfYear % QUOTES.length]
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } } }

function toDateStr(d: Date) { return d.toISOString().slice(0, 10) }

export default function HomePage() {
  const { nutritionPlan, entries, water, training, addWater } = useAppStore()
  const [hoveredHref, setHoveredHref] = useState<string | null>(null)

  const todayStr = toDateStr(new Date())
  const weekKey = getWeekKey()
  const quote = getDailyQuote()

  const hour = new Date().getHours()
  const greeting = hour < 6
    ? { text: 'Доброй ночи', emoji: '🌙', color: 'text-purple-400' }
    : hour < 12
    ? { text: 'Доброе утро', emoji: '☀️', color: 'text-yellow-400' }
    : hour < 18
    ? { text: 'Добрый день', emoji: '🌤', color: 'text-sky-400' }
    : { text: 'Добрый вечер', emoji: '🌆', color: 'text-orange-400' }

  const totalCalories = useMemo(() =>
    entries.filter(e => e.timestamp.slice(0, 10) === todayStr)
      .reduce((sum, e) => sum + (e.food.calories * e.grams) / 100, 0),
    [entries, todayStr]
  )

  const caloriePercent = nutritionPlan ? Math.min((totalCalories / nutritionPlan.calories) * 100, 100) : 0
  const waterMl = water[todayStr] ?? 0
  const waterPercent = Math.min((waterMl / 2000) * 100, 100)

  const workoutDaysTotal = useMemo(() => {
    if (!training.selectedLevel || !training.selectedGoal) return 0
    // count non-rest days from completedDays this week
    return training.completedDays.filter(d => d.startsWith(weekKey)).length
  }, [training, weekKey])

  const hasAnyData = nutritionPlan || waterMl > 0 || training.selectedLevel

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-5xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }} className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{greeting.emoji}</span>
          <p className={`text-base font-semibold ${greeting.color}`}>{greeting.text}</p>
        </div>
        <h1 className="text-[2.75rem] font-bold tracking-tight text-white leading-none">Калорийный Трекер</h1>
        <p className="mt-3 text-white/40 text-[15px] font-light">Твой персональный помощник в здоровом питании</p>
      </motion.div>

      {/* Daily quote */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl px-5 py-4 mb-6 flex items-center gap-4">
        <span className="text-2xl shrink-0">{quote.emoji}</span>
        <p className="text-sm text-white/50 leading-relaxed italic">{quote.text}</p>
      </motion.div>

      {/* Cards grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {CARDS.map(({ href, icon: Icon, title, desc, gradient, borderIdle, borderHover, iconColor, iconBg, glow }) => {
          const isHovered = hoveredHref === href
          const isDimmed = hoveredHref !== null && !isHovered
          return (
            <motion.div key={href} variants={item} style={{ height: '232px' }}
              animate={{ scale: isDimmed ? 0.97 : 1, opacity: isDimmed ? 0.6 : 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}>
              <Link href={href} className="block h-full">
                <motion.div
                  onHoverStart={() => setHoveredHref(href)} onHoverEnd={() => setHoveredHref(null)}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  style={{ height: '100%' }}
                  className={['relative flex flex-col justify-between rounded-2xl border p-6 cursor-pointer overflow-hidden bg-white/[0.03] backdrop-blur-2xl',
                    `bg-gradient-to-br ${gradient}`,
                    isHovered ? `${borderHover} shadow-xl ${glow}` : borderIdle,
                    'transition-[border-color,box-shadow] duration-300'].join(' ')}>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
                  <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
                    <Icon size={20} className={iconColor} />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-white leading-tight mb-1.5">{title}</h3>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Stats bar */}
      {hasAnyData && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl p-5 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            {nutritionPlan && (
              <>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Калории</p>
                    <p className="text-sm font-semibold text-white">{Math.round(totalCalories)} / {nutritionPlan.calories}</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/[0.08] shrink-0" />
              </>
            )}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Droplets className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider">Вода</p>
                <p className="text-sm font-semibold text-white">{waterMl} / 2000 мл</p>
              </div>
            </div>
            {training.selectedLevel && (
              <>
                <div className="w-px h-8 bg-white/[0.08] shrink-0" />
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Тренировки</p>
                    <p className="text-sm font-semibold text-white">{workoutDaysTotal} выполнено на этой неделе</p>
                  </div>
                </div>
              </>
            )}
            {nutritionPlan && (
              <div className="flex-1 min-w-[120px] space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] text-white/25 mb-1">
                    <span>Калории</span><span>{Math.round(caloriePercent)}%</span>
                  </div>
                  <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${caloriePercent}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                      className={`h-full rounded-full ${caloriePercent >= 100 ? 'bg-red-400' : 'bg-gradient-to-r from-orange-400 to-amber-400'}`} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-white/25 mb-1">
                    <span>Вода</span><span>{Math.round(waterPercent)}%</span>
                  </div>
                  <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${waterPercent}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-400" />
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 shrink-0">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-[13px] text-white/40">{entries.filter(e => e.timestamp.slice(0, 10) === todayStr).length} записей сегодня</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick actions */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }} className="flex gap-3 flex-wrap">
        <p className="w-full text-xs text-white/25 uppercase tracking-widest flex items-center gap-1.5 mb-1">
          <Zap className="w-3 h-3" /> Быстрые действия
        </p>
        {[250, 500].map(ml => (
          <motion.button key={ml} onClick={() => addWater(todayStr, ml)}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 text-sm font-medium hover:bg-blue-500/20 hover:border-blue-500/40 transition-all">
            <Droplets className="w-3.5 h-3.5" />
            +{ml} мл воды
          </motion.button>
        ))}
      </motion.div>

      {/* Entry counter */}
      {entries.filter(e => e.timestamp.slice(0, 10) === todayStr).length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 mt-5">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-[13px] text-white/35">{entries.filter(e => e.timestamp.slice(0, 10) === todayStr).length} записей добавлено сегодня</span>
        </motion.div>
      )}
    </div>
  )
}
