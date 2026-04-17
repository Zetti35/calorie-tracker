import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { verifyInitData, parseInitData } from '@/lib/telegram'

const LAVA_API_URL = 'https://gate.lava.top/api/v2'
const LAVA_API_KEY = process.env.LAVA_API_KEY!
const LAVA_PRODUCT_ID = process.env.LAVA_PRODUCT_ID!

export async function POST(req: NextRequest) {
  const initData = req.headers.get('x-telegram-init-data') ?? ''
  const botToken = process.env.TELEGRAM_BOT_TOKEN ?? ''
  const isDev = process.env.NODE_ENV === 'development'

  if (!initData && !isDev) {
    return NextResponse.json({ error: 'Missing initData' }, { status: 401 })
  }

  const tgUser = parseInitData(initData)
  const telegramId = tgUser?.id ?? 0

  const supabase = createServerClient()

  // Находим пользователя
  const { data: user, error } = await supabase
    .from('users')
    .select('id, telegram_id, subscription_activated_at')
    .eq('telegram_id', telegramId)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Уже оплачено
  if (user.subscription_activated_at) {
    return NextResponse.json({ error: 'Already subscribed' }, { status: 400 })
  }

  // Создаём инвойс через lava.top API
  const successUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://calorie-tracker-ashy-beta.vercel.app'}/?payment=success`

  const body = {
    email: `user_${telegramId}@calorie-tracker.app`,
    offerId: LAVA_PRODUCT_ID,
    successUrl,
    buyerLanguage: 'RU',
    currency: 'RUB',
    customFields: {
      telegram_id: String(telegramId),
      user_id: user.id,
    },
  }

  const res = await fetch(`${LAVA_API_URL}/invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': LAVA_API_KEY,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Lava.top invoice error:', err)
    return NextResponse.json({ error: 'Payment creation failed' }, { status: 500 })
  }

  const data = await res.json()
  const paymentUrl = data.paymentUrl ?? data.url ?? data.payment_url

  if (!paymentUrl) {
    console.error('Lava.top no payment URL in response:', data)
    return NextResponse.json({ error: 'No payment URL' }, { status: 500 })
  }

  return NextResponse.json({ payment_url: paymentUrl })
}
