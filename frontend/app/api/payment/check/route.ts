import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { parseInitData } from '@/lib/telegram'

/**
 * POST /api/payment/check - Manually check and activate subscription
 * 
 * This endpoint allows users to manually verify their payment status
 * and activate subscription if payment was successful
 */
export async function POST(req: NextRequest) {
  const initData = req.headers.get('x-telegram-init-data') ?? ''
  const isDev = process.env.NODE_ENV === 'development'

  if (!initData && !isDev) {
    return NextResponse.json({ error: 'Missing initData' }, { status: 401 })
  }

  const tgUser = parseInitData(initData)
  const telegramId = tgUser?.id ?? 0

  console.log('[Payment Check] Checking payment for telegram_id:', telegramId)

  const supabase = createServerClient()

  // Get user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, telegram_id, subscription_activated_at')
    .eq('telegram_id', telegramId)
    .single()

  if (userError || !user) {
    console.error('[Payment Check] User not found:', telegramId)
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Check if already subscribed
  if (user.subscription_activated_at) {
    console.log('[Payment Check] User already subscribed')
    return NextResponse.json({ 
      success: true, 
      already_subscribed: true,
      message: 'Подписка уже активна'
    })
  }

  // Check if there's a completed payment for this user
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (paymentError || !payment) {
    console.log('[Payment Check] No completed payment found')
    return NextResponse.json({ 
      success: false,
      message: 'Оплата не найдена. Пожалуйста, завершите оплату сначала.'
    })
  }

  console.log('[Payment Check] Found completed payment, activating subscription')

  // Activate subscription
  const { error: updateError } = await supabase
    .from('users')
    .update({ subscription_activated_at: new Date().toISOString() })
    .eq('telegram_id', telegramId)

  if (updateError) {
    console.error('[Payment Check] Failed to activate subscription:', updateError)
    return NextResponse.json({ error: 'Failed to activate subscription' }, { status: 500 })
  }

  console.log('[Payment Check] Subscription activated successfully')

  return NextResponse.json({ 
    success: true,
    activated: true,
    message: 'Подписка успешно активирована! 🎉'
  })
}
