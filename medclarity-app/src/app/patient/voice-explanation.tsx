import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { COLORS, TYPOGRAPHY, LAYOUT, SHADOWS } from '../../constants/theme';
import { getAudioStreamUrl } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from 'react-i18next';
import { createAudioPlayer } from 'expo-audio';

export default function VoiceExplanationRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ summaryText?: string; tamilSummary?: string }>();
  const { t } = useTranslation();

  const summaryText = params.summaryText || 'Your prescription has 2 medicines. Take Amoxicillin 500mg after breakfast and after dinner for 5 days. Take Paracetamol only when you have fever or body pain.';
  const tamilSummary = params.tamilSummary || 'உங்கள் மருத்துவ சீட்டில் 2 மருந்துகள் உள்ளன. அமாக்சிசிலின் மாத்திரையை காலை மற்றும் இரவு உணவுக்குப் பின் 5 நாட்களுக்கு எடுக்கவும்.';

  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const isTamil = language === 'ta';

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'0.75' | '1.0' | '1.25'>('1.0');
  const [player, setPlayer] = useState<any>(null);

  const activeText = isTamil ? tamilSummary : summaryText;

  useEffect(() => {
    return () => {
      if (player) {
        try {
          player.pause();
        } catch (e) {}
      }
    };
  }, [player]);

  const handleTogglePlay = async () => {
    try {
      if (isPlaying && player) {
        player.pause();
        setIsPlaying(false);
        return;
      }

      if (player) {
        player.play();
        setIsPlaying(true);
        return;
      }

      const audioUrl = getAudioStreamUrl(activeText, isTamil ? 'ta' : 'en');
      const newPlayer = createAudioPlayer({ uri: audioUrl });
      newPlayer.play();
      setPlayer(newPlayer);
      setIsPlaying(true);

      newPlayer.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (err) {
      console.error('Audio playback error:', err);
      setIsPlaying(false);
    }
  };

  const handleReplay = async () => {
    if (player) {
      player.seekTo(0);
      player.play();
      setIsPlaying(true);
    } else {
      handleTogglePlay();
    }
  };

  const handleLanguageToggle = async (lang: 'en' | 'ta') => {
    if (player) {
      player.pause();
      setPlayer(null);
      setIsPlaying(false);
    }
    await setLanguage(lang);
  };

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primaryBlueDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('voiceExplanationTitle') || 'Voice Audio Guide'}</Text>
        </View>

        {/* Audio Waveform / Speaker Animation Hero */}
        <Card variant="glass" style={styles.playerCard}>
          <View style={styles.speakerCircle}>
            <Ionicons
              name={isPlaying ? 'volume-high' : 'volume-medium-outline'}
              size={52}
              color={COLORS.white}
            />
          </View>

          <Text style={styles.playerStatus}>
            {isPlaying ? (isTamil ? 'குரல் வழிகாட்டல் இயங்குகிறது...' : 'Playing voice explanation...') : (isTamil ? 'கேட்க தொடங்குங்கள்' : 'Ready to listen')}
          </Text>

          {/* Speed Selection Pills */}
          <View style={styles.speedRow}>
            {(['0.75', '1.0', '1.25'] as const).map((speed) => (
              <TouchableOpacity
                key={speed}
                onPress={() => setPlaybackSpeed(speed)}
                style={[styles.speedPill, playbackSpeed === speed && styles.speedPillActive]}
              >
                <Text style={[styles.speedText, playbackSpeed === speed && styles.speedTextActive]}>
                  {speed}x {speed === '0.75' ? (isTamil ? 'மெதுவாக' : 'Slow') : speed === '1.0' ? (isTamil ? 'இயல்பு' : 'Normal') : (isTamil ? 'வேகமாக' : 'Fast')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Main Controls Row */}
          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={handleReplay} style={styles.subControlBtn}>
              <Ionicons name="refresh" size={24} color={COLORS.primaryBlueDark} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleTogglePlay} style={styles.mainPlayBtn}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={36}
                color={COLORS.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleLanguageToggle(isTamil ? 'en' : 'ta')}
              style={styles.subControlBtn}
            >
              <Text style={styles.langToggleText}>{isTamil ? 'EN' : 'தமிழ்'}</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Live Spoken Transcript Card */}
        <Card variant="glass" style={styles.transcriptCard}>
          <View style={styles.transcriptHeader}>
            <Ionicons name="reader-outline" size={20} color={COLORS.primaryTeal} />
            <Text style={styles.transcriptTitle}>{t('nowSpeaking') || 'Prescription Transcript'}</Text>
          </View>
          <Text style={styles.transcriptText}>{activeText}</Text>
        </Card>

        {/* AI Assistant Question Shortcut */}
        <View style={styles.actionContainer}>
          <Button
            title={t('askAiQuestion') || 'Ask AI a Question about this Rx'}
            onPress={() => router.push('/patient/ai-assistant')}
            variant="teal"
            icon={<Ionicons name="chatbubbles" size={22} color={COLORS.white} />}
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  playerCard: {
    alignItems: 'center',
    padding: 24,
    marginVertical: 10,
  },
  speakerCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  playerStatus: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
    marginBottom: 18,
  },
  speedRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  speedPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  speedPillActive: {
    backgroundColor: COLORS.primaryBlueLight,
    borderColor: COLORS.primaryBlue,
  },
  speedText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.textMuted,
  },
  speedTextActive: {
    color: COLORS.primaryBlueDark,
    fontWeight: TYPOGRAPHY.fontWeightBold,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  mainPlayBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  subControlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langToggleText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  transcriptCard: {
    padding: 20,
    marginVertical: 10,
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  transcriptText: {
    fontSize: 16,
    color: COLORS.textDark,
    lineHeight: 24,
  },
  actionContainer: {
    marginTop: 14,
  },
});
