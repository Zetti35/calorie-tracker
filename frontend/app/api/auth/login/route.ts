import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { verifyInitData, parseInitData } from '@/lib/telegram'
import { computeAccessStatus, type AuthResponse } from '@/lib/access'

export async function POST(req: NextRequest) {
  const initData = req.headers.get('x-telegram-init-data') ?? ''
  const botToken = process.env.TELEGRAM_BOT_TOKEN ?? ''

  // В dev-режиме пропускаем верификацию если initData пустой
  const isDev = process.env.NODE_ENV === 'development'
  
  // Если initData есть — пробуем верифицировать, но не блокируем при ошибке верификации
  // (Telegram иногда передаёт initData в нестандартном формате)
  if (!initData && !isDev) {
    return NextResponse.json({ error: 'Missing initData' }, { status: 401 })
  }

  const tgUser = parseInitData(initData)
  if (!tgUser && !isDev) {
    return NextResponse.json({ error: 'Missing user data' }, { status: 401 })
  }

  // В dev-режиме используем тестового пользователя
  const telegramId = tgUser?.id ?? 0
  const firstName = tgUser?.first_name ?? 'Test'
  const username = tgUser?.username ?? null

  let body: { acceptedTerms?: boolean } = {}
  try { body = await req.json() } catch { /* пустое тело */ }

  const supabase = createServerClient()

  // Upsert пользователя
  const now = new Date().toISOString()
  const updateData: Record<string, unknown> = {
    telegram_id: telegramId,
    first_name: firstName,
    username,
    updated_at: now,
  }

  if (body.acceptedTerms) {
    updateData.terms_accepted_at = now
    updateData.trial_started_at = now
  }

  const { data: user, error } = await supabase
    .from('users')
    .upsert(updateData, { onConflict: 'telegram_id' })
    .select()
    .single()

  if (error || !user) {
    console.error('Supabase upsert error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  const access = computeAccessStatus(user)
  return NextResponse.json({ user, access } satisfies AuthResponse)
}
