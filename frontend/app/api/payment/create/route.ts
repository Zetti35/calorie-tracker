import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { parseInitData } from '@/lib/telegram'

const LAVA_API_KEY = process.env.LAVA_API_KEY!
const LAVA_PRODUCT_ID = process.env.LAVA_PRODUCT_ID!
const APP_URL = 'https://calorie-tracker-ashy-beta.vercel.app'

export async function POST(req: NextRequest) {
  const initData = req.headers.get('x-telegram-init-data') ?? ''
  const isDev = process.env.NODE_ENV === 'development'

  if (!initData && !isDev) {
    return NextResponse.json({ error: 'Missing initData' }, { status: 401 })
  }

  const tgUser = parseInitData(initData)
  const telegramId = tgUser?.id ?? 0

  const supabase = createServerClient()

  const { data: user, error } = await supabase
    .from('users')
    .select('id, telegram_id, subscription_activated_at')
    .eq('telegram_id', telegramId)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (user.subscription_activated_at) {
    return NextResponse.json({ error: 'Already subscribed' }, { status: 400 })
  }

  const body = {
    email: `user${telegramId}@calorie-tracker.app`,
    offerId: LAVA_PRODUCT_ID,
    successUrl: `${APP_URL}/?payment=success`,
    buyerLanguage: 'RU',
    currency: 'RUB',
    customFields: {
      telegram_id: String(telegramId),
      user_id: user.id,
    },
  }

  console.log('Lava.top request:', JSON.stringify(body))

  const res = await fetch('https://gate.lava.top/api/v2/invoice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': LAVA_API_KEY,
    },
    body: JSON.stringify(body),
  })

  const responseText = await res.text()
  console.log('Lava.top response status:', res.status, 'body:', responseText)

  if (!res.ok) {
    return NextResponse.json({ error: 'Payment creation failed', details: responseText }, { status: 500 })
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(responseText)
  } catch {
    return NextResponse.json({ error: 'Invalid response from lava.top' }, { status: 500 })
  }

  const paymentUrl = (data.paymentUrl ?? data.url ?? data.payment_url) as string | undefined

  if (!paymentUrl) {
    console.error('Lava.top no payment URL:', data)
    return NextResponse.json({ error: 'No payment URL', data }, { status: 500 })
  }

  return NextResponse.json({ payment_url: paymentUrl })
}
