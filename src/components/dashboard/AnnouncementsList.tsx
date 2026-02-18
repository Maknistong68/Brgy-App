import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';
import { formatRelativeTime } from '@/utils/format';

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
}

interface AnnouncementsListProps {
  announcements: AnnouncementItem[];
}

export function AnnouncementsList({ announcements }: AnnouncementsListProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Announcements</Text>
      </View>
      {announcements.length > 0 ? (
        announcements.map((item) => (
          <View key={item.id} style={styles.announcementCard}>
            <View style={styles.announcementHeader}>
              <View style={styles.announcementTitleRow}>
                {item.is_pinned && (
                  <Ionicons
                    name="pin"
                    size={14}
                    color={colors.primary[600]}
                    style={{ marginRight: spacing.xs }}
                  />
                )}
                <Text style={styles.announcementTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
              <Text style={styles.announcementTime}>
                {formatRelativeTime(item.created_at)}
              </Text>
            </View>
            <Text style={styles.announcementContent} numberOfLines={2}>
              {item.content}
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyAnnouncements}>
          <Ionicons name="megaphone-outline" size={32} color={colors.grey[300]} />
          <Text style={styles.emptyAnnouncementsText}>
            No announcements yet
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  announcementCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  announcementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  announcementTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  announcementTime: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  announcementContent: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  emptyAnnouncements: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  emptyAnnouncementsText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
});
