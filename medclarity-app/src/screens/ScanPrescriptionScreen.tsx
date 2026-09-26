import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorBanner } from '../components/ErrorBanner';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../constants/theme';
import { runOcrApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

export const ScanPrescriptionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);

  const handlePickFromGallery = async () => {
    setErrorMsg(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setErrorMsg(language === 'ta' ? 'கேலரி அனுமதி தேவை.' : 'Gallery permission is required to select prescription photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (err: any) {
      console.error('[GALLERY ERROR]', err);
      setErrorMsg(err.message || (language === 'ta' ? 'படத்தைத் தேர்ந்தெடுப்பதில் பிழை.' : 'Failed to select image from gallery.'));
    }
  };

  const handleTakePhoto = async () => {
    setErrorMsg(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setErrorMsg(language === 'ta' ? 'கேமரா அனுமதி தேவை.' : 'Camera permission is required to capture prescriptions.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (err: any) {
      console.error('[CAMERA ERROR]', err);
      setErrorMsg(err.message || (language === 'ta' ? 'புகைப்படம் எடுப்பதில் பிழை.' : 'Failed to capture photo with camera.'));
    }
  };

  const handleUploadAndRunOcr = async () => {
    if (!selectedImage) {
      setErrorMsg(language === 'ta' ? 'முதலில் மருத்துவ சீட்டைப் படம் பிடிக்கவும்.' : 'Please capture or choose a prescription photo first.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    setProgressMsg(t('processingOcr'));

    try {
      const ocrResult = await runOcrApi(selectedImage);

      if (ocrResult.error) {
        throw new Error(ocrResult.error);
      }

      const extractedText = ocrResult.raw_ocr || '[unclear] Doctor handwriting could not be decoded.';
      
      navigation.navigate('OcrVerify', {
        rawOcrText: extractedText,
        imageUri: selectedImage,
      });
    } catch (err: any) {
      console.error('[OCR UPLOAD ERROR]', err);
      setErrorMsg(err.message || (language === 'ta' ? 'சீட்டைப் படிப்பதில் பிழை ஏற்பட்டது.' : 'Failed to run OCR on the prescription image.'));
    } finally {
      setLoading(false);
      setProgressMsg(null);
    }
  };

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primaryBlueDark} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('scanTitle')}</Text>
          <Text style={styles.subtitle}>{t('scanSubtitle')}</Text>
        </View>

        <Card variant="glass" style={styles.previewCard}>
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <View style={styles.placeholderContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="document-text-outline" size={48} color={COLORS.primaryBlue} />
              </View>
              <Text style={styles.placeholderText}>
                {language === 'ta' ? 'மருத்துவ சீட்டு இன்னும் தேர்ந்தெடுக்கப்படவில்லை' : 'No prescription selected yet'}
              </Text>
            </View>
          )}

          {progressMsg ? (
            <View style={styles.progressBox}>
              <Ionicons name="sync" size={22} color={COLORS.primaryTeal} style={styles.spinIcon} />
              <Text style={styles.progressText}>{progressMsg}</Text>
            </View>
          ) : null}

          <ErrorBanner message={errorMsg} onClose={() => setErrorMsg(null)} />

          <View style={styles.pickerRow}>
            <Button
              title={t('captureBtn')}
              onPress={handleTakePhoto}
              variant="outline"
              icon={<Ionicons name="camera-outline" size={20} color={COLORS.primaryBlue} />}
              style={styles.pickerBtn}
            />

            <Button
              title={t('galleryBtn')}
              onPress={handlePickFromGallery}
              variant="outline"
              icon={<Ionicons name="images-outline" size={20} color={COLORS.primaryBlue} />}
              style={styles.pickerBtn}
            />
          </View>

          {selectedImage ? (
            <Button
              title={t('processAiBtn')}
              onPress={handleUploadAndRunOcr}
              loading={loading}
              variant="primary"
              icon={<Ionicons name="sparkles" size={20} color={COLORS.white} />}
              style={styles.submitBtn}
            />
          ) : null}
        </Card>

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
    marginBottom: 20,
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
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizeBase,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  previewCard: {
    padding: 20,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 260,
    borderRadius: LAYOUT.borderRadiusCard,
    marginBottom: 16,
  },
  placeholderContainer: {
    width: '100%',
    height: 220,
    borderRadius: LAYOUT.borderRadiusCard,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primaryBlueLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  progressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryTealLight,
    padding: 12,
    borderRadius: 12,
    gap: 10,
    width: '100%',
    marginBottom: 14,
  },
  spinIcon: {
    marginRight: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryTeal,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  pickerBtn: {
    flex: 1,
  },
  submitBtn: {
    width: '100%',
    marginTop: 10,
  },
});
