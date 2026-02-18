import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '@/theme';

interface DividerProps {
  color?: string;
  thickness?: number;
  marginVertical?: number;
  style?: ViewStyle;
}

export default function Divider({
  color = colors.divider,
  thickness = 1,
  marginVertical = spacing.sm,
  style,
}: DividerProps) {
  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: color,
          height: thickness,
          marginVertical,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    width: '100%',
  },
});
