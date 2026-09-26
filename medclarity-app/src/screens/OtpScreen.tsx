import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorBanner } from '../components/ErrorBanner';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../constants/theme';
import { verifyOtpApi, requestOtpApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

export const OtpScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const contact = route.params?.contact || '';
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

    // Auto-advance to next input field
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
      navigation.navigate('Language');
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
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={styles.headerLockup}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primaryBlueDark} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('otpTitle')}</Text>
          <Text style={styles.subtitle}>{t('otpSubtitle')} ({contact})</Text>
        </View>

        <Card variant="glass" style={styles.card}>
          {/* 6-digit blank/dash placeholders */}
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
                  placeholder="—"
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
            icon={<Ionicons name="checkmark-circle" size={22} color={COLORS.white} />}
          />

          <TouchableOpacity onPress={handleResend} style={styles.resendBtn}>
            <Text style={styles.resendText}>{t('resendCode')}</Text>
          </TouchableOpacity>
        </Card>

      </ScrollView>
    </LinearGradient>
  );
};

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
  headerLockup: {
    marginBottom: 24,
  },
  backBtn: {
    marginBottom: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizeHeader,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizeBase,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  card: {
    padding: 24,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  digitBox: {
    width: 46,
    height: 56,
    borderRadius: LAYOUT.borderRadiusInput,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitBoxFilled: {
    borderColor: COLORS.primaryBlue,
    backgroundColor: COLORS.primaryBlueLight,
  },
  digitInput: {
    fontSize: 24,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
    textAlign: 'center',
    width: '100%',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryTealLight,
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.primaryTeal,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  resendBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 16,
    color: COLORS.primaryBlue,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
  },
});
