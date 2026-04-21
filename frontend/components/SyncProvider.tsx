'use client'

import { useSyncStore } from '@/lib/useSyncStore'
import { SyncStatusIndicator } from './SyncStatusIndicator'

/**
 * Provider component that initializes sync and shows status indicator
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  // Initialize sync
  useSyncStore()

  return (
    <>
      {/* Sync status indicator in top-right corner */}
      <div className="fixed top-4 right-4 z-50">
        <SyncStatusIndicator />
      </div>

      {children}
    </>
  )
}
