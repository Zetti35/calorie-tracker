'use client'

import { fetchServerData } from './syncOperations'
import { resolveConflict } from './conflictResolution'
import { showConflictNotification } from './syncNotifications'

/**
 * Initialize sync on app load
 * Fetches server data and resolves conflicts
 */
export async function initializeSync(
  currentState: any,
  lastSyncedAt: number | null,
  updateStore: (data: any, timestamp: number) => void
): Promise<void> {
  console.log('[Sync Init] Starting sync initialization...')

  try {
    // Fetch server data
    const result = await fetchServerData()

    if (result.error) {
      console.error('[Sync Init] Failed to fetch server data:', result.error)
      return
    }

    // Resolve conflict
    const resolution = resolveConflict(
      currentState,
      lastSyncedAt,
      result.data,
      result.updated_at
    )

    if (resolution.conflictDetected && resolution.serverWins) {
      // Show conflict notification
      showConflictNotification()
    }

    // Update store with resolved data
    if (resolution.serverWins && result.updated_at) {
      const serverTimestamp = new Date(result.updated_at).getTime()
      updateStore(resolution.data, serverTimestamp)
      console.log('[Sync Init] Store updated with server data')
    } else {
      console.log('[Sync Init] Local data is current')
    }
  } catch (error) {
    console.error('[Sync Init] Unexpected error:', error)
  }
}
