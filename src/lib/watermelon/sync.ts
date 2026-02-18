import { supabase } from '@/lib/supabase';

interface SyncResult {
  success: boolean;
  syncedAt: string | null;
  error?: string;
}

export async function pullChanges(lastSyncedAt: string | null): Promise<SyncResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, syncedAt: null, error: 'Not authenticated' };

    const response = await supabase.functions.invoke('sync-pull', {
      body: { lastSyncedAt },
    });

    if (response.error) {
      return { success: false, syncedAt: null, error: response.error.message };
    }

    // TODO: Apply changes to WatermelonDB local database
    // For each table in response.data.changes, upsert records

    return { success: true, syncedAt: response.data.syncedAt };
  } catch (error: any) {
    return { success: false, syncedAt: null, error: error.message };
  }
}

export async function pushChanges(changes: Record<string, any[]>): Promise<SyncResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, syncedAt: null, error: 'Not authenticated' };

    const response = await supabase.functions.invoke('sync-push', {
      body: { changes },
    });

    if (response.error) {
      return { success: false, syncedAt: null, error: response.error.message };
    }

    return { success: true, syncedAt: response.data.syncedAt };
  } catch (error: any) {
    return { success: false, syncedAt: null, error: error.message };
  }
}

export async function fullSync(lastSyncedAt: string | null): Promise<SyncResult> {
  // Pull first, then push
  const pullResult = await pullChanges(lastSyncedAt);
  if (!pullResult.success) return pullResult;

  // TODO: Collect local changes from WatermelonDB
  // const localChanges = await getLocalPendingChanges();
  // const pushResult = await pushChanges(localChanges);

  return pullResult;
}
