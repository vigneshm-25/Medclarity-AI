import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { Button } from './Button';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { MedicineReminder } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

interface MedicineCardProps {
  item: MedicineReminder;
  onTaken?: (id: string) => void;
  onSnooze?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({
  item,
  onTaken,
  onSnooze,
  onDelete,
  showActions = true,
}) => {
  const { t } = useTranslation();

  const getStatusBadge = () => {
    switch (item.status) {
      case 'completed':
        return {
          label: t('completed'),
          color: COLORS.successGreen,
          bg: '#DCFCE7',
          icon: 'checkmark-circle' as const,
        };
      case 'missed':
        return {
          label: t('missed'),
          color: COLORS.errorRed,
          bg: COLORS.errorBackground,
          icon: 'alert-circle' as const,
        };
      case 'upcoming':
      default:
        return {
          label: t('upcoming'),
          color: COLORS.primaryBlue,
          bg: COLORS.primaryBlueLight,
          icon: 'time-outline' as const,
        };
    }
  };

  const status = getStatusBadge();

  return (
    <Card variant="glass" style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View style={styles.timeBadge}>
          <Ionicons name="time" size={16} color={COLORS.primaryBlueDark} />
          <Text style={styles.timeText}>{item.timeOfDay}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon} size={14} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.contentRow}>
        {item.photoUri ? (
          <Image source={{ uri: item.photoUri }} style={styles.thumbImage} />
        ) : (
          <View style={styles.iconCircle}>
            <Ionicons name="medical" size={24} color={COLORS.primaryTeal} />
          </View>
        )}

        <View style={styles.detailsCol}>
          <Text style={styles.medicineName}>{item.medicineName}</Text>
          <Text style={styles.dosageText}>{item.dosage} • {item.frequency}</Text>

          <View style={styles.tagRow}>
            <View style={styles.foodTag}>
              <Ionicons name="restaurant-outline" size={12} color={COLORS.primaryTeal} />
              <Text style={styles.foodTagText}>{item.relationToFood}</Text>
            </View>

            {item.tagText ? (
              <View style={styles.identifierTag}>
                <Ionicons name="pricetag-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.identifierText}>{item.tagText}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {onDelete ? (
          <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={20} color={COLORS.errorRed} />
          </TouchableOpacity>
        ) : null}
      </View>

      {showActions && item.status === 'upcoming' && (onTaken || onSnooze) ? (
        <View style={styles.actionsRow}>
          {onTaken ? (
            <Button
              title={t('takenAction')}
              onPress={() => onTaken(item.id)}
              variant="warmAccent" // Warm accent used strictly for confirmation moment
              size="normal"
              icon={<Ionicons name="checkmark-done" size={20} color={COLORS.white} />}
              style={styles.actionBtn}
            />
          ) : null}

          {onSnooze ? (
            <Button
              title={t('snoozeAction')}
              onPress={() => onSnooze(item.id)}
              variant="outline"
              size="normal"
              icon={<Ionicons name="alarm-outline" size={18} color={COLORS.primaryBlue} />}
              style={styles.snoozeBtn}
            />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlueLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryTealLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCol: {
    flex: 1,
  },
  medicineName: {
    fontSize: TYPOGRAPHY.fontSizeLarge,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  dosageText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  foodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryTealLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  foodTagText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.primaryTeal,
  },
  identifierTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  identifierText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  deleteBtn: {
    padding: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    flex: 2,
    marginVertical: 0,
  },
  snoozeBtn: {
    flex: 1,
    marginVertical: 0,
  },
});
