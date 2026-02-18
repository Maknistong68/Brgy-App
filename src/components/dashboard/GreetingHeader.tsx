import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Badge } from '@/components/ui';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/theme';

interface GreetingHeaderProps {
  fullName: string;
  role: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function GreetingHeader({ fullName, role }: GreetingHeaderProps) {
  return (
    <View style={styles.greetingSection}>
      <View style={styles.greetingRow}>
        <View style={styles.greetingTextContainer}>
          <Text style={styles.greetingText}>{getGreeting()},</Text>
          <Text style={styles.greetingName}>{fullName}</Text>
        </View>
        <Badge
          label={role.replace(/_/g, ' ')}
          variant="primary"
          size="sm"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  greetingSection: {
    backgroundColor: colors.primary[700],
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: fontSize.md,
    color: colors.primary[100],
    fontWeight: fontWeight.regular,
  },
  greetingName: {
    fontSize: fontSize.xxl,
    color: colors.white,
    fontWeight: fontWeight.bold,
    marginTop: 2,
  },
});
