import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MedicineCard } from '../components/MedicineCard';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { BottomNavigation } from '../components/BottomNavigation';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

export const ReminderListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const reminders = useAppStore((state) => state.reminders);
  const deleteReminder = useAppStore((state) => state.deleteReminder);
  const markDose = useAppStore((state) => state.markDose);
  const language = useAppStore((state) => state.language);

  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'completed' | 'missed'>('all');
  const [modalVisible, setModalVisible] = useState(false);

  const filteredReminders = reminders.filter((rem) => {
    if (activeFilter === 'all') return true;
    return rem.status === activeFilter;
  });

  const handleDelete = (id: string) => {
    deleteReminder(id);
  };

  const handleTaken = (id: string) => {
    markDose(id, 'completed');
  };

  const handleSnooze = (id: string) => {
    markDose(id, 'snoozed');
  };

  const handleScanChoice = () => {
    setModalVisible(false);
    navigation.navigate('ScanPrescription');
  };

  const handleManualChoice = () => {
    setModalVisible(false);
    navigation.navigate('ReminderSetup', { medicinesToSetup: [], currentIndex: 0 });
  };

  const filterTabs = [
    { key: 'all', label: language === 'ta' ? 'அனைத்தும்' : 'All' },
    { key: 'upcoming', label: t('upcoming') || 'Upcoming' },
    { key: 'completed', label: t('completed') || 'Completed' },
    { key: 'missed', label: t('missed') || 'Missed' },
  ];

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primaryBlueDark} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>{t('myMedicinesTitle')}</Text>
            <Text style={styles.subtitle}>{t('todaysSchedule')}</Text>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {filterTabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveFilter(tab.key as any)}
              style={[styles.filterChip, activeFilter === tab.key && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, activeFilter === tab.key && styles.filterTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add New Medicine CTA */}
        <Button
          title={t('addNewMedicine')}
          onPress={() => setModalVisible(true)}
          variant="primary"
          icon={<Ionicons name="add-circle" size={22} color={COLORS.white} />}
          style={styles.addBtn}
        />

        {/* Reminders List */}
        {filteredReminders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="medical-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>
              {activeFilter === 'all'
                ? t('noMedicinesYet')
                : (language === 'ta' ? `${tabLabelFor(activeFilter)} நினைவூட்டல்கள் எதுவும் இல்லை.` : `No ${activeFilter} reminders.`)}
            </Text>
          </View>
        ) : (
          filteredReminders.map((item) => (
            <MedicineCard
              key={item.id}
              item={item}
              onTaken={handleTaken}
              onSnooze={handleSnooze}
              onDelete={handleDelete}
              showActions={true}
            />
          ))
        )}

        {/* Choice Modal: Scan vs Manual */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Card variant="glass" style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('addNewMedicine')}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
              </View>

              <Button
                title={t('fromScan')}
                onPress={handleScanChoice}
                variant="primary"
                icon={<Ionicons name="camera" size={20} color={COLORS.white} />}
                style={styles.modalBtn}
              />

              <Button
                title={t('manualEntry')}
                onPress={handleManualChoice}
                variant="teal"
                icon={<Ionicons name="create-outline" size={20} color={COLORS.white} />}
                style={styles.modalBtn}
              />
            </Card>
          </View>
        </Modal>

      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="medicines" />
    </LinearGradient>
  );
};

function tabLabelFor(key: string): string {
  if (key === 'upcoming') return 'வரவிருக்கும்';
  if (key === 'completed') return 'முடிக்கப்பட்ட';
  if (key === 'missed') return 'தவறிய';
  return 'எந்த';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    fontSize: 22,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryBlueLight,
    borderColor: COLORS.primaryBlue,
  },
  filterText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeightMedium,
    color: COLORS.textMuted,
  },
  filterTextActive: {
    color: COLORS.primaryBlueDark,
    fontWeight: TYPOGRAPHY.fontWeightBold,
  },
  addBtn: {
    marginBottom: 16,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadiusCard,
    padding: 36,
    alignItems: 'center',
    marginVertical: 14,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginTop: 10,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  modalBtn: {
    marginVertical: 6,
  },
});
