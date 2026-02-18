import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

let isConnected = true;

/**
 * Start listening for network connectivity changes.
 * Returns the unsubscribe function (call it to stop listening).
 */
export const initNetworkListener = (onChange: (connected: boolean) => void) => {
  return NetInfo.addEventListener((state: NetInfoState) => {
    const connected = state.isConnected ?? false;
    if (connected !== isConnected) {
      isConnected = connected;
      onChange(connected);
    }
  });
};

/**
 * Perform a one-off network connectivity check.
 */
export const checkNetwork = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  isConnected = state.isConnected ?? false;
  return isConnected;
};

/**
 * Return the last-known connectivity state (synchronous).
 */
export const getIsConnected = () => isConnected;
