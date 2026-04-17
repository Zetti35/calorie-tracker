import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  // lava.top отправляет X-Api-Key заголовок для верификации
  const webhookSecret = process.env.LAVA_WEBHOOK_SECRET
  if (webhookSecret) {
    const apiKey = req.headers.get('x-api-key')
    if (apiKey !== webhookSecret) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Проверяем статус платежа
  const status = body.status as string
  if (status !== 'success') {
    return NextResponse.json({ ok: true })
  }

  // Извлекаем telegram_id из customFields
  const customFields = body.customFields as Record<string, string> | undefined
  const telegramId = customFields?.telegram_id
    ? parseInt(customFields.telegram_id)
    : null

  if (!telegramId) {
    console.error('Lava webhook: no telegram_id in customFields', body)
    return NextResponse.json({ error: 'No telegram_id' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Активируем подписку
  const { error } = await supabase
    .from('users')
    .update({ subscription_activated_at: new Date().toISOString() })
    .eq('telegram_id', telegramId)

  if (error) {
    console.error('Supabase update error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  // Сохраняем платёж
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('telegram_id', telegramId)
    .single()

  if (user) {
    await supabase.from('payments').insert({
      order_id: String(body.id ?? body.invoiceId ?? Date.now()),
      user_id: user.id,
      amount: Number(body.amount ?? 50),
      status: 'completed',
    })
  }

  return NextResponse.json({ ok: true })
}
