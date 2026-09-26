import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PlantStreakVisual } from '../components/PlantStreakVisual';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { getRandomReminderPhrase } from '../services/notificationService';
import { useTranslation } from 'react-i18next';

export const DoseConfirmationScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const reminderId = route.params?.reminderId || 'rem-1';
  const medicineName = route.params?.medicineName || 'Amoxicillin 500mg';

  const markDose = useAppStore((state) => state.markDose);
  const streak = useAppStore((state) => state.streak);
  const plantStage = useAppStore((state) => state.plantStage);
  const language = useAppStore((state) => state.language);

  const [confirmed, setConfirmed] = useState(false);
  const scaleAnim = new Animated.Value(1);

  const warmPhrase = getRandomReminderPhrase(language);

  const handleTaken = () => {
    markDose(reminderId, 'completed');
    setConfirmed(true);

    // Celebratory pop animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      navigation.replace('MainDrawer');
    }, 1500);
  };

  const handleSnooze = () => {
    markDose(reminderId, 'snoozed');
    navigation.replace('MainDrawer');
  };

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="notifications-circle" size={56} color={COLORS.warmAmber} />
          </View>
          <Text style={styles.warmTitle}>{warmPhrase}</Text>
        </View>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Card variant="glass" style={styles.card}>
            <Text style={styles.medLabel}>Medication Scheduled</Text>
            <Text style={styles.medName}>{medicineName}</Text>

            {confirmed ? (
              <View style={styles.celebrationBox}>
                <Ionicons name="checkmark-circle" size={48} color={COLORS.warmAmber} />
                <Text style={styles.celebrationText}>Dose Confirmed! +1 Day Streak!</Text>
              </View>
            ) : (
              <View style={styles.actionsContainer}>
                <Button
                  title={t('takenAction')}
                  onPress={handleTaken}
                  variant="warmAccent" // Warm accent used strictly for confirmation moment
                  icon={<Ionicons name="checkmark-done" size={24} color={COLORS.white} />}
                />

                <Button
                  title={t('snoozeAction')}
                  onPress={handleSnooze}
                  variant="outline"
                  icon={<Ionicons name="alarm-outline" size={20} color={COLORS.primaryBlue} />}
                />
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Updated Plant Growth Visual */}
        <PlantStreakVisual streakDays={streak} stage={plantStage} />

      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    paddingVertical: 50,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  warmTitle: {
    fontSize: TYPOGRAPHY.fontSizeLarge,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textDark,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  card: {
    padding: 24,
    alignItems: 'center',
  },
  medLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  medName: {
    fontSize: 26,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
    marginVertical: 10,
    textAlign: 'center',
  },
  celebrationBox: {
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  celebrationText: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.warmAmber,
  },
  actionsContainer: {
    width: '100%',
    gap: 10,
    marginTop: 16,
  },
});
