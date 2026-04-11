# Design Document

## Overview

Калорийный Трекер — Streamlit-приложение на Python с модульной структурой.
Каждый раздел (калькулятор, дневник, тренировки, новости) реализован как отдельный модуль.
Данные хранятся в `st.session_state` (сессия) и JSON-файлах (статические данные).
Язык интерфейса — строго русский.

---

## Architecture

```
calorie-tracker/
├── app.py                  # точка входа, навигация sidebar
├── .env                    # переменные окружения (не в git)
├── .env.example            # шаблон переменных окружения
├── .gitignore
├── requirements.txt
├── steering.md
├── data/
│   ├── foods.json          # база продуктов (40–50 позиций)
│   └── training_plans.json # три плана тренировок
├── models/
│   └── schemas.py          # Pydantic-модели
├── modules/
│   ├── calculator.py       # расчёт BMR / TDEE / КБЖУ
│   ├── diary.py            # дневник питания
│   ├── food_db.py          # загрузка и поиск по базе продуктов
│   ├── training.py         # отображение планов тренировок
│   └── news.py             # новости ПП (OpenAI или заглушки)
└── pages/
    ├── page_calculator.py
    ├── page_diary.py
    ├── page_training.py
    └── page_news.py
```

---

## Data Models

### schemas.py

```python
from pydantic import BaseModel, Field
from typing import Optional

class UserProfile(BaseModel):
    gender: str          # "мужской" | "женский"
    age: int             # 10–120
    weight: float        # 20–300 кг
    height: float        # 100–250 см
    activity: str        # ключ коэффициента активности
    goal: str            # "похудение" | "поддержание" | "набор"

class NutritionPlan(BaseModel):
    calories: float
    protein: float
    fat: float
    carbs: float

class FoodItem(BaseModel):
    name: str
    calories: float = Field(ge=0)
    protein: float = Field(ge=0)
    fat: float = Field(ge=0)
    carbs: float = Field(ge=0)

class FoodEntry(BaseModel):
    food: FoodItem
    grams: float = Field(gt=0)

class DayExercise(BaseModel):
    name: str
    sets: int
    reps: str           # "10–12" или "отдых"

class TrainingDay(BaseModel):
    day: str
    exercises: list[DayExercise]

class TrainingPlan(BaseModel):
    level: str
    days: list[TrainingDay]
```

---

## Module Design

### modules/calculator.py

Функции:
- `calculate_bmr(profile: UserProfile) -> float` — формула Миффлина–Сан Жеора
- `calculate_tdee(bmr: float, activity: str) -> float` — BMR × коэффициент
- `apply_goal(tdee: float, goal: str) -> float` — ±500 ккал или без изменений
- `calculate_macros(calories: float) -> NutritionPlan` — 30/25/45 %

Коэффициенты активности:
```python
ACTIVITY_COEFFICIENTS = {
    "сидячий": 1.2,
    "малоактивный": 1.375,
    "умеренно активный": 1.55,
    "активный": 1.725,
    "очень активный": 1.9,
}
```

Корректировка по цели:
```python
GOAL_DELTA = {
    "похудение": -500,
    "поддержание": 0,
    "набор": +500,
}
```

### modules/food_db.py

- `load_foods(path: str) -> list[FoodItem]` — загрузка JSON при старте
- `search_foods(query: str, foods: list[FoodItem]) -> list[FoodItem]` — поиск без учёта регистра по полю `name`

### modules/diary.py

Работает через `st.session_state["entries"]: list[FoodEntry]`.

- `add_entry(entry: FoodEntry) -> None`
- `remove_entry(index: int) -> None`
- `get_totals(entries: list[FoodEntry]) -> NutritionPlan` — суммирует КБЖУ

### modules/training.py

- `load_plans(path: str) -> dict[str, TrainingPlan]` — загрузка JSON
- `get_plan(level: str, plans: dict) -> TrainingPlan`

### modules/news.py

Логика выбора источника:
1. Если `OPENAI_API_KEY` задан — запрос к OpenAI Chat API (модель `gpt-3.5-turbo`), промпт: "Дай 3 коротких совета по здоровому питанию на русском языке."
2. Если ключ не задан или запрос упал — возврат статических заглушек из `STATIC_TIPS`.

```python
STATIC_TIPS = [
    "Пейте не менее 1.5–2 литров воды в день.",
    "Включайте белок в каждый приём пищи для насыщения.",
    "Отдавайте предпочтение сложным углеводам: овсянке, рису, гречке.",
]
```

- `fetch_news(api_key: Optional[str]) -> list[str]`
- Результат кэшируется в `st.session_state["news_cache"]`

---

## Data Files

### data/foods.json (структура)

```json
[
  {"name": "Овсянка", "calories": 342, "protein": 12, "fat": 6, "carbs": 60},
  {"name": "Куриная грудка", "calories": 165, "protein": 31, "fat": 3.6, "carbs": 0},
  {"name": "Рис варёный", "calories": 130, "protein": 2.7, "fat": 0.3, "carbs": 28},
  {"name": "Яйцо куриное", "calories": 155, "protein": 13, "fat": 11, "carbs": 1.1},
  {"name": "Творог 5%", "calories": 121, "protein": 17, "fat": 5, "carbs": 3},
  {"name": "Яблоко", "calories": 52, "protein": 0.3, "fat": 0.2, "carbs": 14},
  {"name": "Банан", "calories": 89, "protein": 1.1, "fat": 0.3, "carbs": 23}
]
```

Итоговый файл содержит 40–50 позиций (гречка, картофель, говядина, лосось, молоко, кефир, хлеб ржаной, макароны, брокколи, морковь и др.).

### data/training_plans.json (структура)

```json
{
  "Начинающий": {
    "level": "Начинающий",
    "days": [
      {"day": "Понедельник", "exercises": [{"name": "Приседания", "sets": 3, "reps": "10"}]},
      {"day": "Вторник", "exercises": [{"name": "День отдыха", "sets": 0, "reps": "—"}]}
    ]
  }
}
```

---

## UI Flow

```
sidebar (st.sidebar.radio)
  ├── Калькулятор КБЖУ  → page_calculator.py
  │     форма: пол, возраст, вес, рост, активность, цель
  │     кнопка "Рассчитать" → сохранить NutritionPlan в session_state
  │     вывод: таблица КБЖУ
  │
  ├── Дневник питания   → page_diary.py
  │     поиск продукта → выбор → ввод граммов → кнопка "Добавить"
  │     таблица записей с кнопкой "Удалить"
  │     прогресс-бар калорий (если есть NutritionPlan)
  │
  ├── Тренировки        → page_training.py
  │     selectbox уровня → таблица на 7 дней
  │
  └── Новости           → page_news.py
        отображение 3 советов
        кнопка "Обновить новости"
```

---

## Environment & Configuration

`.env`:
```
OPENAI_API_KEY=sk-...
```

`.env.example`:
```
OPENAI_API_KEY=your_openai_api_key_here
```

Загрузка в `app.py`:
```python
from dotenv import load_dotenv
import os
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
```

---

## Error Handling

| Ситуация | Поведение |
|---|---|
| Некорректный возраст/вес/рост | `st.error("Введите корректный ...")` |
| Граммы <= 0 в дневнике | `st.error("Введите количество больше 0")` |
| Продукт не найден | `st.warning("Продукт не найден")` |
| OpenAI API недоступен | Показать статические заглушки |
| OpenAI ключ отсутствует | Показать статические заглушки без запроса |

---

## Dependencies (requirements.txt)

```
streamlit==1.32.0
pydantic==2.6.4
python-dotenv==1.0.1
openai==1.14.0
```
