import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function ComplaintsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary[700] },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Complaints' }} />
      <Stack.Screen name="new" options={{ title: 'New Complaint' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Complaint Details' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Edit Complaint' }} />
      <Stack.Screen name="[id]/hearing" options={{ title: 'Hearings' }} />
      <Stack.Screen name="[id]/history" options={{ title: 'Status History' }} />
    </Stack>
  );
}
