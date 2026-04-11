"""
Калорийный Трекер - Главный файл приложения
"""

import streamlit as st
from models.schemas import NutritionPlan

# Импорты страниц
from pages.page_calculator import show as show_calculator
from pages.page_diary import show as show_diary

# Импорты дневника (только нужные функции)
from modules.diary import add_entry, remove_entry, clear_diary, get_totals

st.set_page_config(
    page_title="Калорийный Трекер",
    page_icon="🥗",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Инициализация session_state
if "entries" not in st.session_state:
    from modules.diary import load_from_file
    st.session_state["entries"] = load_from_file()

if "nutrition_plan" not in st.session_state:
    st.session_state["nutrition_plan"] = None

# Боковая панель навигации
st.sidebar.title("🥗 Калорийный Трекер")
st.sidebar.markdown("Твой помощник в здоровом питании")

page = st.sidebar.radio(
    "Выбери раздел:",
    options=["Калькулятор КБЖУ", "Дневник питания", "Планы тренировок", "Новости ПП"],
    label_visibility="collapsed"
)

st.sidebar.divider()

if st.sidebar.button("Рассчитай норму КБЖУ в калькуляторе", use_container_width=True):
    page = "Калькулятор КБЖУ"

# Основное содержимое
if page == "Калькулятор КБЖУ":
    show_calculator()

elif page == "Дневник питания":
    show_diary()

elif page == "Планы тренировок":
    from pages.page_training import show as show_training
    show_training()

elif page == "Новости ПП":
    st.title("📰 Новости здорового питания")
    st.info("Раздел в разработке. Здесь будут свежие статьи и советы по ПП.")

# Футер
st.sidebar.divider()
st.sidebar.caption("Версия 1.0 • Streamlit MVP")