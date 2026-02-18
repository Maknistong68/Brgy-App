import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  TextInputProps,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export default function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  secureTextEntry: secureTextEntryProp = false,
  containerStyle,
  inputStyle,
  editable = true,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [secureVisible, setSecureVisible] = useState(!secureTextEntryProp);

  const isSecure = secureTextEntryProp;
  const hasError = !!error;
  const isDisabled = editable === false;

  const borderColor = hasError
    ? colors.error.main
    : focused
      ? colors.primary[600]
      : colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, hasError && styles.labelError]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputWrapper,
          { borderColor },
          focused && styles.inputWrapperFocused,
          isDisabled && styles.inputWrapperDisabled,
          inputStyle,
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          {...rest}
          editable={editable}
          secureTextEntry={isSecure && !secureVisible}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={colors.text.disabled}
          style={[
            styles.input,
            leftIcon ? { paddingLeft: 0 } : null,
            (rightIcon || isSecure) ? { paddingRight: 0 } : null,
          ]}
        />

        {isSecure && (
          <Pressable
            onPress={() => setSecureVisible((v) => !v)}
            style={styles.iconRight}
            hitSlop={8}
          >
            <Text style={styles.toggleText}>
              {secureVisible ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        )}

        {!isSecure && rightIcon && (
          <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </View>

      {hasError && <Text style={styles.errorText}>{error}</Text>}
      {!hasError && helperText && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  labelError: {
    color: colors.error.main,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm + 4,
    minHeight: 48,
  },
  inputWrapperFocused: {
    borderWidth: 2,
  },
  inputWrapperDisabled: {
    backgroundColor: colors.grey[100],
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
  toggleText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary[600],
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.error.main,
    marginTop: spacing.xs,
  },
  helperText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});
