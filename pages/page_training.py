"""
Страница планов тренировок.
"""
import json
from pathlib import Path
import streamlit as st

# ── Константы ────────────────────────────────────────────────────────────────

TYPE_ICONS: dict[str, str] = {
    "Отдых":            "🌿",
    "Активный отдых":   "🚶",
    "Растяжка":         "🧘",
    "Кардио":           "🏃",
    "HIIT Кардио":      "🔥",
    "Full Body":        "💪",
    "Грудь + Трицепс":  "💪",
    "Спина + Бицепс":   "💪",
    "Ноги":             "🦵",
    "Плечи + Пресс":    "🏋️",
    "Грудь (объём)":    "💪",
    "Спина (объём)":    "💪",
    "Ноги (объём)":     "🦵",
    "Плечи + Трапеции": "🏋️",
    "Руки + Пресс":     "💪",
}

GOAL_TIPS: dict[str, str] = {
    "Похудение":        "🔥 Твоя цель — похудение. Рекомендуем уровень **Средний** с акцентом на кардио и HIIT.",
    "Поддержание веса": "⚖️ Твоя цель — поддержание. Любой уровень подойдёт — главное регулярность.",
    "Набор массы":      "💪 Твоя цель — набор массы. Рекомендуем **Средний** или **Продвинутый** с упором на силовые.",
}

LEVEL_META: dict[str, dict] = {
    "Новичок":     {"emoji": "🟢", "color": "#d4edda"},
    "Средний":     {"emoji": "🟡", "color": "#fff3cd"},
    "Продвинутый": {"emoji": "🔴", "color": "#f8d7da"},
}


# ── Загрузка данных ───────────────────────────────────────────────────────────

@st.cache_data
def load_plans() -> dict:
    return json.loads(Path("data/training_plans.json").read_text(encoding="utf-8"))


# ── Вспомогательные функции ───────────────────────────────────────────────────

def _render_exercises(exercises: list[dict]) -> None:
    """Рендерит таблицу упражнений."""
    h = st.columns([4, 1, 2])
    h[0].markdown("**Упражнение**")
    h[1].markdown("**Подх.**")
    h[2].markdown("**Повт.**")
    st.markdown("<hr style='margin:3px 0; border-color:#ddd'>", unsafe_allow_html=True)
    for ex in exercises:
        row = st.columns([4, 1, 2])
        row[0].write(f"• {ex['name']}")
        row[1].write(str(ex["sets"]))
        row[2].write(ex["reps"])


def _render_day_tab(day: dict) -> None:
    """Рендерит содержимое одного дня внутри таба."""
    icon = TYPE_ICONS.get(day["type"], "🏃")
    is_rest = day["type"] in ("Отдых",)

    st.markdown(f"#### {icon} {day['type']}")

    if day.get("focus"):
        st.caption(f"🎯 Фокус: {day['focus']}")

    if is_rest:
        st.success("😴 День полного отдыха. Восстановление — часть прогресса!")
        return

    if day["duration"] > 0:
        st.caption(f"⏱️ Примерное время: **{day['duration']} мин**")

    if day["exercises"]:
        st.markdown("")
        _render_exercises(day["exercises"])


# ── Главная функция страницы ──────────────────────────────────────────────────

def show() -> None:
    st.title("🏋️ Планы тренировок")
    st.markdown("Выбери уровень сложности и получи готовый план на неделю.")
    st.divider()

    plans = load_plans()

    # Рекомендация из калькулятора
    goal = st.session_state.get("calc_goal")
    if goal and goal in GOAL_TIPS:
        st.info(GOAL_TIPS[goal])
        st.markdown("")

    # ── Выбор уровня ─────────────────────────────────────────────────────────
    if "training_level" not in st.session_state:
        st.session_state["training_level"] = "Новичок"

    st.subheader("Выбери уровень сложности:")
    c1, c2, c3 = st.columns(3)
    if c1.button("🟢 Новичок",     use_container_width=True, type="secondary"):
        st.session_state["training_level"] = "Новичок"
    if c2.button("🟡 Средний",     use_container_width=True, type="secondary"):
        st.session_state["training_level"] = "Средний"
    if c3.button("🔴 Продвинутый", use_container_width=True, type="secondary"):
        st.session_state["training_level"] = "Продвинутый"

    level = st.session_state["training_level"]
    plan  = plans[level]
    meta  = LEVEL_META[level]

    st.divider()

    # ── Описание уровня ───────────────────────────────────────────────────────
    st.markdown(
        f"<div style='background:{meta['color']};padding:12px 16px;border-radius:8px;margin-bottom:12px;color:#111'>"
        f"<b>{meta['emoji']} {level}</b> — {plan['description']}"
        f"</div>",
        unsafe_allow_html=True,
    )

    # ── Метрики ───────────────────────────────────────────────────────────────
    rest_days   = sum(1 for d in plan["days"] if d["type"] == "Отдых")
    active_days = 7 - rest_days
    total_min   = sum(d["duration"] for d in plan["days"])

    m1, m2, m3 = st.columns(3)
    m1.metric("💪 Тренировок в неделю", active_days)
    m2.metric("😴 Дней отдыха",         rest_days)
    m3.metric("⏱️ Минут в неделю",      total_min)

    st.divider()
    st.subheader("📅 Расписание на неделю")

    # ── Табы по дням ──────────────────────────────────────────────────────────
    DAY_SHORT = {
        "Понедельник": "Пн", "Вторник": "Вт", "Среда": "Ср",
        "Четверг": "Чт", "Пятница": "Пт", "Суббота": "Сб", "Воскресенье": "Вс",
    }
    day_labels = [DAY_SHORT.get(d["day"], d["day"][:2]) for d in plan["days"]]
    tabs = st.tabs(day_labels)

    for tab, day in zip(tabs, plan["days"]):
        with tab:
            _render_day_tab(day)
