import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../constants/theme';
import { useTranslation } from 'react-i18next';

interface ErrorBannerProps {
  message: string | null;
  onRetry?: () => void;
  onClose?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry, onClose }) => {
  const { t } = useTranslation();

  if (!message) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle" size={24} color={COLORS.errorRed} />

      <View style={styles.textCol}>
        <Text style={styles.title}>{t('errorTitle')}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>

      <View style={styles.actionsRow}>
        {onRetry ? (
          <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('retry')}</Text>
          </TouchableOpacity>
        ) : null}

        {onClose ? (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={COLORS.textDark} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorBackground,
    borderWidth: 1.5,
    borderColor: COLORS.errorRed,
    borderRadius: LAYOUT.borderRadiusCard,
    padding: 14,
    marginVertical: 10,
    gap: 12,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.errorRed,
  },
  message: {
    fontSize: 13,
    color: COLORS.textDark,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryBtn: {
    backgroundColor: COLORS.errorRed,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    fontSize: 13,
  },
  closeBtn: {
    padding: 4,
  },
});
