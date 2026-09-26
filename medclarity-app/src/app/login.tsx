import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorBanner } from '../components/ErrorBanner';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../constants/theme';
import { requestOtpApi } from '../services/api';
import { useTranslation } from 'react-i18next';

export default function LoginRoute() {
  const router = useRouter();
  const { t } = useTranslation();
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSendOtp = async () => {
    setErrorMsg(null);
    if (!contact || contact.trim().length < 5) {
      setErrorMsg('Please enter a valid phone number or email address.');
      return;
    }

    setLoading(true);
    try {
      await requestOtpApi(contact.trim());
      router.push({
        pathname: '/otp',
        params: { contact: contact.trim() },
      });
    } catch (err: any) {
      console.error('[LOGIN ERROR]', err);
      setErrorMsg(err.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#F8FAFC', '#E6F4F1']} style={styles.container}>
      <View pointerEvents="none" style={[styles.blob, styles.blobTopLeft]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobMidLeft]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobTopRight]} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.contentShell}>
            <View style={styles.brandRow}>
              <View style={styles.logoCircle}>
                <Ionicons name="fitness-outline" size={30} color={COLORS.primaryBlueDark} />
              </View>
              <View>
                <Text style={styles.brandKicker}>MedTrack</Text>
                <Text style={styles.brandSubtext}>Medication support</Text>
              </View>
            </View>
            <View style={styles.headerLockup}>
              <Text style={styles.appTitle}>{t('appName')}</Text>
              <Text style={styles.subTitle}>{t('loginSubtitle')}</Text>
            </View>

            <Card variant="glass" style={styles.formCard}>
              <Text style={styles.inputLabel}>{t('loginTitle')}</Text>

              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={COLORS.primaryBlue} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('inputPlaceholder')}
                  placeholderTextColor={COLORS.textLight}
                  value={contact}
                  onChangeText={(text) => {
                    setContact(text);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <ErrorBanner message={errorMsg} onClose={() => setErrorMsg(null)} />

              <Button
                title={t('getOtp')}
                onPress={handleSendOtp}
                loading={loading}
                variant="primary"
                style={styles.primaryButton}
                icon={<Ionicons name="arrow-forward" size={22} color={COLORS.white} />}
              />

              <View style={styles.signupLinkRow}>
                <Text style={styles.signupLinkText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/signup')}>
                  <Text style={styles.signupLinkHighlight}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.footerText}>{t('termsNotice')}</Text>
            </Card>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  contentShell: {
    width: '100%',
    maxWidth: 588,
    paddingTop: 72,
    paddingHorizontal: 32,
    paddingBottom: 48,
    gap: 24,
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blobTopLeft: {
    width: 320,
    height: 320,
    left: -120,
    top: -80,
    backgroundColor: '#DBEAFE',
    opacity: 0.9,
  },
  blobMidLeft: {
    width: 360,
    height: 360,
    left: 480,
    bottom: -40,
    backgroundColor: '#CCFBF1',
    opacity: 0.9,
  },
  blobTopRight: {
    width: 220,
    height: 220,
    right: -40,
    top: -120,
    backgroundColor: '#E0F2FE',
    opacity: 0.8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  brandKicker: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  brandSubtext: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.textLight,
  },
  headerLockup: {
    alignItems: 'center',
    gap: 8,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
    letterSpacing: -0.6,
  },
  subTitle: {
    fontSize: TYPOGRAPHY.fontSizeLarge,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 24,
  },
  formCard: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    gap: 16,
    width: '100%',
    alignSelf: 'stretch',
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSizeLarge,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: LAYOUT.borderRadiusInput,
    paddingHorizontal: 14,
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: COLORS.textDark,
  },
  primaryButton: {
    width: '100%',
  },
  signupLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  signupLinkText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  signupLinkHighlight: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlue,
  },
  footerText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
});
