import { NextRequest, NextResponse } from 'next/server'

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY!
const CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions'

export async function POST(req: NextRequest) {
  const { calories, protein, fat, carbs, goal, targetCalories } = await req.json()

  const prompt = `Ты диетолог. Дай короткий совет (2-3 предложения) на русском.
Данные: ${calories} ккал (норма ${targetCalories ?? '?'}), Б${protein}г Ж${fat}г У${carbs}г, цель: ${goal ?? '?'}.
Что добавить/убрать из рациона сегодня? Без приветствий.`

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
        temperature: 0.7,
        max_tokens: 150,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Cerebras error:', res.status, err)
      return NextResponse.json({ error: 'AI error' }, { status: 500 })
    }

    const data = await res.json()
    const advice = data.choices?.[0]?.message?.content ?? ''

    return NextResponse.json({ advice: advice.trim() })
  } catch (err) {
    console.error('Cerebras request failed:', err)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
