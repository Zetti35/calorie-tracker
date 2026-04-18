import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'meta-llama/llama-3.1-8b-instruct:free'

export async function POST(req: NextRequest) {
  const { calories, protein, fat, carbs, goal, targetCalories } = await req.json()

  const prompt = `Ты диетолог. Дай короткий персональный совет по питанию на русском языке (2-3 предложения максимум).

Данные пользователя за сегодня:
- Съедено калорий: ${calories} ккал (норма: ${targetCalories ?? 'не указана'} ккал)
- Белки: ${protein}г, Жиры: ${fat}г, Углеводы: ${carbs}г
- Цель: ${goal ?? 'не указана'}

Дай конкретный практичный совет что добавить или убрать из рациона сегодня. Без приветствий, сразу к делу.`

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://calorie-tracker.app',
        'X-Title': 'Calorie Tracker',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 150,
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return NextResponse.json({ error: 'AI error' }, { status: 500 })

    const data = await res.json()
    const advice = data.choices?.[0]?.message?.content ?? ''

    return NextResponse.json({ advice: advice.trim() })
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
