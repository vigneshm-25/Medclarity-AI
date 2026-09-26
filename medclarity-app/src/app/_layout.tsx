import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadSavedLanguage } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { initNotificationHandler } from '../services/notificationService';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const setMode = useAppStore((state) => state.setMode);

  useEffect(() => {
    async function initApp() {
      try {
        await initNotificationHandler();

        const lang = await loadSavedLanguage();
        await setLanguage(lang as 'en' | 'ta');

        const savedMode = await AsyncStorage.getItem('user_mode');
        if (savedMode === 'patient' || savedMode === 'caregiver') {
          await setMode(savedMode);
        }

        const onboardingFlag = await AsyncStorage.getItem('has_seen_onboarding');
        if (onboardingFlag === 'true') {
          useAppStore.setState({ hasSeenOnboarding: true });
        }
      } catch (err) {
        console.error('App init error:', err);
      } finally {
        setIsReady(true);
      }
    }

    initApp();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="otp" />
        <Stack.Screen name="language" />
        <Stack.Screen name="mode-selection" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="patient" />
        <Stack.Screen name="caregiver" />
      </Stack>
    </SafeAreaProvider>
  );
}
