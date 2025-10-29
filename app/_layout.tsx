import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TaskProvider } from './contexts/TaskContext';
import { useRouter, useSegments } from 'expo-router';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [readyToRender, setReadyToRender] = useState(false);

  // Wait for auth loading to finish before doing anything
  useEffect(() => {
    if (!loading) setReadyToRender(true);
  }, [loading]);

  // Handle redirect only after rendering stack
  useEffect(() => {
    if (!readyToRender) return;

    if (!user) {
      router.replace('/(auth)/login');
    } else {
      router.replace('/(tabs)');
    }
  }, [user, readyToRender]);

  // Until loading is done, render nothing (or a splash)
  if (!readyToRender) {
    return null; // or <LoadingScreen />
  }

  // Once ready, mount the actual navigator tree
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <TaskProvider>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </TaskProvider>
    </AuthProvider>
  );
}
