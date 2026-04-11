import type { UserProfile, NutritionPlan } from '@/types'

export const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Сидячий (нет спорта)',
  light: 'Лёгкая активность (1–3 раза/нед)',
  moderate: 'Умеренная (3–5 раз/нед)',
  active: 'Активный (6–7 раз/нед)',
  very_active: 'Очень активный (2 раза в день)',
}

const ACTIVITY_COEFFICIENTS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

const GOAL_DELTA: Record<string, number> = {
  loss: -500,
  maintain: 0,
  gain: 500,
}

export const GOAL_LABELS: Record<string, string> = {
  loss: 'Похудение (−500 ккал)',
  maintain: 'Поддержание веса',
  gain: 'Набор массы (+500 ккал)',
}

export function calculateBMR(profile: UserProfile): number {
  const base = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age
  return profile.gender === 'male' ? base + 5 : base - 161
}

export function calculateTDEE(bmr: number, activity: string): number {
  return bmr * (ACTIVITY_COEFFICIENTS[activity] ?? 1.2)
}

export function applyGoal(tdee: number, goal: string): number {
  return tdee + (GOAL_DELTA[goal] ?? 0)
}

export function calculateMacros(calories: number): NutritionPlan {
  return {
    calories: Math.round(calories),
    protein: Math.round((calories * 0.3) / 4),
    fat: Math.round((calories * 0.25) / 9),
    carbs: Math.round((calories * 0.45) / 4),
  }
}

export function calculateNutrition(profile: UserProfile): NutritionPlan & { bmr: number; tdee: number } {
  const bmr = calculateBMR(profile)
  const tdee = calculateTDEE(bmr, profile.activity)
  const calories = applyGoal(tdee, profile.goal)
  const macros = calculateMacros(calories)
  return { ...macros, bmr: Math.round(bmr), tdee: Math.round(tdee) }
}
