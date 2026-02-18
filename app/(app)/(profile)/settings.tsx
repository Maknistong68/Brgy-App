import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useUIStore } from '@/stores/uiStore';
import { useSync } from '@/hooks/useSync';
import { Card } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '@/theme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const BUILD_NUMBER =
  Constants.expoConfig?.ios?.buildNumber ??
  Constants.expoConfig?.android?.versionCode?.toString() ??
  '1';

// ---------------------------------------------------------------------------
// Reusable setting row
// ---------------------------------------------------------------------------

interface SettingRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  iconBg?: string;
  label: string;
  description?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
}

function SettingRow({
  icon,
  iconColor = colors.grey[700],
  iconBg = colors.grey[100],
  label,
  description,
  right,
  onPress,
  isLast = false,
}: SettingRowProps) {
  const Container = onPress ? Pressable : View;
  const containerProps = onPress
    ? {
        onPress,
        style: ({ pressed }: { pressed: boolean }) => [
          styles.settingRow,
          !isLast && styles.settingRowBorder,
          pressed && styles.settingRowPressed,
        ],
      }
    : {
        style: [styles.settingRow, !isLast && styles.settingRowBorder],
      };

  return (
    // @ts-ignore - Pressable/View style differences
    <Container {...containerProps}>
      <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description ? (
          <Text style={styles.settingDescription}>{description}</Text>
        ) : null}
      </View>
      {right && <View style={styles.settingRight}>{right}</View>}
      {onPress && !right && (
        <Ionicons name="chevron-forward" size={18} color={colors.grey[400]} />
      )}
    </Container>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={styles.sectionHeader}>{title}</Text>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SettingsScreen() {
  const { theme, setTheme } = useUIStore();
  const {
    isSyncing,
    pendingChanges,
    getLastSyncTime,
    syncNow,
    isOffline,
  } = useSync();

  // Local notification preference state (placeholder until persisted)
  const [pushEnabled, setPushEnabled] = useState(true);
  const [complaintUpdates, setComplaintUpdates] = useState(true);
  const [documentUpdates, setDocumentUpdates] = useState(true);
  const [announcements, setAnnouncements] = useState(true);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleThemeToggle = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  const handleSyncNow = useCallback(async () => {
    if (isOffline) {
      Alert.alert(
        'Offline',
        'You are currently offline. Please connect to the internet to sync.',
      );
      return;
    }
    await syncNow();
  }, [isOffline, syncNow]);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Clear Cache',
      'This will clear locally cached data. Your account data will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // Placeholder: clear async storage cache, image cache, etc.
            Alert.alert('Done', 'Cache cleared successfully.');
          },
        },
      ],
    );
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ----------------------------------------------------------------- */}
      {/* Appearance */}
      {/* ----------------------------------------------------------------- */}
      <SectionHeader title="Appearance" />
      <Card padding="none" style={styles.card}>
        <SettingRow
          icon="moon-outline"
          iconColor={colors.secondary[600]}
          iconBg={colors.secondary[50]}
          label="Dark Mode"
          description={theme === 'light' ? 'Light theme active' : 'Dark theme active'}
          isLast
          right={
            <Switch
              value={theme === 'dark'}
              onValueChange={handleThemeToggle}
              trackColor={{
                false: colors.grey[300],
                true: colors.primary[300],
              }}
              thumbColor={
                theme === 'dark' ? colors.primary[600] : colors.grey[50]
              }
            />
          }
        />
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* Notifications */}
      {/* ----------------------------------------------------------------- */}
      <SectionHeader title="Notifications" />
      <Card padding="none" style={styles.card}>
        <SettingRow
          icon="notifications-outline"
          iconColor={colors.info.main}
          iconBg={colors.info.light + '25'}
          label="Push Notifications"
          description="Receive push notifications on this device"
          right={
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{
                false: colors.grey[300],
                true: colors.primary[300],
              }}
              thumbColor={
                pushEnabled ? colors.primary[600] : colors.grey[50]
              }
            />
          }
        />
        <SettingRow
          icon="megaphone-outline"
          iconColor={colors.warning.main}
          iconBg={colors.warning.light + '25'}
          label="Complaint Updates"
          description="Get notified about complaint status changes"
          right={
            <Switch
              value={complaintUpdates}
              onValueChange={setComplaintUpdates}
              disabled={!pushEnabled}
              trackColor={{
                false: colors.grey[300],
                true: colors.primary[300],
              }}
              thumbColor={
                complaintUpdates && pushEnabled
                  ? colors.primary[600]
                  : colors.grey[50]
              }
            />
          }
        />
        <SettingRow
          icon="document-text-outline"
          iconColor={colors.primary[600]}
          iconBg={colors.primary[50]}
          label="Document Updates"
          description="Get notified when documents are ready"
          right={
            <Switch
              value={documentUpdates}
              onValueChange={setDocumentUpdates}
              disabled={!pushEnabled}
              trackColor={{
                false: colors.grey[300],
                true: colors.primary[300],
              }}
              thumbColor={
                documentUpdates && pushEnabled
                  ? colors.primary[600]
                  : colors.grey[50]
              }
            />
          }
        />
        <SettingRow
          icon="chatbubble-ellipses-outline"
          iconColor={colors.success.main}
          iconBg={colors.success.light + '25'}
          label="Announcements"
          description="Receive barangay announcements"
          isLast
          right={
            <Switch
              value={announcements}
              onValueChange={setAnnouncements}
              disabled={!pushEnabled}
              trackColor={{
                false: colors.grey[300],
                true: colors.primary[300],
              }}
              thumbColor={
                announcements && pushEnabled
                  ? colors.primary[600]
                  : colors.grey[50]
              }
            />
          }
        />
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* Sync */}
      {/* ----------------------------------------------------------------- */}
      <SectionHeader title="Data & Sync" />
      <Card padding="none" style={styles.card}>
        <SettingRow
          icon="time-outline"
          iconColor={colors.grey[700]}
          iconBg={colors.grey[100]}
          label="Last Synced"
          description={getLastSyncTime()}
        />
        <SettingRow
          icon="cloud-upload-outline"
          iconColor={colors.info.main}
          iconBg={colors.info.light + '25'}
          label="Pending Changes"
          description={
            pendingChanges > 0
              ? `${pendingChanges} change${pendingChanges !== 1 ? 's' : ''} waiting to sync`
              : 'Everything is up to date'
          }
        />
        <SettingRow
          icon="sync-outline"
          iconColor={colors.primary[600]}
          iconBg={colors.primary[50]}
          label="Sync Now"
          description={isSyncing ? 'Syncing...' : 'Manually sync your data'}
          onPress={handleSyncNow}
          isLast
          right={
            isSyncing ? (
              <ActivityIndicator size="small" color={colors.primary[600]} />
            ) : (
              <Ionicons
                name="arrow-forward-circle-outline"
                size={22}
                color={colors.primary[600]}
              />
            )
          }
        />
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* Cache */}
      {/* ----------------------------------------------------------------- */}
      <SectionHeader title="Storage" />
      <Card padding="none" style={styles.card}>
        <SettingRow
          icon="trash-outline"
          iconColor={colors.error.main}
          iconBg={colors.error.light + '20'}
          label="Clear Cache"
          description="Free up space by clearing cached data"
          onPress={handleClearCache}
          isLast
        />
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* About */}
      {/* ----------------------------------------------------------------- */}
      <SectionHeader title="About" />
      <Card padding="none" style={styles.card}>
        <SettingRow
          icon="information-circle-outline"
          iconColor={colors.primary[600]}
          iconBg={colors.primary[50]}
          label="App Version"
          right={<Text style={styles.versionText}>{APP_VERSION}</Text>}
        />
        <SettingRow
          icon="code-slash-outline"
          iconColor={colors.grey[600]}
          iconBg={colors.grey[100]}
          label="Build Number"
          isLast
          right={<Text style={styles.versionText}>{BUILD_NUMBER}</Text>}
        />
      </Card>

      <View style={styles.footerSpacer} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },

  // Section header
  sectionHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.md,
  },

  // Card wrapper
  card: {
    marginHorizontal: spacing.md,
  },

  // Setting row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  settingRowPressed: {
    backgroundColor: colors.grey[50],
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  settingDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  settingRight: {
    marginLeft: spacing.sm,
  },

  // Version text
  versionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },

  // Footer
  footerSpacer: {
    height: spacing.xxl,
  },
});
