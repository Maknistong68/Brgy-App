import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/hooks/useAuth';
import { useOffline } from '@/hooks/useOffline';

export default function RootLayout() {
  useAuth(); // Initialize auth listener
  useOffline(); // Initialize network listener

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="join-barangay" options={{ headerShown: false }} />
      </Stack>
      <Toast />
    </>
  );
}
