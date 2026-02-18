import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';

type PaddingVariant = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  header?: string | React.ReactNode;
  padding?: PaddingVariant;
  style?: ViewStyle;
  headerStyle?: ViewStyle;
}

const paddingMap: Record<PaddingVariant, number> = {
  none: 0,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
};

export default function Card({
  children,
  header,
  padding = 'md',
  style,
  headerStyle,
}: CardProps) {
  const padValue = paddingMap[padding];

  const renderHeader = () => {
    if (!header) return null;

    if (typeof header === 'string') {
      return (
        <View style={[styles.header, { paddingHorizontal: padValue, paddingTop: padValue }, headerStyle]}>
          <Text style={styles.headerText}>{header}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.header, { paddingHorizontal: padValue, paddingTop: padValue }, headerStyle]}>
        {header}
      </View>
    );
  };

  return (
    <View style={[styles.card, style]}>
      {renderHeader()}
      <View style={{ padding: padValue, paddingTop: header ? spacing.sm : padValue }}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.md,
    overflow: 'hidden',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: spacing.sm,
  },
  headerText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
});
