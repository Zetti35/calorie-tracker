import { createHmac } from 'crypto'

/**
 * Server-only Telegram initData verification using Node.js crypto
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyInitData(initData: string, botToken: string): boolean {
  if (!initData || !botToken) return false

  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return false

    // Remove hash from parameters
    params.delete('hash')

    // Sort remaining parameters by key and build data_check_string
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')

    // secret_key = HMAC-SHA256(bot_token, "WebAppData")
    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()

    // computed_hash = HMAC-SHA256(data_check_string, secret_key)
    const computedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    return computedHash === hash
  } catch (error) {
    console.error('[verifyInitData] Error:', error)
    return false
  }
}
