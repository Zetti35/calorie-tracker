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
    // Parse initData manually to preserve URL encoding
    // and handle duplicate keys (take only first occurrence)
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
        // Keep original URL-encoded values, skip duplicates
        seenKeys.add(key)
        dataCheckPairs.push(pair)
      }
    }
    
    if (!hash) {
      console.error('[verifyInitData] No hash in initData')
      return false
    }
    
    // Sort alphabetically and join with newline
    const dataCheckString = dataCheckPairs.sort().join('\n')

    console.log('[verifyInitData] Parameters:', Array.from(seenKeys).join(', '))
    console.log('[verifyInitData] dataCheckString preview:', dataCheckString.substring(0, 150))

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
