'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dumbbell, Clock, ChevronDown, ChevronUp, Flame, Target, Utensils, Sun, Zap, Moon, CheckCircle2, Circle, TrendingUp, RotateCcw, Info, X, Timer, Square } from 'lucide-react'
import { GOAL_PLANS } from '../../data/goal_plans'
import { useAppStore, getWeekKey } from '@/lib/store'

type ExerciseTip = { steps: string[]; muscles: string; tip: string }

const TIPS: Record<string, ExerciseTip> = {
  'Приседания': { muscles: 'Квадрицепсы, ягодицы, бицепс бедра', steps: ['Ноги на ширине плеч, носки чуть развёрнуты', 'Спина прямая, взгляд вперёд', 'Опускайся до параллели бёдер с полом', 'Колени не выходят за носки', 'Поднимайся через пятки'], tip: 'Представь, что садишься на стул позади себя — это поможет держать спину прямой.' },
  'Приседания (неглубокие)': { muscles: 'Квадрицепсы, ягодицы', steps: ['Ноги на ширине плеч', 'Опускайся на треть глубины', 'Спина прямая, колени над носками', 'Поднимайся через пятки'], tip: 'Неглубокие приседания — отличный старт. Постепенно увеличивай глубину.' },
  'Приседания со штангой': { muscles: 'Квадрицепсы, ягодицы, бицепс бедра, поясница', steps: ['Штанга на трапециях, ноги чуть шире плеч', 'Носки развёрнуты 30–45°', 'Опускайся до параллели или ниже', 'Колени в направлении носков', 'Поднимайся через пятки, спина прямая'], tip: 'Смотри чуть вверх — это помогает держать грудь поднятой и спину прямой.' },
  'Отжимания': { muscles: 'Грудные, трицепс, передние дельты', steps: ['Руки чуть шире плеч, пальцы вперёд', 'Тело — прямая линия от головы до пяток', 'Опускайся до касания грудью пола', 'Локти под углом 45° к телу', 'Выдох при подъёме'], tip: 'Напряги пресс и ягодицы — это защитит поясницу и поможет держать тело прямым.' },
  'Отжимания с колен': { muscles: 'Грудные, трицепс, передние дельты', steps: ['Колени на полу, руки чуть шире плеч', 'Бёдра, корпус и голова — одна линия', 'Опускайся медленно, 2–3 секунды вниз', 'Локти не расставляй слишком широко', 'Полностью выпрями руки вверху'], tip: 'Это полноценное упражнение, не "облегчённое". Контролируй каждое повторение.' },
  'Планка': { muscles: 'Пресс, поясница, плечи, ягодицы', steps: ['Упор на предплечья или прямые руки', 'Тело — прямая линия, без прогиба в пояснице', 'Взгляд в пол, шея нейтральна', 'Напряги пресс и ягодицы', 'Дыши ровно, не задерживай дыхание'], tip: 'Качество важнее времени. Лучше 20 секунд идеальной планки, чем минута с прогибом.' },
  'Выпады': { muscles: 'Квадрицепсы, ягодицы, бицепс бедра', steps: ['Шаг вперёд на 60–70 см', 'Опускай заднее колено к полу', 'Переднее колено над щиколоткой', 'Корпус прямой, не наклоняйся вперёд', 'Оттолкнись передней ногой и вернись'], tip: 'Смотри вперёд, а не вниз — это помогает держать равновесие и прямую спину.' },
  'Выпады на месте': { muscles: 'Квадрицепсы, ягодицы', steps: ['Стоя, шаг назад одной ногой', 'Опускай заднее колено к полу', 'Переднее колено над щиколоткой', 'Вернись в исходное положение', 'Чередуй ноги'], tip: 'Выпады на месте легче для баланса — хорошее начало перед шагающими выпадами.' },
  'Выпады с гантелями': { muscles: 'Квадрицепсы, ягодицы, бицепс бедра', steps: ['Гантели в руках, шаг вперёд', 'Опускай заднее колено к полу', 'Переднее колено над щиколоткой', 'Корпус прямой', 'Оттолкнись и сделай следующий шаг'], tip: 'Держи гантели нейтрально — не позволяй им тянуть плечи вниз.' },
  'Скручивания': { muscles: 'Прямая мышца живота', steps: ['Лёжа на спине, колени согнуты', 'Руки за головой или на груди', 'Поднимай лопатки, не шею', 'Выдох при подъёме, вдох при опускании', 'Поясница прижата к полу'], tip: 'Не тяни себя за голову — это нагружает шею. Работает только пресс.' },
  'Ягодичный мост': { muscles: 'Ягодицы, бицепс бедра, поясница', steps: ['Лёжа на спине, ступни на полу', 'Ноги согнуты под 90°, ширина бёдер', 'Поднимай таз до прямой линии тело-бёдра', 'Сожми ягодицы в верхней точке', 'Медленно опускайся'], tip: 'Задержись на 1–2 секунды вверху и сильно сожми ягодицы — это удвоит эффект.' },
  'Велосипед лёжа': { muscles: 'Косые мышцы живота, прямая мышца живота', steps: ['Лёжа на спине, руки за головой', 'Поднять ноги под 45°', 'Тянуть правый локоть к левому колену', 'Одновременно выпрямлять правую ногу', 'Чередовать стороны в ритмичном темпе'], tip: 'Не спеши. Медленный "велосипед" с полным скручиванием эффективнее быстрого.' },
  'Прыжки на месте': { muscles: 'Икры, квадрицепсы, сердечно-сосудистая система', steps: ['Ноги вместе, руки вдоль тела', 'Прыгни, разводя ноги шире плеч', 'Одновременно подними руки над головой', 'Приземляйся мягко, на носки', 'Сразу прыгай обратно'], tip: 'Приземляйся мягко, слегка сгибая колени — это снижает нагрузку на суставы.' },
  'Жим гантелей лёжа': { muscles: 'Грудные, трицепс, передние дельты', steps: ['Лёжа на скамье, ступни на полу', 'Гантели на уровне груди, локти под 45°', 'Жми вверх до полного выпрямления рук', 'Не блокируй локти в верхней точке', 'Медленно опускай — 2–3 секунды'], tip: 'Своди лопатки и прижимай их к скамье — это защитит плечи и улучшит технику.' },
  'Тяга гантелей в наклоне': { muscles: 'Широчайшие, ромбовидные, бицепс', steps: ['Наклон корпуса 45°, спина прямая', 'Гантели свисают вниз, руки прямые', 'Тяни локти назад и вверх', 'Своди лопатки в верхней точке', 'Медленно опускай'], tip: 'Думай не о руках, а о локтях — тяни именно локти к потолку.' },
  'Жим гантелей сидя': { muscles: 'Средние и передние дельты, трицепс', steps: ['Сидя прямо, спина к спинке скамьи', 'Гантели на уровне ушей, локти под 90°', 'Жми вверх, не сводя гантели', 'Не прогибайся в пояснице', 'Медленно опускай до исходного положения'], tip: 'Не поднимай плечи к ушам — держи их опущенными на протяжении всего движения.' },
  'Сгибания на бицепс': { muscles: 'Бицепс, брахиалис', steps: ['Стоя, гантели в опущенных руках', 'Локти прижаты к корпусу', 'Сгибай руки, поворачивая ладони вверх', 'Поднимай до полного сокращения бицепса', 'Медленно опускай — 3 секунды'], tip: 'Не раскачивай корпус — это читинг. Работает только бицепс, тело неподвижно.' },
  'Махи в стороны': { muscles: 'Средние дельты', steps: ['Стоя, гантели вдоль тела', 'Лёгкий наклон вперёд 10–15°', 'Поднимай руки через стороны до уровня плеч', 'Мизинец чуть выше большого пальца', 'Медленно опускай'], tip: 'Используй лёгкий вес — это изолирующее упражнение. Тяжёлый вес убивает технику.' },
  'Становая тяга': { muscles: 'Бицепс бедра, ягодицы, спина, трапеции', steps: ['Ноги на ширине бёдер, штанга над серединой стопы', 'Хват чуть шире ног, спина прямая', 'Поднимай штангу, держа её близко к телу', 'Бёдра и плечи поднимаются одновременно', 'Выпрямись полностью, сводя лопатки'], tip: 'Перед подъёмом сделай глубокий вдох и напряги пресс — это защитит поясницу.' },
  'Подтягивания': { muscles: 'Широчайшие, бицепс, задние дельты', steps: ['Хват чуть шире плеч, ладони от себя', 'Из виса подтягивайся до подбородка выше перекладины', 'Своди лопатки при подъёме', 'Не раскачивайся', 'Медленно опускайся в полный вис'], tip: 'Думай о том, что тянешь локти вниз к бёдрам — это активирует широчайшие.' },
  'Подтягивания с весом': { muscles: 'Широчайшие, бицепс, задние дельты', steps: ['Пояс с отягощением или гантель между ног', 'Хват чуть шире плеч', 'Подтягивайся до подбородка выше перекладины', 'Своди лопатки при подъёме', 'Медленно опускайся'], tip: 'Добавляй вес постепенно — не более 5% от веса тела за раз.' },
  'Жим штанги лёжа': { muscles: 'Грудные, трицепс, передние дельты', steps: ['Лёжа на скамье, ступни на полу', 'Хват чуть шире плеч, лопатки сведены', 'Опускай штангу к нижней части груди', 'Локти под углом 45–75° к телу', 'Жми вверх и чуть назад'], tip: 'Прогиб в пояснице — нормально, но ягодицы должны касаться скамьи.' },
  'Бёрпи': { muscles: 'Всё тело, сердечно-сосудистая система', steps: ['Из стойки — присед, руки на пол', 'Прыжком — упор лёжа', 'Отжимание (опционально)', 'Прыжком — обратно в присед', 'Прыжок вверх с руками над головой'], tip: 'Не торопись в начале — лучше 5 чистых бёрпи, чем 15 кривых.' },
  'Румынская тяга': { muscles: 'Бицепс бедра, ягодицы, поясница', steps: ['Стоя, штанга или гантели перед бёдрами', 'Ноги почти прямые, лёгкий сгиб в коленях', 'Наклоняйся вперёд, отводя таз назад', 'Спина прямая, штанга скользит по ногам', 'Поднимайся, сокращая ягодицы'], tip: 'Чувствуй растяжение в задней поверхности бедра — это значит, ты делаешь правильно.' },
  'Французский жим': { muscles: 'Трицепс (все три головки)', steps: ['Лёжа, гантель или штанга над лицом', 'Локти направлены в потолок, неподвижны', 'Опускай снаряд ко лбу или за голову', 'Разгибай руки только в локтях', 'Не разводи локти в стороны'], tip: 'Локти — это ось вращения. Они не должны двигаться никуда, только предплечья.' },
  'Французский жим лёжа': { muscles: 'Трицепс (все три головки)', steps: ['Лёжа на скамье, штанга над лицом', 'Локти направлены в потолок, неподвижны', 'Опускай штангу ко лбу', 'Разгибай руки только в локтях', 'Не разводи локти в стороны'], tip: 'Локти — это ось вращения. Они не должны двигаться никуда, только предплечья.' },
}

type Goal = { key: string; emoji: string; title: string; subtitle: string; color: string; border: string; bg: string; activeBorder: string; activeBg: string }
type NutritionPlan = { morning: string; preworkout: string; postworkout: string; evening: string }

const GOALS_BY_LEVEL: Record<string, Goal[]> = {
  Новичок: [
    { key: 'tone', emoji: '✨', title: 'Привести себя в тонус', subtitle: 'Лёгкий рельеф и хорошее самочувствие', color: 'text-sky-400', border: 'border-sky-500/25', bg: 'bg-sky-500/8', activeBorder: 'border-sky-500/60', activeBg: 'bg-sky-500/15' },
    { key: 'lose', emoji: '🔥', title: 'Сбросить лишнее', subtitle: 'Постепенное и комфортное похудение', color: 'text-rose-400', border: 'border-rose-500/25', bg: 'bg-rose-500/8', activeBorder: 'border-rose-500/60', activeBg: 'bg-rose-500/15' },
    { key: 'habit', emoji: '🌱', title: 'Выработать привычку', subtitle: 'Регулярное движение как образ жизни', color: 'text-green-400', border: 'border-green-500/25', bg: 'bg-green-500/8', activeBorder: 'border-green-500/60', activeBg: 'bg-green-500/15' },
  ],
  Любитель: [
    { key: 'maintain', emoji: '⚖️', title: 'Поддержать форму', subtitle: 'Сохранить вес и держать тело в тонусе', color: 'text-yellow-400', border: 'border-yellow-500/25', bg: 'bg-yellow-500/8', activeBorder: 'border-yellow-500/60', activeBg: 'bg-yellow-500/15' },
    { key: 'lose', emoji: '🔥', title: 'Сжечь жир и обрести рельеф', subtitle: 'Минус жир, плюс чёткие контуры тела', color: 'text-rose-400', border: 'border-rose-500/25', bg: 'bg-rose-500/8', activeBorder: 'border-rose-500/60', activeBg: 'bg-rose-500/15' },
    { key: 'build', emoji: '💪', title: 'Начать строить мышцы', subtitle: 'Первые заметные результаты в объёме', color: 'text-purple-400', border: 'border-purple-500/25', bg: 'bg-purple-500/8', activeBorder: 'border-purple-500/60', activeBg: 'bg-purple-500/15' },
  ],
  Профессионал: [
    { key: 'mass', emoji: '🏋️', title: 'Набор мышечной массы', subtitle: 'Максимальный рост силы и объёма', color: 'text-orange-400', border: 'border-orange-500/25', bg: 'bg-orange-500/8', activeBorder: 'border-orange-500/60', activeBg: 'bg-orange-500/15' },
    { key: 'cut', emoji: '⚡', title: 'Сушка и рельеф', subtitle: 'Сохранить мышцы, убрать жировую прослойку', color: 'text-cyan-400', border: 'border-cyan-500/25', bg: 'bg-cyan-500/8', activeBorder: 'border-cyan-500/60', activeBg: 'bg-cyan-500/15' },
    { key: 'strength', emoji: '🎯', title: 'Рост силовых показателей', subtitle: 'Прогрессия в базовых упражнениях', color: 'text-emerald-400', border: 'border-emerald-500/25', bg: 'bg-emerald-500/8', activeBorder: 'border-emerald-500/60', activeBg: 'bg-emerald-500/15' },
  ],
}

const NUTRITION: Record<string, Record<string, NutritionPlan>> = {
  Новичок: {
    tone: {
      morning: 'Овсянка на воде с бананом и ложкой мёда — медленные углеводы для мягкого старта дня',
      preworkout: 'Яблоко или горсть орехов за 30 мин до тренировки — лёгкий заряд без тяжести',
      postworkout: 'Творог 0% с ягодами или варёное яйцо — белок для восстановления без лишних калорий',
      evening: 'Греческий йогурт или кефир — лёгкий белок перед сном, поддерживает восстановление',
    },
    lose: {
      morning: 'Омлет из 2 белков с овощами — сытный белковый старт без лишних углеводов',
      preworkout: 'Стакан кефира или яблоко — минимум калорий, максимум бодрости',
      postworkout: 'Куриная грудка с огурцом и помидором — чистый белок и клетчатка без углеводов',
      evening: 'Творог 0% без добавок — медленный белок, насыщает и не откладывается в жир',
    },
    habit: {
      morning: 'Гречка с молоком или овсянка с фруктами — сбалансированный старт для энергии на весь день',
      preworkout: 'Банан или горсть сухофруктов — быстрые углеводы для лёгкой тренировки',
      postworkout: 'Творог с бананом или рис с куриной грудкой — восстановление гликогена и белок',
      evening: 'Кефир с горстью орехов — полезные жиры и белок для спокойного сна',
    },
  },
  Любитель: {
    maintain: {
      morning: 'Овсянка с ягодами и орехами + варёное яйцо — баланс БЖУ для стабильного веса',
      preworkout: 'Банан с ложкой арахисовой пасты за 40 мин — углеводы + жиры для устойчивой энергии',
      postworkout: 'Рис с куриной грудкой и брокколи — классическое восстановительное питание',
      evening: 'Творог 5% с корицей или греческий йогурт — белок без углеводного всплеска',
    },
    lose: {
      morning: 'Омлет из 3 белков со шпинатом и помидорами — высокобелковый старт, минимум углеводов',
      preworkout: 'Яблоко или грейпфрут — ускоряют метаболизм, дают лёгкую энергию',
      postworkout: 'Куриная грудка с овощами на пару — чистый белок и клетчатка для жиросжигания',
      evening: 'Творог 0% с огурцом или кефир — насыщает без лишних калорий перед сном',
    },
    build: {
      morning: 'Овсянка с бананом, мёдом и протеином — углеводы + белок для роста мышц',
      preworkout: 'Банан + горсть орехов за 45 мин — энергия для продуктивной тренировки',
      postworkout: 'Рис с говядиной или куриной грудкой — углеводы восстанавливают гликоген, белок строит мышцы',
      evening: 'Творог 5% с орехами — казеиновый белок питает мышцы всю ночь',
    },
  },
  Профессионал: {
    mass: {
      morning: 'Овсянка с бананом, 3 яйца + стакан молока — мощный старт с высоким содержанием БЖУ',
      preworkout: 'Рис с куриной грудкой за 1.5 часа — медленные углеводы для максимальной отдачи на тренировке',
      postworkout: 'Протеиновый коктейль + банан сразу после, через 1 час — рис с говядиной и овощами',
      evening: 'Творог 5% с орехами и мёдом — казеин + полезные жиры для ночного восстановления мышц',
    },
    cut: {
      morning: 'Омлет из 4 белков со шпинатом + гречка — белок и медленные углеводы без лишнего жира',
      preworkout: 'Рисовые хлебцы с творогом за 1 час — лёгкие углеводы без задержки воды',
      postworkout: 'Куриная грудка с брокколи и огурцом — чистый белок, ноль лишних калорий',
      evening: 'Творог 0% с корицей — медленный белок, подавляет аппетит, не задерживает воду',
    },
    strength: {
      morning: 'Гречка с яйцами и авокадо — сложные углеводы + полезные жиры для силовой работы',
      preworkout: 'Рис с куриной грудкой за 1.5–2 часа — максимальный запас гликогена для тяжёлых подходов',
      postworkout: 'Протеин + быстрые углеводы (банан, рис) — закрыть белково-углеводное окно в первые 30 мин',
      evening: 'Творог 5% с орехами — казеин восстанавливает мышечные волокна во время сна',
    },
  },
}

const LEVELS = [
  { key: 'Новичок', emoji: '🌱', color: 'text-sky-400', border: 'border-sky-500/30', bg: 'bg-sky-500/10', activeBg: 'bg-sky-500/20', activeBorder: 'border-sky-500/60', desc: 'Сидячий образ жизни, почти нет спорта' },
  { key: 'Любитель', emoji: '🚶', color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', activeBg: 'bg-yellow-500/20', activeBorder: 'border-yellow-500/60', desc: 'Иногда занимаюсь, делаю зарядку' },
  { key: 'Профессионал', emoji: '🏋️', color: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10', activeBg: 'bg-orange-500/20', activeBorder: 'border-orange-500/60', desc: 'Стабильные тренировки, серьёзные нагрузки' },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } } }

export default function TrainingPage() {
  const [openDay, setOpenDay] = useState<string | null>(null)
  const [hoveredLevel, setHoveredLevel] = useState<string | null>(null)
  const [hoveredGoal, setHoveredGoal] = useState<string | null>(null)
  const [activeTip, setActiveTip] = useState<string | null>(null)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerLabel, setTimerLabel] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTimer = useCallback((seconds: number, label: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setTimerSeconds(seconds)
    setTimerLabel(label)
    setTimerRunning(true)
    intervalRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          setTimerRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setTimerRunning(false)
    setTimerSeconds(0)
  }, [])

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  const { training, setTrainingLevel, setTrainingGoal, toggleDayComplete, resetTrainingWeek, setCompletedSets } = useAppStore()

  const toggleSet = useCallback((key: string, total: number) => {
    const current = training.completedSets[key] ?? 0
    setCompletedSets(key, current >= total ? 0 : current + 1)
  }, [training.completedSets, setCompletedSets])
  const selected = training.selectedLevel
  const selectedGoal = training.selectedGoal
  const weekKey = getWeekKey()

  // Сбрасываем невалидный уровень из старого localStorage
  useEffect(() => {
    if (selected && !GOALS_BY_LEVEL[selected]) {
      setTrainingLevel(LEVELS[0].key)
    }
  }, [selected, setTrainingLevel])

  const plan = selected && selectedGoal ? GOAL_PLANS[selected]?.[selectedGoal] : null
  const levelMeta = LEVELS.find(l => l.key === selected)
  const goals = (selected ? GOALS_BY_LEVEL[selected] : null) ?? []
  const nutrition = selected && selectedGoal ? NUTRITION[selected]?.[selectedGoal] : null

  const workoutDays = plan?.days.filter(d => d.exercises.length > 0) ?? []
  const completedThisWeek = workoutDays.filter(d => training.completedDays.includes(`${weekKey}:${d.day}`))
  const progressPercent = workoutDays.length > 0 ? (completedThisWeek.length / workoutDays.length) * 100 : 0

  const handleLevelSelect = (key: string) => {
    setTrainingLevel(key)
    setOpenDay(null)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="px-4 sm:px-8 py-8 sm:py-10 max-w-4xl">
      <div className="flex items-center gap-3 mb-2">
        <Dumbbell className="w-6 h-6 text-orange-400" />
        <h1 className="text-3xl font-bold text-white">Планы тренировок</h1>
      </div>
      <p className="text-white/40 mb-8 text-sm">Выбери уровень подготовки и цель — получи персональный план</p>

      {/* Level selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {LEVELS.map(({ key, emoji, color, border, bg, activeBg, activeBorder, desc }) => {
          const isActive = selected === key
          const isDimmed = hoveredLevel !== null && hoveredLevel !== key
          return (
            <motion.button key={key} onClick={() => handleLevelSelect(key)}
              onHoverStart={() => setHoveredLevel(key)} onHoverEnd={() => setHoveredLevel(null)}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              animate={{ scale: isDimmed ? 0.97 : 1, opacity: isDimmed ? 0.6 : 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className={['relative flex flex-col items-center gap-2 p-5 rounded-2xl border cursor-pointer text-center backdrop-blur-xl transition-all duration-200',
                isActive ? `${activeBg} ${activeBorder}` : `${bg} ${border} hover:border-white/20`].join(' ')}
            >
              {isActive && <motion.div layoutId="level-active" className="absolute inset-0 rounded-2xl bg-white/[0.03]" transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />}
              <span className="text-3xl relative z-10">{emoji}</span>
              <span className={`text-base font-bold relative z-10 ${color}`}>{key}</span>
              <span className="text-xs text-white/40 relative z-10 leading-relaxed">{desc}</span>
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {selected && goals.length > 0 && (
          <motion.div key={`goals-${selected}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-white/40" />
              <p className="text-sm text-white/40">Выбери свою цель</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {goals.map((goal) => {
                const isActive = selectedGoal === goal.key
                const isDimmed = hoveredGoal !== null && hoveredGoal !== goal.key
                return (
                  <motion.button key={goal.key} onClick={() => setTrainingGoal(goal.key)}
                    onHoverStart={() => setHoveredGoal(goal.key)} onHoverEnd={() => setHoveredGoal(null)}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    animate={{ scale: isDimmed ? 0.97 : 1, opacity: isDimmed ? 0.6 : 1 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                    className={['relative flex flex-col items-start gap-1.5 p-4 rounded-2xl border cursor-pointer text-left backdrop-blur-xl transition-all duration-200',
                      isActive ? `${goal.activeBg} ${goal.activeBorder}` : `${goal.bg} ${goal.border} hover:border-white/20`].join(' ')}
                  >
                    {isActive && <motion.div layoutId="goal-active" className="absolute inset-0 rounded-2xl bg-white/[0.02]" transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />}
                    <span className="text-xl relative z-10">{goal.emoji}</span>
                    <span className={`text-sm font-semibold relative z-10 ${goal.color} leading-tight`}>{goal.title}</span>
                    <span className="text-xs text-white/35 relative z-10 leading-relaxed">{goal.subtitle}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nutrition block */}
      <AnimatePresence mode="wait">
        {nutrition && (
          <motion.div key={`nutrition-${selected}-${selectedGoal}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Utensils className="w-4 h-4 text-white/40" />
              <p className="text-sm text-white/40">Рекомендуемое питание</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Sun, label: 'Утром', value: nutrition.morning, color: 'text-yellow-400', bg: 'bg-yellow-500/8', border: 'border-yellow-500/20' },
                { icon: Zap, label: 'До тренировки', value: nutrition.preworkout, color: 'text-sky-400', bg: 'bg-sky-500/8', border: 'border-sky-500/20' },
                { icon: Flame, label: 'После тренировки', value: nutrition.postworkout, color: 'text-orange-400', bg: 'bg-orange-500/8', border: 'border-orange-500/20' },
                { icon: Moon, label: 'Вечером перед сном', value: nutrition.evening, color: 'text-purple-400', bg: 'bg-purple-500/8', border: 'border-purple-500/20' },
              ].map(({ icon: Icon, label, value, color, bg, border }) => (
                <div key={label} className={`rounded-2xl border ${border} ${bg} backdrop-blur-xl p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    <span className={`text-xs font-semibold ${color}`}>{label}</span>
                  </div>
                  <p className="text-xs text-white/55 leading-relaxed">{value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekly progress */}
      <AnimatePresence mode="wait">
        {plan && workoutDays.length > 0 && (
          <motion.div key={`progress-${selected}-${selectedGoal}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }} className="mb-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-white/70">Прогресс этой недели</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/30">{completedThisWeek.length} из {workoutDays.length} тренировок</span>
                  <button onClick={resetTrainingWeek} className="flex items-center gap-1 text-xs text-white/25 hover:text-white/50 transition-colors">
                    <RotateCcw className="w-3 h-3" />
                    <span>Сбросить</span>
                  </button>
                </div>
              </div>
              <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden mb-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {workoutDays.map((d) => {
                  const dayKey = `${weekKey}:${d.day}`
                  const done = training.completedDays.includes(dayKey)
                  return (
                    <button key={d.day} onClick={() => toggleDayComplete(dayKey)}
                      className={['flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border',
                        done ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-white/[0.04] border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'].join(' ')}
                    >
                      {done ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                      {d.day}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan content */}
      <AnimatePresence mode="wait">
        {plan && levelMeta && selectedGoal && (
          <motion.div key={`${selected}-${selectedGoal}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
            <div className={`rounded-2xl border ${levelMeta.border} ${levelMeta.bg} backdrop-blur-xl p-5 mb-6`}>
              <div className="flex items-center gap-2 mb-1">
                <Flame className={`w-4 h-4 ${levelMeta.color}`} />
                <span className={`text-sm font-semibold ${levelMeta.color}`}>
                  {GOALS_BY_LEVEL[selected!]?.find(g => g.key === selectedGoal)?.title}
                </span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">{plan.description}</p>
            </div>

            <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
              {plan.days.map((day) => {
                const isRest = day.exercises.length === 0
                const isOpen = openDay === day.day
                return (
                  <motion.div key={day.day} variants={item}>
                    <div className={['rounded-2xl border backdrop-blur-xl overflow-hidden', isRest ? 'border-white/[0.06] bg-white/[0.02]' : 'border-white/10 bg-white/[0.03] cursor-pointer'].join(' ')}>
                      <button onClick={() => !isRest && setOpenDay(isOpen ? null : day.day)} disabled={isRest} className="w-full flex items-center justify-between px-5 py-4 text-left">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-medium text-white/30 w-24 shrink-0">{day.day}</span>
                          <div>
                            <span className={`text-sm font-semibold ${isRest ? 'text-white/25' : 'text-white'}`}>{isRest ? 'День отдыха' : day.type}</span>
                            {day.focus && <p className="text-xs text-white/35 mt-0.5">{day.focus}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {day.duration > 0 && <div className="flex items-center gap-1 text-xs text-white/30"><Clock className="w-3 h-3" /><span>{day.duration} мин</span></div>}
                          {!isRest && (isOpen ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />)}
                        </div>
                      </button>
                      <AnimatePresence>
                        {isOpen && !isRest && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="overflow-hidden">
                            <div className="px-5 pb-4 border-t border-white/[0.06]">
                              <div className="pt-3 space-y-2">
                                {day.exercises.map((ex, i) => {
                                  const setKey = `${day.day}:${i}`
                                  const done = training.completedSets[setKey] ?? 0
                                  const total = ex.sets > 0 ? ex.sets : 0
                                  return (
                                  <div key={i} className="py-2.5 border-b border-white/[0.04] last:border-0">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-white/80">{ex.name}</span>
                                        {TIPS[ex.name] && (
                                          <button onClick={() => setActiveTip(ex.name)} className="text-white/20 hover:text-white/50 transition-colors">
                                            <Info className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                      <span className="text-xs text-white/40 shrink-0 ml-4">{total > 0 ? `${total} × ${ex.reps}` : ex.reps}</span>
                                    </div>
                                    {total > 0 && (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-white/25 mr-1">подходы:</span>
                                        {Array.from({ length: total }).map((_, s) => {
                                          const isDone = s < done
                                          return (
                                            <motion.button
                                              key={s}
                                              onClick={() => toggleSet(setKey, total)}
                                              whileTap={{ scale: 0.85 }}
                                              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                              className={[
                                                'w-6 h-6 rounded-full border text-[10px] font-semibold transition-all duration-200',
                                                isDone
                                                  ? 'bg-green-500/30 border-green-500/60 text-green-400'
                                                  : 'bg-white/[0.04] border-white/15 text-white/30 hover:border-white/30',
                                              ].join(' ')}
                                            >
                                              {s + 1}
                                            </motion.button>
                                          )
                                        })}
                                        {done === total && total > 0 && (
                                          <motion.span
                                            initial={{ opacity: 0, x: -4 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="text-[10px] text-green-400 ml-1"
                                          >
                                            ✓ готово
                                          </motion.span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  )
                                })}
                              </div>
                              {/* Rest timer */}
                              <div className="pt-3 pb-1 flex items-center gap-2 border-t border-white/[0.04] mt-2">
                                <Timer className="w-3.5 h-3.5 text-white/25" />
                                <span className="text-xs text-white/25">Отдых:</span>
                                {[60, 90, 120].map(s => (
                                  <button key={s} onClick={() => startTimer(s, day.type)}
                                    className="px-2.5 py-1 rounded-lg text-xs border border-white/10 bg-white/[0.04] text-white/40 hover:text-white/70 hover:border-white/25 transition-all duration-150">
                                    {s}с
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!selected && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center text-white/25 text-sm">
          Выбери уровень выше, чтобы увидеть план тренировок
        </div>
      )}
      {selected && !selectedGoal && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-white/25 text-sm">
          Выбери цель выше — план тренировок подберётся автоматически
        </div>
      )}

      {/* Floating rest timer widget */}
      <AnimatePresence>
        {(timerRunning || timerSeconds > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="fixed bottom-8 right-8 z-40 rounded-2xl border border-white/10 bg-[#111]/90 backdrop-blur-2xl p-4 shadow-2xl shadow-black/50 flex items-center gap-4 min-w-[220px]"
          >
            <div className="relative w-12 h-12 shrink-0">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" stroke="white" strokeOpacity="0.08" strokeWidth="3" fill="none" />
                <motion.circle cx="24" cy="24" r="20" stroke={timerSeconds <= 10 ? '#f87171' : '#34d399'} strokeWidth="3" fill="none"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - timerSeconds / (timerLabel ? timerSeconds : 1))}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${timerSeconds <= 10 ? 'text-red-400' : 'text-white'}`}>
                {timerSeconds}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/35 truncate">{timerLabel}</p>
              <p className={`text-sm font-semibold ${timerSeconds <= 10 ? 'text-red-400' : 'text-white'}`}>
                {timerRunning ? 'Отдыхай...' : 'Время вышло!'}
              </p>
            </div>
            <button onClick={stopTimer} className="text-white/25 hover:text-white/60 transition-colors shrink-0">
              {timerRunning ? <Square className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise tip modal */}
      <AnimatePresence>
        {activeTip && TIPS[activeTip] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveTip(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111]/95 backdrop-blur-2xl p-6 shadow-2xl shadow-black/60"
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-white leading-tight">{activeTip}</h3>
                  <p className="text-xs text-white/35 mt-1">{TIPS[activeTip].muscles}</p>
                </div>
                <button onClick={() => setActiveTip(null)} className="text-white/25 hover:text-white/60 transition-colors ml-4 mt-0.5">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SVG illustration removed — text-only tip */}

              {/* Steps */}
              <div className="space-y-2 mb-4">
                {TIPS[activeTip].steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-[10px] text-white/40 shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-sm text-white/65 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>

              {/* Pro tip */}
              <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-3">
                <p className="text-xs text-orange-300/80 leading-relaxed">💡 {TIPS[activeTip].tip}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
