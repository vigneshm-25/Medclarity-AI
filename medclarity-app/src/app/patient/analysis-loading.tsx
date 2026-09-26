import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card } from '../../components/Card';
import { COLORS, TYPOGRAPHY, LAYOUT, SHADOWS } from '../../constants/theme';
import { processPrescriptionTextApi, PrescriptionProcessResponse } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from 'react-i18next';

export default function AnalysisLoadingRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ rawOcrText?: string }>();
  const rawOcrText = params.rawOcrText || '';

  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const progressAnim = useRef(new Animated.Value(15)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const steps = [
    { id: 1, label: t('stage1'), icon: 'document-text-outline' as const },
    { id: 2, label: t('stage2'), icon: 'medkit-outline' as const },
    { id: 3, label: t('stage3'), icon: 'time-outline' as const },
    { id: 4, label: t('stage4'), icon: 'shield-checkmark-outline' as const },
    { id: 5, label: t('stage5'), icon: 'sparkles-outline' as const },
  ];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.timing(progressAnim, {
      toValue: 92,
      duration: 3500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const t1 = setTimeout(() => { if (isMounted) setCurrentStep(2); }, 500);
    const t2 = setTimeout(() => { if (isMounted) setCurrentStep(3); }, 1100);
    const t3 = setTimeout(() => { if (isMounted) setCurrentStep(4); }, 1800);
    const t4 = setTimeout(() => { if (isMounted) setCurrentStep(5); }, 2500);

    async function executeAiPipeline() {
      try {
        const targetLang = language === 'ta' ? 'Tamil' : 'English';
        const masterPayload: PrescriptionProcessResponse = await processPrescriptionTextApi(rawOcrText, targetLang);

        if (!isMounted) return;

        Animated.timing(progressAnim, {
          toValue: 100,
          duration: 300,
          useNativeDriver: false,
        }).start();

        setCurrentStep(5);

        setTimeout(() => {
          if (isMounted) {
            router.replace({
              pathname: '/patient/prescription',
              params: {
                masterPayload: JSON.stringify(masterPayload),
                rawOcrText,
              },
            });
          }
        }, 400);
      } catch (err: any) {
        console.error('[ANALYSIS PIPELINE ERROR]', err);
        if (isMounted) {
          setErrorMsg(err.message || (language === 'ta' ? 'பகுப்பாய்வு தோல்வியடைந்தது.' : 'Analysis failed. Please try again.'));
        }
      }
    }

    executeAiPipeline();

    return () => {
      isMounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [rawOcrText, language]);

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <View style={styles.content}>
        
        {/* Animated Medical Pulse Circle */}
        <View style={styles.pulseContainer}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.pulseInner}>
              <Ionicons name="medical" size={40} color={COLORS.primaryTealBright} />
            </View>
          </Animated.View>
        </View>

        <Text style={styles.title}>{t('analyzingPrescriptionTitle')}</Text>
        <Text style={styles.subtitle}>{t('analyzingPrescriptionSubtitle')}</Text>

        {/* Progress Bar */}
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* 5 Sequential Medical Stage Cards */}
        <Card variant="glass" style={styles.stepsCard}>
          {steps.map((step) => {
            const isDone = currentStep > step.id;
            const isActive = currentStep === step.id;

            return (
              <View
                key={step.id}
                style={[
                  styles.stepRow,
                  isActive && styles.stepRowActive,
                  isDone && styles.stepRowDone,
                ]}
              >
                <View
                  style={[
                    styles.stepBadge,
                    isDone && styles.stepBadgeDone,
                    isActive && styles.stepBadgeActive,
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                  ) : isActive ? (
                    <Ionicons name={step.icon} size={16} color={COLORS.white} />
                  ) : (
                    <Ionicons name={step.icon} size={16} color={COLORS.textLight} />
                  )}
                </View>

                <Text
                  style={[
                    styles.stepText,
                    isActive && styles.stepTextActive,
                    isDone && styles.stepTextDone,
                  ]}
                >
                  {step.label}
                </Text>

                {isActive && (
                  <View style={styles.activeDot} />
                )}
              </View>
            );
          })}
        </Card>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={COLORS.errorRed} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : (
          <View style={styles.trustBadge}>
            <Ionicons name="shield-checkmark" size={18} color={COLORS.primaryTeal} />
            <Text style={styles.trustText}>
              {language === 'ta' ? 'WHO மற்றும் CDSCO வழிகாட்டுதல்கள்' : 'WHO Model List of Essential Medicines'}
            </Text>
          </View>
        )}

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseContainer: {
    marginBottom: 20,
  },
  pulseRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryBlueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryBlueDark,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizeHeader,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
    maxWidth: 320,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primaryTeal,
    borderRadius: 4,
  },
  stepsCard: {
    width: '100%',
    padding: 18,
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 12,
  },
  stepRowActive: {
    backgroundColor: COLORS.primaryBlueLight,
  },
  stepRowDone: {
    backgroundColor: '#F8FAFC',
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeActive: {
    backgroundColor: COLORS.primaryBlue,
  },
  stepBadgeDone: {
    backgroundColor: COLORS.successGreen,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textLight,
  },
  stepTextActive: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  stepTextDone: {
    color: COLORS.textDark,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryTeal,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    backgroundColor: COLORS.primaryTealLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  trustText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.primaryTeal,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    backgroundColor: COLORS.errorBackground,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.errorRed,
  },
});
