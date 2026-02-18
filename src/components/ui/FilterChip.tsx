import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/theme';

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function FilterChip({
  label,
  selected = false,
  onPress,
  disabled = false,
  style,
  textStyle,
}: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
        pressed && !selected && styles.chipPressed,
        disabled && styles.chipDisabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          selected ? styles.labelSelected : styles.labelUnselected,
          disabled && styles.labelDisabled,
          textStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  chipSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  chipUnselected: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  chipPressed: {
    backgroundColor: colors.grey[100],
  },
  chipDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  labelSelected: {
    color: colors.white,
  },
  labelUnselected: {
    color: colors.text.primary,
  },
  labelDisabled: {
    color: colors.text.disabled,
  },
});
