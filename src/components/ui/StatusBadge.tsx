import React from 'react';
import { ViewStyle } from 'react-native';
import { colors } from '@/theme';
import Badge from './Badge';

type StatusKey = keyof typeof colors.status;

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

/**
 * Maps a status key (e.g. "under_review") to a readable label ("Under Review").
 */
function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Returns a light background and dark foreground based on the status color.
 */
function getStatusColors(status: string): { bg: string; text: string } {
  const key = status.toLowerCase().replace(/\s+/g, '_') as StatusKey;
  const base = colors.status[key];

  if (!base) {
    return { bg: colors.grey[200], text: colors.text.primary };
  }

  // Create a light tinted background by overlaying on white (approximation)
  return { bg: `${base}1A`, text: base };
}

export default function StatusBadge({ status, size = 'md', style }: StatusBadgeProps) {
  const { bg, text } = getStatusColors(status);

  return (
    <Badge
      label={formatStatusLabel(status)}
      backgroundColor={bg}
      textColor={text}
      size={size}
      style={style}
    />
  );
}
