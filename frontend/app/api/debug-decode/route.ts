import { NextRequest, NextResponse } from 'next/server'

/**
 * Debug endpoint to decode initData and see actual values
 */
export async function POST(request: NextRequest) {
  try {
    const initData = request.headers.get('x-telegram-init-data')
    
    if (!initData) {
      return NextResponse.json({ error: 'No initData provided' }, { status: 400 })
    }

    // Parse and decode to see what Telegram actually sent
    const params = new URLSearchParams(initData)
    const decoded: Record<string, string> = {}
    
    for (const [key, value] of params.entries()) {
      decoded[key] = value
    }

    // Show user parameter in detail
    const userParam = params.get('user')
    let userObject = null
    if (userParam) {
      try {
        userObject = JSON.parse(userParam)
      } catch (e) {
        userObject = { error: 'Failed to parse user JSON' }
      }
    }

    return NextResponse.json({
      decoded: decoded,
      userObject: userObject,
      photoUrl: userObject?.photo_url || null,
    })
  } catch (error: any) {
    console.error('[debug-decode] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
