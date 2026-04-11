"""
Модуль загрузки и поиска по базе продуктов.
"""
import json
from pathlib import Path
from models.schemas import FoodItem


def load_foods(path: str = "data/foods.json") -> list[FoodItem]:
    """Загружает список продуктов из JSON-файла и валидирует через Pydantic."""
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    return [FoodItem(**item) for item in data]


def search_foods(query: str, foods: list[FoodItem]) -> list[FoodItem]:
    """
    Ищет продукты по названию (без учёта регистра).
    Пустая строка — возвращает все продукты.
    """
    if not query.strip():
        return foods
    q = query.strip().lower()
    return [f for f in foods if q in f.name.lower()]
