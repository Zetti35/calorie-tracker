"""
Модуль расчёта суточной нормы калорий и БЖУ.
Формула BMR: Mifflin-St Jeor (1990) — самая точная для большинства людей.
"""
from models.schemas import UserProfile, NutritionPlan


# Коэффициенты активности для расчёта TDEE = BMR × коэффициент
ACTIVITY_COEFFICIENTS: dict[str, float] = {
    "Сидячий (нет спорта)": 1.2,
    "Лёгкая активность (1–3 раза/нед)": 1.375,
    "Умеренная активность (3–5 раз/нед)": 1.55,
    "Активный (6–7 раз/нед)": 1.725,
    "Очень активный (2 раза в день)": 1.9,
}

# Корректировка калорий по цели
GOAL_DELTA: dict[str, float] = {
    "Похудение": -500.0,
    "Поддержание веса": 0.0,
    "Набор массы": +500.0,
}


def calculate_bmr(profile: UserProfile) -> float:
    """
    Рассчитывает базовый обмен веществ (BMR) по формуле Mifflin-St Jeor.

    Мужчины: 10*вес + 6.25*рост - 5*возраст + 5
    Женщины: 10*вес + 6.25*рост - 5*возраст - 161
    """
    base = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age
    if profile.gender == "Мужской":
        return base + 5
    else:
        return base - 161


def calculate_tdee(bmr: float, activity: str) -> float:
    """Рассчитывает суточный расход энергии (TDEE) = BMR × коэффициент активности."""
    coefficient = ACTIVITY_COEFFICIENTS.get(activity, 1.2)
    return bmr * coefficient


def apply_goal(tdee: float, goal: str) -> float:
    """Корректирует калории в зависимости от цели (±500 ккал или без изменений)."""
    delta = GOAL_DELTA.get(goal, 0.0)
    return tdee + delta


def calculate_macros(calories: float) -> NutritionPlan:
    """
    Рассчитывает БЖУ из итоговых калорий по соотношению 30% / 25% / 45%.

    Белки и углеводы: 4 ккал/г
    Жиры: 9 ккал/г
    """
    protein = round((calories * 0.30) / 4, 1)
    fat = round((calories * 0.25) / 9, 1)
    carbs = round((calories * 0.45) / 4, 1)
    return NutritionPlan(
        calories=round(calories, 1),
        protein=protein,
        fat=fat,
        carbs=carbs,
    )


def calculate_nutrition(profile: UserProfile) -> NutritionPlan:
    """Полный расчёт: BMR → TDEE → цель → БЖУ. Главная функция модуля."""
    bmr = calculate_bmr(profile)
    tdee = calculate_tdee(bmr, profile.activity)
    target_calories = apply_goal(tdee, profile.goal)
    return calculate_macros(target_calories)
