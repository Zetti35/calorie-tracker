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
    
    // Get detailed verification info
    const hash = params.get('hash')
    params.delete('hash')
    params.delete('signature')
    
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')
    
    return NextResponse.json({
      valid: isValid,
      botTokenPresent: !!BOT_TOKEN,
      botTokenLength: BOT_TOKEN?.length || 0,
      initDataLength: initData.length,
      parameters: Object.keys(allParams),
      parametersAfterFilter: Array.from(params.keys()),
      user: user,
      hasHash: !!allParams.hash,
      hashLength: allParams.hash?.length || 0,
      hasSignature: !!allParams.signature,
      dataCheckStringPreview: dataCheckString.substring(0, 200),
      hashPreview: hash?.substring(0, 16),
    })
  } catch (error: any) {
    console.error('[debug-init-data] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
