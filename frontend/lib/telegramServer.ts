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
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) {
      console.error('[verifyInitData] No hash in initData')
      return false
    }

    // Remove hash from parameters
    params.delete('hash')

    // Sort remaining parameters by key and build data_check_string
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')

    console.log('[verifyInitData] Parameters:', Array.from(params.keys()).join(', '))
    console.log('[verifyInitData] dataCheckString preview:', dataCheckString.substring(0, 100) + '...')

    // secret_key = HMAC-SHA256(bot_token, "WebAppData")
    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()

    // computed_hash = HMAC-SHA256(data_check_string, secret_key)
    const computedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    const isValid = computedHash === hash
    console.log('[verifyInitData] Hash match:', isValid)
    
    if (!isValid) {
      console.log('[verifyInitData] Expected hash:', hash.substring(0, 16) + '...')
      console.log('[verifyInitData] Computed hash:', computedHash.substring(0, 16) + '...')
    }

    return isValid
  } catch (error) {
    console.error('[verifyInitData] Error:', error)
    return false
  }
}
