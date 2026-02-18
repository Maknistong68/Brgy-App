import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { signOut } from '@/services/auth';
import { Avatar, Badge, Button, Card, Divider } from '@/components/ui';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';
import { getStatusLabel } from '@/utils/format';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, reset } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [signingOut, setSigningOut] = useState(false);

  const fullName = profile
    ? `${profile.first_name}${profile.middle_name ? ` ${profile.middle_name}` : ''} ${profile.last_name}${profile.suffix ? ` ${profile.suffix}` : ''}`
    : 'User';

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', error.message);
              setSigningOut(false);
              return;
            }
            reset();
          },
        },
      ],
    );
  };

  const handleChangeAvatar = () => {
    // Placeholder for avatar change - would open image picker
    Alert.alert('Change Avatar', 'Avatar change functionality coming soon.');
  };

  if (!profile) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <Pressable onPress={handleChangeAvatar} style={styles.avatarContainer}>
          <Avatar
            source={
              profile.avatar_url ? { uri: profile.avatar_url } : null
            }
            name={fullName}
            size="xl"
          />
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera" size={14} color={colors.white} />
          </View>
        </Pressable>
        <Text style={styles.userName}>{fullName}</Text>
        <Badge
          label={(profile.role ?? 'resident').replace(/_/g, ' ')}
          variant="primary"
        />
      </View>

      {/* User Info Card */}
      <Card header="Personal Information" style={styles.infoCard}>
        <InfoRow icon="mail-outline" label="Email" value={profile.email} />
        <InfoRow
          icon="call-outline"
          label="Phone"
          value={profile.phone ?? 'Not provided'}
        />
        <InfoRow
          icon="location-outline"
          label="Address"
          value={profile.address ?? 'Not provided'}
        />
        {profile.purok && (
          <InfoRow icon="map-outline" label="Purok" value={profile.purok} />
        )}
        <Divider />
        <View style={styles.verificationRow}>
          <Text style={styles.verificationLabel}>Verification Status</Text>
          <Badge
            label={profile.is_verified ? 'Verified' : 'Unverified'}
            variant={profile.is_verified ? 'success' : 'warning'}
            size="sm"
          />
        </View>
      </Card>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            pressed && styles.menuItemPressed,
          ]}
          onPress={() => router.push('/(app)/(profile)/edit')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.primary[50] }]}>
              <Ionicons name="create-outline" size={20} color={colors.primary[600]} />
            </View>
            <Text style={styles.menuItemText}>Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.grey[400]} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            pressed && styles.menuItemPressed,
          ]}
          onPress={() => router.push('/(app)/(profile)/notifications')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.secondary[50] }]}>
              <Ionicons name="notifications-outline" size={20} color={colors.secondary[600]} />
            </View>
            <Text style={styles.menuItemText}>Notifications</Text>
          </View>
          <View style={styles.menuItemRight}>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.grey[400]} />
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            pressed && styles.menuItemPressed,
          ]}
          onPress={() => router.push('/(app)/(profile)/settings')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.grey[100] }]}>
              <Ionicons name="settings-outline" size={20} color={colors.grey[700]} />
            </View>
            <Text style={styles.menuItemText}>App Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.grey[400]} />
        </Pressable>
      </View>

      {/* Sign Out */}
      <View style={styles.signOutSection}>
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="danger"
          fullWidth
          loading={signingOut}
          leftIcon={<Ionicons name="log-out-outline" size={18} color={colors.white} />}
        />
      </View>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={infoRowStyles.row}>
      <Ionicons name={icon as any} size={16} color={colors.text.secondary} />
      <View style={infoRowStyles.textContainer}>
        <Text style={infoRowStyles.label}>{label}</Text>
        <Text style={infoRowStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    marginTop: 2,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    ...shadows.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  userName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  infoCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  verificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verificationLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  menuSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuItemPressed: {
    backgroundColor: colors.grey[50],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  unreadBadge: {
    backgroundColor: colors.error.main,
    borderRadius: borderRadius.full,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  unreadBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  signOutSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
});
