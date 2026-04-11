export type NavItem = {
  id: string
  label: string
  icon: string
  href: string
}

export type UserProfile = {
  gender: 'male' | 'female'
  age: number
  weight: number
  height: number
  activity: string
  goal: 'loss' | 'maintain' | 'gain'
}

export type NutritionPlan = {
  calories: number
  protein: number
  fat: number
  carbs: number
}

export type FoodItem = {
  name: string
  calories: number
  protein: number
  fat: number
  carbs: number
}

export type DiaryEntry = {
  id: string
  food: FoodItem
  grams: number
  timestamp: string
}
