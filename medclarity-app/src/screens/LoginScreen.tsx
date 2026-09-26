import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorBanner } from '../components/ErrorBanner';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../constants/theme';
import { requestOtpApi } from '../services/api';
import { useTranslation } from 'react-i18next';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
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
      navigation.navigate('Otp', { contact: contact.trim() });
    } catch (err: any) {
      console.error('[LOGIN ERROR]', err);
      setErrorMsg(err.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerLockup}>
            <View style={styles.logoCircle}>
              <Ionicons name="fitness-outline" size={48} color={COLORS.primaryBlue} />
            </View>
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
              icon={<Ionicons name="arrow-forward" size={22} color={COLORS.white} />}
            />

            <View style={styles.signupLinkRow}>
              <Text style={styles.signupLinkText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.signupLinkHighlight}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('termsNotice')}</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  headerLockup: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBlueLight,
  },
  appTitle: {
    fontSize: TYPOGRAPHY.fontSizeHeader,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  subTitle: {
    fontSize: TYPOGRAPHY.fontSizeBase,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
  formCard: {
    padding: 24,
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
    backgroundColor: '#F1F5F9',
    borderRadius: LAYOUT.borderRadiusInput,
    paddingHorizontal: 14,
    minHeight: 54,
    marginBottom: 16,
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
  signupLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
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
  footer: {
    marginTop: 30,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
