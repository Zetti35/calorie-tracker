import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { verifyInitData, parseInitData } from '@/lib/telegram'
import { computeAccessStatus, type AuthResponse } from '@/lib/access'

export async function GET(req: NextRequest) {
  const initData = req.headers.get('x-telegram-init-data') ?? ''
  const botToken = process.env.TELEGRAM_BOT_TOKEN ?? ''

  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev && !verifyInitData(initData, botToken)) {
    return NextResponse.json({ error: 'Invalid initData' }, { status: 401 })
  }

  const tgUser = parseInitData(initData)
  const telegramId = tgUser?.id ?? 0

  if (!telegramId && !isDev) {
    return NextResponse.json({ error: 'Missing user data' }, { status: 401 })
  }

  const supabase = createServerClient()

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const access = computeAccessStatus(user)
  return NextResponse.json({ user, access } satisfies AuthResponse)
}
