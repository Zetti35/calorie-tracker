import { NextRequest, NextResponse } from 'next/server'

const AI_SERVER_URL = process.env.AI_SERVER_URL!

export async function POST(req: NextRequest) {
  const { query } = await req.json()
  if (!query?.trim()) {
    return NextResponse.json({ error: 'No query' }, { status: 400 })
  }

  try {
    const res = await fetch(`${AI_SERVER_URL}/api/food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
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
