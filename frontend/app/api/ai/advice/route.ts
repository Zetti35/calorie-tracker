import { NextRequest, NextResponse } from 'next/server'

const HF_TOKEN = process.env.HF_TOKEN!
const HF_URL = 'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-1.5B-Instruct'

export async function POST(req: NextRequest) {
  const { calories, protein, fat, carbs, goal, targetCalories } = await req.json()

  const prompt = `Ты диетолог. Дай короткий совет (2-3 предложения) на русском.
Данные: ${calories} ккал (норма ${targetCalories ?? '?'}), Б${protein}г Ж${fat}г У${carbs}г, цель: ${goal ?? '?'}.
Что добавить/убрать из рациона сегодня? Без приветствий.`

  try {
    const res = await fetch(HF_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 150, temperature: 0.7 },
      }),
    })

    if (!res.ok) return NextResponse.json({ error: 'AI error' }, { status: 500 })

    const data = await res.json()
    const advice = data[0]?.generated_text ?? ''

    return NextResponse.json({ advice: advice.trim() })
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
