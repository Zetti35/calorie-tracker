'use client'

/**
 * Conflict resolution logic for sync system
 * Implements server-wins strategy with local backup
 */

const BACKUP_KEY = 'calorie-tracker-backup'
const BACKUP_TIMESTAMP_KEY = 'calorie-tracker-backup-timestamp'
const BACKUP_RETENTION_DAYS = 7

export interface ConflictResult {
  resolved: boolean
  data: any
  conflictDetected: boolean
  serverWins: boolean
}

/**
 * Resolve conflict between local and server data
 * Strategy: Server wins when server is newer
 */
export function resolveConflict(
  localData: any,
  localTimestamp: number | null,
  serverData: any,
  serverTimestamp: string | null
): ConflictResult {
  // No server data - local wins
  if (!serverData || !serverTimestamp) {
    console.log('[Conflict] No server data - local wins')
    return {
      resolved: true,
      data: localData,
      conflictDetected: false,
      serverWins: false,
    }
  }

  // No local timestamp - server wins
  if (!localTimestamp) {
    console.log('[Conflict] No local timestamp - server wins')
    return {
      resolved: true,
      data: serverData,
      conflictDetected: false,
      serverWins: true,
    }
  }

  const serverTime = new Date(serverTimestamp).getTime()

  // Compare timestamps
  if (serverTime > localTimestamp) {
    // Server is newer - server wins
    console.log('[Conflict] Server is newer - server wins')
    console.log('  Local:', new Date(localTimestamp).toISOString())
    console.log('  Server:', serverTimestamp)

    // Create backup of local data before overwriting
    createBackup(localData)

    return {
      resolved: true,
      data: serverData,
      conflictDetected: true,
      serverWins: true,
    }
  } else {
    // Local is newer or equal - local wins
    console.log('[Conflict] Local is newer - local wins')
    return {
      resolved: true,
      data: localData,
      conflictDetected: false,
      serverWins: false,
    }
  }
}

/**
 * Create backup of local data in localStorage
 */
export function createBackup(data: any): void {
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(data))
    localStorage.setItem(BACKUP_TIMESTAMP_KEY, Date.now().toString())
    console.log('[Backup] Local data backed up')
  } catch (error) {
    console.error('[Backup] Failed to create backup:', error)
  }
}

/**
 * Get backup data if it exists and is not expired
 */
export function getBackup(): any | null {
  try {
    const backupData = localStorage.getItem(BACKUP_KEY)
    const backupTimestamp = localStorage.getItem(BACKUP_TIMESTAMP_KEY)

    if (!backupData || !backupTimestamp) {
      return null
    }

    // Check if backup is expired (older than 7 days)
    const backupTime = parseInt(backupTimestamp, 10)
    const now = Date.now()
    const daysSinceBackup = (now - backupTime) / (1000 * 60 * 60 * 24)

    if (daysSinceBackup > BACKUP_RETENTION_DAYS) {
      console.log('[Backup] Backup expired, removing')
      clearBackup()
      return null
    }

    return JSON.parse(backupData)
  } catch (error) {
    console.error('[Backup] Failed to get backup:', error)
    return null
  }
}

/**
 * Clear backup data
 */
export function clearBackup(): void {
  try {
    localStorage.removeItem(BACKUP_KEY)
    localStorage.removeItem(BACKUP_TIMESTAMP_KEY)
    console.log('[Backup] Backup cleared')
  } catch (error) {
    console.error('[Backup] Failed to clear backup:', error)
  }
}

/**
 * Check if backup exists
 */
export function hasBackup(): boolean {
  return localStorage.getItem(BACKUP_KEY) !== null
}
