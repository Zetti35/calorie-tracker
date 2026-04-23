export type TelegramUser = {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

/**
 * Извлекает данные пользователя из initData.
 * Работает как на клиенте, так и на сервере.
 */
export function parseInitData(initData: string): TelegramUser | null {
  try {
    const params = new URLSearchParams(initData)
    const userStr = params.get('user')
    if (!userStr) return null
    return JSON.parse(userStr) as TelegramUser
  } catch {
    return null
  }
}
