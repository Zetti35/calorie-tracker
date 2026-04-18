import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

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
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Gemini error:', err)
      return NextResponse.json({ error: 'AI error' }, { status: 500 })
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Parse error' }, { status: 500 })

    const food = JSON.parse(jsonMatch[0])
    if (food.error) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    return NextResponse.json({ food })
  } catch (err) {
    console.error('Gemini request failed:', err)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
