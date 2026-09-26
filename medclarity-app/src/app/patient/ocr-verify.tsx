import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ErrorBanner } from '../../components/ErrorBanner';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../../constants/theme';
import { processPrescriptionTextApi } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from 'react-i18next';

export default function OcrVerifyRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ rawOcrText?: string }>();
  const initialText = params.rawOcrText || '';

  const { t } = useTranslation();
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
    console.log('[CP-OCR-UI-2]');
    console.log('Text edited');
  };

  const handleReset = () => {
    setOcrText(initialText);
    if (errorMsg) setErrorMsg(null);
    console.log('[CP-OCR-UI-3]');
    console.log('Reset to OCR');
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(ocrText);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleContinue = async () => {
    if (!ocrText || !ocrText.trim()) {
      setErrorMsg('Please enter prescription text.');
      return;
    }

    setErrorMsg(null);
    console.log('[CP-OCR-UI-4]');
    console.log('Submitting edited text');
    console.log('Character count:', ocrText.trim().length);

    router.push({
      pathname: '/patient/analysis-loading',
      params: {
        rawOcrText: ocrText.trim(),
      },
    });
  };

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} disabled={loading}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primaryBlueDark} />
          </TouchableOpacity>
          <Text style={styles.title}>Prescription Extracted</Text>
          <Text style={styles.subtitle}>{t('ocrVerifySubtitle') || 'Review and edit extracted text before AI analysis'}</Text>
        </View>

        <Card variant="glass" style={styles.card}>
          <View style={styles.inputHeaderRow}>
            <Ionicons name="document-text-outline" size={22} color={COLORS.primaryBlue} />
            <Text style={styles.inputLabel}>Extracted Prescription Text</Text>
          </View>

          <TextInput
            style={styles.textArea}
            multiline
            editable={!loading}
            value={ocrText}
            onChangeText={handleTextChange}
            placeholder="Parsed prescription text will appear here..."
            placeholderTextColor={COLORS.textLight}
            textAlignVertical="top"
          />

          <ErrorBanner message={errorMsg} onClose={() => setErrorMsg(null)} />

          {showToast && (
            <View style={styles.toastContainer}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={styles.toastText}>Copied</Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.secondaryBtn, loading && styles.disabledBtn]}
              onPress={handleReset}
              disabled={loading}
            >
              <Ionicons name="refresh-outline" size={18} color={COLORS.primaryBlueDark} />
              <Text style={styles.secondaryBtnText}>Reset to OCR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, loading && styles.disabledBtn]}
              onPress={handleCopy}
              disabled={loading}
            >
              <Ionicons name="copy-outline" size={18} color={COLORS.primaryBlueDark} />
              <Text style={styles.secondaryBtnText}>Copy Text</Text>
            </TouchableOpacity>
          </View>

          <Button
            title={loading ? 'Analysing prescription...' : 'Continue'}
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
