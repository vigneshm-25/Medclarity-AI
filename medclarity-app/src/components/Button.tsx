import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, LAYOUT, SHADOWS } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'purple' | 'teal' | 'warmAccent' | 'outline' | 'ghost';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'normal' | 'large';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  size = 'large',
}) => {
  const getGradientColors = () => {
    switch (variant) {
      case 'purple':
        return COLORS.bluePurpleGradient;
      case 'teal':
        return COLORS.tealGreenGradient;
      case 'warmAccent':
        // WARM ACCENT EXCLUSIVELY FOR STREAK & DOSE CONFIRMATION
        return COLORS.warmAccentGradient;
      case 'primary':
      default:
        return COLORS.blueTealGradient;
    }
  };

  const isGradient = variant === 'primary' || variant === 'purple' || variant === 'teal' || variant === 'warmAccent';
  const minHeight = size === 'large' ? 56 : LAYOUT.minTouchTarget;
  const fontSize = size === 'large' ? 20 : TYPOGRAPHY.fontSizeLarge;

  if (isGradient) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[styles.container, { minHeight }, disabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { minHeight }]}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              {icon}
              <Text style={[styles.text, { fontSize }, textStyle]}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.container,
        { minHeight },
        variant === 'outline' ? styles.outline : styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.primaryBlue} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              variant === 'outline' ? styles.outlineText : styles.ghostText,
              { fontSize },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: LAYOUT.borderRadiusPill,
    overflow: 'hidden',
    justifyContent: 'center',
    marginVertical: 6,
    ...SHADOWS.soft,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.buttonPaddingHorizontal,
    borderRadius: LAYOUT.borderRadiusPill,
    gap: 8,
  },
  text: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    textAlign: 'center',
  },
  outline: {
    borderWidth: 2,
    borderColor: COLORS.primaryBlue,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.buttonPaddingHorizontal,
    gap: 8,
  },
  outlineText: {
    color: COLORS.primaryBlue,
  },
  ghost: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.buttonPaddingHorizontal,
    gap: 8,
  },
  ghostText: {
    color: COLORS.primaryBlue,
  },
  disabled: {
    opacity: 0.5,
  },
});
