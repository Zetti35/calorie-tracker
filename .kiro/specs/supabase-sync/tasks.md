# Implementation Plan: Supabase Data Synchronization

## Overview

This plan implements bidirectional data synchronization between the Zustand client store and Supabase database for the Telegram Mini App calorie tracker. The implementation follows a layered approach: database setup → API routes → sync middleware → UI components → migration logic → testing.

The sync system uses a Zustand middleware that debounces state changes, manages an offline queue, and communicates with Next.js API routes that handle server-side Supabase operations using the service role key.

## Tasks

- [x] 1. Set up database schema and environment configuration
  - Create `diary_data` table in Supabase with JSONB data column
  - Add unique constraint on `user_id` and foreign key to `users` table
  - Create RLS policy for service_role_only access
  - Add `SUPABASE_SERVICE_ROLE_KEY` to environment variables
  - Create database trigger to auto-update `updated_at` timestamp
  - _Requirements: 6.5, 6.6, 9.1, 9.5_

- [ ] 2. Implement sync API routes
  - [x] 2.1 Create POST /api/sync route for saving user state
    - Validate Telegram initData authentication
    - Extract telegram_id and lookup user_id from users table
    - Upsert diary_data record with user state in JSONB data column
    - Return updated_at timestamp on success
    - Handle errors: 401 (auth), 404 (user not found), 500 (server)
    - _Requirements: 6.1, 6.3, 6.4, 6.6, 6.8, 9.2, 9.3, 9.6_
  
  - [ ]* 2.2 Write property test for POST /api/sync
    - **Property 20: Authentication Validation on API Requests**
    - **Property 21: Unauthorized Response on Auth Failure**
    - **Property 22: Data Persistence on POST**
    - **Property 24: Not Found Response for Missing User**
    - **Property 33: User Data Isolation**
    - **Validates: Requirements 6.3, 6.4, 6.6, 6.8, 9.6**
  
  - [x] 2.3 Create GET /api/sync route for loading user state
    - Validate Telegram initData authentication
    - Extract telegram_id and lookup user_id from users table
    - Fetch diary_data record by user_id
    - Return data and updated_at (or null if not found)
    - Handle errors: 401 (auth), 404 (user not found), 500 (server)
    - _Requirements: 6.2, 6.3, 6.4, 6.7, 6.8, 9.2, 9.3, 9.6_
  
  - [ ]* 2.4 Write property test for GET /api/sync
    - **Property 23: Data Retrieval on GET**
    - **Validates: Requirements 6.7**

- [x] 3. Checkpoint - Verify API routes work with manual testing
  - Test POST /api/sync with valid and invalid auth
  - Test GET /api/sync returns correct data
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement sync middleware for Zustand store
  - [x] 4.1 Create sync middleware with debounce logic
    - Create `frontend/lib/syncMiddleware.ts` with SyncMiddleware type
    - Implement debounce timer (2 seconds) that resets on rapid changes
    - Add sync state tracking (status, lastSyncedAt, pendingSync, error)
    - Intercept all store mutations and trigger debounced sync
    - Implement data size validation (max 1MB) before sync
    - _Requirements: 1.1, 1.2, 1.3, 7.1, 7.2, 7.5, 7.6_
  
  - [ ]* 4.2 Write property tests for debounce behavior
    - **Property 1: Debounce Timer Reset on Rapid Changes**
    - **Property 2: Sync Trigger After Debounce Period**
    - **Property 26: Data Size Limit Enforcement**
    - **Validates: Requirements 1.1, 1.2, 1.3, 7.2, 7.5**
  
  - [x] 4.3 Implement offline queue and network detection
    - Monitor navigator.onLine for connectivity status
    - Queue failed sync attempts with pendingSync flag
    - Flush queue automatically when connection restored
    - Add event listeners for online/offline events
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 4.4 Write property tests for offline queue management
    - **Property 9: Local Persistence in Offline Mode**
    - **Property 10: Offline Queue Management**
    - **Property 11: Queue Flush on Reconnection**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  
  - [x] 4.5 Implement retry logic with exponential backoff
    - Retry failed syncs up to 3 times with 5-second delays
    - Track retry count in sync state
    - Show appropriate error notifications after max retries
    - Preserve local data on all sync errors
    - _Requirements: 8.1, 8.2, 8.6_
  
  - [ ]* 4.6 Write property tests for retry logic
    - **Property 27: Retry Logic on Network Errors**
    - **Property 28: Final Error Notification After Retries**
    - **Property 32: Data Preservation on Sync Error**
    - **Validates: Requirements 8.1, 8.2, 8.6**
  
  - [x] 4.7 Implement sync operations (POST and GET)
    - Create syncToServer function that calls POST /api/sync
    - Create fetchServerData function that calls GET /api/sync
    - Update lastSyncedAt timestamp on successful sync
    - Handle all error types: network, server, auth, validation
    - Log all errors to console with structured format
    - _Requirements: 1.4, 8.3, 8.4, 8.5_
  
  - [ ]* 4.8 Write property tests for sync operations
    - **Property 3: Timestamp Update on Successful Sync**
    - **Property 29: Server Error Notification**
    - **Property 30: Redirect on Authentication Error**
    - **Property 31: Error Logging**
    - **Validates: Requirements 1.4, 8.3, 8.4, 8.5**

- [ ] 5. Implement conflict resolution logic
  - [x] 5.1 Create conflict detection and resolution
    - Compare server updated_at with local lastSyncedAt
    - Implement server-wins strategy when server is newer
    - Implement local-wins strategy when local is newer
    - Create backup of local data before applying server data
    - Store backup in localStorage under "calorie-tracker-backup" key
    - _Requirements: 2.2, 2.3, 4.1, 4.3_
  
  - [ ]* 5.2 Write property tests for conflict resolution
    - **Property 6: Server Wins Conflict Resolution**
    - **Property 7: Local Wins When Newer**
    - **Property 15: Backup Creation on Conflict**
    - **Validates: Requirements 2.2, 2.3, 4.1, 4.3**
  
  - [x] 5.3 Implement conflict notifications
    - Show notification when server data overwrites local changes
    - Display message: "Данные обновлены с сервера. Изменения с другого устройства применены."
    - Implement 7-day backup retention logic
    - _Requirements: 4.2, 4.4, 4.5_
  
  - [ ]* 5.4 Write property test for conflict notifications
    - **Property 14: Conflict Notification Display**
    - **Validates: Requirements 4.2**

- [ ] 6. Checkpoint - Verify sync middleware works end-to-end
  - Test debounce behavior with rapid state changes
  - Test offline queue with simulated network failures
  - Test conflict resolution with different timestamps
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement data loading on app initialization
  - [x] 7.1 Add sync initialization to store setup
    - Call fetchServerData on authenticated app load
    - Compare timestamps and apply conflict resolution
    - Update store with loaded data
    - Handle first-time users (no server data)
    - _Requirements: 2.1, 2.4, 2.5_
  
  - [ ]* 7.2 Write property tests for data loading
    - **Property 5: Server Data Fetch on Authenticated App Load**
    - **Property 8: Store Update After Data Load**
    - **Validates: Requirements 2.1, 2.5**

- [ ] 8. Create sync status indicator component
  - [x] 8.1 Create SyncStatusIndicator component
    - Create `frontend/components/SyncStatusIndicator.tsx`
    - Subscribe to _sync state from store
    - Display status icons: ✓ (synced), ⟳ (syncing), ⚠ (error), ○ (offline)
    - Apply appropriate colors: green, blue, yellow, gray
    - Show status for 2 seconds after successful sync, then hide
    - Remain visible during syncing, error, or offline states
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 8.2 Write unit tests for SyncStatusIndicator
    - Test all status state displays
    - Test auto-hide after 2 seconds on success
    - Test visibility during error/offline states
    - _Requirements: 5.2, 5.3, 5.4, 5.5_
  
  - [x] 8.3 Add retry functionality to error indicator
    - Make error icon clickable
    - Trigger manual sync retry on click
    - Show loading state during retry
    - _Requirements: 5.6_
  
  - [ ]* 8.4 Write property test for retry on click
    - **Property 19: Retry on Error Click**
    - **Validates: Requirements 5.6**
  
  - [x] 8.5 Integrate SyncStatusIndicator into app layout
    - Add component to header in `frontend/app/layout.tsx`
    - Position in top-right corner with appropriate styling
    - Ensure visibility across all pages
    - _Requirements: 5.1_

- [ ] 9. Implement migration logic for existing users
  - [x] 9.1 Create migration handler
    - Create `frontend/lib/migration.ts` with migrateLocalData function
    - Check for "migrated" flag in localStorage
    - Skip migration if flag is true (idempotence)
    - Load current store state from localStorage
    - Check if server has data via GET /api/sync
    - If server empty, send local data via POST /api/sync
    - Set "migrated: true" flag after successful migration
    - _Requirements: 10.1, 10.2, 10.3, 10.5_
  
  - [ ]* 9.2 Write property tests for migration
    - **Property 34: Migration Idempotence**
    - **Validates: Requirements 10.3, 10.5**
  
  - [x] 9.3 Add migration notification
    - Show success notification: "Ваши данные успешно синхронизированы с сервером"
    - Display notification only on first successful migration
    - _Requirements: 10.4_
  
  - [ ]* 9.4 Write property test for migration notification
    - **Property 35: Migration Success Notification**
    - **Validates: Requirements 10.4**
  
  - [x] 9.5 Integrate migration into app initialization
    - Call migrateLocalData on first authenticated app load
    - Run migration before regular sync initialization
    - Handle migration errors gracefully (log and continue)
    - _Requirements: 10.1_

- [ ] 10. Wire sync middleware into existing store
  - [x] 10.1 Update store.ts to use sync middleware
    - Import syncMiddleware from lib/syncMiddleware
    - Wrap store with sync middleware after persist middleware
    - Configure sync middleware with default settings (2s debounce, 3 retries)
    - Add _sync state to AppState type
    - _Requirements: 1.1, 7.3_
  
  - [ ] 10.2 Test store integration with sync
    - Verify state changes trigger debounced sync
    - Verify persist middleware still works correctly
    - Test that all existing store actions work unchanged
    - _Requirements: 7.3, 7.4_

- [ ] 11. Checkpoint - End-to-end integration testing
  - Test complete flow: login → load data → make changes → sync → logout → login → see changes
  - Test offline scenario: go offline → make changes → go online → auto-sync
  - Test conflict scenario: change on device A → change on device B → device A loads → sees B's changes
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 12. Write integration tests for complete sync flows
  - [ ]* 12.1 Test fresh user flow
    - No local data → No server data → Empty state
    - _Requirements: 2.4_
  
  - [ ]* 12.2 Test returning user flow
    - Local data → Server data newer → Server wins
    - _Requirements: 2.2, 4.1_
  
  - [ ]* 12.3 Test multi-device flow
    - Device A syncs → Device B loads → Sees A's changes
    - _Requirements: 2.1, 2.5_
  
  - [ ]* 12.4 Test offline workflow
    - Make changes offline → Go online → Auto-sync
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 12.5 Test conflict scenario
    - Local changes → Server has newer data → Backup created
    - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 13. Write property tests for remaining correctness properties
  - [ ]* 13.1 Test sync status display properties
    - **Property 4: Sync Status Display After Completion**
    - **Property 12: Offline Status Indicator Display**
    - **Property 13: Synced Status After Reconnection**
    - **Property 16: Idle Synced Status Display**
    - **Property 17: Loading Status During Sync**
    - **Property 18: Error Status Display**
    - **Validates: Requirements 1.5, 3.4, 3.5, 5.2, 5.3, 5.4**
  
  - [ ]* 13.2 Test store behavior during sync
    - **Property 25: Store Accepts Changes During Sync**
    - **Validates: Requirements 7.4**

- [ ] 14. Final checkpoint - Complete system verification
  - Run all property-based tests (35 properties)
  - Run all unit tests
  - Run all integration tests
  - Verify no console errors during normal operation
  - Test on multiple devices/browsers
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- Integration tests validate complete user workflows
- The sync middleware is designed to be non-blocking and preserve local data on all errors
- All sensitive keys (service role key, bot token) must remain server-side only
- The implementation follows a server-wins conflict resolution strategy for simplicity
