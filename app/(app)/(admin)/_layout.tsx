import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary[700] },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Admin Panel' }} />
      <Stack.Screen name="users" options={{ title: 'User Management' }} />
      <Stack.Screen name="reports" options={{ title: 'Reports' }} />
      <Stack.Screen name="announcements" options={{ title: 'Announcements' }} />
      <Stack.Screen name="settings" options={{ title: 'Barangay Settings' }} />
      <Stack.Screen name="fees" options={{ title: 'Fee Schedule' }} />
      <Stack.Screen name="audit-logs" options={{ title: 'Audit Logs' }} />
    </Stack>
  );
}
