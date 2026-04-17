'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { NutritionPlan, DiaryEntry, UserProfile } from '@/types'

type TrainingState = {
  selectedLevel: string | null
  selectedGoal: string | null
  completedDays: string[]
  completedSets: Record<string, number>
}

type ReminderTime = { time: string; label: string }
type RemindersState = { enabled: boolean; times: ReminderTime[] }

type AppState = {
  // Калькулятор
  nutritionPlan: (NutritionPlan & { bmr: number; tdee: number; goal: string }) | null
  userProfile: UserProfile | null
  setNutritionPlan: (plan: NutritionPlan & { bmr: number; tdee: number; goal: string }, profile: UserProfile) => void

  // История расчётов (последние 5)
  calcHistory: Array<{ plan: NutritionPlan & { bmr: number; tdee: number; goal: string }; profile: UserProfile; date: string }>
  clearCalcHistory: () => void

  // Дневник
  entries: DiaryEntry[]
  addEntry: (entry: DiaryEntry) => void
  removeEntry: (id: string) => void
  clearDiary: () => void
  clearDayEntries: (dateStr: string) => void

  // Напоминания
  reminders: RemindersState
  setReminders: (r: RemindersState) => void

  // Пользовательские продукты (из API или добавленные вручную)
  customFoods: FoodItem[]
  addCustomFood: (food: FoodItem) => void
  removeCustomFood: (name: string) => void

  // Избранные продукты
  favorites: string[] // имена продуктов
  toggleFavorite: (name: string) => void

  // История недавних продуктов
  recentFoods: string[]
  addRecentFood: (name: string) => void

  // Вода
  water: Record<string, number>
  addWater: (dateStr: string, ml: number) => void
  removeWater: (dateStr: string, ml: number) => void
  resetWater: (dateStr: string) => void

  // Тренировки
  training: TrainingState
  setTrainingLevel: (level: string) => void
  setTrainingGoal: (goal: string) => void
  toggleDayComplete: (dayKey: string) => void
  resetTrainingWeek: () => void
  setCompletedSets: (key: string, count: number) => void
  resetSets: () => void
}

function getWeekKey(): string {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const week = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `${now.getFullYear()}-W${week}`
}

export { getWeekKey }

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      nutritionPlan: null,
      userProfile: null,
      setNutritionPlan: (plan, profile) => set((s) => ({
        nutritionPlan: plan,
        userProfile: profile,
        calcHistory: [
          { plan, profile, date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) },
          ...s.calcHistory.filter(h => JSON.stringify(h.profile) !== JSON.stringify(profile)),
        ].slice(0, 5),
      })),

      calcHistory: [],
      clearCalcHistory: () => set({ calcHistory: [] }),

      entries: [],
      addEntry: (entry) => set((s) => ({ entries: [...s.entries, entry] })),
      removeEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      clearDiary: () => set({ entries: [] }),
      clearDayEntries: (dateStr) => set((s) => ({
        entries: s.entries.filter(e => e.timestamp.slice(0, 10) !== dateStr)
      })),

      water: {},
      addWater: (dateStr, ml) => set((s) => ({ water: { ...s.water, [dateStr]: (s.water[dateStr] ?? 0) + ml } })),
      removeWater: (dateStr, ml) => set((s) => ({ water: { ...s.water, [dateStr]: Math.max(0, (s.water[dateStr] ?? 0) - ml) } })),
      resetWater: (dateStr) => set((s) => ({ water: { ...s.water, [dateStr]: 0 } })),

      reminders: {
        enabled: false,
        times: [
          { time: '08:00', label: 'Завтрак' },
          { time: '13:00', label: 'Обед' },
          { time: '19:00', label: 'Ужин' },
        ],
      },
      setReminders: (r) => set({ reminders: r }),

      customFoods: [],
      addCustomFood: (food) => set((s) => {
        // не дублируем если уже есть
        if (s.customFoods.some(f => f.name === food.name)) return s
        return { customFoods: [food, ...s.customFoods] }
      }),
      removeCustomFood: (name) => set((s) => ({
        customFoods: s.customFoods.filter(f => f.name !== name)
      })),

      favorites: [],
      toggleFavorite: (name) => set((s) => ({
        favorites: s.favorites.includes(name)
          ? s.favorites.filter(f => f !== name)
          : [...s.favorites, name]
      })),

      recentFoods: [],
      addRecentFood: (name) => set((s) => ({
        recentFoods: [name, ...s.recentFoods.filter(n => n !== name)].slice(0, 10)
      })),

      training: { selectedLevel: null, selectedGoal: null, completedDays: [], completedSets: {} },
      setTrainingLevel: (level) => set((s) => ({ training: { ...s.training, selectedLevel: level, selectedGoal: null, completedDays: [], completedSets: {} } })),
      setTrainingGoal: (goal) => set((s) => ({ training: { ...s.training, selectedGoal: goal } })),
      toggleDayComplete: (dayKey) => set((s) => {
        const days = s.training.completedDays
        const exists = days.includes(dayKey)
        return { training: { ...s.training, completedDays: exists ? days.filter(d => d !== dayKey) : [...days, dayKey] } }
      }),
      resetTrainingWeek: () => set((s) => ({ training: { ...s.training, completedDays: [], completedSets: {} } })),
      setCompletedSets: (key, count) => set((s) => ({
        training: { ...s.training, completedSets: { ...s.training.completedSets, [key]: count } }
      })),
      resetSets: () => set((s) => ({ training: { ...s.training, completedSets: {} } })),
    }),
    { name: 'calorie-tracker' }
  )
)
