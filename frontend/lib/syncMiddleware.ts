'use client'
import { StateCreator, StoreMutatorIdentifier } from 'zustand'

// Sync middleware configuration
export interface SyncMiddlewareConfig {
  debounceMs: number // Default: 2000
  maxRetries: number // Default: 3
  retryDelayMs: number // Default: 5000
  maxDataSizeBytes: number // Default: 1MB
}

// Sync state tracked in store
export interface SyncState {
  status: 'idle' | 'syncing' | 'error' | 'offline'
  lastSyncedAt: number | null
  pendingSync: boolean
  error: string | null
}

// Default configuration
const DEFAULT_CONFIG: SyncMiddlewareConfig = {
  debounceMs: 2000,
  maxRetries: 3,
  retryDelayMs: 5000,
  maxDataSizeBytes: 1024 * 1024, // 1MB
}

type SyncMiddleware = <T extends object>(
  config: Partial<SyncMiddlewareConfig>,
  storeInitializer: StateCreator<T, [], []>
) => StateCreator<T & { _sync: SyncState }, [], []>

// Helper to get Telegram initData
function getInitData(): string {
  if (typeof window === 'undefined') return ''
  return window.Telegram?.WebApp?.initData ?? ''
}

// Helper to check if online
function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}

/**
 * Sync middleware for Zustand
 * Automatically syncs store state to server with debouncing
 */
export const syncMiddleware: SyncMiddleware =
  (userConfig, storeInitializer) => (set, get, api) => {
    const config = { ...DEFAULT_CONFIG, ...userConfig }

    // Sync state
    let syncState: SyncState = {
      status: 'idle',
      lastSyncedAt: null,
      pendingSync: false,
      error: null,
    }

    // Debounce timer
    let debounceTimer: NodeJS.Timeout | null = null

    // Retry state
    let retryCount = 0

    // Update sync state
    const updateSyncState = (partial: Partial<SyncState>) => {
      syncState = { ...syncState, ...partial }
      // Update store with new sync state
      set({ _sync: syncState } as any, false)
    }

    // Sync to server
    const syncToServer = async (state: any) => {
      const initData = getInitData()
      if (!initData) {
        console.warn('[Sync] No Telegram initData available')
        updateSyncState({ status: 'error', error: 'No authentication' })
        return
      }

      // Check if online
      if (!isOnline()) {
        updateSyncState({ status: 'offline', pendingSync: true })
        return
      }

      // Validate data size
      const stateJson = JSON.stringify(state)
      if (stateJson.length > config.maxDataSizeBytes) {
        const sizeMB = (stateJson.length / (1024 * 1024)).toFixed(2)
        console.error(`[Sync] Data too large: ${sizeMB}MB (max 1MB)`)
        updateSyncState({
          status: 'error',
          error: `Данные слишком большие (${sizeMB}MB). Максимум 1MB.`,
        })
        return
      }

      updateSyncState({ status: 'syncing', error: null })

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
          throw new Error(error.error || `HTTP ${response.status}`)
        }

        const result = await response.json()
        const updatedAt = new Date(result.updated_at).getTime()

        // Success
        retryCount = 0
        updateSyncState({
          status: 'idle',
          lastSyncedAt: updatedAt,
          pendingSync: false,
          error: null,
        })

        console.log('[Sync] Synced successfully at', new Date(updatedAt).toISOString())
      } catch (error: any) {
        console.error('[Sync] Error:', error.message)

        // Retry logic for network errors
        if (retryCount < config.maxRetries && error.message.includes('fetch')) {
          retryCount++
          console.log(`[Sync] Retrying (${retryCount}/${config.maxRetries})...`)

          setTimeout(() => {
            syncToServer(state)
          }, config.retryDelayMs)
        } else {
          // Max retries reached or non-network error
          retryCount = 0
          updateSyncState({
            status: 'error',
            error: error.message,
            pendingSync: true,
          })

          // Show notification based on error type
          if (error.message.includes('401')) {
            console.error('[Sync] Authentication error - redirecting to login')
            // TODO: Redirect to login
          } else if (error.message.includes('500')) {
            console.error('[Sync] Server error - try again later')
          } else {
            console.error('[Sync] Network error - check connection')
          }
        }
      }
    }

    // Trigger debounced sync
    const triggerSync = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      debounceTimer = setTimeout(() => {
        const state = get()
        syncToServer(state)
        debounceTimer = null
      }, config.debounceMs)
    }

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[Sync] Connection restored')
        updateSyncState({ status: 'idle' })

        // Flush pending changes
        if (syncState.pendingSync) {
          const state = get()
          syncToServer(state)
        }
      })

      window.addEventListener('offline', () => {
        console.log('[Sync] Connection lost')
        updateSyncState({ status: 'offline' })
      })
    }

    // Wrap set to intercept state changes
    const wrappedSet: typeof set = (partial: any, replace?: any) => {
      set(partial, replace)

      // Trigger debounced sync after state change
      triggerSync()
    }

    // Initialize store with sync state
    const storeWithSync = storeInitializer(wrappedSet as any, get, api)

    return {
      ...storeWithSync,
      _sync: syncState,
    } as any
  }
