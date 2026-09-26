import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, LAYOUT, SHADOWS } from '../constants/theme';
import { useTranslation } from 'react-i18next';

interface TimePickerModalProps {
  visible: boolean;
  initialTime?: string; // e.g. "08:30 AM" or "14:45"
  onClose: () => void;
  onSelectTime: (formattedTime: string, hour24: number, minute: number) => void;
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  initialTime = '08:00 AM',
  onClose,
  onSelectTime,
}) => {
  const { t } = useTranslation();

  // Parse initial time
  const parseTime = (str: string) => {
    let h = 8;
    let m = 0;
    let p: 'AM' | 'PM' = 'AM';

    const match12 = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match12) {
      h = parseInt(match12[1], 10);
      m = parseInt(match12[2], 10);
      if (match12[3]) {
        p = match12[3].toUpperCase() as 'AM' | 'PM';
      } else if (h >= 12) {
        p = 'PM';
        if (h > 12) h -= 12;
      }
    }
    return { hour: Math.min(Math.max(1, h), 12), minute: Math.min(Math.max(0, m), 59), period: p };
  };

  const initial = parseTime(initialTime);
  const [selectedHour, setSelectedHour] = useState<number>(initial.hour);
  const [selectedMinute, setSelectedMinute] = useState<number>(initial.minute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(initial.period);

  const presets = [
    { label: t('morning') || 'Morning', time: '08:00 AM', h: 8, m: 0, p: 'AM' as const },
    { label: t('afternoon') || 'Afternoon', time: '01:30 PM', h: 1, m: 30, p: 'PM' as const },
    { label: t('night') || 'Night', time: '08:30 PM', h: 8, m: 30, p: 'PM' as const },
    { label: 'Bedtime', time: '10:00 PM', h: 10, m: 0, p: 'PM' as const },
  ];

  const handleConfirm = () => {
    const formattedHour = selectedHour.toString().padStart(2, '0');
    const formattedMinute = selectedMinute.toString().padStart(2, '0');
    const timeStr = `${formattedHour}:${formattedMinute} ${selectedPeriod}`;

    let hour24 = selectedHour;
    if (selectedPeriod === 'PM' && hour24 < 12) hour24 += 12;
    if (selectedPeriod === 'AM' && hour24 === 12) hour24 = 0;

    onSelectTime(timeStr, hour24, selectedMinute);
    onClose();
  };

  const incrementHour = () => {
    setSelectedHour((prev) => (prev >= 12 ? 1 : prev + 1));
  };

  const decrementHour = () => {
    setSelectedHour((prev) => (prev <= 1 ? 12 : prev - 1));
  };

  const incrementMinute = () => {
    setSelectedMinute((prev) => (prev >= 55 ? 0 : (Math.floor(prev / 5) * 5 + 5) % 60));
  };

  const decrementMinute = () => {
    setSelectedMinute((prev) => (prev <= 0 ? 55 : (Math.ceil(prev / 5) * 5 - 5 + 60) % 60));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="time" size={24} color={COLORS.primaryTeal} />
              <Text style={styles.title}>{t('selectTimePrompt') || 'Select Reminder Time'}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Quick Presets */}
          <Text style={styles.sectionLabel}>{t('quickPresets') || 'Quick Suggestions'}</Text>
          <View style={styles.presetsRow}>
            {presets.map((preset, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  setSelectedHour(preset.h);
                  setSelectedMinute(preset.m);
                  setSelectedPeriod(preset.p);
                }}
                style={styles.presetChip}
              >
                <Text style={styles.presetTime}>{preset.time}</Text>
                <Text style={styles.presetLabel}>{preset.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Clock Display & Interactive Controls */}
          <Text style={styles.sectionLabel}>{t('exactTime') || 'Custom Clock Time'}</Text>
          <View style={styles.clockCard}>
            {/* Hours Picker */}
            <View style={styles.spinnerCol}>
              <TouchableOpacity onPress={incrementHour} style={styles.stepperBtn}>
                <Ionicons name="chevron-up" size={28} color={COLORS.primaryBlueDark} />
              </TouchableOpacity>
              <View style={styles.numberBox}>
                <Text style={styles.numberText}>
                  {selectedHour.toString().padStart(2, '0')}
                </Text>
                <Text style={styles.subLabel}>{t('hours') || 'Hrs'}</Text>
              </View>
              <TouchableOpacity onPress={decrementHour} style={styles.stepperBtn}>
                <Ionicons name="chevron-down" size={28} color={COLORS.primaryBlueDark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.timeColon}>:</Text>

            {/* Minutes Picker */}
            <View style={styles.spinnerCol}>
              <TouchableOpacity onPress={incrementMinute} style={styles.stepperBtn}>
                <Ionicons name="chevron-up" size={28} color={COLORS.primaryBlueDark} />
              </TouchableOpacity>
              <View style={styles.numberBox}>
                <Text style={styles.numberText}>
                  {selectedMinute.toString().padStart(2, '0')}
                </Text>
                <Text style={styles.subLabel}>{t('minutes') || 'Min'}</Text>
              </View>
              <TouchableOpacity onPress={decrementMinute} style={styles.stepperBtn}>
                <Ionicons name="chevron-down" size={28} color={COLORS.primaryBlueDark} />
              </TouchableOpacity>
            </View>

            {/* AM / PM Toggle */}
            <View style={styles.periodCol}>
              <TouchableOpacity
                onPress={() => setSelectedPeriod('AM')}
                style={[styles.periodBtn, selectedPeriod === 'AM' && styles.periodBtnActive]}
              >
                <Text
                  style={[
                    styles.periodText,
                    selectedPeriod === 'AM' && styles.periodTextActive,
                  ]}
                >
                  AM
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedPeriod('PM')}
                style={[styles.periodBtn, selectedPeriod === 'PM' && styles.periodBtnActive]}
              >
                <Text
                  style={[
                    styles.periodText,
                    selectedPeriod === 'PM' && styles.periodTextActive,
                  ]}
                >
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Minute Selection Row */}
          <View style={styles.minuteChipsRow}>
            {[0, 15, 30, 45].map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setSelectedMinute(m)}
                style={[
                  styles.minuteChip,
                  selectedMinute === m && styles.minuteChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.minuteChipText,
                    selectedMinute === m && styles.minuteChipTextActive,
                  ]}
                >
                  :{m.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>{t('cancel') || 'Cancel'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
              <Text style={styles.confirmBtnText}>{t('confirm') || 'Set Time'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 22,
    ...SHADOWS.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textMuted,
    marginBottom: 8,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    backgroundColor: COLORS.primaryBlueLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  presetTime: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  presetLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  clockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  spinnerCol: {
    alignItems: 'center',
  },
  stepperBtn: {
    padding: 4,
  },
  numberBox: {
    width: 68,
    height: 64,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primaryBlue,
    ...SHADOWS.soft,
  },
  numberText: {
    fontSize: 28,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.textLight,
  },
  timeColon: {
    fontSize: 32,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
    marginBottom: 6,
  },
  periodCol: {
    flexDirection: 'column',
    gap: 8,
    marginLeft: 6,
  },
  periodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: COLORS.primaryBlue,
  },
  periodText: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  periodTextActive: {
    color: COLORS.white,
  },
  minuteChipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 20,
  },
  minuteChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  minuteChipActive: {
    backgroundColor: COLORS.primaryTeal,
  },
  minuteChipText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textDark,
  },
  minuteChipTextActive: {
    color: COLORS.white,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: LAYOUT.borderRadiusInput,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textDark,
  },
  confirmBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: LAYOUT.borderRadiusInput,
    backgroundColor: COLORS.primaryBlue,
    ...SHADOWS.soft,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.white,
  },
});
