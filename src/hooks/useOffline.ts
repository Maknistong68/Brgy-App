import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { initNetworkListener, checkNetwork } from '@/utils/network';

/**
 * Offline detection hook.
 *
 * Performs an initial connectivity check on mount and subscribes to ongoing
 * network state changes, updating the global UI store accordingly.
 *
 * Call once at the root layout level; read `isOffline` from any component.
 *
 * Usage:
 * ```ts
 * const { isOffline } = useOffline();
 * ```
 */
export function useOffline() {
  const { isOffline, setOffline } = useUIStore();

  useEffect(() => {
    // Perform an initial connectivity check
    checkNetwork().then((connected) => setOffline(!connected));

    // Subscribe to ongoing changes
    const unsubscribe = initNetworkListener((connected) => setOffline(!connected));

    return () => unsubscribe();
  }, []);

  return { isOffline };
}
