import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PlantStreakVisual } from '../components/PlantStreakVisual';
import { MedicineCard } from '../components/MedicineCard';
import { Button } from '../components/Button';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';
import { scheduleMedicationReminder } from '../services/notificationService';

export const PatientHomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const contact = useAppStore((state) => state.contact);
  const reminders = useAppStore((state) => state.reminders);
  const streak = useAppStore((state) => state.streak);
  const plantStage = useAppStore((state) => state.plantStage);
  const markDose = useAppStore((state) => state.markDose);
  const language = useAppStore((state) => state.language);

  // Schedule local notification test on boot for upcoming reminders
  useEffect(() => {
    const upcoming = reminders.find((r) => r.status === 'upcoming');
    if (upcoming) {
      scheduleMedicationReminder(upcoming.medicineName, upcoming.dosage, upcoming.timeOfDay, language);
    }
  }, []);

  const handleTaken = (id: string) => {
    markDose(id, 'completed');
  };

  const handleSnooze = (id: string) => {
    markDose(id, 'snoozed');
  };

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userRow}>
            <View style={styles.logoBadge}>
              <Ionicons name="heart" size={24} color={COLORS.primaryTealBright} />
            </View>
            <View>
              <Text style={styles.greetingText}>{t('welcomeHeader')}</Text>
              <Text style={styles.usernameText}>{contact || 'Patient'}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={styles.drawerBtn}
          >
            <Ionicons name="menu-outline" size={28} color={COLORS.primaryBlueDark} />
          </TouchableOpacity>
        </View>

        {/* Streak Growth Plant Visual (Warm Accent Amber/Coral ONLY) */}
        <PlantStreakVisual streakDays={streak} stage={plantStage} />

        {/* Primary Action Buttons */}
        <View style={styles.primaryActionsRow}>
          <Button
            title={t('scanPrescriptionBtn')}
            onPress={() => navigation.navigate('ScanPrescription')}
            variant="primary"
            icon={<Ionicons name="camera" size={22} color={COLORS.white} />}
            style={styles.flexBtn}
          />

          <Button
            title={t('myMedicinesBtn')}
            onPress={() => navigation.navigate('MyMedicines')}
            variant="teal"
            icon={<Ionicons name="medical" size={22} color={COLORS.white} />}
            style={styles.flexBtn}
          />
        </View>

        {/* Today's Schedule Section */}
        <View style={styles.scheduleHeaderRow}>
          <Text style={styles.sectionTitle}>{t('todaysSchedule')}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{reminders.length}</Text>
          </View>
        </View>

        {reminders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color={COLORS.primaryTeal} />
            <Text style={styles.emptyText}>{t('noRemindersToday')}</Text>
          </View>
        ) : (
          reminders.map((item) => (
            <MedicineCard
              key={item.id}
              item={item}
              onTaken={handleTaken}
              onSnooze={handleSnooze}
            />
          ))
        )}

      </ScrollView>
    </LinearGradient>
  );
};

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryBlueDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  usernameText: {
    fontSize: 20,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  drawerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  primaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12,
  },
  flexBtn: {
    flex: 1,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  countBadge: {
    backgroundColor: COLORS.primaryBlueLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadiusCard,
    padding: 30,
    alignItems: 'center',
    marginVertical: 10,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 10,
    textAlign: 'center',
  },
});
