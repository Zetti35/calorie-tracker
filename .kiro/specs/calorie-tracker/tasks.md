# План реализации: Калорийный Трекер

## Обзор

Пошаговая реализация Streamlit-приложения на Python. Каждый шаг заканчивается рабочим кодом и git-коммитом. Начинаем с настройки окружения, затем строим модули снизу вверх — от моделей данных до страниц UI.

## Задачи

- [ ] 1. Настройка проекта и начальный коммит
  - Создать структуру папок: `data/`, `models/`, `modules/`, `pages/`
  - Создать `requirements.txt` с зафиксированными версиями: streamlit==1.32.0, pydantic==2.6.4, python-dotenv==1.0.1, openai==1.14.0
  - Создать `.gitignore` (исключить `.env`, `__pycache__/`, `*.pyc`, `venv/`, `.venv/`)
  - Создать `.env.example` с переменной `OPENAI_API_KEY=your_openai_api_key_here`
  - Создать `steering.md` с описанием целей проекта, архитектуры и правил разработки
  - Инициализировать git-репозиторий и сделать initial commit
  - _Требования: 7.1, 7.2, 7.5, 7.6, 7.7_

- [ ] 2. Pydantic-модели
  - [ ] 2.1 Создать `models/schemas.py` со всеми моделями
    - Реализовать: `UserProfile`, `NutritionPlan`, `FoodItem`, `FoodEntry`, `DayExercise`, `TrainingDay`, `TrainingPlan`
    - Добавить валидацию полей: `Field(ge=0)` для числовых значений, диапазоны для `UserProfile`
    - Добавить type hints для всех полей
    - _Требования: 1.7, 2.5, 7.3, 7.4_
  - [ ]* 2.2 Написать property-тест для `UserProfile`
    - **Property 1: Валидация диапазонов UserProfile**
    - **Validates: Requirements 1.8, 1.9, 1.10**
  - Сделать git commit: `feat: add pydantic models`

- [ ] 3. База продуктов (данные)
  - [ ] 3.1 Создать `data/foods.json` с 40–50 продуктами
    - Включить: овсянка, куриная грудка, рис варёный, яйцо, творог, яблоко, банан, гречка, картофель, говядина, лосось, молоко, кефир, хлеб ржаной, макароны, брокколи, морковь и др.
    - Каждый продукт: `name`, `calories`, `protein`, `fat`, `carbs` (на 100 г)
    - _Требования: 2.1, 2.4_
  - Сделать git commit: `feat: add foods database`

- [ ] 4. Планы тренировок (данные)
  - [ ] 4.1 Создать `data/training_plans.json` с тремя планами
    - Реализовать уровни: "Начинающий", "Средний", "Продвинутый"
    - Каждый план: 7 дней, упражнения с `name`, `sets`, `reps` или "День отдыха"
    - _Требования: 4.1, 4.3, 4.4_
  - Сделать git commit: `feat: add training plans data`

- [ ] 5. Модуль калькулятора
  - [ ] 5.1 Создать `modules/calculator.py`
    - Реализовать `calculate_bmr(profile: UserProfile) -> float` — формула Миффлина–Сан Жеора для мужчин и женщин
    - Реализовать `calculate_tdee(bmr: float, activity: str) -> float` с коэффициентами `ACTIVITY_COEFFICIENTS`
    - Реализовать `apply_goal(tdee: float, goal: str) -> float` с `GOAL_DELTA` (±500 ккал)
    - Реализовать `calculate_macros(calories: float) -> NutritionPlan` — соотношение 30%/25%/45%
    - _Требования: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  - [ ]* 5.2 Написать property-тест для `calculate_bmr`
    - **Property 2: BMR мужчины всегда больше BMR женщины при одинаковых параметрах**
    - **Validates: Requirements 1.1, 1.2**
  - [ ]* 5.3 Написать property-тест для `calculate_macros`
    - **Property 3: Сумма калорий из БЖУ равна итоговым калориям (±1 ккал погрешность)**
    - **Validates: Requirements 1.6**
  - Сделать git commit: `feat: add calculator module`

- [ ] 6. Модуль базы продуктов
  - [ ] 6.1 Создать `modules/food_db.py`
    - Реализовать `load_foods(path: str) -> list[FoodItem]` — загрузка и валидация JSON через Pydantic
    - Реализовать `search_foods(query: str, foods: list[FoodItem]) -> list[FoodItem]` — поиск без учёта регистра
    - _Требования: 2.2, 2.3, 2.4, 2.5_
  - [ ]* 6.2 Написать property-тест для `search_foods`
    - **Property 4: Поиск пустой строкой возвращает все продукты**
    - **Validates: Requirements 2.2**
  - Сделать git commit: `feat: add food_db module`

- [ ] 7. Модуль дневника питания
  - [ ] 7.1 Создать `modules/diary.py`
    - Реализовать `add_entry(entry: FoodEntry) -> None` — добавление в `st.session_state["entries"]`
    - Реализовать `remove_entry(index: int) -> None` — удаление по индексу
    - Реализовать `get_totals(entries: list[FoodEntry]) -> NutritionPlan` — суммирование КБЖУ с учётом граммовки
    - _Требования: 3.1, 3.2, 3.4, 3.5_
  - [ ]* 7.2 Написать property-тест для `get_totals`
    - **Property 5: Удвоение граммовки всех записей удваивает итоговые КБЖУ**
    - **Validates: Requirements 3.2**
  - Сделать git commit: `feat: add diary module`

- [ ] 8. Модуль тренировок
  - [ ] 8.1 Создать `modules/training.py`
    - Реализовать `load_plans(path: str) -> dict[str, TrainingPlan]` — загрузка JSON
    - Реализовать `get_plan(level: str, plans: dict) -> TrainingPlan`
    - _Требования: 4.1, 4.2, 4.3_
  - Сделать git commit: `feat: add training module`

- [ ] 9. Модуль новостей
  - [ ] 9.1 Создать `modules/news.py`
    - Определить `STATIC_TIPS` — список из 3+ статических советов
    - Реализовать `fetch_news(api_key: Optional[str]) -> list[str]`
    - Логика: если `api_key` задан — запрос к OpenAI `gpt-3.5-turbo`, иначе — `STATIC_TIPS`
    - При ошибке API — вернуть `STATIC_TIPS`
    - Кэшировать результат в `st.session_state["news_cache"]`
    - _Требования: 5.1, 5.2, 5.3, 5.4, 5.5_
  - Сделать git commit: `feat: add news module`

- [ ] 10. Checkpoint — проверка модулей
  - Убедиться, что все модули импортируются без ошибок
  - Убедиться, что все тесты проходят (если написаны)
  - Задать вопросы пользователю при необходимости

- [ ] 11. Страница калькулятора
  - [ ] 11.1 Создать `pages/page_calculator.py`
    - Форма: пол (selectbox), возраст (number_input), вес (number_input), рост (number_input), активность (selectbox), цель (selectbox)
    - Валидация диапазонов с `st.error()` для возраста, веса, роста
    - Кнопка "Рассчитать" → вызов модуля calculator → сохранение `NutritionPlan` в `st.session_state["nutrition_plan"]`
    - Вывод результата в виде таблицы: калории, белки, жиры, углеводы
    - _Требования: 1.1–1.10, 6.3, 6.4_
  - Сделать git commit: `feat: add calculator page`

- [ ] 12. Страница дневника питания
  - [ ] 12.1 Создать `pages/page_diary.py`
    - Поле поиска продукта → вызов `search_foods` → отображение результатов
    - Сообщение "Продукт не найден" если результатов нет
    - Выбор продукта + ввод граммов (> 0) + кнопка "Добавить"
    - Валидация граммов с `st.error()` при значении <= 0
    - Таблица записей с кнопкой "Удалить" для каждой строки
    - Итоговые КБЖУ за день
    - Прогресс-бар калорий если есть `st.session_state["nutrition_plan"]`
    - _Требования: 2.2, 2.3, 3.1–3.6, 6.3, 6.4_
  - Сделать git commit: `feat: add diary page`

- [ ] 13. Страница тренировок
  - [ ] 13.1 Создать `pages/page_training.py`
    - Загрузка планов через `load_plans`
    - Selectbox выбора уровня: "Начинающий", "Средний", "Продвинутый"
    - Таблица на 7 дней: день недели, упражнения, подходы, повторения
    - Пометка "День отдыха" для дней без упражнений
    - _Требования: 4.1–4.4, 6.3, 6.4_
  - Сделать git commit: `feat: add training page`

- [ ] 14. Страница новостей
  - [ ] 14.1 Создать `pages/page_news.py`
    - Отображение 3+ советов из `fetch_news`
    - Кнопка "Обновить новости" → повторный вызов `fetch_news` с очисткой кэша
    - Сообщение об ошибке при недоступности API
    - _Требования: 5.1–5.5, 6.3, 6.4_
  - Сделать git commit: `feat: add news page`

- [ ] 15. Главный файл app.py и финальная сборка
  - [ ] 15.1 Создать `app.py`
    - Загрузка `.env` через `python-dotenv`
    - Инициализация `st.session_state` (entries, nutrition_plan, news_cache)
    - Sidebar с `st.sidebar.radio` для навигации между 4 разделами
    - Маршрутизация к соответствующей странице по выбору
    - Заголовок приложения "Калорийный Трекер"
    - _Требования: 6.1, 6.2, 7.1, 7.8_
  - Сделать git commit: `feat: add app.py and wire all pages`

- [ ] 16. Финальный checkpoint
  - Запустить `streamlit run app.py` и проверить все разделы вручную
  - Убедиться, что все тесты проходят
  - Сделать финальный git commit: `chore: final review and cleanup`
  - Задать вопросы пользователю при необходимости

## Примечания

- Задачи с `*` — опциональные тесты, можно пропустить для быстрого MVP
- После каждого шага делается git commit для удобства отката
- Все модули используют type hints и Pydantic-модели из `models/schemas.py`
- Приложение запускается командой: `streamlit run app.py`
