import { createHmac } from 'crypto'

/**
 * Server-only Telegram initData verification using Node.js crypto
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyInitData(initData: string, botToken: string): boolean {
  if (!initData || !botToken) {
    console.error('[verifyInitData] Missing initData or botToken')
    return false
  }

  try {
    // Parse initData properly
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    
    if (!hash) {
      console.error('[verifyInitData] No hash in initData')
      return false
    }

    // Build data check string according to Telegram spec
    // https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
    const dataCheckPairs: string[] = []
    
    for (const [key, value] of params.entries()) {
      // Skip hash and signature
      if (key === 'hash' || key === 'signature') {
        continue
      }
      dataCheckPairs.push(`${key}=${value}`)
    }
    
    // Sort alphabetically and join with newline
    const dataCheckString = dataCheckPairs.sort().join('\n')

    console.log('[verifyInitData] Parameters:', dataCheckPairs.map(p => p.split('=')[0]).join(', '))
    console.log('[verifyInitData] dataCheckString:', dataCheckString)

    // secret_key = HMAC-SHA256(bot_token, "WebAppData")
    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()

    // computed_hash = HMAC-SHA256(data_check_string, secret_key)
    const computedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    const isValid = computedHash === hash
    console.log('[verifyInitData] Hash match:', isValid)
    
    if (!isValid) {
      console.log('[verifyInitData] Expected hash:', hash)
      console.log('[verifyInitData] Computed hash:', computedHash)
    }

    return isValid
  } catch (error) {
    console.error('[verifyInitData] Error:', error)
    return false
  }
}
