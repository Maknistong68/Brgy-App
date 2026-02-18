import React from 'react';
import { ViewStyle } from 'react-native';
import { colors } from '@/theme';
import Badge from './Badge';

type PriorityKey = keyof typeof colors.priority;

interface PriorityBadgeProps {
  priority: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

function formatPriorityLabel(priority: string): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
}

function getPriorityColors(priority: string): { bg: string; text: string } {
  const key = priority.toLowerCase() as PriorityKey;
  const base = colors.priority[key];

  if (!base) {
    return { bg: colors.grey[200], text: colors.text.primary };
  }

  return { bg: `${base}1A`, text: base };
}

export default function PriorityBadge({ priority, size = 'md', style }: PriorityBadgeProps) {
  const { bg, text } = getPriorityColors(priority);

  return (
    <Badge
      label={formatPriorityLabel(priority)}
      backgroundColor={bg}
      textColor={text}
      size={size}
      style={style}
    />
  );
}
