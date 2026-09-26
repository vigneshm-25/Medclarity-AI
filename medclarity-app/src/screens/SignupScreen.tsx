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
import { useAppStore } from '../store/useAppStore';

export const SignupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [contact, setContact] = useState('');
  const [selectedRole, setSelectedRole] = useState<'patient' | 'caregiver'>('patient');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const setMode = useAppStore((state) => state.setMode);

  const handleSignup = async () => {
    setErrorMsg(null);
    if (!fullName || fullName.trim().length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!contact || contact.trim().length < 5) {
      setErrorMsg('Please enter a valid phone number or email address.');
      return;
    }

    setLoading(true);
    try {
      await setMode(selectedRole);
      await requestOtpApi(contact.trim());
      navigation.navigate('Otp', { contact: contact.trim(), fullName: fullName.trim() });
    } catch (err: any) {
      console.error('[SIGNUP ERROR]', err);
      setErrorMsg(err.message || 'Failed to initiate signup verification.');
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
              <Ionicons name="shield-checkmark" size={44} color={COLORS.primaryTeal} />
            </View>
            <Text style={styles.appTitle}>{t('signupTitle') || 'Create Account'}</Text>
            <Text style={styles.subTitle}>{t('signupSubtitle') || 'Join MedClarity AI for smart, accessible medication management'}</Text>
          </View>

          <Card variant="glass" style={styles.formCard}>
            {/* Full Name Field */}
            <Text style={styles.inputLabel}>{t('fullNamePlaceholder') || 'Full Name'}</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={COLORS.primaryBlue} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor={COLORS.textLight}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errorMsg) setErrorMsg(null);
                }}
                autoCapitalize="words"
              />
            </View>

            {/* Email / Phone Field */}
            <Text style={styles.inputLabel}>{t('inputPlaceholder') || 'Email or Phone Number'}</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={COLORS.primaryBlue} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. +91 98765 43210"
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

            {/* Role Selection Tabs */}
            <Text style={styles.inputLabel}>I am using this as</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                onPress={() => setSelectedRole('patient')}
                style={[styles.roleOption, selectedRole === 'patient' && styles.roleOptionActive]}
              >
                <Ionicons
                  name="person"
                  size={18}
                  color={selectedRole === 'patient' ? COLORS.primaryBlueDark : COLORS.textMuted}
                />
                <Text style={[styles.roleText, selectedRole === 'patient' && styles.roleTextActive]}>
                  Patient
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedRole('caregiver')}
                style={[styles.roleOption, selectedRole === 'caregiver' && styles.roleOptionActive]}
              >
                <Ionicons
                  name="people"
                  size={18}
                  color={selectedRole === 'caregiver' ? COLORS.primaryBlueDark : COLORS.textMuted}
                />
                <Text style={[styles.roleText, selectedRole === 'caregiver' && styles.roleTextActive]}>
                  Caregiver
                </Text>
              </TouchableOpacity>
            </View>

            <ErrorBanner message={errorMsg} onClose={() => setErrorMsg(null)} />

            <Button
              title={t('createAccountBtn') || 'Create Account & Verify'}
              onPress={handleSignup}
              loading={loading}
              variant="primary"
              icon={<Ionicons name="arrow-forward" size={22} color={COLORS.white} />}
              style={styles.actionBtn}
            />

            <View style={styles.loginLinkRow}>
              <Text style={styles.loginLinkText}>{t('alreadyHaveAccount') || 'Already have an account?'} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLinkHighlight}>{t('loginLink') || 'Log In'}</Text>
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
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primaryTealLight,
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
    marginTop: 6,
    maxWidth: 300,
  },
  formCard: {
    padding: 22,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
    marginBottom: 8,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: LAYOUT.borderRadiusInput,
    paddingHorizontal: 14,
    minHeight: 52,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textDark,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  roleOptionActive: {
    backgroundColor: COLORS.primaryBlueLight,
    borderColor: COLORS.primaryBlue,
  },
  roleText: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.textMuted,
  },
  roleTextActive: {
    color: COLORS.primaryBlueDark,
    fontWeight: TYPOGRAPHY.fontWeightBold,
  },
  actionBtn: {
    marginTop: 8,
  },
  loginLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  loginLinkText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  loginLinkHighlight: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlue,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
