export type AccessStatus =
  | { type: 'pending_consent' }
  | { type: 'trial'; remaining_hours: number }
  | { type: 'expired' }
  | { type: 'subscribed' }

export type User = {
  id: string
  telegram_id: number
  username: string | null
  first_name: string | null
  trial_started_at: string | null
  terms_accepted_at: string | null
  subscription_activated_at: string | null
  created_at: string
  updated_at: string
}

export type AuthResponse = {
  user: User
  access: AccessStatus
}

const TRIAL_HOURS = 72

export function computeAccessStatus(user: User): AccessStatus {
  // Есть подписка — полный доступ
  if (user.subscription_activated_at) {
    return { type: 'subscribed' }
  }

  // Нет согласия с условиями
  if (!user.terms_accepted_at) {
    return { type: 'pending_consent' }
  }

  // Пробный период
  if (user.trial_started_at) {
    const trialStart = new Date(user.trial_started_at).getTime()
    const now = Date.now()
    const elapsedHours = (now - trialStart) / (1000 * 60 * 60)
    const remaining = TRIAL_HOURS - elapsedHours

    if (remaining > 0) {
      return { type: 'trial', remaining_hours: Math.ceil(remaining) }
    }
    return { type: 'expired' }
  }

  return { type: 'expired' }
}
