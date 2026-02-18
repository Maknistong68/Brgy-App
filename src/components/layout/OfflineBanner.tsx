import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '@/stores/uiStore';
import { colors, spacing, fontSize } from '@/theme';

/**
 * A banner that displays at the top of the screen when the device is offline.
 *
 * Reads the `isOffline` flag from the global UI store and renders a warning
 * bar with a cloud-offline icon and explanatory text. When online, returns
 * `null` so it occupies no layout space.
 *
 * Usage:
 * ```tsx
 * <OfflineBanner />
 * ```
 */
export function OfflineBanner() {
  const { isOffline } = useUIStore();

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline" size={16} color={colors.white} />
      <Text style={styles.text}>You are offline. Some features may be limited.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warning.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  text: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
