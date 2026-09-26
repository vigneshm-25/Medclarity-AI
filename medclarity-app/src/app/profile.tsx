import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { BottomNavigation } from '../components/BottomNavigation';
import { COLORS, TYPOGRAPHY, LAYOUT, SHADOWS } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

export default function ProfileRoute() {
  const router = useRouter();
  const { t } = useTranslation();
  const contact = useAppStore((state) => state.contact);
  const userMode = useAppStore((state) => state.userMode);
  const language = useAppStore((state) => state.language);
  const streak = useAppStore((state) => state.streak);
  const reminders = useAppStore((state) => state.reminders);
  const logoutUser = useAppStore((state) => state.logoutUser);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const [copiedCode, setCopiedCode] = useState(false);
  const shareCode = 'MED-PAT-7892';

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(shareCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLogout = async () => {
    await logoutUser();
    router.replace('/login');
  };

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primaryBlueDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profileHeader') || 'Patient Profile'}</Text>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={22} color={COLORS.primaryBlueDark} />
          </TouchableOpacity>
        </View>

        {/* User Identity Card */}
        <Card variant="glass" style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={40} color={COLORS.white} />
          </View>
          <Text style={styles.userName}>{contact ? contact.split('@')[0] : 'Patient User'}</Text>
          <Text style={styles.userContact}>{contact || '+91 98765 43210'}</Text>
          
          <View style={styles.modeBadge}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.primaryBlue} />
            <Text style={styles.modeBadgeText}>Mode: {userMode === 'patient' ? 'Patient' : 'Caregiver'}</Text>
          </View>
        </Card>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Card variant="glass" style={styles.statBox}>
            <Ionicons name="flame" size={24} color={COLORS.warmAmber} />
            <Text style={styles.statNumber}>{streak} Days</Text>
            <Text style={styles.statLabel}>Adherence Streak</Text>
          </Card>

          <Card variant="glass" style={styles.statBox}>
            <Ionicons name="medical" size={24} color={COLORS.primaryTeal} />
            <Text style={styles.statNumber}>{reminders.length}</Text>
            <Text style={styles.statLabel}>Active Reminders</Text>
          </Card>
        </View>

        {/* Clinical / Health Info */}
        <Card variant="glass" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('healthDetails') || 'Health & Medical Info'}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('bloodGroup') || 'Blood Group'}</Text>
            <Text style={styles.infoValue}>O+ Positive</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('allergies') || 'Known Allergies'}</Text>
            <Text style={styles.infoValue}>Penicillin (Mild)</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('emergencyContact') || 'Emergency Contact'}</Text>
            <Text style={styles.infoValue}>+91 98765 12345 (Family)</Text>
          </View>
        </Card>

        {/* Caregiver Share Code Card */}
        <Card variant="glass" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('caregiverCode') || 'Caregiver Link Code'}</Text>
          <Text style={styles.sectionSub}>Share this code with your family member or caregiver to allow adherence monitoring.</Text>
          
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{shareCode}</Text>
            <TouchableOpacity onPress={handleCopyCode} style={styles.copyBtn}>
              <Ionicons
                name={copiedCode ? 'checkmark-circle' : 'copy-outline'}
                size={18}
                color={copiedCode ? COLORS.successGreen : COLORS.primaryBlue}
              />
              <Text style={[styles.copyBtnText, copiedCode && { color: COLORS.successGreen }]}>
                {copiedCode ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Language Selection Quick Switch */}
        <Card variant="glass" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('languageSetting') || 'App Language'}</Text>
          <View style={styles.langSwitchRow}>
            <TouchableOpacity
              onPress={() => setLanguage('en')}
              style={[styles.langChoice, language === 'en' && styles.langChoiceActive]}
            >
              <Text style={[styles.langChoiceText, language === 'en' && styles.langChoiceTextActive]}>
                English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setLanguage('ta')}
              style={[styles.langChoice, language === 'ta' && styles.langChoiceActive]}
            >
              <Text style={[styles.langChoiceText, language === 'ta' && styles.langChoiceTextActive]}>
                தமிழ் (Tamil)
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Logout Action Button */}
        <View style={styles.logoutContainer}>
          <Button
            title={t('logout') || 'Log Out'}
            onPress={handleLogout}
            variant="outline"
            icon={<Ionicons name="log-out-outline" size={20} color={COLORS.errorRed} />}
            textStyle={{ color: COLORS.errorRed }}
            style={styles.logoutBtn}
          />
        </View>

      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="profile" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  userCard: {
    alignItems: 'center',
    padding: 24,
    marginVertical: 10,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryBlueDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...SHADOWS.soft,
  },
  userName: {
    fontSize: 20,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  userContact: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 10,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlueLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  modeBadgeText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 6,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionCard: {
    padding: 18,
    marginVertical: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
    marginBottom: 8,
  },
  sectionSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  codeText: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
    letterSpacing: 1.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlue,
  },
  langSwitchRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  langChoice: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langChoiceActive: {
    backgroundColor: COLORS.primaryBlueLight,
    borderColor: COLORS.primaryBlue,
  },
  langChoiceText: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.textMuted,
  },
  langChoiceTextActive: {
    color: COLORS.primaryBlueDark,
    fontWeight: TYPOGRAPHY.fontWeightBold,
  },
  logoutContainer: {
    marginTop: 16,
    marginBottom: 10,
  },
  logoutBtn: {
    borderColor: COLORS.errorRed,
  },
});
