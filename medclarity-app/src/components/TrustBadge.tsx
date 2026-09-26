import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import { useTranslation } from 'react-i18next';

export const TrustBadges: React.FC = () => {
  const { t } = useTranslation();

  const badges = [
    { label: t('whoGrounded'), icon: 'shield-checkmark-outline' as const },
    { label: t('humanVerified'), icon: 'checkmark-circle-outline' as const },
    { label: t('multilingual'), icon: 'language-outline' as const },
    { label: t('securePrivate'), icon: 'lock-closed-outline' as const },
  ];

  return (
    <View style={styles.container}>
      {badges.map((badge, idx) => (
        <View key={idx} style={styles.chip}>
          <Ionicons name={badge.icon} size={14} color={COLORS.primaryBlueDark} />
          <Text style={styles.chipText}>{badge.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlueLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.primaryBlueDark,
  },
});
