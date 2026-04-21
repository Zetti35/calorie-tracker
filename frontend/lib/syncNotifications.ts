'use client'

/**
 * Notification system for sync events
 * Uses browser notifications or in-app toasts
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  timestamp: number
}

// In-memory notification store
let notifications: Notification[] = []
let listeners: Array<(notifications: Notification[]) => void> = []

/**
 * Show a notification
 */
export function showNotification(type: NotificationType, message: string): void {
  const notification: Notification = {
    id: `${Date.now()}-${Math.random()}`,
    type,
    message,
    timestamp: Date.now(),
  }

  notifications.push(notification)
  notifyListeners()

  console.log(`[Notification] ${type.toUpperCase()}: ${message}`)

  // Auto-remove after 5 seconds
  setTimeout(() => {
    removeNotification(notification.id)
  }, 5000)
}

/**
 * Remove a notification
 */
export function removeNotification(id: string): void {
  notifications = notifications.filter((n) => n.id !== id)
  notifyListeners()
}

/**
 * Subscribe to notification changes
 */
export function subscribeToNotifications(
  callback: (notifications: Notification[]) => void
): () => void {
  listeners.push(callback)

  // Return unsubscribe function
  return () => {
    listeners = listeners.filter((l) => l !== callback)
  }
}

/**
 * Get current notifications
 */
export function getNotifications(): Notification[] {
  return [...notifications]
}

/**
 * Notify all listeners
 */
function notifyListeners(): void {
  listeners.forEach((listener) => listener([...notifications]))
}

/**
 * Show conflict notification
 */
export function showConflictNotification(): void {
  showNotification(
    'warning',
    'Данные обновлены с сервера. Изменения с другого устройства применены.'
  )
}

/**
 * Show migration success notification
 */
export function showMigrationSuccessNotification(): void {
  showNotification('success', 'Ваши данные успешно синхронизированы с сервером')
}

/**
 * Show sync error notification
 */
export function showSyncErrorNotification(error: string): void {
  if (error.includes('401')) {
    showNotification('error', 'Ошибка аутентификации. Войдите заново.')
  } else if (error.includes('500')) {
    showNotification('error', 'Ошибка сервера. Попробуйте позже.')
  } else {
    showNotification('error', 'Не удалось синхронизировать данные. Проверьте подключение к интернету.')
  }
}

/**
 * Show data size warning
 */
export function showDataSizeWarning(sizeMB: string): void {
  showNotification(
    'warning',
    `Данные слишком большие (${sizeMB}MB). Максимум 1MB. Синхронизация отключена.`
  )
}
