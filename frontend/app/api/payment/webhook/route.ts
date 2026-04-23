import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  console.log('[Webhook] Received payment webhook')
  
  // lava.top отправляет Basic Auth заголовок для верификации
  const webhookSecret = process.env.LAVA_WEBHOOK_SECRET
  const authHeader = req.headers.get('authorization')
  
  console.log('[Webhook] Secret configured:', !!webhookSecret)
  console.log('[Webhook] Auth header present:', !!authHeader)
  
  if (webhookSecret && authHeader) {
    // Basic Auth формат: "Basic base64(username:password)"
    // Lava.top отправляет в формате "user:pass"
    const base64Credentials = authHeader.replace('Basic ', '')
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
    console.log('[Webhook] Decoded credentials format:', credentials.includes(':') ? 'valid' : 'invalid')
    
    // Извлекаем пароль (после двоеточия)
    const password = credentials.split(':')[1]
    console.log('[Webhook] Password match:', password === webhookSecret)
    
    if (password !== webhookSecret) {
      console.error('[Webhook] Invalid credentials')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
    console.log('[Webhook] Received body:', JSON.stringify(body, null, 2))
  } catch (e) {
    console.error('[Webhook] Failed to parse body:', e)
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Проверяем статус платежа
  const status = body.status as string
  console.log('[Webhook] Payment status:', status)
  
  if (status !== 'success') {
    console.log('[Webhook] Status not success, ignoring')
    return NextResponse.json({ ok: true })
  }

  // Извлекаем telegram_id из customFields или email
  const customFields = body.customFields as Record<string, string> | undefined
  let telegramId = customFields?.telegram_id
    ? parseInt(customFields.telegram_id)
    : null

  console.log('[Webhook] customFields:', customFields)
  console.log('[Webhook] telegram_id from customFields:', telegramId)

  // Если нет в customFields — пробуем извлечь из email (user{id}@calorie-tracker.app)
  if (!telegramId) {
    const email = body.buyerEmail as string ?? body.email as string ?? ''
    console.log('[Webhook] Trying to extract from email:', email)
    const match = email.match(/^user(\d+)@/)
    if (match) {
      telegramId = parseInt(match[1])
      console.log('[Webhook] Extracted telegram_id from email:', telegramId)
    }
  }

  if (!telegramId) {
    console.error('[Webhook] No telegram_id found in webhook data')
    return NextResponse.json({ error: 'No telegram_id' }, { status: 400 })
  }

  console.log('[Webhook] Activating subscription for telegram_id:', telegramId)

  const supabase = createServerClient()

  // Активируем подписку
  const { error } = await supabase
    .from('users')
    .update({ subscription_activated_at: new Date().toISOString() })
    .eq('telegram_id', telegramId)

  if (error) {
    console.error('[Webhook] Supabase update error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  console.log('[Webhook] Subscription activated successfully')

  // Сохраняем платёж
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('telegram_id', telegramId)
    .single()

  if (user) {
    const paymentData = {
      order_id: String(body.id ?? body.invoiceId ?? Date.now()),
      user_id: user.id,
      amount: Number(body.amount ?? 50),
      status: 'completed',
    }
    console.log('[Webhook] Saving payment:', paymentData)
    
    await supabase.from('payments').insert(paymentData)
    console.log('[Webhook] Payment saved')
  }

  console.log('[Webhook] Webhook processed successfully')
  return NextResponse.json({ ok: true })
}
