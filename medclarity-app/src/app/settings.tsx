import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

export default function SettingsRoute() {
  const router = useRouter();
  const { t } = useTranslation();
  const contact = useAppStore((state) => state.contact);
  const userMode = useAppStore((state) => state.userMode);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const setMode = useAppStore((state) => state.setMode);
  const logoutUser = useAppStore((state) => state.logoutUser);

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const handleToggleLanguage = async () => {
    const nextLang = language === 'en' ? 'ta' : 'en';
    await setLanguage(nextLang);
  };

  const handleToggleMode = async () => {
    const nextMode = userMode === 'patient' ? 'caregiver' : 'patient';
    await setMode(nextMode);
    if (nextMode === 'caregiver') {
      router.replace('/caregiver' as any);
    } else {
      router.replace('/patient' as any);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.replace('/login' as any);
  };

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primaryBlueDark} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('settingsTitle')}</Text>
        </View>

        {/* Profile Card */}
        <Card variant="glass" style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={28} color={COLORS.primaryBlue} />
            </View>
            <View style={styles.profileTextCol}>
              <Text style={styles.profileTitle}>{t('profileTitle')}</Text>
              <Text style={styles.profileContact}>{contact || 'User Contact'}</Text>
              <Text style={styles.roleTag}>Mode: {userMode === 'patient' ? 'Patient' : 'Caregiver'}</Text>
            </View>
          </View>
        </Card>

        {/* Settings Options */}
        <Card variant="glass" style={styles.card}>
          
          {/* Language Toggle */}
          <TouchableOpacity onPress={handleToggleLanguage} style={styles.optionItem}>
            <View style={styles.optionLeft}>
              <Ionicons name="language-outline" size={24} color={COLORS.primaryBlue} />
              <View>
                <Text style={styles.optionTitle}>{t('languageSetting')}</Text>
                <Text style={styles.optionValue}>{language === 'en' ? 'English' : 'தமிழ் (Tamil)'}</Text>
              </View>
            </View>
            <Ionicons name="swap-horizontal" size={22} color={COLORS.primaryBlue} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Mode Switcher */}
          <TouchableOpacity onPress={handleToggleMode} style={styles.optionItem}>
            <View style={styles.optionLeft}>
              <Ionicons name="people-outline" size={24} color={COLORS.primaryTeal} />
              <View>
                <Text style={styles.optionTitle}>{t('modeSetting')}</Text>
                <Text style={styles.optionValue}>
                  {userMode === 'patient' ? t('patientModeTitle') : t('caregiverModeTitle')}
                </Text>
              </View>
            </View>
            <Ionicons name="swap-horizontal" size={22} color={COLORS.primaryTeal} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Notification Switch */}
          <View style={styles.optionItem}>
            <View style={styles.optionLeft}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.primaryPurple} />
              <View>
                <Text style={styles.optionTitle}>{t('notificationsSetting')}</Text>
                <Text style={styles.optionValue}>{notificationsEnabled ? 'Enabled' : 'Disabled'}</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#CBD5E1', true: COLORS.primaryPurple }}
            />
          </View>

          <View style={styles.divider} />

          {/* History Quick Access */}
          <TouchableOpacity onPress={() => router.push('/patient/history')} style={styles.optionItem}>
            <View style={styles.optionLeft}>
              <Ionicons name="time-outline" size={24} color={COLORS.primaryBlueDark} />
              <View>
                <Text style={styles.optionTitle}>{t('historyTitle')}</Text>
                <Text style={styles.optionValue}>View medication log history</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.textLight} />
          </TouchableOpacity>

        </Card>

        {/* Logout Button */}
        <Button
          title={t('logout')}
          onPress={handleLogout}
          variant="outline"
          icon={<Ionicons name="log-out-outline" size={20} color={COLORS.errorRed} />}
          textStyle={{ color: COLORS.errorRed }}
          style={styles.logoutBtn}
        />

      </ScrollView>
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
    paddingBottom: 30,
  },
  header: {
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizeHeader,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  card: {
    marginVertical: 10,
    padding: 18,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryBlueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileTextCol: {
    flex: 1,
  },
  profileTitle: {
    fontSize: TYPOGRAPHY.fontSizeLarge,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  profileContact: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  roleTag: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.primaryTeal,
    marginTop: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  optionValue: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  logoutBtn: {
    borderColor: COLORS.errorRed,
    marginTop: 20,
  },
});
