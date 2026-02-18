import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/theme';

type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: colors.grey[200], text: colors.text.primary },
  primary: { bg: colors.primary[50], text: colors.primary[700] },
  secondary: { bg: colors.secondary[50], text: colors.secondary[700] },
  success: { bg: '#E8F5E9', text: colors.success.dark },
  warning: { bg: '#FFF3E0', text: colors.warning.dark },
  error: { bg: '#FFEBEE', text: colors.error.dark },
  info: { bg: '#E3F2FD', text: colors.info.dark },
};

export default function Badge({
  label,
  variant = 'default',
  size = 'md',
  backgroundColor,
  textColor,
  style,
  textStyle,
}: BadgeProps) {
  const variantColor = variantColors[variant];
  const bg = backgroundColor ?? variantColor.bg;
  const fg = textColor ?? variantColor.text;
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          paddingVertical: isSmall ? 2 : spacing.xs,
          paddingHorizontal: isSmall ? spacing.sm : spacing.sm + 4,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: fg,
            fontSize: isSmall ? fontSize.xs : fontSize.sm,
          },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: fontWeight.semibold,
    textTransform: 'capitalize',
  },
});
