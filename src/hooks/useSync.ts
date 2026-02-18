import { useCallback } from 'react';
import { useSyncStore } from '@/stores/syncStore';
import { formatRelativeTime } from '@/utils/format';
import { useUIStore } from '@/stores/uiStore';
import { SYNC } from '@/constants';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Sync hook (placeholder for WatermelonDB / offline-first sync).
 *
 * Provides access to the sync state and exposes actions for triggering a
 * manual sync. The actual sync engine will be wired up when WatermelonDB or
 * another offline storage layer is integrated.
 *
 * Usage:
 * ```ts
 * const { isSyncing, lastSyncedAt, pendingChanges, syncNow, getLastSyncTime } = useSync();
 * ```
 */
export function useSync() {
  const {
    lastSyncedAt,
    isSyncing,
    pendingChanges,
    syncErrors,
    setLastSynced,
    setSyncing,
    setPendingChanges,
    addSyncError,
    clearSyncErrors,
  } = useSyncStore();

  const { isOffline } = useUIStore();

  // -----------------------------------------------------------------------
  // Trigger a manual sync
  // -----------------------------------------------------------------------

  const syncNow = useCallback(async () => {
    if (isSyncing) return;
    if (isOffline) {
      console.warn('Cannot sync while offline');
      return;
    }

    setSyncing(true);
    clearSyncErrors();

    try {
      // -----------------------------------------------------------------
      // TODO: Implement actual sync logic with WatermelonDB / local DB.
      //
      // The sync flow should:
      // 1. Push local pending changes to the server.
      // 2. Pull remote changes since `lastSyncedAt`.
      // 3. Resolve conflicts (last-write-wins or custom strategy).
      // 4. Update the local database.
      // -----------------------------------------------------------------

      // Simulate a sync delay for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const now = new Date().toISOString();
      setLastSynced(now);
      setPendingChanges(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      addSyncError({
        id: Date.now().toString(),
        entity: 'sync',
        entityId: '',
        action: 'sync',
        message,
        timestamp: new Date().toISOString(),
      });
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  }, [isSyncing, isOffline]);

  // -----------------------------------------------------------------------
  // Get a human-readable representation of the last sync time
  // -----------------------------------------------------------------------

  const getLastSyncTime = useCallback((): string => {
    if (!lastSyncedAt) return 'Never synced';
    return formatRelativeTime(lastSyncedAt);
  }, [lastSyncedAt]);

  return {
    // State
    lastSyncedAt,
    isSyncing,
    pendingChanges,
    syncErrors,
    isOffline,

    // Actions
    syncNow,
    getLastSyncTime,
    clearSyncErrors,
  };
}
