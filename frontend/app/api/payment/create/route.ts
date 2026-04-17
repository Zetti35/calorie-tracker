import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { parseInitData } from '@/lib/telegram'

const LAVA_PRODUCT_URL = 'https://app.lava.top/products/fd592cb9-fdce-44b9-a82a-3fd3dc13cfa4'
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

  // Прямая ссылка на страницу оплаты lava.top с email пользователя
  const paymentUrl = `${LAVA_PRODUCT_URL}?client_email=user${telegramId}%40calorie-tracker.app`

  return NextResponse.json({ payment_url: paymentUrl })
}
