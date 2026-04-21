import { NextResponse } from 'next/server'

/**
 * Test endpoint to check sync setup
 * GET /api/test-sync-setup
 */
export async function GET() {
  const checks = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    telegramBotToken: !!process.env.TELEGRAM_BOT_TOKEN,
  }

  const allGood = Object.values(checks).every(Boolean)

  return NextResponse.json({
    status: allGood ? 'ok' : 'error',
    checks,
    message: allGood 
      ? 'All environment variables are configured' 
      : 'Some environment variables are missing',
  })
}
