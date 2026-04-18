import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

export async function POST(req: NextRequest) {
  const { calories, protein, fat, carbs, goal, targetCalories } = await req.json()

  const prompt = `Ты диетолог. Дай короткий персональный совет по питанию на русском языке (2-3 предложения максимум).

Данные пользователя за сегодня:
- Съедено калорий: ${calories} ккал (норма: ${targetCalories ?? 'не указана'} ккал)
- Белки: ${protein}г, Жиры: ${fat}г, Углеводы: ${carbs}г
- Цель: ${goal ?? 'не указана'}

Дай конкретный практичный совет что добавить или убрать из рациона сегодня. Без приветствий, сразу к делу.`

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 150 },
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return NextResponse.json({ error: 'AI error' }, { status: 500 })

    const data = await res.json()
    const advice = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    return NextResponse.json({ advice: advice.trim() })
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
