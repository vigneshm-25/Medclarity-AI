import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorBanner } from '../components/ErrorBanner';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../constants/theme';
import { verifyOtpApi, requestOtpApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

export default function OtpRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ contact?: string }>();
  const contact = params.contact || '';

  const { t } = useTranslation();
  const loginUser = useAppStore((state) => state.loginUser);

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (text: string, index: number) => {
    setErrorMsg(null);
    const newOtp = [...otpDigits];
    newOtp[index] = text;
    setOtpDigits(newOtp);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    setErrorMsg(null);
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setErrorMsg(t('otpInvalid'));
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtpApi(contact, code);
      await loginUser(contact, res.token);
      router.push('/language');
    } catch (err: any) {
      console.error('[OTP ERROR]', err);
      setErrorMsg(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      await requestOtpApi(contact);
      setInfoMsg('A new OTP code has been sent to your contact.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend OTP.');
    }
  };

  return (
    <LinearGradient colors={['#F8FAFC', '#E6F4F1']} style={styles.container}>
      <View pointerEvents="none" style={[styles.blob, styles.blobTopLeft]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobTopRight]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobBottomRight]} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.shell}>
          <View style={styles.hero}>
            <View style={styles.heroGraphic}>
              <View style={styles.heroImagePanel}>
                <View style={styles.heroIconWrap}>
                  <Ionicons name="heart" size={42} color={COLORS.primaryBlue} />
                  <Ionicons name="medical" size={36} color={COLORS.primaryTeal} style={styles.heroMedicalIcon} />
                  <View style={styles.heroBellBadge}>
                    <Ionicons name="notifications" size={20} color={COLORS.primaryPurple} />
                  </View>
                </View>
              </View>
            </View>
            <Text style={styles.brandName}>MedTrack</Text>
            <Text style={styles.brandSubtitle}>Your daily medication companion</Text>
          </View>

          <Card variant="glass" style={styles.card}>
            <Text style={styles.cardTitle}>Verify Your Identity</Text>
            <Text style={styles.cardSubtitle}>
              A verification code has been sent to your registered email or mobile number.
            </Text>

            <Text style={styles.inputLabel}>Enter verification code</Text>

            <View style={styles.otpRow}>
              {otpDigits.map((digit, idx) => (
                <View key={idx} style={[styles.digitBox, digit ? styles.digitBoxFilled : null]}>
                  <TextInput
                    ref={(ref) => { inputRefs.current[idx] = ref; }}
                    style={styles.digitInput}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, idx)}
                    onKeyPress={(e) => handleKeyPress(e, idx)}
                    placeholder="0"
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              ))}
            </View>

            {infoMsg ? (
              <View style={styles.infoBanner}>
                <Ionicons name="information-circle" size={18} color={COLORS.primaryTeal} />
                <Text style={styles.infoText}>{infoMsg}</Text>
              </View>
            ) : null}

            <ErrorBanner message={errorMsg} onClose={() => setErrorMsg(null)} />

            <Button
              title={t('verifyBtn')}
              onPress={handleVerify}
              loading={loading}
              variant="primary"
              style={styles.verifyBtn}
              icon={<Ionicons name="checkmark-circle" size={22} color={COLORS.white} />}
            />

            <TouchableOpacity onPress={handleResend} style={styles.resendBtn}>
              <Text style={styles.resendText}>
                Didn’t receive a code? <Text style={styles.resendLink}>Resend Code</Text>
              </Text>
            </TouchableOpacity>
          </Card>

          <Text style={styles.footerText}>
            By continuing, you agree to our <Text style={styles.footerLink}>Terms</Text> and <Text style={styles.footerLink}>Privacy Policy</Text>.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blobTopLeft: {
    width: 340,
    height: 340,
    left: -120,
    top: -90,
    backgroundColor: '#DBEAFE',
    opacity: 0.9,
  },
  blobTopRight: {
    width: 250,
    height: 250,
    right: -80,
    top: -110,
    backgroundColor: '#E0F2FE',
    opacity: 0.8,
  },
  blobBottomRight: {
    width: 260,
    height: 260,
    right: -90,
    bottom: -60,
    backgroundColor: '#CCFBF1',
    opacity: 0.85,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  shell: {
    width: '100%',
    maxWidth: 700,
    alignItems: 'center',
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    width: '100%',
  },
  heroGraphic: {
    width: '100%',
    alignItems: 'center',
  },
  heroImagePanel: {
    width: '78%',
    maxWidth: 490,
    height: 112,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  heroIconWrap: {
    width: 140,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroMedicalIcon: {
    position: 'absolute',
    left: 66,
    top: 28,
  },
  heroBellBadge: {
    position: 'absolute',
    right: 38,
    top: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 9999,
    padding: 4,
  },
  brandName: {
    fontSize: 24,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
    letterSpacing: -0.4,
  },
  brandSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  card: {
    width: '100%',
    maxWidth: 410,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 22,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  inputLabel: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textDark,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 14,
  },
  digitBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitBoxFilled: {
    borderColor: COLORS.primaryBlue,
    backgroundColor: '#EFF6FF',
  },
  digitInput: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
    textAlign: 'center',
    width: '100%',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryTealLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.primaryTeal,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    flex: 1,
  },
  verifyBtn: {
    width: '100%',
    marginTop: 2,
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: 6,
    marginTop: 2,
  },
  resendText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  resendLink: {
    color: COLORS.primaryBlue,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 360,
  },
  footerLink: {
    color: COLORS.textDark,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
  },
});
