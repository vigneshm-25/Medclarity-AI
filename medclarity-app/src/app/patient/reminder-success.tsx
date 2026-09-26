import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { COLORS, TYPOGRAPHY, LAYOUT, SHADOWS } from '../../constants/theme';
import { useTranslation } from 'react-i18next';

export default function ReminderSuccessRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    medicineName?: string;
    dosage?: string;
    timeOfDay?: string;
    relationToFood?: string;
  }>();

  const { t } = useTranslation();
  const medicineName = params.medicineName || 'Amoxicillin 500mg';
  const dosage = params.dosage || '1 Capsule';
  const timeOfDay = params.timeOfDay || '08:00 AM';
  const relationToFood = params.relationToFood || 'After Food';

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Success Celebration Hero */}
        <View style={styles.heroSection}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark-circle" size={80} color={COLORS.successGreen} />
          </View>
          <Text style={styles.title}>{t('reminderSuccessTitle') || 'Reminder Scheduled!'}</Text>
          <Text style={styles.subtitle}>
            {t('reminderSuccessSubtitle') || 'Your medication reminder is active with daily alarm notifications.'}
          </Text>
        </View>

        {/* Scheduled Dose Details Card */}
        <Card variant="glass" style={styles.summaryCard}>
          <View style={styles.cardHeader}>
            <View style={styles.medBadge}>
              <Ionicons name="medical" size={24} color={COLORS.primaryTeal} />
            </View>
            <View style={styles.medHeaderCol}>
              <Text style={styles.medicineName}>{medicineName}</Text>
              <Text style={styles.dosageText}>{dosage}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={18} color={COLORS.primaryBlue} />
              <View>
                <Text style={styles.infoLabel}>Scheduled Time</Text>
                <Text style={styles.infoValue}>{timeOfDay}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="restaurant-outline" size={18} color={COLORS.primaryTeal} />
              <View>
                <Text style={styles.infoLabel}>Meal Relation</Text>
                <Text style={styles.infoValue}>{relationToFood}</Text>
              </View>
            </View>
          </View>

          <View style={styles.notificationStatus}>
            <Ionicons name="notifications-circle" size={20} color={COLORS.successGreen} />
            <Text style={styles.notificationText}>Daily push notification alarm enabled</Text>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <Button
            title={t('backToHome') || 'Back to Home'}
            onPress={() => router.replace('/patient')}
            variant="primary"
            icon={<Ionicons name="home" size={20} color={COLORS.white} />}
          />

          <Button
            title={t('viewAllReminders') || 'View All Reminders'}
            onPress={() => router.push('/patient/medicines')}
            variant="teal"
            icon={<Ionicons name="list" size={20} color={COLORS.white} />}
          />

          <Button
            title={t('addAnother') || '+ Add Another Medicine'}
            onPress={() =>
              router.push({
                pathname: '/patient/reminder-setup',
                params: { medicinesToSetup: JSON.stringify([]), currentIndex: 0 },
              })
            }
            variant="outline"
            icon={<Ionicons name="add" size={20} color={COLORS.primaryBlue} />}
          />
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
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    paddingTop: 60,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  checkCircle: {
    marginBottom: 16,
    ...SHADOWS.soft,
  },
  title: {
    fontSize: 26,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
    lineHeight: 22,
  },
  summaryCard: {
    padding: 20,
    marginVertical: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  medBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryTealLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medHeaderCol: {
    flex: 1,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  dosageText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
    marginTop: 2,
  },
  notificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 16,
  },
  notificationText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.successGreen,
  },
  actionSection: {
    marginTop: 20,
    gap: 10,
  },
});
