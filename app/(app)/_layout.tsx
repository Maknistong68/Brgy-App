import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { colors } from '@/theme';
import { View, Text, StyleSheet } from 'react-native';
import { useUIStore } from '@/stores/uiStore';

export default function AppLayout() {
  const { session, isInitialized, profile } = useAuthStore();
  const { isRoleAtLeast } = usePermissions();
  const { isOffline } = useUIStore();

  if (isInitialized && !session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isInitialized && session && profile && !profile.barangay_id) {
    return <Redirect href="/join-barangay" />;
  }

  return (
    <View style={{ flex: 1 }}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color={colors.white} />
          <Text style={styles.offlineText}>You are offline</Text>
        </View>
      )}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary[600],
          tabBarInactiveTintColor: colors.grey[500],
          tabBarStyle: {
            borderTopColor: colors.border,
            paddingBottom: 4,
            paddingTop: 4,
            height: 60,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
          headerStyle: { backgroundColor: colors.primary[700] },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Tabs.Screen
          name="(home)"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(complaints)"
          options={{
            title: 'Complaints',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-text" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(documents)"
          options={{
            title: 'Documents',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="folder" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(admin)"
          options={{
            title: 'Admin',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
            href: isRoleAtLeast('secretary') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="(profile)"
          options={{
            title: 'Profile',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: colors.warning.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  offlineText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
