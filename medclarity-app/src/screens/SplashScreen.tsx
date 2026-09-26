import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import { useTranslation } from 'react-i18next';

export const SplashScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const scaleAnim = new Animated.Value(0.7);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient colors={COLORS.bluePurpleGradient} style={styles.container}>
      <Animated.View
        style={[
          styles.logoLockup,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconCircle}>
          {/* Logo mark (heart + heartbeat + pill + bell mark) */}
          <Ionicons name="heart" size={54} color={COLORS.primaryTealBright} />
          <View style={styles.badgeOverlay}>
            <Ionicons name="notifications" size={24} color={COLORS.warmAmber} />
          </View>
        </View>

        <Text style={styles.appName}>{t('appName')}</Text>
        <Text style={styles.tagline}>{t('tagline')}</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoLockup: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 20,
  },
  badgeOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 3,
  },
  appName: {
    fontSize: TYPOGRAPHY.fontSizeHero,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: TYPOGRAPHY.fontSizeLarge,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 8,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
});
