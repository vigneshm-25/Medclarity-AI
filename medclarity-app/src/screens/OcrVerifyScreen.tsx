import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorBanner } from '../components/ErrorBanner';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

export const OcrVerifyScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const initialText = route.params?.rawOcrText || '';
  const language = useAppStore((state) => state.language);

  const [ocrText, setOcrText] = useState(initialText);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    console.log('[CP-OCR-UI-1]');
    console.log('Raw transcription received');
    console.log('Character count:', initialText.length);
  }, [initialText]);

  const handleTextChange = (text: string) => {
    setOcrText(text);
    if (errorMsg) setErrorMsg(null);
  };

  const handleReset = () => {
    setOcrText(initialText);
    if (errorMsg) setErrorMsg(null);
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(ocrText);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleContinue = async () => {
    if (!ocrText || !ocrText.trim()) {
      setErrorMsg(language === 'ta' ? 'மருந்துச் சீட்டு உரையை உள்ளிடவும்.' : 'Please enter prescription text.');
      return;
    }

    setErrorMsg(null);
    navigation.navigate('AnalysisLoading', {
      rawOcrText: ocrText.trim(),
    });
  };

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} disabled={loading}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primaryBlueDark} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('ocrVerifyTitle')}</Text>
          <Text style={styles.subtitle}>{t('ocrVerifySubtitle')}</Text>
        </View>

        <Card variant="glass" style={styles.card}>
          <View style={styles.inputHeaderRow}>
            <Ionicons name="document-text-outline" size={22} color={COLORS.primaryBlue} />
            <Text style={styles.inputLabel}>
              {language === 'ta' ? 'பிரித்தெடுக்கப்பட்ட உரை' : 'Extracted Prescription Text'}
            </Text>
          </View>

          <TextInput
            style={styles.textArea}
            multiline
            editable={!loading}
            value={ocrText}
            onChangeText={handleTextChange}
            placeholder={language === 'ta' ? 'மருந்துச் சீட்டு உரை இங்கே தோன்றும்...' : 'Parsed prescription text will appear here...'}
            placeholderTextColor={COLORS.textLight}
            textAlignVertical="top"
          />

          <ErrorBanner message={errorMsg} onClose={() => setErrorMsg(null)} />

          {showToast && (
            <View style={styles.toastContainer}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={styles.toastText}>
                {language === 'ta' ? 'நகலெடுக்கப்பட்டது' : 'Copied'}
              </Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.secondaryBtn, loading && styles.disabledBtn]}
              onPress={handleReset}
              disabled={loading}
            >
              <Ionicons name="refresh-outline" size={18} color={COLORS.primaryBlueDark} />
              <Text style={styles.secondaryBtnText}>
                {language === 'ta' ? 'மீட்டமை' : 'Reset to OCR'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, loading && styles.disabledBtn]}
              onPress={handleCopy}
              disabled={loading}
            >
              <Ionicons name="copy-outline" size={18} color={COLORS.primaryBlueDark} />
              <Text style={styles.secondaryBtnText}>
                {language === 'ta' ? 'உரையை நகலெடு' : 'Copy Text'}
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title={t('continueBtn')}
            onPress={handleContinue}
            loading={loading}
            disabled={loading}
            variant="primary"
            icon={!loading ? <Ionicons name="arrow-forward" size={22} color={COLORS.white} /> : undefined}
            style={styles.continueBtn}
          />
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
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  inputHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    padding: 16,
    fontSize: 18,
    lineHeight: 28,
    color: '#0F172A',
    minHeight: 350,
    marginBottom: 16,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  toastText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primaryBlueDark,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  continueBtn: {
    marginTop: 4,
  },
});
