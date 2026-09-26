import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../../constants/theme';
import { PrescriptionProcessResponse, MedicineItem, getAudioStreamUrl, normalizeMedicineItem, NormalizedMedicine } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from 'react-i18next';
import { createAudioPlayer } from 'expo-audio';

export default function PrescriptionResultsRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ masterPayload?: string }>();
  const { t } = useTranslation();

  let masterPayload: PrescriptionProcessResponse = {};
  if (params.masterPayload) {
    try {
      masterPayload = JSON.parse(params.masterPayload);
    } catch (e: any) {
      console.log('[CP-AUDIT-7]');
      console.log('Error parsing masterPayload params:', e?.message);
    }
  }

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

  // Runtime Audit Checkpoint Logs
  console.log('[CP-AUDIT-1]');
  console.log('Complete API response:', JSON.stringify(masterPayload, null, 2));

  console.log('[CP-AUDIT-2]');
  console.log('Medicine array received:', JSON.stringify(rawMedicines, null, 2));

  if (masterPayload.simplified_en) {
    console.log('[CP-AUDIT-6]');
    console.log('Simplified medicine object:', JSON.stringify(masterPayload.simplified_en, null, 2));
  }

  if (masterPayload.reminders) {
    console.log('[CP-AUDIT-5]');
    console.log('Reminder object:', JSON.stringify(masterPayload.reminders, null, 2));
  }

  // Normalize medicines array
  const medicines: NormalizedMedicine[] = rawMedicines.map((medItem: any, idx: number) => {
    console.log('[CP-AUDIT-3]');
    console.log(`Medicine object before rendering #${idx + 1}:`, JSON.stringify(medItem, null, 2));

    const norm = normalizeMedicineItem(medItem);

    console.log('[CP-AUDIT-4]');
    console.log(`Medicine name actually rendered #${idx + 1}:`, norm.name);

    return norm;
  });

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
      console.log('[CP-AUDIT-7]');
      console.log('Audio playback rendering error:', err?.message);
      setIsPlayingAudio(false);
    }
  };

  const handleSetReminders = () => {
    router.push({
      pathname: '/patient/reminder-setup',
      params: {
        medicinesToSetup: JSON.stringify(medicines),
        currentIndex: '0',
      },
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

    router.replace('/patient' as any);
  };

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primaryBlueDark} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('resultsTitle')}</Text>
          {masterPayload.patient_name ? (
            <Text style={styles.patientTag}>Patient: {masterPayload.patient_name}</Text>
          ) : null}
        </View>

        {/* Voice Audio Narration Bar */}
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/patient/voice-explanation',
              params: {
                summaryText: `${guide?.patient_greeting || 'Hello'} ${guide?.simple_summary || ''}. ${medicines.map((m) => `${m.name}, ${m.dosage}, ${m.timing}`).join('. ')}`,
                tamilSummary: masterPayload.tamil_guide?.simple_summary || guide?.simple_summary || '',
              },
            })
          }
          style={styles.audioBar}
        >
          <Ionicons name="volume-high" size={32} color={COLORS.primaryTeal} />
          <View style={styles.audioTextCol}>
            <Text style={styles.audioTitle}>{t('playAudio')}</Text>
            <Text style={styles.audioSub}>Open interactive voice breakdown ({language === 'ta' ? 'Tamil' : 'English'})</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.primaryTeal} />
        </TouchableOpacity>

        {/* Doctor Summary Greeting */}
        {guide?.simple_summary ? (
          <Card variant="glass" style={styles.summaryCard}>
            <Text style={styles.greetingText}>{guide.patient_greeting || 'Patient Advisory'}</Text>
            <Text style={styles.summaryText}>{guide.simple_summary}</Text>
          </Card>
        ) : null}

        {/* Medicines List */}
        {medicines.map((med, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.9}
            onPress={() =>
              router.push({
                pathname: '/patient/medicine-details',
                params: {
                  medicineData: JSON.stringify(med.raw || med),
                },
              })
            }
          >
            <Card variant="glass" style={styles.medicineCard}>
              <View style={styles.medHeaderRow}>
                <View style={styles.medIconCircle}>
                  <Ionicons name="medical" size={24} color={COLORS.primaryBlue} />
                </View>
                <View style={styles.medTitleCol}>
                  <Text style={styles.medName}>{med.name}</Text>
                  <Text style={styles.medDosage}>{med.dosage} • {med.duration}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
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
                  <Text style={styles.detailLabel}>Purpose:</Text>
                  <Text style={styles.detailValue}>{med.purpose}</Text>
                </View>
              ) : null}

              {med.side_effects ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Common Side Effects:</Text>
                  <Text style={styles.detailValue}>{med.side_effects}</Text>
                </View>
              ) : null}

              {/* WHO / NLEM Citation Footer */}
              <View style={styles.citationBox}>
                <Ionicons name="shield-checkmark" size={14} color={COLORS.primaryTeal} />
                <Text style={styles.citationText}>{t('sourceCitation')}</Text>
              </View>
            </Card>
          </TouchableOpacity>
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
