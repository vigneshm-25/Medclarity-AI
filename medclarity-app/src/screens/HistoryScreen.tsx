import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

export const HistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const historyLog = useAppStore((state) => state.historyLog);
  const language = useAppStore((state) => state.language);

  const getStatusText = (status: string) => {
    if (language === 'ta') {
      if (status === 'completed') return 'முடிந்தது';
      if (status === 'missed') return 'தவறியது';
      return 'தள்ளிவைக்கப்பட்டது';
    }
    return status.toUpperCase();
  };

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primaryBlueDark} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('historyTitle')}</Text>
          <Text style={styles.subtitle}>{t('historySubtitle')}</Text>
        </View>

        {historyLog.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="clipboard-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>
              {language === 'ta' ? 'மருந்து வரலாறு எதுவும் இதுவரை பதிவு செய்யப்படவில்லை.' : 'No medication history recorded yet.'}
            </Text>
          </View>
        ) : (
          historyLog.map((record) => (
            <Card key={record.id} variant="glass" style={styles.recordCard}>
              <View style={styles.row}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        record.status === 'completed'
                          ? '#DCFCE7'
                          : record.status === 'missed'
                          ? COLORS.errorBackground
                          : COLORS.primaryBlueLight,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      record.status === 'completed'
                        ? 'checkmark-circle'
                        : record.status === 'missed'
                        ? 'alert-circle'
                        : 'time'
                    }
                    size={18}
                    color={
                      record.status === 'completed'
                        ? COLORS.successGreen
                        : record.status === 'missed'
                        ? COLORS.errorRed
                        : COLORS.primaryBlue
                    }
                  />
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          record.status === 'completed'
                            ? COLORS.successGreen
                            : record.status === 'missed'
                            ? COLORS.errorRed
                            : COLORS.primaryBlueDark,
                      },
                    ]}
                  >
                    {getStatusText(record.status)}
                  </Text>
                </View>

                <Text style={styles.timeText}>{record.actionTime}</Text>
              </View>

              <Text style={styles.medName}>{record.medicineName}</Text>
              <Text style={styles.medDetails}>
                {language === 'ta' ? 'அளவு' : 'Dosage'}: {record.dosage} • {language === 'ta' ? 'நேரம்' : 'Scheduled'}: {record.scheduledTime}
              </Text>
            </Card>
          ))
        )}

      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    paddingTop: 50,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizeHeader,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizeBase,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadiusCard,
    padding: 30,
    alignItems: 'center',
    marginVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 10,
  },
  recordCard: {
    marginVertical: 6,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.fontWeightBold,
  },
  timeText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  medName: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  medDetails: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
