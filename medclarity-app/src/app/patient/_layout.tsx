import React from 'react';
import { Stack } from 'expo-router';

export default function PatientLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="scan" />
      <Stack.Screen name="ocr-verify" />
      <Stack.Screen name="analysis-loading" />
      <Stack.Screen name="prescription" />
      <Stack.Screen name="medicine-details" />
      <Stack.Screen name="voice-explanation" />
      <Stack.Screen name="reminder-setup" />
      <Stack.Screen name="add-reminder" />
      <Stack.Screen name="reminder-success" />
      <Stack.Screen name="dose-confirmation" />
      <Stack.Screen name="medicines" />
      <Stack.Screen name="reminders" />
      <Stack.Screen name="history" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="ai-assistant" />
    </Stack>
  );
}
