# AI Server для Calorie Tracker

Простой AI сервер на FastAPI + Ollama для поиска продуктов и советов по питанию.

## Развёртывание на Railway

1. Зайди на https://railway.app/
2. Зарегистрируйся через GitHub
3. Нажми "New Project" → "Deploy from GitHub repo"
4. Выбери свой репозиторий
5. Railway автоматически обнаружит Dockerfile
6. Установи переменную окружения:
   - `PORT=8000` (Railway автоматически установит свой порт)
7. Дождись деплоя (займёт 5-10 минут, т.к. скачивается модель)
8. Скопируй URL твоего сервиса (например: `https://твой-проект.railway.app`)

## Использование

После деплоя добавь URL в Vercel Environment Variables:
- Name: `AI_SERVER_URL`
- Value: `https://твой-проект.railway.app`

## Endpoints

- `POST /api/food` - поиск продукта
- `POST /api/advice` - совет по питанию
- `GET /health` - проверка здоровья сервера

## Модель

Используется `llama3.2:1b` - легковесная модель (1.3GB), быстрая и понимает русский.
