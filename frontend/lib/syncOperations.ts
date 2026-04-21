'use client'

/**
 * Sync operations for manual sync control
 * These functions can be used outside of the middleware
 */

// Helper to get Telegram initData
function getInitData(): string {
  if (typeof window === 'undefined') return ''
  return window.Telegram?.WebApp?.initData ?? ''
}

export interface SyncResult {
  success: boolean
  updated_at?: string
  error?: string
}

export interface LoadResult {
  data: any | null
  updated_at: string | null
  error?: string
}

/**
 * Sync state to server (POST /api/sync)
 */
export async function syncToServer(state: any): Promise<SyncResult> {
  const initData = getInitData()
  if (!initData) {
    return { success: false, error: 'No authentication' }
  }

  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-init-data': initData,
      },
      body: JSON.stringify({ data: state }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[syncToServer] Error:', error)
      return { success: false, error: error.error || `HTTP ${response.status}` }
    }

    const result = await response.json()
    console.log('[syncToServer] Success:', result.updated_at)
    return { success: true, updated_at: result.updated_at }
  } catch (error: any) {
    console.error('[syncToServer] Network error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Load state from server (GET /api/sync)
 */
export async function fetchServerData(): Promise<LoadResult> {
  const initData = getInitData()
  if (!initData) {
    return { data: null, updated_at: null, error: 'No authentication' }
  }

  try {
    const response = await fetch('/api/sync', {
      method: 'GET',
      headers: {
        'x-telegram-init-data': initData,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[fetchServerData] Error:', error)
      return { data: null, updated_at: null, error: error.error || `HTTP ${response.status}` }
    }

    const result = await response.json()
    console.log('[fetchServerData] Success:', result.updated_at)
    return { data: result.data, updated_at: result.updated_at }
  } catch (error: any) {
    console.error('[fetchServerData] Network error:', error)
    return { data: null, updated_at: null, error: error.message }
  }
}

/**
 * Manual sync trigger (for retry button)
 */
export async function manualSync(state: any): Promise<SyncResult> {
  console.log('[manualSync] Triggering manual sync...')
  return syncToServer(state)
}
