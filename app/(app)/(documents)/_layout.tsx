import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function DocumentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary[700] },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Documents' }} />
      <Stack.Screen name="new" options={{ title: 'Request Document' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Request Details' }} />
      <Stack.Screen name="[id]/history" options={{ title: 'Status History' }} />
    </Stack>
  );
}
