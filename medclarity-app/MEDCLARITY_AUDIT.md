# MedClarity App Structural Audit Report

**Date:** 2026-08-24
**Target Directory:** `medclarity-app`
**Mode:** Read-Only Investigation

---

## 1. Directory Tree (3 Levels Deep)
> Excluding `node_modules`, `.expo`, `android`, `ios`, and `.git`.

```text
medclarity-app/
├── .claude
│   └── settings.json
├── .gitignore
├── .vscode
│   ├── extensions.json
│   └── settings.json
├── AGENTS.md
├── App.tsx
├── CLAUDE.md
├── LICENSE
├── README.md
├── app.json
├── assets
│   ├── expo.icon
│   │   ├── Assets
│   │   └── icon.json
│   └── images
│       ├── android-icon-background.png
│       ├── android-icon-foreground.png
│       ├── android-icon-monochrome.png
│       ├── expo-badge-white.png
│       ├── expo-badge.png
│       ├── expo-logo.png
│       ├── favicon.png
│       ├── icon.png
│       ├── logo-glow.png
│       ├── react-logo.png
│       ├── react-logo@2x.png
│       ├── react-logo@3x.png
│       ├── splash-icon.png
│       ├── tabIcons
│       └── tutorial-web.png
├── eas.json
├── expo-env.d.ts
├── package-lock.json
├── package.json
├── scripts
│   └── reset-project.js
├── src
│   ├── app
│   │   ├── _layout.tsx
│   │   ├── caregiver
│   │   ├── explore.tsx
│   │   ├── index.tsx
│   │   ├── language.tsx
│   │   ├── login.tsx
│   │   ├── mode-selection.tsx
│   │   ├── onboarding.tsx
│   │   ├── otp.tsx
│   │   ├── patient
│   │   └── settings.tsx
│   ├── components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ErrorBanner.tsx
│   │   ├── MedicineCard.tsx
│   │   ├── PlantStreakVisual.tsx
│   │   ├── TrustBadge.tsx
│   │   ├── animated-icon.module.css
│   │   ├── animated-icon.tsx
│   │   ├── animated-icon.web.tsx
│   │   ├── app-tabs.tsx
│   │   ├── app-tabs.web.tsx
│   │   ├── external-link.tsx
│   │   ├── hint-row.tsx
│   │   ├── themed-text.tsx
│   │   ├── themed-view.tsx
│   │   ├── ui
│   │   └── web-badge.tsx
│   ├── constants
│   │   └── theme.ts
│   ├── global.css
│   ├── hooks
│   │   ├── use-color-scheme.ts
│   │   ├── use-color-scheme.web.ts
│   │   └── use-theme.ts
│   ├── i18n
│   │   └── index.ts
│   ├── navigation
│   │   └── RootNavigator.tsx
│   ├── screens
│   │   ├── CaregiverHomeScreen.tsx
│   │   ├── DoseConfirmationScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── LanguageScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── ModeSelectionScreen.tsx
│   │   ├── MyMedicinesScreen.tsx
│   │   ├── OcrVerifyScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   ├── OtpScreen.tsx
│   │   ├── PatientHomeScreen.tsx
│   │   ├── PrescriptionResultsScreen.tsx
│   │   ├── ReminderSetupScreen.tsx
│   │   ├── ScanPrescriptionScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── SplashScreen.tsx
│   ├── services
│   │   ├── api.ts
│   │   └── notificationService.ts
│   └── store
│       └── useAppStore.ts
└── tsconfig.json
```

---

## 2. Dependencies and DevDependencies (`medclarity-app/package.json`)

```json
{
  "dependencies": {
    "@expo/ui": "~57.0.7",
    "@expo/vector-icons": "^15.1.1",
    "@react-native-async-storage/async-storage": "^3.1.1",
    "expo": "~57.0.8",
    "expo-audio": "~57.0.3",
    "expo-camera": "^57.0.3",
    "expo-clipboard": "~57.0.1",
    "expo-constants": "~57.0.7",
    "expo-dev-client": "~57.0.9",
    "expo-device": "~57.0.1",
    "expo-font": "~57.0.1",
    "expo-glass-effect": "~57.0.1",
    "expo-image": "~57.0.1",
    "expo-image-picker": "^57.0.6",
    "expo-linear-gradient": "^57.0.1",
    "expo-linking": "~57.0.4",
    "expo-notifications": "^57.0.7",
    "expo-router": "~57.0.8",
    "expo-splash-screen": "~57.0.5",
    "expo-status-bar": "~57.0.1",
    "expo-symbols": "~57.0.1",
    "expo-system-ui": "~57.0.1",
    "expo-web-browser": "~57.0.2",
    "i18next": "^26.3.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-i18next": "^17.0.11",
    "react-native": "0.86.0",
    "react-native-gesture-handler": "~2.32.0",
    "react-native-reanimated": "4.5.0",
    "react-native-safe-area-context": "~5.7.0",
    "react-native-screens": "~4.26.0",
    "react-native-web": "~0.21.0",
    "react-native-worklets": "0.10.0",
    "zustand": "^5.0.14"
  },
  "devDependencies": {
    "@types/react": "~19.2.2",
    "typescript": "~6.0.3"
  }
}
```

---

## 3. Routing and Scheme Configuration (`medclarity-app/app.json`)

```json
{
  "name": "medclarity-app",
  "slug": "medclarity-app",
  "scheme": "medclarityapp",
  "plugins": [
    "expo-router",
    [
      "expo-splash-screen",
      {
        "backgroundColor": "#208AEF",
        "image": "./assets/images/splash-icon.png",
        "imageWidth": 76
      }
    ],
    "expo-audio"
  ],
  "experiments": {
    "typedRoutes": true,
    "reactCompiler": true
  },
  "extra": {
    "router": {},
    "eas": {
      "projectId": "119edfd0-9593-4b9c-bf0c-dd5e5b11fc4d"
    }
  }
}
```

---

## 4. Navigation Architecture & Routing Pattern

### Status:
- **Top-Level `app/` folder (Expo Router default root):** **NOT PRESENT** (`medclarity-app/app` does not exist).
- **Nested `src/app/` folder (Expo Router in `src` directory):** **PRESENT** (All active file-based routes and nested layouts reside under `src/app/`).
- **`src/navigation/` folder (React Navigation pattern):** **PRESENT** (Contains legacy placeholder stub `RootNavigator.tsx`).

### Files inside `src/navigation/`:
```text
src/navigation/RootNavigator.tsx
```

#### Content of `src/navigation/RootNavigator.tsx`:
```tsx
// Obsolete legacy RootNavigator - superseded by Expo Router (src/app)
export const RootNavigator = () => null;
```

### Route Files inside `src/app/`:
```text
src/app/_layout.tsx
src/app/explore.tsx
src/app/index.tsx
src/app/language.tsx
src/app/login.tsx
src/app/mode-selection.tsx
src/app/onboarding.tsx
src/app/otp.tsx
src/app/settings.tsx
src/app/caregiver/_layout.tsx
src/app/caregiver/alerts.tsx
src/app/caregiver/index.tsx
src/app/caregiver/patients.tsx
src/app/patient/_layout.tsx
src/app/patient/ai-assistant.tsx
src/app/patient/dose-confirmation.tsx
src/app/patient/history.tsx
src/app/patient/index.tsx
src/app/patient/medicines.tsx
src/app/patient/ocr-verify.tsx
src/app/patient/prescription.tsx
src/app/patient/reminder-setup.tsx
src/app/patient/scan.tsx
```

---

## 5. Application Entry Point Files

The application uses Expo Router (`"main": "expo-router/entry"` in `package.json`).
- `App.tsx` serves as the root component forwarding into Expo Router's `<Slot />`.
- `src/app/_layout.tsx` serves as the Root Layout initializing stores, i18n, notifications, and navigation stack.
- `src/app/index.tsx` serves as the initial route / splash screen redirector.

### 5.1 `medclarity-app/App.tsx`
```tsx
// App.tsx - Forwarding entry point for Expo Router (SDK 56 compatible)
import { Slot } from 'expo-router';

export default function App() {
  return <Slot />;
}

```

### 5.2 `medclarity-app/src/app/_layout.tsx`
```tsx
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
        <Stack.Screen name="login" />
        <Stack.Screen name="otp" />
        <Stack.Screen name="language" />
        <Stack.Screen name="mode-selection" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="patient" />
        <Stack.Screen name="caregiver" />
      </Stack>
    </SafeAreaProvider>
  );
}

```

### 5.3 `medclarity-app/src/app/index.tsx`
```tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';

export default function SplashScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const isLoggedIn = useAppStore((state) => state.isLoggedIn);
  const userMode = useAppStore((state) => state.userMode);

  const scaleAnim = new Animated.Value(0.7);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      if (isLoggedIn) {
        if (userMode === 'caregiver') {
          router.replace('/caregiver' as any);
        } else {
          router.replace('/patient' as any);
        }
      } else {
        router.replace('/login' as any);
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [isLoggedIn, userMode]);

  return (
    <LinearGradient colors={COLORS.bluePurpleGradient} style={styles.container}>
      <Animated.View
        style={[
          styles.logoLockup,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="heart" size={54} color={COLORS.primaryTealBright} />
          <View style={styles.badgeOverlay}>
            <Ionicons name="notifications" size={24} color={COLORS.warmAmber} />
          </View>
        </View>

        <Text style={styles.appName}>{t('appName')}</Text>
        <Text style={styles.tagline}>{t('tagline')}</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoLockup: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 20,
  },
  badgeOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 3,
  },
  appName: {
    fontSize: TYPOGRAPHY.fontSizeHero,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: TYPOGRAPHY.fontSizeLarge,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 8,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
});

```

---

## 6. Theme and Design Tokens File

### Status:
- `src/theme/theme.ts`: **DOES NOT EXIST** (No `src/theme/` directory exists).
- Active design system tokens and theme definitions reside in: `src/constants/theme.ts`.

### Full Contents of `medclarity-app/src/constants/theme.ts`:
```typescript
// MedClarity AI Design System Tokens

export const COLORS = {
  // Navigation & Informational UI (Blue, Purple, Teal)
  primaryBlue: '#2563EB',
  primaryBlueDark: '#1E3A8A',
  primaryBlueLight: '#DBEAFE',

  primaryPurple: '#7C3AED',
  primaryPurpleLight: '#F3E8FF',

  primaryTeal: '#0D9488',
  primaryTealLight: '#CCFBF1',
  primaryTealBright: '#2DD4BF',

  // Text & Base Neutral Colors
  textDark: '#0F172A',
  textMuted: '#475569',
  textLight: '#94A3B8',
  white: '#FFFFFF',

  background: '#F8FAFC',
  cardBackground: '#FFFFFF',
  glassBorder: 'rgba(255, 255, 255, 0.6)',
  cardShadow: 'rgba(15, 23, 42, 0.08)',

  // Status & Error
  errorRed: '#DC2626',
  errorBackground: '#FEE2E2',
  successGreen: '#16A34A',

  // STRICT RULE: Warm Accent (Amber/Coral) is RESERVED EXCLUSIVELY for streak, growth, & dose confirmation
  warmAmber: '#F59E0B',
  warmCoral: '#FB923C',
  warmAccentGradient: ['#F59E0B', '#FB923C'] as const,

  // UI Gradients
  bluePurpleGradient: ['#1E3A8A', '#7C3AED'] as const,
  tealGreenGradient: ['#0D9488', '#059669'] as const,
  blueTealGradient: ['#2563EB', '#14B8A6'] as const,
  lightBackgroundGradient: ['#F8FAFC', '#EFF6FF'] as const,
};

// Legacy Theme Compatibility Tokens
export const Colors = {
  light: {
    text: COLORS.textDark,
    textSecondary: COLORS.textMuted,
    background: COLORS.background,
    backgroundElement: '#F1F5F9',
    backgroundSelected: '#DBEAFE',
    tint: COLORS.primaryBlue,
    icon: COLORS.primaryBlue,
    tabIconDefault: COLORS.textLight,
    tabIconSelected: COLORS.primaryBlue,
  },
  dark: {
    text: COLORS.white,
    textSecondary: COLORS.textLight,
    background: COLORS.textDark,
    backgroundElement: '#1E293B',
    backgroundSelected: '#1E3A8A',
    tint: COLORS.primaryTealBright,
    icon: COLORS.primaryTealBright,
    tabIconDefault: COLORS.textLight,
    tabIconSelected: COLORS.primaryTealBright,
  },
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
};

export const Fonts = {
  regular: 'System',
  bold: 'System',
  mono: 'System',
};

export type ThemeColor = 'text' | 'textSecondary' | 'background' | 'backgroundElement' | 'backgroundSelected' | 'tint';
export const BottomTabInset = 16;
export const MaxContentWidth = 600;

export const TYPOGRAPHY = {
  fontSizeBase: 16,
  fontSizeLarge: 18,
  fontSizeTitle: 22,
  fontSizeHeader: 28,
  fontSizeHero: 34,

  fontWeightNormal: '400' as const,
  fontWeightMedium: '500' as const,
  fontWeightSemiBold: '600' as const,
  fontWeightBold: '700' as const,
};

export const LAYOUT = {
  minTouchTarget: 48, // Accessibility minimum touch target height/width
  buttonPaddingVertical: 14,
  buttonPaddingHorizontal: 24,
  borderRadiusPill: 9999,
  borderRadiusCard: 20,
  borderRadiusInput: 14,
  screenPaddingHorizontal: 20,
};

export const SHADOWS = {
  soft: {
    shadowColor: COLORS.textDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  medium: {
    shadowColor: COLORS.textDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

```

---

## 7. Implemented Screen Files

### 7.1 Screen Components in `src/screens/`
```text
src/screens/CaregiverHomeScreen.tsx
src/screens/DoseConfirmationScreen.tsx
src/screens/HistoryScreen.tsx
src/screens/LanguageScreen.tsx
src/screens/LoginScreen.tsx
src/screens/ModeSelectionScreen.tsx
src/screens/MyMedicinesScreen.tsx
src/screens/OcrVerifyScreen.tsx
src/screens/OnboardingScreen.tsx
src/screens/OtpScreen.tsx
src/screens/PatientHomeScreen.tsx
src/screens/PrescriptionResultsScreen.tsx
src/screens/ReminderSetupScreen.tsx
src/screens/ScanPrescriptionScreen.tsx
src/screens/SettingsScreen.tsx
src/screens/SplashScreen.tsx
```

### 7.2 Expo Router Route Screens in `src/app/`
```text
src/app/_layout.tsx
src/app/explore.tsx
src/app/index.tsx
src/app/language.tsx
src/app/login.tsx
src/app/mode-selection.tsx
src/app/onboarding.tsx
src/app/otp.tsx
src/app/settings.tsx
src/app/caregiver/_layout.tsx
src/app/caregiver/alerts.tsx
src/app/caregiver/index.tsx
src/app/caregiver/patients.tsx
src/app/patient/_layout.tsx
src/app/patient/ai-assistant.tsx
src/app/patient/dose-confirmation.tsx
src/app/patient/history.tsx
src/app/patient/index.tsx
src/app/patient/medicines.tsx
src/app/patient/ocr-verify.tsx
src/app/patient/prescription.tsx
src/app/patient/reminder-setup.tsx
src/app/patient/scan.tsx
```
