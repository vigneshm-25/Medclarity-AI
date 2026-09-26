import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { COLORS, TYPOGRAPHY, LAYOUT, SHADOWS } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

export const LanguageScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const currentLang = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const [selectedLang, setSelectedLang] = useState<'en' | 'ta'>(currentLang || 'en');

  const handleSelectLanguage = async (lang: 'en' | 'ta') => {
    setSelectedLang(lang);
    await setLanguage(lang);
  };

  const handleContinue = async () => {
    await setLanguage(selectedLang);
    navigation.navigate('ModeSelection');
  };

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <View style={styles.globeBadge}>
            <Ionicons name="language" size={32} color={COLORS.primaryBlueDark} />
          </View>
          <Text style={styles.title}>{t('chooseAppLanguage') || 'Choose App Language'}</Text>
          <Text style={styles.subtitle}>{t('selectLanguageSubtitle') || 'Select your preferred language / உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்'}</Text>
        </View>

        <View style={styles.cardsContainer}>
          {/* English Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleSelectLanguage('en')}
            style={styles.touchableCard}
          >
            <Card
              variant={selectedLang === 'en' ? 'accentBorder' : 'glass'}
              style={selectedLang === 'en' ? { ...styles.card, ...styles.selectedCard } : styles.card}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconCircle}>
                  <Text style={styles.scriptBadge}>A</Text>
                </View>
                <View style={styles.textCol}>
                  <Text style={styles.langName}>English</Text>
                  <Text style={styles.langSub}>{t('englishSub') || 'Continue in English'}</Text>
                </View>
                {selectedLang === 'en' ? (
                  <Ionicons name="checkmark-circle" size={28} color={COLORS.primaryBlue} />
                ) : (
                  <View style={styles.unselectedRadio} />
                )}
              </View>
            </Card>
          </TouchableOpacity>

          {/* Tamil Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleSelectLanguage('ta')}
            style={styles.touchableCard}
          >
            <Card
              variant={selectedLang === 'ta' ? 'accentBorder' : 'glass'}
              style={selectedLang === 'ta' ? { ...styles.card, ...styles.selectedCardTeal } : styles.card}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconCircle, { backgroundColor: COLORS.primaryTealLight }]}>
                  <Text style={[styles.scriptBadge, { color: COLORS.primaryTeal }]}>த</Text>
                </View>
                <View style={styles.textCol}>
                  <Text style={styles.langName}>தமிழ்</Text>
                  <Text style={styles.langSub}>{t('tamilSub') || 'தமிழில் தொடரவும்'}</Text>
                </View>
                {selectedLang === 'ta' ? (
                  <Ionicons name="checkmark-circle" size={28} color={COLORS.primaryTeal} />
                ) : (
                  <View style={styles.unselectedRadio} />
                )}
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={t('continueBtn') || (selectedLang === 'ta' ? 'தொடரவும்' : 'Continue')}
            onPress={handleContinue}
            variant={selectedLang === 'ta' ? 'teal' : 'primary'}
            icon={<Ionicons name="arrow-forward" size={22} color={COLORS.white} />}
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
    flexGrow: 1,
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  globeBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBlueLight,
    ...SHADOWS.soft,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizeHeader,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizeBase,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 8,
    marginVertical: 12,
  },
  touchableCard: {
    marginVertical: 4,
  },
  card: {
    padding: 20,
  },
  selectedCard: {
    backgroundColor: '#F0F9FF',
    borderColor: COLORS.primaryBlue,
    borderWidth: 1.5,
  },
  selectedCardTeal: {
    backgroundColor: '#F0FDFA',
    borderColor: COLORS.primaryTeal,
    borderWidth: 1.5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryBlueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scriptBadge: {
    fontSize: 26,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlue,
  },
  textCol: {
    flex: 1,
  },
  langName: {
    fontSize: 22,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  langSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  unselectedRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  buttonContainer: {
    marginTop: 24,
  },
});
