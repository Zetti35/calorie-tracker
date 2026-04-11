"""
Страница дневника питания.
"""

import streamlit as st
from modules.food_db import load_foods, search_foods
from modules.diary import add_entry, remove_entry, clear_diary, get_totals


@st.cache_data
def get_all_foods():
    return load_foods()


def show() -> None:
    """Главная функция страницы Дневник питания"""

    # Красный стиль для кнопок удаления
    st.markdown("""
        <style>
        div[data-testid="stButton"] button[kind="secondary"] {
            background-color: #ff4d4d !important;
            color: white !important;
            border-color: #ff4d4d !important;
        }
        button[kind="secondary"]:hover {
            background-color: #ff3333 !important;
        }
        </style>
    """, unsafe_allow_html=True)

    st.title("📔 Дневник питания")
    st.markdown("Добавляй продукты и следи за суточным потреблением КБЖУ.")

    st.divider()

    # Инициализация session_state
    if "entries" not in st.session_state:
        st.session_state["entries"] = []

    all_foods = get_all_foods()

    # === Блок добавления продукта ===
    st.subheader("➕ Добавить продукт")

    col1, col2 = st.columns([3, 1])

    with col1:
        query = st.text_input(
            "🔍 Поиск по названию",
            placeholder="Например: курица, овсянка, яйцо...",
            key="diary_search"
        )

    results = search_foods(query, all_foods)

    col_select, col_grams = st.columns([3, 1], gap="medium")

    with col_select:
        if results:
            chosen_name = st.selectbox(
                "Выбери продукт:",
                options=[f.name for f in results],
                key="diary_chosen"
            )
            selected = next((f for f in results if f.name == chosen_name), None)
            
            if selected:
                st.caption(
                    f"На 100 г: 🔥 {selected.calories} ккал · "
                    f"Б {selected.protein} г · Ж {selected.fat} г · У {selected.carbs} г"
                )
        else:
            if query:
                st.warning("😕 Продукт не найден.")
            selected = None

    with col_grams:
        grams = st.number_input(
            "Граммы (г)",
            min_value=1.0,
            max_value=5000.0,
            value=100.0,
            step=10.0,
            key="diary_grams"
        )
        if selected:
            st.caption(f"≈ {selected.calories * grams / 100:.0f} ккал")

    # Кнопка добавления
    if st.button("➕ Добавить в дневник", type="primary", use_container_width=True):
        if selected is None:
            st.error("❌ Сначала выбери продукт")
        else:
            add_entry(selected.model_dump(), float(grams))
            st.success(f"✅ Добавлено: {selected.name} — {grams:.0f} г")
            st.rerun()   # Правильный способ очистки поиска

    st.divider()

    # === Список приёмов пищи ===
    entries: list[dict] = st.session_state.get("entries", [])

    col_title, col_clear = st.columns([4, 1])
    col_title.subheader(f"🍽️ Приёмы пищи сегодня ({len(entries)})")

    if entries and col_clear.button("🗑️ Очистить день", type="secondary"):
        clear_diary()
        st.rerun()

    if not entries:
        st.info("📭 Дневник пуст. Добавь первый продукт выше!")
        return

    # Заголовки таблицы
    cols_h = st.columns([3, 1.2, 1.2, 1.2, 1.2, 1.2, 0.9])
    headers = ["Продукт", "Граммы", "🔥 Ккал", "🥩 Белки", "🧈 Жиры", "🍞 Углев.", "Действие"]
    for col, header in zip(cols_h, headers):
        col.markdown(f"**{header}**")

    st.markdown("---")

    # Строки с записями
    for i, e in enumerate(entries):
        f = e["grams"] / 100.0
        cols = st.columns([3, 1.2, 1.2, 1.2, 1.2, 1.2, 0.9])

        cols[0].write(e["name"])
        cols[1].write(f"{e['grams']:.0f} г")
        cols[2].write(f"{e['calories'] * f:.0f}")
        cols[3].write(f"{e['protein'] * f:.1f} г")
        cols[4].write(f"{e['fat'] * f:.1f} г")
        cols[5].write(f"{e['carbs'] * f:.1f} г")

        # Красная кнопка удаления
        if cols[6].button("🗑️ Удалить", 
                          key=f"del_{i}", 
                          type="secondary", 
                          help="Удалить запись"):
            remove_entry(i)
            st.rerun()

    st.divider()

    # === Итог за день ===
    totals = get_totals(entries)
    st.subheader("📊 Итог за день")

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("🔥 Калории", f"{totals.calories:.0f} ккал")
    m2.metric("🥩 Белки", f"{totals.protein:.1f} г")
    m3.metric("🧈 Жиры", f"{totals.fat:.1f} г")
    m4.metric("🍞 Углеводы", f"{totals.carbs:.1f} г")

    # Прогресс по норме из калькулятора
    plan = st.session_state.get("nutrition_plan")
    if plan:
        st.markdown("**📈 Прогресс по калориям:**")
        ratio = min(totals.calories / plan.calories, 1.0)
        st.progress(ratio)
        remaining = plan.calories - totals.calories
        if remaining >= 0:
            st.caption(f"Съедено {totals.calories:.0f} из {plan.calories:.0f} ккал · Осталось: {remaining:.0f} ккал")
        else:
            st.warning(f"⚠️ Норма превышена на {abs(remaining):.0f} ккал")
    else:
        st.caption("💡 Рассчитай норму в Калькуляторе КБЖУ, чтобы видеть прогресс-бар")