import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { parseInitData } from '@/lib/telegram'

const ADMIN_TELEGRAM_ID = 970308869

function isAdmin(initData: string): boolean {
  const tgUser = parseInitData(initData)
  return tgUser?.id === ADMIN_TELEGRAM_ID
}

// GET /api/admin/users — список всех пользователей
export async function GET(req: NextRequest) {
  const initData = req.headers.get('x-telegram-init-data') ?? ''
  if (!isAdmin(initData)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, telegram_id, username, first_name, trial_started_at, terms_accepted_at, subscription_activated_at, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })
  return NextResponse.json({ users: data })
}

// PATCH /api/admin/users — выдать/забрать доступ
export async function PATCH(req: NextRequest) {
  const initData = req.headers.get('x-telegram-init-data') ?? ''
  if (!isAdmin(initData)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { telegram_id, action } = await req.json()
  if (!telegram_id || !['grant', 'revoke'].includes(action)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('users')
    .update({
      subscription_activated_at: action === 'grant' ? new Date().toISOString() : null,
    })
    .eq('telegram_id', telegram_id)

  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
