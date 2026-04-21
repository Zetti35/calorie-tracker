from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import json
import re

app = FastAPI()

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2:1b"

class FoodQuery(BaseModel):
    query: str

class AdviceQuery(BaseModel):
    calories: int
    protein: float
    fat: float
    carbs: float
    goal: str = None
    targetCalories: int = None

@app.post("/api/food")
async def search_food(data: FoodQuery):
    if not data.query.strip():
        raise HTTPException(status_code=400, detail="No query")
    
    prompt = f"""Ты эксперт по питанию. Пользователь ввёл: "{data.query}".
Верни ТОЛЬКО JSON (без markdown):
{{"name":"название на русском","calories":число,"protein":число,"fat":число,"carbs":число}}
Если не распознан: {{"error":"not_found"}}"""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                OLLAMA_URL,
                json={
                    "model": MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.1}
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="AI error")
            
            result = response.json()
            text = result.get("response", "")
            
            # Extract JSON from response
            json_match = re.search(r'\{[^}]+\}', text)
            if not json_match:
                raise HTTPException(status_code=500, detail="Parse error")
            
            food = json.loads(json_match.group())
            if food.get("error"):
                raise HTTPException(status_code=404, detail="not_found")
            
            return {"food": food}
    
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Request failed")

@app.post("/api/advice")
async def get_advice(data: AdviceQuery):
    prompt = f"""Ты диетолог. Дай короткий совет (2-3 предложения) на русском.
Данные: {data.calories} ккал (норма {data.targetCalories or '?'}), Б{data.protein}г Ж{data.fat}г У{data.carbs}г, цель: {data.goal or '?'}.
Что добавить/убрать из рациона сегодня? Без приветствий."""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                OLLAMA_URL,
                json={
                    "model": MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.7}
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="AI error")
            
            result = response.json()
            advice = result.get("response", "").strip()
            
            return {"advice": advice}
    
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Request failed")

@app.get("/health")
async def health():
    return {"status": "ok"}
