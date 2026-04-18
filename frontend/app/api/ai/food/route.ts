import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'meta-llama/llama-3.1-8b-instruct:free'

export async function POST(req: NextRequest) {
  const { query } = await req.json()
  if (!query?.trim()) {
    return NextResponse.json({ error: 'No query' }, { status: 400 })
  }

  const prompt = `Ты эксперт по питанию. Пользователь ввёл название продукта: "${query}".

Верни ТОЛЬКО JSON объект (без markdown, без пояснений) с КБЖУ на 100г продукта:
{
  "name": "точное название продукта на русском",
  "calories": число,
  "protein": число,
  "fat": число,
  "carbs": число
}

Если продукт не распознан — верни {"error": "not_found"}.
Все числа — целые или с одним знаком после запятой.`

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
        temperature: 0.1,
        max_tokens: 200,
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('OpenRouter error:', err)
      return NextResponse.json({ error: 'AI error' }, { status: 500 })
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content ?? ''

    // Извлекаем JSON из ответа
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Parse error' }, { status: 500 })

    const food = JSON.parse(jsonMatch[0])
    if (food.error) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    return NextResponse.json({ food })
  } catch (err) {
    console.error('OpenRouter request failed:', err)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
