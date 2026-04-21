# Testing Sync API

## Prerequisites

1. Dev server running: `npm run dev`
2. Real Telegram initData from your Mini App

## Getting Telegram initData

1. Open your Telegram Mini App in browser
2. Open browser DevTools (F12)
3. In Console, run:
   ```javascript
   window.Telegram.WebApp.initData
   ```
4. Copy the output (it looks like: `query_id=...&user=...&hash=...`)
5. Add to `frontend/.env.local`:
   ```
   TEST_TELEGRAM_INIT_DATA="your_copied_initData_here"
   ```

## Running Tests

```bash
cd frontend
npx tsx scripts/test-sync-api.ts
```

## Manual Testing with curl

### POST /api/sync (Save data)

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -H "x-telegram-init-data: YOUR_INIT_DATA" \
  -d '{"data":{"entries":[],"water":{},"training":{},"reminders":{},"customFoods":[],"favorites":[],"recentFoods":[],"nutritionPlan":null,"userProfile":null,"calcHistory":[]}}'
```

### GET /api/sync (Load data)

```bash
curl http://localhost:3000/api/sync \
  -H "x-telegram-init-data: YOUR_INIT_DATA"
```

## Expected Responses

### POST Success (200)
```json
{
  "success": true,
  "updated_at": "2026-04-21T12:34:56.789Z"
}
```

### GET Success (200)
```json
{
  "data": { /* UserState */ },
  "updated_at": "2026-04-21T12:34:56.789Z"
}
```

### GET First Time (200)
```json
{
  "data": null,
  "updated_at": null
}
```

### Unauthorized (401)
```json
{
  "error": "Unauthorized"
}
```

### User Not Found (404)
```json
{
  "error": "User not found"
}
```

## Troubleshooting

- **401 Unauthorized**: Check that initData is valid and not expired
- **404 User not found**: User must exist in `users` table (login via /api/auth/login first)
- **500 Database error**: Check Supabase connection and RLS policies
