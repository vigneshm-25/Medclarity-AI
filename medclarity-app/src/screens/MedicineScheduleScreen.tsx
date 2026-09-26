import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorBanner } from '../components/ErrorBanner';
import { TimePickerModal } from '../components/TimePickerModal';
import { COLORS, TYPOGRAPHY, LAYOUT, SHADOWS } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

interface MedicineScheduleScreenProps {
  navigation: any;
  route: any;
}

export const MedicineScheduleScreen: React.FC<MedicineScheduleScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const patientId = route.params?.patientId;
  const linkedPatients = useAppStore((state) => state.linkedPatients);
  const addScheduleForPatient = useAppStore((state) => state.addScheduleForPatient);
  const language = useAppStore((state) => state.language);

  const selectedPatient = linkedPatients.find((p) => p.id === patientId) || linkedPatients[0];

  // Form States
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('1 Tablet');
  
  // Timing slot toggles
  const [morning, setMorning] = useState(true);
  const [afternoon, setAfternoon] = useState(false);
  const [night, setNight] = useState(true);

  // Dates
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Frequency
  const [frequency, setFrequency] = useState<'Daily' | 'Alternate Days' | 'As Needed'>('Daily');

  // Exact Clock Time
  const [timeOfDay, setTimeOfDay] = useState('08:30 AM');
  const [hour24, setHour24] = useState<number>(8);
  const [minute, setMinute] = useState<number>(30);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  // Food relation
  const [relationToFood, setRelationToFood] = useState<string>('After Food');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const foodOptions = [
    { key: 'Before Food', label: t('beforeFood') || 'Before Food' },
    { key: 'After Food', label: t('afterFood') || 'After Food' },
    { key: 'With Food', label: t('withFood') || 'With Food' },
  ];

  const frequencyOptions = [
    { key: 'Daily', label: t('daily') || 'Daily' },
    { key: 'Alternate Days', label: t('alternateDays') || 'Alternate Days' },
    { key: 'As Needed', label: t('asNeeded') || 'As Needed' },
  ];

  const handleSaveSchedule = async () => {
    if (!medicineName || !medicineName.trim()) {
      setErrorMsg(language === 'ta' ? 'மருந்தின் பெயரை உள்ளிடவும்.' : 'Please enter the medicine name.');
      return;
    }

    if (!selectedPatient) {
      setErrorMsg(language === 'ta' ? 'நோயாளியைத் தேர்ந்தெடுக்கவும்.' : 'Please select a patient.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      await addScheduleForPatient(selectedPatient.id, {
        medicineName: medicineName.trim(),
        dosage: dosage.trim(),
        morning,
        afternoon,
        night,
        startDate,
        endDate,
        timeOfDay,
        hour24,
        minute,
        relationToFood,
        frequency,
        duration: '30 Days',
      });

      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('CaregiverHome');
      }
    } catch (err: any) {
      console.error('[SAVE SCHEDULE ERROR]', err);
      setErrorMsg(err.message || 'Failed to save medicine schedule.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primaryBlueDark} />
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={styles.title}>{t('addScheduleTitle')}</Text>
            {selectedPatient && (
              <Text style={styles.subPatientHeader}>
                {t('scheduleFor')}: <Text style={styles.patientHighlight}>{selectedPatient.name}</Text>
              </Text>
            )}
          </View>
        </View>

        <Card variant="glass" style={styles.formCard}>
          {/* Medicine Name */}
          <Text style={styles.fieldLabel}>{t('medicineName')} *</Text>
          <TextInput
            style={styles.textInput}
            value={medicineName}
            onChangeText={setMedicineName}
            placeholder={language === 'ta' ? 'எ.கா: பாராசிட்டமால் 500mg' : 'e.g. Paracetamol 500mg'}
            placeholderTextColor={COLORS.textLight}
          />

          {/* Dosage */}
          <Text style={styles.fieldLabel}>{t('dosage')} *</Text>
          <TextInput
            style={styles.textInput}
            value={dosage}
            onChangeText={setDosage}
            placeholder={language === 'ta' ? 'எ.கா: 1 மாத்திரை' : 'e.g. 1 Tablet'}
            placeholderTextColor={COLORS.textLight}
          />

          {/* Morning / Afternoon / Night Toggles */}
          <Text style={styles.fieldLabel}>
            {language === 'ta' ? 'வேளைத் தேர்வு (காலை / மதியம் / இரவு)' : 'Dose Slots (Morning / Afternoon / Night)'}
          </Text>
          <View style={styles.slotRow}>
            <TouchableOpacity
              onPress={() => setMorning(!morning)}
              style={[styles.slotChip, morning && styles.slotChipActive]}
            >
              <Ionicons
                name="sunny"
                size={18}
                color={morning ? COLORS.white : COLORS.warmAmber}
              />
              <Text style={[styles.slotText, morning && styles.slotTextActive]}>
                {t('morning')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setAfternoon(!afternoon)}
              style={[styles.slotChip, afternoon && styles.slotChipActive]}
            >
              <Ionicons
                name="partly-sunny"
                size={18}
                color={afternoon ? COLORS.white : COLORS.primaryTeal}
              />
              <Text style={[styles.slotText, afternoon && styles.slotTextActive]}>
                {t('afternoon')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setNight(!night)}
              style={[styles.slotChip, night && styles.slotChipActive]}
            >
              <Ionicons
                name="moon"
                size={18}
                color={night ? COLORS.white : COLORS.primaryBlue}
              />
              <Text style={[styles.slotText, night && styles.slotTextActive]}>
                {t('night')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Exact Reminder Time Picker */}
          <Text style={styles.fieldLabel}>{t('timeOfDayLabel')}</Text>
          <TouchableOpacity
            onPress={() => setTimePickerVisible(true)}
            style={styles.timeSelectorCard}
          >
            <View style={styles.timeDisplayRow}>
              <View style={styles.timeIconWrap}>
                <Ionicons name="alarm" size={24} color={COLORS.primaryBlue} />
              </View>
              <View style={styles.timeTextCol}>
                <Text style={styles.timeValueText}>{timeOfDay}</Text>
                <Text style={styles.timeHelperText}>
                  {language === 'ta' ? 'நேரத்தைத் மாற்ற தொடவும்' : 'Tap to change exact reminder clock time'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>

          {/* Frequency */}
          <Text style={styles.fieldLabel}>{t('frequencyLabel')}</Text>
          <View style={styles.optionsRow}>
            {frequencyOptions.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setFrequency(opt.key as any)}
                style={[
                  styles.optionPill,
                  frequency === opt.key && styles.optionPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.optionPillText,
                    frequency === opt.key && styles.optionPillTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Relation to Food */}
          <Text style={styles.fieldLabel}>{t('relationToFood')}</Text>
          <View style={styles.optionsRow}>
            {foodOptions.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setRelationToFood(opt.key)}
                style={[
                  styles.optionPill,
                  relationToFood === opt.key && styles.optionTealPillActive,
                ]}
              >
                <Ionicons
                  name="restaurant-outline"
                  size={16}
                  color={relationToFood === opt.key ? COLORS.white : COLORS.primaryTeal}
                />
                <Text
                  style={[
                    styles.optionPillText,
                    relationToFood === opt.key && styles.optionPillTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Start and End Dates */}
          <View style={styles.datesRow}>
            <View style={styles.dateCol}>
              <Text style={styles.fieldLabel}>{t('startDate')}</Text>
              <TextInput
                style={styles.dateInput}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textLight}
              />
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.fieldLabel}>{t('endDate')}</Text>
              <TextInput
                style={styles.dateInput}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          </View>

          <ErrorBanner message={errorMsg} onClose={() => setErrorMsg(null)} />

          {/* Save Button */}
          <Button
            title={t('saveScheduleBtn')}
            onPress={handleSaveSchedule}
            loading={loading}
            variant="teal"
            icon={<Ionicons name="checkmark-circle" size={22} color={COLORS.white} />}
            style={styles.saveBtn}
          />
        </Card>

        {/* Interactive Free Time Picker Modal */}
        <TimePickerModal
          visible={timePickerVisible}
          initialTime={timeOfDay}
          onClose={() => setTimePickerVisible(false)}
          onSelectTime={(formatted, h24, min) => {
            setTimeOfDay(formatted);
            setHour24(h24);
            setMinute(min);
          }}
        />

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
    gap: 12,
    marginBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  headerTitleCol: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizeHeader,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  subPatientHeader: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  patientHighlight: {
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryTeal,
  },
  formCard: {
    padding: 22,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
    marginTop: 14,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: LAYOUT.borderRadiusInput,
    paddingHorizontal: 14,
    minHeight: 50,
    fontSize: 16,
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  slotRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  slotChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotChipActive: {
    backgroundColor: COLORS.primaryBlue,
    borderColor: COLORS.primaryBlue,
  },
  slotText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  slotTextActive: {
    color: COLORS.white,
  },
  timeSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryBlueLight,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBlue,
    marginVertical: 4,
  },
  timeDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeTextCol: {
    justifyContent: 'center',
  },
  timeValueText: {
    fontSize: 20,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  timeHelperText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: LAYOUT.borderRadiusPill,
    gap: 6,
  },
  optionPillActive: {
    backgroundColor: COLORS.primaryBlue,
  },
  optionTealPillActive: {
    backgroundColor: COLORS.primaryTeal,
  },
  optionPillText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  optionPillTextActive: {
    color: COLORS.white,
  },
  datesRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  dateCol: {
    flex: 1,
  },
  dateInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: LAYOUT.borderRadiusInput,
    paddingHorizontal: 14,
    minHeight: 46,
    fontSize: 14,
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  saveBtn: {
    marginTop: 22,
  },
});
