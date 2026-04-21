'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { manualSync } from '@/lib/syncOperations'

export interface SyncStatusIndicatorProps {
  className?: string
}

export function SyncStatusIndicator({ className = '' }: SyncStatusIndicatorProps) {
  const syncState = useAppStore((state) => (state as any)._sync)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  // Show success indicator for 2 seconds after sync
  useEffect(() => {
    if (syncState?.status === 'idle' && syncState?.lastSyncedAt) {
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [syncState?.lastSyncedAt])

  // Handle manual retry
  const handleRetry = async () => {
    if (isRetrying) return

    setIsRetrying(true)
    const state = useAppStore.getState()
    await manualSync(state)
    setIsRetrying(false)
  }

  if (!syncState) {
    return null
  }

  const { status, error } = syncState

  // Don't show indicator when idle and not showing success
  if (status === 'idle' && !showSuccess) {
    return null
  }

  // Determine icon and color based on status
  let icon = ''
  let color = ''
  let label = ''
  let tooltip = ''
  let clickable = false

  if (status === 'syncing' || isRetrying) {
    icon = '⟳'
    color = 'text-blue-500'
    label = 'Синхронизация...'
    tooltip = 'Синхронизация данных с сервером'
  } else if (status === 'error') {
    icon = '⚠'
    color = 'text-yellow-500'
    label = 'Ошибка'
    tooltip = error || 'Ошибка синхронизации. Нажмите для повтора.'
    clickable = true
  } else if (status === 'offline') {
    icon = '○'
    color = 'text-gray-400'
    label = 'Offline'
    tooltip = 'Нет подключения к интернету'
  } else if (showSuccess) {
    icon = '✓'
    color = 'text-green-500'
    label = 'Синхронизировано'
    tooltip = 'Данные синхронизированы'
  }

  return (
    <div
      className={`flex items-center gap-2 text-sm ${className}`}
      title={tooltip}
      onClick={clickable ? handleRetry : undefined}
      style={{ cursor: clickable ? 'pointer' : 'default' }}
    >
      <span
        className={`${color} ${status === 'syncing' || isRetrying ? 'animate-spin' : ''}`}
        style={{ fontSize: '16px' }}
      >
        {icon}
      </span>
      <span className={`${color} hidden sm:inline`}>{label}</span>
    </div>
  )
}
