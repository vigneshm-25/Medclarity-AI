import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, TYPOGRAPHY, LAYOUT, SHADOWS } from '../constants/theme';
import { useTranslation } from 'react-i18next';

export type TabKey = 'home' | 'medicines' | 'scan' | 'history' | 'profile';

interface BottomNavigationProps {
  activeTab: TabKey;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab }) => {
  const router = useRouter();
  const { t } = useTranslation();

  const tabs: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap; route: string; isScan?: boolean }[] = [
    {
      key: 'home',
      label: t('home') || 'Home',
      icon: 'home-outline',
      activeIcon: 'home',
      route: '/patient',
    },
    {
      key: 'medicines',
      label: t('medicines') || 'Medicines',
      icon: 'medical-outline',
      activeIcon: 'medical',
      route: '/patient/medicines',
    },
    {
      key: 'scan',
      label: t('scanTitle') || 'Scan',
      icon: 'camera-outline',
      activeIcon: 'camera',
      route: '/patient/scan',
      isScan: true,
    },
    {
      key: 'history',
      label: t('history') || 'History',
      icon: 'calendar-outline',
      activeIcon: 'calendar',
      route: '/patient/history',
    },
    {
      key: 'profile',
      label: t('profile') || 'Profile',
      icon: 'person-outline',
      activeIcon: 'person',
      route: '/patient/profile',
    },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          if (tab.isScan) {
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => router.push(tab.route as any)}
                activeOpacity={0.85}
                style={styles.scanTabContainer}
              >
                <View style={styles.scanButton}>
                  <Ionicons name="camera" size={26} color={COLORS.white} />
                </View>
                <Text style={[styles.tabLabel, styles.scanLabel]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => {
                if (!isActive) {
                  router.push(tab.route as any);
                }
              }}
              activeOpacity={0.7}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
            >
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={isActive ? COLORS.primaryBlue : COLORS.textLight}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.activeTabLabel : styles.inactiveTabLabel,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadiusCard,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.medium,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    minWidth: 54,
    minHeight: 48,
  },
  activeTabButton: {
    backgroundColor: COLORS.primaryBlueLight,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
  },
  activeTabLabel: {
    color: COLORS.primaryBlueDark,
    fontWeight: TYPOGRAPHY.fontWeightBold,
  },
  inactiveTabLabel: {
    color: COLORS.textMuted,
  },
  scanTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    minHeight: 54,
  },
  scanButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.soft,
  },
  scanLabel: {
    color: COLORS.primaryBlueDark,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    marginTop: 2,
  },
});
