"""
Модуль логики дневника питания.
Записи хранятся в st.session_state["entries"] как обычные словари.
Синхронизируются с data/diary.json при каждом изменении.
"""

import json
from pathlib import Path
import streamlit as st
from datetime import datetime
from models.schemas import NutritionPlan

_DIARY_FILE = Path("data/diary.json")


def _save(entries: list[dict]) -> None:
    """Сохраняет записи в JSON-файл."""
    try:
        _DIARY_FILE.parent.mkdir(exist_ok=True)
        _DIARY_FILE.write_text(
            json.dumps(entries, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    except Exception:
        pass  # не ломаем приложение если диск недоступен


def load_from_file() -> list[dict]:
    """Загружает записи из файла. При ошибке возвращает пустой список."""
    try:
        if _DIARY_FILE.exists():
            return json.loads(_DIARY_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return []


def add_entry(food: dict, grams: float) -> None:
    """Добавляет запись о приёме пищи. food приходит как dict из .model_dump()"""
    if "entries" not in st.session_state:
        st.session_state["entries"] = []
    
    st.session_state["entries"].append({
        "name": food["name"],
        "grams": float(grams),
        "calories": float(food["calories"]),
        "protein": float(food["protein"]),
        "fat": float(food["fat"]),
        "carbs": float(food["carbs"]),
        "timestamp": datetime.now().isoformat()
    })
    _save(st.session_state["entries"])


def remove_entry(index: int) -> None:
    """Удаляет запись по индексу"""
    entries: list = st.session_state.get("entries", [])
    if 0 <= index < len(entries):
        entries.pop(index)
        _save(entries)


def clear_diary() -> None:
    """Очищает весь дневник за сегодня"""
    st.session_state["entries"] = []
    _save([])


def get_totals(entries: list[dict]) -> NutritionPlan:
    """Считает общие КБЖУ за день"""
    total_cal = total_prot = total_fat = total_carbs = 0.0
    
    for e in entries:
        f = e["grams"] / 100.0
        total_cal += e["calories"] * f
        total_prot += e["protein"] * f
        total_fat += e["fat"] * f
        total_carbs += e["carbs"] * f
    
    return NutritionPlan(
        calories=round(total_cal, 1),
        protein=round(total_prot, 1),
        fat=round(total_fat, 1),
        carbs=round(total_carbs, 1),
    )