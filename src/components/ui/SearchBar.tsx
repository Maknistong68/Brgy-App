import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';

interface SearchBarProps {
  value?: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  debounceMs?: number;
  autoFocus?: boolean;
  style?: ViewStyle;
  searchIcon?: React.ReactNode;
}

export default function SearchBar({
  value: controlledValue,
  onChangeText,
  placeholder = 'Search...',
  debounceMs = 300,
  autoFocus = false,
  style,
  searchIcon,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(controlledValue ?? '');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isControlled = controlledValue !== undefined;

  // Sync controlled value
  useEffect(() => {
    if (isControlled) {
      setLocalValue(controlledValue);
    }
  }, [controlledValue, isControlled]);

  const handleChange = useCallback(
    (text: string) => {
      setLocalValue(text);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        onChangeText(text);
      }, debounceMs);
    },
    [onChangeText, debounceMs],
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleClear = () => {
    setLocalValue('');
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    onChangeText('');
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconWrapper}>
        {searchIcon ?? <Text style={styles.searchIconFallback}>&#x1F50D;</Text>}
      </View>

      <TextInput
        value={localValue}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.text.disabled}
        autoFocus={autoFocus}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        style={styles.input}
      />

      {localValue.length > 0 && (
        <Pressable onPress={handleClear} style={styles.clearButton} hitSlop={8}>
          <Text style={styles.clearText}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm + 4,
    minHeight: 44,
    ...shadows.sm,
  },
  iconWrapper: {
    marginRight: spacing.sm,
  },
  searchIconFallback: {
    fontSize: fontSize.lg,
    color: colors.text.secondary,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    marginLeft: spacing.xs,
    padding: spacing.xs,
  },
  clearText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.secondary,
  },
});
