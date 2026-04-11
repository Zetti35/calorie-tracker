"""
Pydantic-модели данных для Калорийного Трекера.
Pydantic автоматически проверяет типы и значения при создании объектов.
"""
from pydantic import BaseModel, Field
from typing import Optional


class UserProfile(BaseModel):
    """Параметры пользователя для расчёта КБЖУ."""
    gender: str        # "мужской" или "женский"
    age: int           # возраст в годах (10–120)
    weight: float      # вес в кг (20–300)
    height: float      # рост в см (100–250)
    activity: str      # ключ уровня активности
    goal: str          # "похудение" | "поддержание" | "набор"


class NutritionPlan(BaseModel):
    """Суточная норма КБЖУ."""
    calories: float    # калории (ккал)
    protein: float     # белки (г)
    fat: float         # жиры (г)
    carbs: float       # углеводы (г)


class FoodItem(BaseModel):
    """Продукт из базы данных (значения на 100 г)."""
    name: str
    calories: float = Field(ge=0)
    protein: float = Field(ge=0)
    fat: float = Field(ge=0)
    carbs: float = Field(ge=0)


class FoodEntry(BaseModel):
    """Запись в дневнике питания: продукт + количество граммов."""
    food: FoodItem
    grams: float = Field(gt=0)  # граммы должны быть > 0


class DayExercise(BaseModel):
    """Одно упражнение в плане тренировок."""
    name: str
    sets: int          # количество подходов
    reps: str          # повторения, например "10–12" или "—"


class TrainingDay(BaseModel):
    """День тренировочного плана."""
    day: str                        # название дня, например "Понедельник"
    exercises: list[DayExercise]    # список упражнений


class TrainingPlan(BaseModel):
    """Недельный план тренировок."""
    level: str                  # уровень: "Начинающий" / "Средний" / "Продвинутый"
    days: list[TrainingDay]     # 7 дней
