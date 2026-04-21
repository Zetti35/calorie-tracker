'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from './store'
import { initializeSync } from './syncInitialization'
import { migrateLocalData } from './migration'
import { syncToServer } from './syncOperations'

let syncInitialized = false
let debounceTimer: NodeJS.Timeout | null = null

/**
 * Hook to initialize sync and handle automatic syncing
 * Call this once in your root layout or app component
 */
export function useSyncStore() {
  const hasInitialized = useRef(false)

  useEffect(() => {
    // Only initialize once
    if (hasInitialized.current || syncInitialized) return
    hasInitialized.current = true
    syncInitialized = true

    console.log('[useSyncStore] Initializing sync...')

    // Check if Telegram WebApp is available
    const hasTelegramAuth = typeof window !== 'undefined' && 
                           window.Telegram?.WebApp?.initData

    if (!hasTelegramAuth) {
      console.warn('[useSyncStore] ⚠️ No Telegram initData - sync disabled')
      console.warn('[useSyncStore] 📝 To enable sync:')
      console.warn('[useSyncStore]    1. Deploy to Vercel')
      console.warn('[useSyncStore]    2. Open in Telegram Mini App')
      return
    }

    // Wait for auth to be ready
    const initTimer = setTimeout(async () => {
      const state = useAppStore.getState()

      // Run migration first
      await migrateLocalData(state)

      // Then initialize sync
      await initializeSync(
        state,
        (state as any)._sync?.lastSyncedAt || null,
        (data, timestamp) => {
          // Update store with server data
          useAppStore.setState({
            ...data,
            _sync: {
              ...(state as any)._sync,
              lastSyncedAt: timestamp,
            },
          })
        }
      )

      console.log('[useSyncStore] Sync initialized')
    }, 1000)

    return () => clearTimeout(initTimer)
  }, [])

  // Subscribe to store changes and trigger debounced sync
  useEffect(() => {
    // Check if Telegram WebApp is available
    const hasTelegramAuth = typeof window !== 'undefined' && 
                           window.Telegram?.WebApp?.initData

    if (!hasTelegramAuth) {
      console.log('[useSyncStore] Sync disabled - no Telegram auth')
      return
    }

    const unsubscribe = useAppStore.subscribe((state) => {
      console.log('[useSyncStore] Store changed, scheduling sync...')
      
      // Clear existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer)
        console.log('[useSyncStore] Cleared previous timer')
      }

      // Set new timer
      debounceTimer = setTimeout(async () => {
        console.log('[useSyncStore] Triggering debounced sync...')

        // Get current state
        const currentState = useAppStore.getState()

        // Remove _sync from state before sending
        const { _sync, ...dataToSync } = currentState as any

        console.log('[useSyncStore] Syncing data:', {
          entries: dataToSync.entries?.length || 0,
          water: Object.keys(dataToSync.water || {}).length,
        })

        // Sync to server
        const result = await syncToServer(dataToSync)

        console.log('[useSyncStore] Sync result:', result)

        if (result.success && result.updated_at) {
          // Update lastSyncedAt
          console.log('[useSyncStore] ✅ Sync successful')
          useAppStore.setState({
            _sync: {
              status: 'idle',
              lastSyncedAt: new Date(result.updated_at).getTime(),
              pendingSync: false,
              error: null,
            },
          } as any)
        } else if (result.error) {
          // Update error state
          console.error('[useSyncStore] ❌ Sync failed:', result.error)
          const currentSync = (useAppStore.getState() as any)._sync
          useAppStore.setState({
            _sync: {
              ...currentSync,
              status: 'error',
              error: result.error,
              pendingSync: true,
            },
          } as any)
        }

        debounceTimer = null
      }, 2000) // 2 second debounce
    })

    return () => {
      unsubscribe()
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [])
}
