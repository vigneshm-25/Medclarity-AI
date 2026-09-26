import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Image, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorBanner } from '../components/ErrorBanner';
import { TimePickerModal } from '../components/TimePickerModal';
import { COLORS, TYPOGRAPHY, LAYOUT, SHADOWS } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { normalizeMedicineItem } from '../services/api';
import { useTranslation } from 'react-i18next';

export const ReminderSetupScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const medicinesToSetup = route.params?.medicinesToSetup || [];
  const currentIndex = route.params?.currentIndex || 0;
  const rawItem = medicinesToSetup[currentIndex] || {};
  const currentItem = normalizeMedicineItem(rawItem);

  const addReminder = useAppStore((state) => state.addReminder);
  const language = useAppStore((state) => state.language);

  // Form Fields
  const [medicineName, setMedicineName] = useState(currentItem.name !== 'Medication' ? currentItem.name : '');
  const [dosage, setDosage] = useState(currentItem.dosage !== 'As prescribed' ? currentItem.dosage : '1 Tablet');
  const [relationToFood, setRelationToFood] = useState<string>(currentItem.relation_to_food || currentItem.timing || 'After Food');
  const [selectedTime, setSelectedTime] = useState<string>(currentItem.time_of_day || '08:00 AM');
  const [hour24, setHour24] = useState<number>(8);
  const [minute, setMinute] = useState<number>(0);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const [tagText, setTagText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const foodOptions = [
    { key: 'Before Food', label: t('beforeFood') || 'Before Food' },
    { key: 'After Food', label: t('afterFood') || 'After Food' },
    { key: 'With Food', label: t('withFood') || 'With Food' },
  ];

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err: any) {
      console.error('Image selection error:', err);
    }
  };

  const handleConfirmCurrent = async () => {
    if (!medicineName || !medicineName.trim()) {
      setErrorMsg(language === 'ta' ? 'மருந்தின் பெயரை உள்ளிடவும்.' : 'Please enter a medicine name.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const newRemData = {
        patientName: 'Self',
        medicineName: medicineName.trim(),
        dosage: dosage.trim(),
        timeOfDay: selectedTime,
        hour24,
        minute,
        relationToFood,
        frequency: 'Daily',
        tagText: tagText.trim() || undefined,
        photoUri: photoUri || undefined,
      };

      // Add to store & schedule notifications
      await addReminder(newRemData);

      // Check if more medicines remain in queue
      if (currentIndex < medicinesToSetup.length - 1) {
        navigation.push('ReminderSetup', {
          medicinesToSetup,
          currentIndex: currentIndex + 1,
        });
      } else {
        navigation.replace('ReminderSuccess', {
          medicineName: newRemData.medicineName,
          dosage: newRemData.dosage,
          timeOfDay: newRemData.timeOfDay,
          relationToFood: newRemData.relationToFood,
        });
      }
    } catch (err: any) {
      console.error('[REMINDER SETUP ERROR]', err);
      setErrorMsg(err.message || 'Failed to save reminder.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primaryBlueDark} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('reminderSetupTitle')}</Text>
          {medicinesToSetup.length > 0 ? (
            <Text style={styles.stepBadge}>
              {language === 'ta'
                ? `மருந்து ${currentIndex + 1} / ${medicinesToSetup.length}`
                : `Medicine ${currentIndex + 1} of ${medicinesToSetup.length}`}
            </Text>
          ) : null}
        </View>

        <Card variant="glass" style={styles.card}>
          {/* Medicine Name */}
          <Text style={styles.label}>{t('medicineName')}</Text>
          <TextInput
            style={styles.input}
            value={medicineName}
            onChangeText={setMedicineName}
            placeholder={language === 'ta' ? 'எ.கா: பாராசிட்டமால் 650mg' : 'e.g. Paracetamol 650mg'}
            placeholderTextColor={COLORS.textLight}
          />

          {/* Dosage */}
          <Text style={styles.label}>{t('dosage')}</Text>
          <TextInput
            style={styles.input}
            value={dosage}
            onChangeText={setDosage}
            placeholder={language === 'ta' ? 'எ.கா: 1 மாத்திரை' : 'e.g. 1 Tablet'}
            placeholderTextColor={COLORS.textLight}
          />

          {/* Scheduled Time (Free Time Picker) */}
          <Text style={styles.label}>{t('scheduledTime')}</Text>
          <TouchableOpacity
            onPress={() => setTimePickerVisible(true)}
            style={styles.timePickerCard}
          >
            <View style={styles.timeCardLeft}>
              <View style={styles.clockIconWrap}>
                <Ionicons name="time" size={22} color={COLORS.primaryBlue} />
              </View>
              <View>
                <Text style={styles.timeCardValue}>{selectedTime}</Text>
                <Text style={styles.timeCardSub}>
                  {language === 'ta' ? 'நேரத்தை மாற்ற தொடவும்' : 'Tap to customize reminder clock time'}
                </Text>
              </View>
            </View>
            <Ionicons name="create-outline" size={20} color={COLORS.primaryBlue} />
          </TouchableOpacity>

          {/* Relation to Food */}
          <Text style={styles.label}>{t('relationToFood')}</Text>
          <View style={styles.optionsRow}>
            {foodOptions.map((food) => (
              <TouchableOpacity
                key={food.key}
                onPress={() => setRelationToFood(food.key)}
                style={[
                  styles.optionPill,
                  relationToFood === food.key && styles.selectedTealPill,
                ]}
              >
                <Ionicons
                  name="restaurant-outline"
                  size={16}
                  color={relationToFood === food.key ? COLORS.white : COLORS.primaryTeal}
                />
                <Text
                  style={[
                    styles.optionText,
                    relationToFood === food.key && styles.selectedOptionText,
                  ]}
                >
                  {food.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Personal Identifier (Text Tag & Photo) */}
          <Text style={styles.label}>{t('identifierTitle')}</Text>
          <TextInput
            style={styles.input}
            value={tagText}
            onChangeText={setTagText}
            placeholder={t('identifierPlaceholder')}
            placeholderTextColor={COLORS.textLight}
          />

          {/* Attach Photo Button / Thumbnail */}
          <TouchableOpacity onPress={handlePickPhoto} style={styles.photoPickerBtn}>
            {photoUri ? (
              <View style={styles.attachedRow}>
                <Image source={{ uri: photoUri }} style={styles.thumbImage} />
                <Text style={styles.attachedText}>{t('photoAttached')}</Text>
              </View>
            ) : (
              <View style={styles.attachedRow}>
                <Ionicons name="camera-outline" size={22} color={COLORS.primaryBlue} />
                <Text style={styles.photoPickerText}>{t('attachPhoto')}</Text>
              </View>
            )}
          </TouchableOpacity>

          <ErrorBanner message={errorMsg} onClose={() => setErrorMsg(null)} />

          <Button
            title={
              currentIndex < medicinesToSetup.length - 1
                ? t('confirmNext')
                : t('done')
            }
            onPress={handleConfirmCurrent}
            loading={loading}
            variant="primary"
            icon={<Ionicons name="checkmark-circle" size={22} color={COLORS.white} />}
            style={styles.submitBtn}
          />
        </Card>

        {/* Free Time Picker Modal */}
        <TimePickerModal
          visible={timePickerVisible}
          initialTime={selectedTime}
          onClose={() => setTimePickerVisible(false)}
          onSelectTime={(formatted, h24, min) => {
            setSelectedTime(formatted);
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
    ...SHADOWS.soft,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizeHeader,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  stepBadge: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.primaryTeal,
    marginTop: 4,
  },
  card: {
    padding: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: LAYOUT.borderRadiusInput,
    paddingHorizontal: 14,
    minHeight: 50,
    fontSize: 15,
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  timePickerCard: {
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
  timeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clockIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeCardValue: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  timeCardSub: {
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
  selectedTealPill: {
    backgroundColor: COLORS.primaryTeal,
  },
  optionText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  selectedOptionText: {
    color: COLORS.white,
  },
  photoPickerBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: LAYOUT.borderRadiusInput,
    padding: 14,
    marginTop: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  attachedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumbImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  attachedText: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryTeal,
  },
  photoPickerText: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.primaryBlue,
  },
  submitBtn: {
    marginTop: 10,
  },
});
