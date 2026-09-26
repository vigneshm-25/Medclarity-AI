import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, LAYOUT, SHADOWS } from '../constants/theme';
import { useTranslation } from 'react-i18next';

interface PlantStreakProps {
  streakDays: number;
  stage: 'seedling' | 'sprout' | 'healthy' | 'flowering';
}

export const PlantStreakVisual: React.FC<PlantStreakProps> = ({ streakDays, stage }) => {
  const { t } = useTranslation();

  const getStageDetails = () => {
    switch (stage) {
      case 'flowering':
        return { icon: 'rose-outline' as const, label: 'Flowering Tree', desc: 'Outstanding adherence!' };
      case 'healthy':
        return { icon: 'leaf-outline' as const, label: 'Healthy Plant', desc: 'Growing strong!' };
      case 'sprout':
        return { icon: 'nutrition-outline' as const, label: 'Young Sprout', desc: 'Great progress!' };
      case 'seedling':
      default:
        return { icon: 'flower-outline' as const, label: 'Seedling', desc: 'Keep taking medicines to grow' };
    }
  };

  const details = getStageDetails();

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        // WARM ACCENT EXCLUSIVELY RESERVED FOR STREAK / REWARD / DOSE CONFIRMATION
        colors={['#FFFBEB', '#FFEDD5']}
        style={styles.gradientBg}
      >
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <Ionicons name={details.icon} size={32} color={COLORS.warmAmber} />
          </View>
          <View style={styles.textColumn}>
            <View style={styles.badgeRow}>
              <Text style={styles.title}>{t('streakTitle')}</Text>
              <View style={styles.streakPill}>
                <Ionicons name="flame" size={16} color={COLORS.white} />
                <Text style={styles.streakText}>{streakDays} Days</Text>
              </View>
            </View>
            <Text style={styles.stageLabel}>{details.label} • {details.desc}</Text>
            <Text style={styles.subtext}>{t('streakSubtext')}</Text>
          </View>
        </View>

        {/* Growth Progress Bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, Math.max(15, (streakDays / 14) * 100))}%` },
            ]}
          />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: LAYOUT.borderRadiusCard,
    overflow: 'hidden',
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: '#FDE68A', // Soft amber border
    ...SHADOWS.soft,
  },
  gradientBg: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.warmAmber,
    ...SHADOWS.soft,
  },
  textColumn: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizeLarge,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: '#78350F', // Rich warm brown
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmAmber,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
  },
  streakText: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    fontSize: 14,
  },
  stageLabel: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.warmCoral,
    marginTop: 2,
  },
  subtext: {
    fontSize: 13,
    color: '#92400E',
    marginTop: 4,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.warmAmber,
    borderRadius: 4,
  },
});
