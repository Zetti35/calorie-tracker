import { NextRequest, NextResponse } from 'next/server'

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY!
const CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions'

export async function POST(req: NextRequest) {
  const { query } = await req.json()
  if (!query?.trim()) {
    return NextResponse.json({ error: 'No query' }, { status: 400 })
  }

  const prompt = `Ты эксперт по питанию. Пользователь ввёл: "${query}".
Верни ТОЛЬКО JSON (без markdown):
{"name":"название на русском","calories":число,"protein":число,"fat":число,"carbs":число}
Если не распознан: {"error":"not_found"}`

  try {
    const res = await fetch(CEREBRAS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.1-8b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 150,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Cerebras error:', res.status, err)
      return NextResponse.json({ error: 'AI error' }, { status: 500 })
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content ?? ''

    const jsonMatch = text.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Parse error' }, { status: 500 })

    const food = JSON.parse(jsonMatch[0])
    if (food.error) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    return NextResponse.json({ food })
  } catch (err) {
    console.error('Cerebras request failed:', err)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
