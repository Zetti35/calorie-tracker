import { NextRequest, NextResponse } from 'next/server'

const AI_SERVER_URL = process.env.AI_SERVER_URL!

export async function POST(req: NextRequest) {
  const { calories, protein, fat, carbs, goal, targetCalories } = await req.json()

  try {
    const res = await fetch(`${AI_SERVER_URL}/api/advice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calories, protein, fat, carbs, goal, targetCalories }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('AI server error:', res.status, err)
      return NextResponse.json({ error: 'AI error' }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('AI server request failed:', err)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
