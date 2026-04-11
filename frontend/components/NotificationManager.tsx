'use client'
import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export default function NotificationManager() {
  const { entries, reminders } = useAppStore()

  useEffect(() => {
    if (!reminders?.enabled) return
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const interval = setInterval(() => {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      const todayStr = now.toISOString().slice(0, 10)
      const todayEntries = entries.filter(e => e.timestamp.slice(0, 10) === todayStr)

      for (const reminder of reminders.times) {
        const reminderMinutes = toMinutes(reminder.time)
        // Fire within a 1-minute window
        if (Math.abs(currentMinutes - reminderMinutes) !== 0) continue

        // Check if there are entries in the last 2 hours
        const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
        const recentEntry = todayEntries.some(e => new Date(e.timestamp).getTime() > twoHoursAgo)
        if (recentEntry) continue

        new Notification('🥗 Калорийный Трекер', {
          body: `${reminder.label} — не забудь записать что ел!`,
          icon: '/favicon.ico',
          tag: `meal-reminder-${reminder.time}`,
        })
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [entries, reminders])

  return null
}
