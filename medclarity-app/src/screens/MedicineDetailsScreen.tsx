import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { COLORS, TYPOGRAPHY, LAYOUT, SHADOWS } from '../constants/theme';
import { NormalizedMedicine, normalizeMedicineItem, getAudioStreamUrl } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';
import { createAudioPlayer } from 'expo-audio';

interface MedicineDetailsScreenProps {
  navigation: any;
  route: any;
}

export const MedicineDetailsScreen: React.FC<MedicineDetailsScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const rawMed = route.params?.medicine || {
    name: 'Amoxicillin 500mg',
    dosage: '1 Capsule',
    timing: 'After Food (Morning & Evening)',
    time_of_day: '08:00 AM',
    relation_to_food: 'After Food',
    purpose: 'Broad-spectrum antibiotic used to treat bacterial throat, ear, and chest infections.',
    duration: '5 Days',
    side_effects: 'Mild nausea, stomach ache, diarrhea. Take with plenty of water.',
  };

  const medicine: NormalizedMedicine = normalizeMedicineItem(rawMed);
  const language = useAppStore((state) => state.language);
  const isTamil = language === 'ta';

  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState<any>(null);

  const handlePlayVoice = async () => {
    try {
      if (isPlaying && player) {
        player.pause();
        player.seekTo(0);
        setIsPlaying(false);
        return;
      }

      const spokenText = `${medicine.name}. ${medicine.dosage}. ${medicine.timing}. ${medicine.purpose || ''}. ${medicine.side_effects || ''}`;
      const audioUrl = getAudioStreamUrl(spokenText, isTamil ? 'ta' : 'en');

      const newPlayer = createAudioPlayer({ uri: audioUrl });
      newPlayer.play();
      setPlayer(newPlayer);
      setIsPlaying(true);

      newPlayer.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (err) {
      console.log('Voice audio playback error:', err);
      setIsPlaying(false);
    }
  };

  const handleSetReminder = () => {
    navigation.navigate('ReminderSetup', {
      medicinesToSetup: [medicine],
      currentIndex: 0,
    });
  };

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primaryBlueDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('medicineDetailsTitle') || 'Medicine Details'}</Text>
        </View>

        {/* Hero Medicine Card */}
        <Card variant="glass" style={styles.heroCard}>
          <View style={styles.iconBadge}>
            <Ionicons name="medical" size={32} color={COLORS.primaryTeal} />
          </View>
          <Text style={styles.medicineName}>{medicine.name}</Text>
          <Text style={styles.dosageText}>{medicine.dosage} • {medicine.duration}</Text>

          <View style={styles.whoBadge}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.primaryTeal} />
            <Text style={styles.whoText}>{t('whoVerified') || 'WHO Model List Verified'}</Text>
          </View>
        </Card>

        {/* Spoken Narration Button */}
        <TouchableOpacity onPress={handlePlayVoice} style={styles.voiceBar}>
          <Ionicons
            name={isPlaying ? 'pause-circle' : 'volume-high'}
            size={28}
            color={COLORS.primaryBlue}
          />
          <View style={styles.voiceTextCol}>
            <Text style={styles.voiceTitle}>
              {isPlaying ? t('stopAudio') : (t('listenAudioSummary') || 'Listen to Voice Breakdown')}
            </Text>
            <Text style={styles.voiceSub}>
              {isTamil ? 'தமிழ் குரல் வழிகாட்டல்' : 'Spoken plain English audio'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Schedule & Meal Timing */}
        <Card variant="glass" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="restaurant-outline" size={20} color={COLORS.primaryTeal} />
            <Text style={styles.sectionTitle}>{t('instructionsTitle') || 'How to Take'}</Text>
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.rowLabel}>Timing:</Text>
            <Text style={styles.rowValue}>{medicine.timing}</Text>
          </View>
          {medicine.time_of_day ? (
            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Scheduled Hour:</Text>
              <Text style={styles.rowValue}>{medicine.time_of_day}</Text>
            </View>
          ) : null}
          <View style={styles.rowItem}>
            <Text style={styles.rowLabel}>Prescribed Duration:</Text>
            <Text style={styles.rowValue}>{medicine.duration}</Text>
          </View>
        </Card>

        {/* Purpose */}
        {medicine.purpose ? (
          <Card variant="glass" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.primaryBlue} />
              <Text style={styles.sectionTitle}>Purpose & Indication</Text>
            </View>
            <Text style={styles.bodyText}>{medicine.purpose}</Text>
          </Card>
        ) : null}

        {/* Side Effects & Precautions */}
        <Card variant="glass" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning-outline" size={20} color={COLORS.warmAmber} />
            <Text style={styles.sectionTitle}>{t('sideEffectsTitle') || 'Possible Side Effects'}</Text>
          </View>
          <Text style={styles.bodyText}>
            {medicine.side_effects || 'Generally well-tolerated. Drink a full glass of water. Consult your doctor if unexpected symptoms occur.'}
          </Text>
        </Card>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={t('setReminders') || 'Set Reminder for this Medicine'}
            onPress={handleSetReminder}
            variant="primary"
            icon={<Ionicons name="alarm" size={22} color={COLORS.white} />}
          />
        </View>

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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  heroCard: {
    alignItems: 'center',
    padding: 24,
    marginVertical: 10,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryTealLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicineName: {
    fontSize: 24,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
    textAlign: 'center',
  },
  dosageText: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 12,
  },
  whoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryTealLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  whoText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryTeal,
  },
  voiceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryBlueLight,
    gap: 12,
    ...SHADOWS.soft,
  },
  voiceTextCol: {
    flex: 1,
  },
  voiceTitle: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  voiceSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionCard: {
    padding: 18,
    marginVertical: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textDark,
  },
  bodyText: {
    fontSize: 14,
    color: COLORS.textDark,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 16,
  },
});
