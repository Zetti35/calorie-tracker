import { NextRequest, NextResponse } from 'next/server'
import { verifyInitData } from '@/lib/telegramServer'
import { parseInitData } from '@/lib/telegram'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

/**
 * Debug endpoint to test initData verification
 */
export async function POST(request: NextRequest) {
  try {
    const initData = request.headers.get('x-telegram-init-data')
    
    if (!initData) {
      return NextResponse.json({ error: 'No initData provided' }, { status: 400 })
    }

    // Parse initData
    const params = new URLSearchParams(initData)
    const allParams = Object.fromEntries(params.entries())
    
    // Get user
    const user = parseInitData(initData)
    
    // Verify
    const isValid = verifyInitData(initData, BOT_TOKEN)
    
    return NextResponse.json({
      valid: isValid,
      botTokenPresent: !!BOT_TOKEN,
      botTokenLength: BOT_TOKEN?.length || 0,
      initDataLength: initData.length,
      parameters: Object.keys(allParams),
      user: user,
      hasHash: !!allParams.hash,
      hashLength: allParams.hash?.length || 0,
    })
  } catch (error: any) {
    console.error('[debug-init-data] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
