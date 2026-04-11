"""
Страница калькулятора суточной нормы КБЖУ.

Важный принцип Streamlit: при каждом взаимодействии весь скрипт
перезапускается сверху вниз. Поэтому результаты нужно хранить в
st.session_state, а не внутри блока if st.button(...).
"""
import streamlit as st
from models.schemas import UserProfile
from modules.calculator import (
    calculate_bmr,
    calculate_tdee,
    apply_goal,
    calculate_macros,
    ACTIVITY_COEFFICIENTS,
    GOAL_DELTA,
)

ACTIVITY_HINTS: dict[str, str] = {
    "Сидячий (нет спорта)":               "🪑 Офисная работа, почти нет движения",
    "Лёгкая активность (1–3 раза/нед)":   "🚶 Лёгкие прогулки или редкие тренировки",
    "Умеренная активность (3–5 раз/нед)": "🏃 Регулярные тренировки 3–5 раз в неделю",
    "Активный (6–7 раз/нед)":             "💪 Интенсивные тренировки почти каждый день",
    "Очень активный (2 раза в день)":     "🔥 Спортсмен или тяжёлый физический труд",
}

GOAL_TIPS: dict[str, str] = {
    "Похудение":        "💡 Дефицит 500 ккал — примерно −0.5 кг в неделю. Безопасный темп!",
    "Поддержание веса": "💡 Эта норма поддерживает твой текущий вес.",
    "Набор массы":      "💡 Профицит 500 ккал — примерно +0.5 кг в неделю. Следи за качеством еды!",
}


def show() -> None:
    """Отображает страницу калькулятора КБЖУ."""

    st.title("🧮 Калькулятор суточной нормы КБЖУ")
    st.markdown(
        "Введи свои параметры — получишь **персональную норму калорий и БЖУ** на день, "
        "рассчитанную по формуле Mifflin-St Jeor."
    )
    st.divider()

    # ── Форма ввода ──────────────────────────────────────────────────────────
    col1, col2 = st.columns(2, gap="large")

    with col1:
        st.subheader("👤 Личные данные")
        gender = st.selectbox("Пол", ["Мужской", "Женский"])
        age    = st.number_input("Возраст (лет)", min_value=1,   max_value=150,   value=25,    step=1)
        weight = st.number_input("Вес (кг)",       min_value=1.0, max_value=500.0, value=70.0,  step=0.5)
        height = st.number_input("Рост (см)",      min_value=50.0, max_value=300.0, value=175.0, step=0.5)

    with col2:
        st.subheader("🏃 Активность и цель")
        activity = st.selectbox(
            "Уровень активности",
            list(ACTIVITY_COEFFICIENTS.keys()),
            help="Выбери уровень, который соответствует твоему образу жизни",
        )
        st.caption(ACTIVITY_HINTS.get(activity, ""))
        goal = st.selectbox(
            "Цель",
            list(GOAL_DELTA.keys()),
            help="Похудение = −500 ккал, Набор = +500 ккал от нормы",
        )

    st.divider()

    # ── Валидация ─────────────────────────────────────────────────────────────
    errors: list[str] = []
    if not (10 <= age <= 120):
        errors.append("❌ Введите корректный возраст (10–120 лет)")
    if not (20 <= weight <= 300):
        errors.append("❌ Введите корректный вес (20–300 кг)")
    if not (100 <= height <= 250):
        errors.append("❌ Введите корректный рост (100–250 см)")

    for err in errors:
        st.error(err)

    # ── Кнопка расчёта ────────────────────────────────────────────────────────
    # При нажатии считаем и СОХРАНЯЕМ всё в session_state.
    # Результаты рендерим НИЖЕ — вне блока if, чтобы они не исчезали.
    if st.button("🔢 Рассчитать норму КБЖУ", type="primary", disabled=bool(errors)):
        profile = UserProfile(
            gender=gender,
            age=int(age),
            weight=float(weight),
            height=float(height),
            activity=activity,
            goal=goal,
        )
        bmr  = calculate_bmr(profile)
        tdee = calculate_tdee(bmr, activity)
        kcal = apply_goal(tdee, goal)
        plan = calculate_macros(kcal)

        # Сохраняем всё в session_state
        st.session_state["nutrition_plan"]  = plan
        st.session_state["calc_bmr"]        = bmr
        st.session_state["calc_tdee"]       = tdee
        st.session_state["calc_kcal"]       = kcal
        st.session_state["calc_goal"]       = goal
        st.session_state["calc_done"]       = True

    # ── Вывод результатов (всегда, если расчёт был выполнен) ─────────────────
    if st.session_state.get("calc_done"):
        plan = st.session_state["nutrition_plan"]
        bmr  = st.session_state["calc_bmr"]
        tdee = st.session_state["calc_tdee"]
        kcal = st.session_state["calc_kcal"]
        goal_saved = st.session_state["calc_goal"]

        st.success("✅ Расчёт выполнен!")

        # Промежуточные значения
        st.subheader("📐 Промежуточные расчёты")
        c1, c2, c3 = st.columns(3)
        c1.metric(
            "🫀 BMR — базовый обмен",
            f"{bmr:.0f} ккал",
            help="Калории, которые тело тратит в полном покое (без движения)",
        )
        c2.metric(
            "⚡ TDEE — с учётом активности",
            f"{tdee:.0f} ккал",
            help="BMR × коэффициент активности",
        )
        c3.metric(
            "🎯 Норма по цели",
            f"{kcal:.0f} ккал",
            delta=f"{GOAL_DELTA[goal_saved]:+.0f} ккал",
        )

        st.divider()

        # Итоговая норма КБЖУ
        st.subheader("📊 Твоя суточная норма:")
        m1, m2, m3, m4 = st.columns(4)
        m1.metric("🔥 Калории",  f"{plan.calories:.0f} ккал")
        m2.metric("🥩 Белки",    f"{plan.protein:.0f} г",  help="30% от калорий · 4 ккал/г")
        m3.metric("🧈 Жиры",     f"{plan.fat:.0f} г",      help="25% от калорий · 9 ккал/г")
        m4.metric("🍞 Углеводы", f"{plan.carbs:.0f} г",    help="45% от калорий · 4 ккал/г")

        # Визуальное распределение БЖУ
        st.subheader("📈 Распределение БЖУ")
        cb, cj, cu = st.columns(3)
        with cb:
            st.markdown("**🥩 Белки — 30%**")
            st.progress(0.30)
            st.caption(f"{plan.protein:.0f} г · {plan.calories * 0.30:.0f} ккал")
        with cj:
            st.markdown("**🧈 Жиры — 25%**")
            st.progress(0.25)
            st.caption(f"{plan.fat:.0f} г · {plan.calories * 0.25:.0f} ккал")
        with cu:
            st.markdown("**🍞 Углеводы — 45%**")
            st.progress(0.45)
            st.caption(f"{plan.carbs:.0f} г · {plan.calories * 0.45:.0f} ккал")

        st.divider()
        st.info(GOAL_TIPS.get(goal_saved, ""))
        st.caption("💾 Норма сохранена — перейди в **Дневник питания**, чтобы отслеживать рацион.")
