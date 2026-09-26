import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, LAYOUT, SHADOWS } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'glass' | 'solid' | 'accentBorder';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'glass' }) => {
  return (
    <View
      style={[
        styles.card,
        variant === 'glass' && styles.glassCard,
        variant === 'accentBorder' && styles.accentBorderCard,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: LAYOUT.borderRadiusCard,
    padding: 18,
    marginVertical: 8,
    ...SHADOWS.soft,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  accentBorderCard: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primaryBlue,
  },
});
