import { NextRequest, NextResponse } from 'next/server'

/**
 * Debug endpoint to see raw initData
 */
export async function POST(request: NextRequest) {
  try {
    const initData = request.headers.get('x-telegram-init-data')
    
    if (!initData) {
      return NextResponse.json({ error: 'No initData provided' }, { status: 400 })
    }

    // Show raw initData
    return NextResponse.json({
      raw: initData,
      length: initData.length,
      preview: initData.substring(0, 200),
    })
  } catch (error: any) {
    console.error('[debug-raw-initdata] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
