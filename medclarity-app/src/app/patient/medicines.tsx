import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MedicineCard } from '../../components/MedicineCard';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { BottomNavigation } from '../../components/BottomNavigation';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from 'react-i18next';

export default function PatientMedicinesRoute() {
  const router = useRouter();
  const { t } = useTranslation();
  const reminders = useAppStore((state) => state.reminders);
  const deleteReminder = useAppStore((state) => state.deleteReminder);
  const [modalVisible, setModalVisible] = useState(false);

  const handleDelete = (id: string) => {
    deleteReminder(id);
  };

  const handleScanChoice = () => {
    setModalVisible(false);
    router.push('/patient/scan');
  };

  const handleManualChoice = () => {
    setModalVisible(false);
    router.push('/patient/reminder-setup');
  };

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primaryBlueDark} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('myMedicinesTitle')}</Text>
        </View>

        <Button
          title={t('addNewMedicine')}
          onPress={() => setModalVisible(true)}
          variant="primary"
          icon={<Ionicons name="add-circle" size={22} color={COLORS.white} />}
          style={styles.addBtn}
        />

        {reminders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="medical-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>{t('noMedicinesYet')}</Text>
          </View>
        ) : (
          reminders.map((item) => (
            <MedicineCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
              showActions={false}
            />
          ))
        )}

        {/* Choice Modal: From Scan vs Manual */}
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

      <BottomNavigation activeTab="medicines" />
    </LinearGradient>
  );
}

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
    marginBottom: 16,
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
  addBtn: {
    marginBottom: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSizeLarge,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  modalBtn: {
    marginVertical: 6,
  },
});
