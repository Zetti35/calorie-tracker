'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, ChevronDown, Save, Trash2, RotateCcw, BookOpen, Calculator, Dumbbell, Bell, BellOff, CreditCard, CheckCircle2, Clock } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { calculateNutrition, ACTIVITY_LABELS, GOAL_LABELS } from '@/lib/calculator'
import { useAuth } from '@/lib/auth'
import type { UserProfile } from '@/types'

const GENDER_LABELS = { male: 'Мужской', female: 'Женский' } as const

function Stepper({ label, value, unit, min, max, step = 1, onChange }: {
  label: string; value: number; unit: string; min: number; max: number; step?: number; onChange: (v: number) => void
}) {
  return (
    <div>
      <p className="text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">{label}</p>
      <div className="flex items-center bg-white/[0.06] border border-white/10 rounded-2xl overflow-hidden h-14">
        <motion.button type="button" whileTap={{ scale: 0.85 }}
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-12 h-full text-2xl font-thin text-white/40 hover:text-white hover:bg-white/[0.08] transition-all select-none flex items-center justify-center">−</motion.button>
        <div className="flex-1 text-center">
          <span className="text-xl font-bold text-white">{value}</span>
          <span className="text-sm text-white/40 ml-1">{unit}</span>
        </div>
        <motion.button type="button" whileTap={{ scale: 0.85 }}
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-12 h-full text-2xl font-thin text-white/40 hover:text-white hover:bg-white/[0.08] transition-all select-none flex items-center justify-center">+</motion.button>
      </div>
    </div>
  )
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function ProfilePage() {
  const { userProfile, nutritionPlan, setNutritionPlan, entries, clearDiary, calcHistory, clearCalcHistory, training, reminders, setReminders } = useAppStore()
  const { user: tgUser, status, createPayment } = useAuth()
  const [payLoading, setPayLoading] = useState(false)

  async function handlePayment() {
    setPayLoading(true)
    try {
      const url = await createPayment()
      if (window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(url)
      } else {
        window.open(url, '_blank')
      }
    } catch (err) {
      console.error('Payment error:', err)
      alert('Ошибка при создании платежа. Попробуй ещё раз.')
    } finally {
      setPayLoading(false)
    }
  }

  const [gender, setGender]     = useState<'male' | 'female'>(userProfile?.gender ?? 'male')
  const [age, setAge]           = useState(userProfile?.age ?? 25)
  const [weight, setWeight]     = useState(userProfile?.weight ?? 75)
  const [height, setHeight]     = useState(userProfile?.height ?? 175)
  const [activity, setActivity] = useState<keyof typeof ACTIVITY_LABELS>(userProfile?.activity ?? 'moderate')
  const [goal, setGoal]         = useState<'loss' | 'maintain' | 'gain'>(userProfile?.goal ?? 'maintain')
  const [saved, setSaved]       = useState(false)

  useEffect(() => {
    if (!userProfile) return
    setGender(userProfile.gender); setAge(userProfile.age)
    setWeight(userProfile.weight); setHeight(userProfile.height)
    setActivity(userProfile.activity as keyof typeof ACTIVITY_LABELS)
    setGoal(userProfile.goal)
  }, [userProfile])

  function handleSave() {
    const profile: UserProfile = { gender, age, weight, height, activity, goal }
    const plan = { ...calculateNutrition(profile), goal } as ReturnType<typeof calculateNutrition> & { goal: string }
    setNutritionPlan(plan, profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const totalEntries = entries.length
  const daysTracked = new Set(entries.map(e => e.timestamp.slice(0, 10))).size
  const bmi = userProfile ? Math.round((userProfile.weight / ((userProfile.height / 100) ** 2)) * 10) / 10 : null
  const bmiLabel = bmi ? bmi < 18.5 ? 'Недовес' : bmi < 25 ? 'Норма' : bmi < 30 ? 'Избыток' : 'Ожирение' : null
  const bmiColor = bmi ? bmi < 18.5 ? 'text-blue-400' : bmi < 25 ? 'text-green-400' : bmi < 30 ? 'text-yellow-400' : 'text-red-400' : ''

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="px-10 py-12 max-w-3xl">

      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/15 flex items-center justify-center shadow-lg">
          <User className="w-7 h-7 text-white/70" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Профиль</h1>
          <p className="text-sm text-white/40">Твои параметры и статистика</p>
        </div>
      </div>

      {/* Блок аккаунта */}
      {tgUser && (
        <div className="mt-6 bg-zinc-900/80 border border-zinc-700/60 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">{tgUser.first_name}{tgUser.username ? ` @${tgUser.username}` : ''}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {status?.type === 'subscribed' && (
                <><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /><span className="text-xs text-green-400">Доступ активен</span></>
              )}
              {status?.type === 'trial' && (
                <><Clock className="w-3.5 h-3.5 text-blue-400" /><span className="text-xs text-blue-400">Пробный период · {status.remaining_hours} ч</span></>
              )}
              {status?.type === 'expired' && (
                <><CreditCard className="w-3.5 h-3.5 text-orange-400" /><span className="text-xs text-orange-400">Требуется оплата</span></>
              )}
            </div>
          </div>
          {(status?.type === 'trial' || status?.type === 'expired') && (
            <motion.button
              onClick={handlePayment}
              disabled={payLoading}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-400 text-sm font-semibold hover:bg-orange-500/25 disabled:opacity-50 transition-all shrink-0"
            >
              <CreditCard className="w-4 h-4" />
              {payLoading ? 'Загрузка...' : '50 ₽'}
            </motion.button>
          )}
        </div>
      )}

      {/* Кнопка админ панели — только для владельца */}
      {tgUser?.telegram_id === 970308869 && (
        <motion.a
          href="/admin"
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-semibold hover:bg-purple-500/20 transition-all"
        >
          🛡️ Админ панель
        </motion.a>
      )}

      <div className="h-px bg-white/[0.06] my-8" />

      {/* Stats */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Записей', value: totalEntries, unit: 'в дневнике', icon: BookOpen, color: 'text-green-300', grad: 'from-green-500/20 to-green-900/10', border: 'border-green-500/20', iconBg: 'bg-green-500/15', iconColor: 'text-green-400' },
          { label: 'Дней', value: daysTracked, unit: 'отслежено', icon: Calculator, color: 'text-blue-300', grad: 'from-blue-500/20 to-blue-900/10', border: 'border-blue-500/20', iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400' },
          { label: 'Расчётов', value: calcHistory.length, unit: 'нормы', icon: Calculator, color: 'text-purple-300', grad: 'from-purple-500/20 to-purple-900/10', border: 'border-purple-500/20', iconBg: 'bg-purple-500/15', iconColor: 'text-purple-400' },
          { label: 'Тренировок', value: training.completedDays.length, unit: 'выполнено', icon: Dumbbell, color: 'text-orange-300', grad: 'from-orange-500/20 to-orange-900/10', border: 'border-orange-500/20', iconBg: 'bg-orange-500/15', iconColor: 'text-orange-400' },
        ].map(s => (
          <motion.div key={s.label} variants={fadeUp} whileHover={{ scale: 1.03, y: -3 }}
            className={`bg-gradient-to-br ${s.grad} border ${s.border} rounded-2xl p-4 text-center hover:shadow-xl hover:shadow-black/40 transition-shadow`}>
            <div className={`w-8 h-8 rounded-xl ${s.iconBg} flex items-center justify-center mx-auto mb-3`}>
              <s.icon className={`w-4 h-4 ${s.iconColor}`} />
            </div>
            <p className={`text-3xl font-black ${s.color} leading-none mb-1`}>{s.value}</p>
            <p className="text-[10px] text-white/35 uppercase tracking-wider">{s.unit}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* BMI + current norm */}
      {userProfile && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {bmi && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Индекс массы тела</p>
              <div className="flex items-end gap-3">
                <p className={`text-4xl font-black ${bmiColor}`}>{bmi}</p>
                <p className={`text-sm font-semibold ${bmiColor} mb-1`}>{bmiLabel}</p>
              </div>
              <p className="text-xs text-white/30 mt-2">{userProfile.weight} кг · {userProfile.height} см</p>
            </div>
          )}
          {nutritionPlan && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Норма КБЖУ</p>
              <p className="text-3xl font-black text-orange-300 leading-none mb-2">{nutritionPlan.calories} <span className="text-sm font-normal text-white/40">ккал</span></p>
              <div className="flex gap-3 text-xs">
                <span className="text-red-300">Б {nutritionPlan.protein}г</span>
                <span className="text-white/20">·</span>
                <span className="text-yellow-300">Ж {nutritionPlan.fat}г</span>
                <span className="text-white/20">·</span>
                <span className="text-green-300">У {nutritionPlan.carbs}г</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit form */}
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl p-7 mb-6">
        <p className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-6">Параметры</p>

        <div className="mb-6">
          <p className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wider">Пол</p>
          <div className="flex gap-3">
            {(['male', 'female'] as const).map(g => (
              <motion.button key={g} type="button" onClick={() => setGender(g)} whileTap={{ scale: 0.97 }}
                className={`flex-1 h-14 rounded-2xl text-sm font-semibold transition-all ${
                  gender === g
                    ? 'bg-white/15 border-2 border-white/30 text-white shadow-lg'
                    : 'bg-white/[0.04] border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/[0.07]'
                }`}>
                {GENDER_LABELS[g]}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Stepper label="Возраст" value={age}    unit="лет" min={10}  max={120} onChange={setAge} />
          <Stepper label="Вес"     value={weight} unit="кг"  min={20}  max={300} onChange={setWeight} />
          <Stepper label="Рост"    value={height} unit="см"  min={100} max={250} onChange={setHeight} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Уровень активности', value: activity, options: ACTIVITY_LABELS, onChange: (v: string) => setActivity(v as keyof typeof ACTIVITY_LABELS) },
            { label: 'Цель', value: goal, options: GOAL_LABELS, onChange: (v: string) => setGoal(v as 'loss' | 'maintain' | 'gain') },
          ].map(s => (
            <div key={s.label}>
              <p className="text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">{s.label}</p>
              <div className="relative">
                <select value={s.value} onChange={e => s.onChange(e.target.value)}
                  className="w-full h-14 appearance-none bg-white/[0.06] border border-white/10 rounded-2xl px-5 text-sm font-medium text-white outline-none focus:border-white/30 transition-colors cursor-pointer pr-12">
                  {Object.entries(s.options).map(([k, v]) => (
                    <option key={k} value={k} className="bg-zinc-900 text-white">{v as string}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              </div>
            </div>
          ))}
        </div>

        <motion.button onClick={handleSave} whileHover={{ scale: 1.01, boxShadow: '0 0 30px rgba(255,255,255,0.08)' }} whileTap={{ scale: 0.98 }}
          className={`w-full h-14 flex items-center justify-center gap-2 font-semibold text-sm rounded-2xl transition-all ${
            saved
              ? 'bg-green-500/20 border border-green-500/40 text-green-400 shadow-lg shadow-green-500/10'
              : 'bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 text-white'
          }`}>
          <Save className="w-4 h-4" />
          {saved ? 'Сохранено ✓' : 'Сохранить и пересчитать норму'}
        </motion.button>
      </div>

      {/* Reminders */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-yellow-400" />
            <p className="text-sm font-semibold text-white">Напоминания о питании</p>
          </div>
          <motion.button
            onClick={async () => {
              if (!reminders.enabled) {
                if ('Notification' in window) {
                  const perm = await Notification.requestPermission()
                  if (perm !== 'granted') return
                }
              }
              setReminders({ ...reminders, enabled: !reminders.enabled })
            }}
            whileTap={{ scale: 0.95 }}
            className={['flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all',
              reminders.enabled
                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                : 'bg-white/[0.04] border-white/10 text-white/40 hover:text-white/60'
            ].join(' ')}>
            {reminders.enabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            {reminders.enabled ? 'Включены' : 'Выключены'}
          </motion.button>
        </div>

        {reminders.enabled && (
          <div className="space-y-3">
            <p className="text-xs text-white/35">Напомним записать еду если за 2 часа до этого времени не было записей:</p>
            {reminders.times.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-white/50 w-16">{r.label}</span>
                <input
                  type="time"
                  value={r.time}
                  onChange={e => {
                    const updated = [...reminders.times]
                    updated[i] = { ...r, time: e.target.value }
                    setReminders({ ...reminders, times: updated })
                  }}
                  className="bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-yellow-500/40 transition-colors"
                />
              </div>
            ))}
            <p className="text-[10px] text-white/25 mt-2">Уведомления работают пока браузер открыт</p>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.03] backdrop-blur-xl p-5">
        <p className="text-xs text-red-400/60 uppercase tracking-wider mb-4">Сброс данных</p>
        <div className="flex gap-3 flex-wrap">
          <motion.button onClick={clearDiary} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 hover:border-red-500/35 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
            Очистить дневник
          </motion.button>
          <motion.button onClick={clearCalcHistory} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 hover:border-red-500/35 transition-all">
            <RotateCcw className="w-3.5 h-3.5" />
            Очистить историю расчётов
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
