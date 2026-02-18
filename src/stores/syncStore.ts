import { create } from 'zustand';

interface SyncError {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  message: string;
  timestamp: string;
}

interface SyncState {
  lastSyncedAt: string | null;
  isSyncing: boolean;
  pendingChanges: number;
  syncErrors: SyncError[];
  setLastSynced: (timestamp: string | null) => void;
  setSyncing: (isSyncing: boolean) => void;
  setPendingChanges: (count: number) => void;
  addSyncError: (error: SyncError) => void;
  clearSyncErrors: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  lastSyncedAt: null,
  isSyncing: false,
  pendingChanges: 0,
  syncErrors: [],
  setLastSynced: (lastSyncedAt) => set({ lastSyncedAt }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setPendingChanges: (pendingChanges) => set({ pendingChanges }),
  addSyncError: (error) =>
    set((state) => ({ syncErrors: [...state.syncErrors, error] })),
  clearSyncErrors: () => set({ syncErrors: [] }),
}));
