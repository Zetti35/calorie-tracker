import { NextRequest, NextResponse } from 'next/server'

/**
 * Debug endpoint to see what dataCheckString is generated
 */
export async function POST(request: NextRequest) {
  try {
    const initData = request.headers.get('x-telegram-init-data')
    
    if (!initData) {
      return NextResponse.json({ error: 'No initData provided' }, { status: 400 })
    }

    // Parse initData manually (same as verifyInitData)
    const pairs = initData.split('&')
    const seenKeys = new Set<string>()
    const dataCheckPairs: string[] = []
    let hash = ''
    
    for (const pair of pairs) {
      const eqIndex = pair.indexOf('=')
      if (eqIndex === -1) continue
      
      const key = pair.substring(0, eqIndex)
      
      if (key === 'hash') {
        const value = pair.substring(eqIndex + 1)
        hash = value
      } else if (key !== 'signature' && !seenKeys.has(key)) {
        seenKeys.add(key)
        dataCheckPairs.push(pair)
      }
    }
    
    // Sort alphabetically and join with newline
    const dataCheckString = dataCheckPairs.sort().join('\n')

    return NextResponse.json({
      dataCheckString: dataCheckString,
      dataCheckStringLength: dataCheckString.length,
      pairs: dataCheckPairs,
      hash: hash,
      parameters: Array.from(seenKeys),
    })
  } catch (error: any) {
    console.error('[debug-datacheck] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
