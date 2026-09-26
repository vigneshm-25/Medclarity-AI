import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';
import { createAudioPlayer } from 'expo-audio';
import { getAudioStreamUrl } from '../services/api';

const { width } = Dimensions.get('window');

export const OnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const language = useAppStore((state) => state.language);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [player, setPlayer] = useState<any>(null);

  const slides = [
    {
      icon: 'camera-outline' as const,
      title: t('onboarding1Title'),
      desc: t('onboarding1Desc'),
    },
    {
      icon: 'book-outline' as const,
      title: t('onboarding2Title'),
      desc: t('onboarding2Desc'),
    },
    {
      icon: 'alarm-outline' as const,
      title: t('onboarding3Title'),
      desc: t('onboarding3Desc'),
    },
  ];

  const handleFinish = async () => {
    if (player) {
      player.remove();
    }
    await completeOnboarding();
    navigation.replace('MainDrawer');
  };

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handlePlayVoiceNarration = async () => {
    try {
      if (isPlayingAudio && player) {
        player.pause();
        player.seekTo(0);
        setIsPlayingAudio(false);
        return;
      }

      const slide = slides[activeIndex];
      const narrationText = `${slide.title}. ${slide.desc}`;
      const url = getAudioStreamUrl(narrationText, language);

      const newPlayer = createAudioPlayer({ uri: url });
      newPlayer.play();
      setPlayer(newPlayer);
      setIsPlayingAudio(true);

      newPlayer.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          setIsPlayingAudio(false);
        }
      });
    } catch (err) {
      console.log('Voice narration playback issue (fallback):', err);
      setIsPlayingAudio(false);
    }
  };

  const currentSlide = slides[activeIndex];

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
          <Text style={styles.skipText}>{t('skip')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.centerContainer}>
        <Card variant="glass" style={styles.slideCard}>
          <View style={styles.iconCircle}>
            <Ionicons name={currentSlide.icon} size={54} color={COLORS.primaryBlue} />
          </View>

          <Text style={styles.slideTitle}>{currentSlide.title}</Text>
          <Text style={styles.slideDesc}>{currentSlide.desc}</Text>

          {/* Voice Narration Button */}
          <TouchableOpacity onPress={handlePlayVoiceNarration} style={styles.narrationBtn}>
            <Ionicons
              name={isPlayingAudio ? 'volume-high' : 'volume-medium-outline'}
              size={22}
              color={COLORS.primaryTeal}
            />
            <Text style={styles.narrationText}>
              {isPlayingAudio ? t('stopAudio') : t('playAudio')}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Carousel Pagination Dots */}
        <View style={styles.paginationRow}>
          {slides.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === activeIndex ? styles.activeDot : null,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Button
          title={activeIndex === slides.length - 1 ? t('getStarted') : t('next')}
          onPress={handleNext}
          variant="primary"
          icon={<Ionicons name="arrow-forward" size={22} color={COLORS.white} />}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  topBar: {
    alignItems: 'flex-end',
  },
  skipBtn: {
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.primaryBlue,
  },
  centerContainer: {
    alignItems: 'center',
  },
  slideCard: {
    width: width - 40,
    padding: 28,
    alignItems: 'center',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primaryBlueLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  slideTitle: {
    fontSize: TYPOGRAPHY.fontSizeHeader,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
    textAlign: 'center',
    marginBottom: 12,
  },
  slideDesc: {
    fontSize: 17,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  narrationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryTealLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  narrationText: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryTeal,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#CBD5E1',
  },
  activeDot: {
    width: 24,
    backgroundColor: COLORS.primaryBlue,
  },
  bottomBar: {
    marginBottom: 10,
  },
});
