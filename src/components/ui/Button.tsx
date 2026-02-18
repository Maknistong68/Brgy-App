import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle; pressed: ViewStyle }> = {
  primary: {
    container: { backgroundColor: colors.primary[600] },
    text: { color: colors.white },
    pressed: { backgroundColor: colors.primary[700] },
  },
  secondary: {
    container: { backgroundColor: colors.secondary[500] },
    text: { color: colors.white },
    pressed: { backgroundColor: colors.secondary[700] },
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary[600] },
    text: { color: colors.primary[600] },
    pressed: { backgroundColor: colors.primary[50] },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.primary[600] },
    pressed: { backgroundColor: colors.grey[100] },
  },
  danger: {
    container: { backgroundColor: colors.error.main },
    text: { color: colors.white },
    pressed: { backgroundColor: colors.error.dark },
  },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle; iconSpacing: number }> = {
  sm: {
    container: { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md },
    text: { fontSize: fontSize.sm },
    iconSpacing: spacing.xs,
  },
  md: {
    container: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg },
    text: { fontSize: fontSize.md },
    iconSpacing: spacing.sm,
  },
  lg: {
    container: { paddingVertical: spacing.md - 2, paddingHorizontal: spacing.xl },
    text: { fontSize: fontSize.lg },
    iconSpacing: spacing.sm,
  },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        vStyle.container,
        sStyle.container,
        fullWidth && styles.fullWidth,
        pressed && vStyle.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={vStyle.text.color as string}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={{ marginRight: sStyle.iconSpacing }}>{leftIcon}</View>}
          <Text
            style={[
              styles.text,
              vStyle.text,
              sStyle.text,
              isDisabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View style={{ marginLeft: sStyle.iconSpacing }}>{rightIcon}</View>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...shadows.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.text.disabled,
  },
});
