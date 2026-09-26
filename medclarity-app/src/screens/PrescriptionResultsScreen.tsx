import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { COLORS, TYPOGRAPHY, LAYOUT, SHADOWS } from '../constants/theme';
import { PrescriptionProcessResponse, getAudioStreamUrl, normalizeMedicineItem, NormalizedMedicine } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';
import { createAudioPlayer } from 'expo-audio';

export const PrescriptionResultsScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const masterPayload: PrescriptionProcessResponse = route.params?.masterPayload || {};
  const language = useAppStore((state) => state.language);
  const addReminder = useAppStore((state) => state.addReminder);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [player, setPlayer] = useState<any>(null);

  const isTamil = language === 'ta';
  const guide = isTamil
    ? masterPayload.tamil_guide || masterPayload.translated_guide || masterPayload.simplified_en
    : masterPayload.simplified_en;

  const rawMedicines: any[] = guide?.medicines || masterPayload.reminders || [
    {
      name: 'Amoxicillin 500mg',
      medicine_name: 'Amoxicillin 500mg',
      dosage: '1 Capsule',
      simple_dosage: '1 Capsule',
      time_of_day: '08:00 AM',
      frequency: 'Daily (Morning & Evening)',
      relation_to_food: 'After Food',
      simple_timing: 'After Food',
      duration: '5 Days',
      purpose: 'Antibiotic for bacterial infection',
      side_effects: 'Mild stomach upset, nausea',
    },
  ];

  const medicines: NormalizedMedicine[] = rawMedicines.map((medItem: any) => normalizeMedicineItem(medItem));

  const handlePlayAudioNarration = async () => {
    try {
      if (isPlayingAudio && player) {
        player.pause();
        player.seekTo(0);
        setIsPlayingAudio(false);
        return;
      }

      const summaryText = `${guide?.patient_greeting || 'Hello'} ${guide?.simple_summary || ''}. ${medicines.map((m) => `${m.name}, ${m.dosage}, ${m.timing}`).join('. ')}`;
      const audioUrl = getAudioStreamUrl(summaryText, isTamil ? 'ta' : 'en');

      const newPlayer = createAudioPlayer({ uri: audioUrl });
      newPlayer.play();
      setPlayer(newPlayer);
      setIsPlayingAudio(true);

      newPlayer.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          setIsPlayingAudio(false);
        }
      });
    } catch (err: any) {
      console.log('Audio playback rendering error:', err?.message);
      setIsPlayingAudio(false);
    }
  };

  const handleSetReminders = () => {
    navigation.navigate('ReminderSetup', {
      medicinesToSetup: medicines,
      currentIndex: 0,
    });
  };

  const handleSaveOnly = () => {
    medicines.forEach((med) => {
      addReminder({
        patientName: masterPayload.patient_name || 'Self',
        medicineName: med.name,
        dosage: med.dosage,
        timeOfDay: med.time_of_day || '08:00 AM',
        relationToFood: med.relation_to_food || med.timing || 'After Food',
        frequency: med.frequency || 'Daily',
        duration: med.duration,
      });
    });

    navigation.replace('MainDrawer');
  };

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primaryBlueDark} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('resultsTitle')}</Text>
          {masterPayload.patient_name ? (
            <Text style={styles.patientTag}>
              {language === 'ta' ? 'நோயாளி: ' : 'Patient: '}{masterPayload.patient_name}
            </Text>
          ) : null}
        </View>

        {/* Voice Audio Narration Bar */}
        <TouchableOpacity onPress={handlePlayAudioNarration} style={styles.audioBar}>
          <Ionicons
            name={isPlayingAudio ? 'pause-circle' : 'play-circle'}
            size={36}
            color={COLORS.primaryTeal}
          />
          <View style={styles.audioTextCol}>
            <Text style={styles.audioTitle}>
              {isPlayingAudio ? t('stopAudio') : t('playAudio')}
            </Text>
            <Text style={styles.audioSub}>
              {language === 'ta'
                ? 'உங்கள் மொழியில் குரல் வழிகாட்டலைக் கேட்கவும் (தமிழ்)'
                : 'Listen in your selected language (English)'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Doctor Summary Greeting */}
        {guide?.simple_summary ? (
          <Card variant="glass" style={styles.summaryCard}>
            <Text style={styles.greetingText}>{guide.patient_greeting || (language === 'ta' ? 'மருத்துவ ஆலோசனை' : 'Patient Advisory')}</Text>
            <Text style={styles.summaryText}>{guide.simple_summary}</Text>
          </Card>
        ) : null}

        {/* Medicines List */}
        {medicines.map((med, idx) => (
          <Card key={idx} variant="glass" style={styles.medicineCard}>
            <View style={styles.medHeaderRow}>
              <View style={styles.medIconCircle}>
                <Ionicons name="medical" size={24} color={COLORS.primaryBlue} />
              </View>
              <View style={styles.medTitleCol}>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medDosage}>{med.dosage} • {med.duration}</Text>
              </View>
            </View>

            <View style={styles.tagGrid}>
              <View style={styles.tagPill}>
                <Ionicons name="restaurant-outline" size={14} color={COLORS.primaryTeal} />
                <Text style={styles.tagText}>{med.timing}</Text>
              </View>

              {med.time_of_day ? (
                <View style={[styles.tagPill, { backgroundColor: COLORS.primaryBlueLight }]}>
                  <Ionicons name="time-outline" size={14} color={COLORS.primaryBlue} />
                  <Text style={[styles.tagText, { color: COLORS.primaryBlueDark }]}>{med.time_of_day}</Text>
                </View>
              ) : null}
            </View>

            {med.purpose ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{language === 'ta' ? 'நோக்கம்:' : 'Purpose:'}</Text>
                <Text style={styles.detailValue}>{med.purpose}</Text>
              </View>
            ) : null}

            {med.side_effects ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{language === 'ta' ? 'பக்க விளைவுகள்:' : 'Common Side Effects:'}</Text>
                <Text style={styles.detailValue}>{med.side_effects}</Text>
              </View>
            ) : null}

            {/* WHO / NLEM Citation Footer */}
            <View style={styles.citationBox}>
              <Ionicons name="shield-checkmark" size={14} color={COLORS.primaryTeal} />
              <Text style={styles.citationText}>{t('sourceCitation')}</Text>
            </View>
          </Card>
        ))}

        {/* Doctor Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.textMuted} />
          <Text style={styles.disclaimerText}>{t('doctorDisclaimer')}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title={t('setReminders')}
            onPress={handleSetReminders}
            variant="primary"
            icon={<Ionicons name="alarm" size={22} color={COLORS.white} />}
          />

          <Button
            title={t('saveOnly')}
            onPress={handleSaveOnly}
            variant="outline"
            icon={<Ionicons name="bookmark-outline" size={20} color={COLORS.primaryBlue} />}
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
  patientTag: {
    fontSize: 15,
    color: COLORS.primaryTeal,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    marginTop: 4,
  },
  audioBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryTealLight,
    padding: 14,
    borderRadius: LAYOUT.borderRadiusCard,
    gap: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  audioTextCol: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryTeal,
  },
  audioSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  summaryCard: {
    marginBottom: 16,
    padding: 16,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 15,
    color: COLORS.textDark,
    lineHeight: 22,
  },
  medicineCard: {
    marginVertical: 8,
    padding: 18,
  },
  medHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  medIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryBlueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medTitleCol: {
    flex: 1,
  },
  medName: {
    fontSize: 20,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  medDosage: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  tagGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryTealLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.primaryTeal,
  },
  detailRow: {
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textMuted,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.textDark,
    marginTop: 2,
  },
  citationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  citationText: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginVertical: 14,
    gap: 8,
  },
  disclaimerText: {
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
    lineHeight: 18,
  },
  actionsContainer: {
    gap: 8,
    marginTop: 10,
  },
});
