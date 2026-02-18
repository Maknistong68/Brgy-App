import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: string;
  iconColor?: string;
  iconBackgroundColor?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  style?: ViewStyle;
}

export function StatCard({
  label,
  value,
  icon,
  iconColor = colors.primary[600],
  iconBackgroundColor = colors.primary[50],
  trend,
  style,
}: StatCardProps) {
  const getTrendColor = () => {
    if (!trend) return colors.grey[500];
    switch (trend.direction) {
      case 'up':
        return colors.success.main;
      case 'down':
        return colors.error.main;
      case 'neutral':
      default:
        return colors.grey[500];
    }
  };

  const getTrendIcon = (): string => {
    if (!trend) return 'remove-outline';
    switch (trend.direction) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      case 'neutral':
      default:
        return 'remove-outline';
    }
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.topRow}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
            <Ionicons name={icon as any} size={22} color={iconColor} />
          </View>
        )}
        {trend && (
          <View style={styles.trendContainer}>
            <Ionicons name={getTrendIcon() as any} size={14} color={getTrendColor()} />
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {Math.abs(trend.value)}%
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flex: 1,
    minWidth: 140,
    ...shadows.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  value: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
});
