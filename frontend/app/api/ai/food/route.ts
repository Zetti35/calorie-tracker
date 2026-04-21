import { NextRequest, NextResponse } from 'next/server'

const HF_TOKEN = process.env.HF_TOKEN!
const HF_URL = 'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-1.5B-Instruct'

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
    const res = await fetch(HF_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 150, temperature: 0.1 },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('HF error:', res.status, err)
      return NextResponse.json({ error: 'AI error' }, { status: 500 })
    }

    const data = await res.json()
    const text = data[0]?.generated_text ?? ''

    const jsonMatch = text.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Parse error' }, { status: 500 })

    const food = JSON.parse(jsonMatch[0])
    if (food.error) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    return NextResponse.json({ food })
  } catch (err) {
    console.error('HF request failed:', err)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
