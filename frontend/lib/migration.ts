'use client'

import { fetchServerData, syncToServer } from './syncOperations'
import { showMigrationSuccessNotification } from './syncNotifications'

const MIGRATED_FLAG_KEY = 'calorie-tracker-migrated'

export interface MigrationResult {
  migrated: boolean
  error?: string
}

/**
 * Migrate local data to server (one-time operation)
 * This runs once after sync feature is deployed
 */
export async function migrateLocalData(currentState: any): Promise<MigrationResult> {
  console.log('[Migration] Checking if migration is needed...')

  // Check if already migrated
  const alreadyMigrated = localStorage.getItem(MIGRATED_FLAG_KEY)
  if (alreadyMigrated === 'true') {
    console.log('[Migration] Already migrated, skipping')
    return { migrated: false }
  }

  try {
    // Check if server has data
    const serverResult = await fetchServerData()

    if (serverResult.error) {
      console.error('[Migration] Failed to check server data:', serverResult.error)
      return { migrated: false, error: serverResult.error }
    }

    // If server already has data, no need to migrate
    if (serverResult.data) {
      console.log('[Migration] Server already has data, marking as migrated')
      localStorage.setItem(MIGRATED_FLAG_KEY, 'true')
      return { migrated: false }
    }

    // Check if local data exists
    const hasLocalData = currentState && Object.keys(currentState).length > 0

    if (!hasLocalData) {
      console.log('[Migration] No local data to migrate')
      localStorage.setItem(MIGRATED_FLAG_KEY, 'true')
      return { migrated: false }
    }

    // Migrate local data to server
    console.log('[Migration] Migrating local data to server...')
    const syncResult = await syncToServer(currentState)

    if (!syncResult.success) {
      console.error('[Migration] Failed to migrate data:', syncResult.error)
      return { migrated: false, error: syncResult.error }
    }

    // Mark as migrated
    localStorage.setItem(MIGRATED_FLAG_KEY, 'true')
    console.log('[Migration] Migration successful!')

    // Show success notification
    showMigrationSuccessNotification()

    return { migrated: true }
  } catch (error: any) {
    console.error('[Migration] Unexpected error:', error)
    return { migrated: false, error: error.message }
  }
}

/**
 * Check if migration has been completed
 */
export function isMigrated(): boolean {
  return localStorage.getItem(MIGRATED_FLAG_KEY) === 'true'
}

/**
 * Reset migration flag (for testing)
 */
export function resetMigrationFlag(): void {
  localStorage.removeItem(MIGRATED_FLAG_KEY)
  console.log('[Migration] Migration flag reset')
}
