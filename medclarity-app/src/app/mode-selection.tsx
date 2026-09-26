import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TrustBadges } from '../components/TrustBadge';
import { COLORS, TYPOGRAPHY, LAYOUT, SHADOWS } from '../constants/theme';
import { useAppStore, UserMode } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

export default function ModeSelectionRoute() {
  const router = useRouter();
  const { t } = useTranslation();
  const setMode = useAppStore((state) => state.setMode);
  const hasSeenOnboarding = useAppStore((state) => state.hasSeenOnboarding);

  const handleSelectMode = async (mode: UserMode) => {
    await setMode(mode);
    if (mode === 'patient' && !hasSeenOnboarding) {
      router.push('/onboarding' as any);
    } else if (mode === 'caregiver') {
      router.replace('/caregiver' as any);
    } else {
      router.replace('/patient' as any);
    }
  };

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.title}>{t('selectModeTitle')}</Text>
        </View>

        {/* Patient Mode Card (Blue / Purple) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleSelectMode('patient')}
          style={styles.cardWrapper}
        >
          <LinearGradient
            colors={COLORS.bluePurpleGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modeCard}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="person" size={32} color={COLORS.primaryBlueDark} />
              </View>
              <Ionicons name="arrow-forward-circle" size={36} color={COLORS.white} />
            </View>

            <Text style={styles.cardTitle}>{t('patientModeTitle')}</Text>
            <Text style={styles.cardDesc}>{t('patientModeDesc')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Caregiver Mode Card (Teal / Green) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleSelectMode('caregiver')}
          style={styles.cardWrapper}
        >
          <LinearGradient
            colors={COLORS.tealGreenGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modeCard}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.primaryTealLight }]}>
                <Ionicons name="people" size={32} color={COLORS.primaryTeal} />
              </View>
              <Ionicons name="arrow-forward-circle" size={36} color={COLORS.white} />
            </View>

            <Text style={styles.cardTitle}>{t('caregiverModeTitle')}</Text>
            <Text style={styles.cardDesc}>{t('caregiverModeDesc')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Trust Badges beneath */}
        <View style={styles.trustSection}>
          <TrustBadges />
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizeHeader,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
    textAlign: 'center',
  },
  cardWrapper: {
    marginVertical: 10,
    borderRadius: LAYOUT.borderRadiusCard,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  modeCard: {
    padding: 24,
    borderRadius: LAYOUT.borderRadiusCard,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.white,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  trustSection: {
    marginTop: 24,
  },
});
