import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ErrorBanner } from '../components/ErrorBanner';
import { COLORS, TYPOGRAPHY, LAYOUT, SHADOWS } from '../constants/theme';
import { useAppStore, Patient, MedicineReminder } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

export const CaregiverHomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const linkedPatients = useAppStore((state) => state.linkedPatients);
  const addPatient = useAppStore((state) => state.addPatient);
  const updatePatient = useAppStore((state) => state.updatePatient);
  const deletePatient = useAppStore((state) => state.deletePatient);
  const toggleReminderEnabled = useAppStore((state) => state.toggleReminderEnabled);
  const deleteReminder = useAppStore((state) => state.deleteReminder);
  const language = useAppStore((state) => state.language);

  const [searchQuery, setSearchQuery] = useState('');
  const [addPatientModalVisible, setAddPatientModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editPatientModalVisible, setEditPatientModalVisible] = useState(false);

  // Add Patient Form State
  const [patName, setPatName] = useState('');
  const [patAge, setPatAge] = useState('');
  const [patGender, setPatGender] = useState<'male' | 'female' | 'other'>('male');
  const [patPhone, setPatPhone] = useState('');
  const [patRelationship, setPatRelationship] = useState('');
  const [patNotes, setPatNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Patient Form State
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female' | 'other'>('male');
  const [editPhone, setEditPhone] = useState('');
  const [editRelationship, setEditRelationship] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Filter patients by search query
  const filteredPatients = linkedPatients.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.relationship && p.relationship.toLowerCase().includes(q))
    );
  });

  const handleOpenAddPatient = () => {
    setPatName('');
    setPatAge('');
    setPatGender('male');
    setPatPhone('');
    setPatRelationship('');
    setPatNotes('');
    setFormError(null);
    setAddPatientModalVisible(true);
  };

  const handleSavePatient = () => {
    if (!patName || !patName.trim()) {
      setFormError(language === 'ta' ? 'நோயாளியின் பெயரை உள்ளிடவும்.' : 'Please enter the patient name.');
      return;
    }
    if (!patPhone || !patPhone.trim()) {
      setFormError(language === 'ta' ? 'தொலைபேசி எண்ணை உள்ளிடவும்.' : 'Please enter phone number.');
      return;
    }

    setFormError(null);
    const newPat = addPatient({
      name: patName.trim(),
      age: patAge.trim() || '60',
      gender: patGender,
      phone: patPhone.trim(),
      relationship: patRelationship.trim() || undefined,
      notes: patNotes.trim() || undefined,
    });

    setAddPatientModalVisible(false);
  };

  const handleOpenEditPatient = (pat: Patient) => {
    setEditName(pat.name);
    setEditAge(pat.age || '');
    setEditGender((pat.gender as any) || 'male');
    setEditPhone(pat.phone || '');
    setEditRelationship(pat.relationship || '');
    setEditNotes(pat.notes || '');
    setEditPatientModalVisible(true);
  };

  const handleSaveEditPatient = () => {
    if (!selectedPatient) return;
    updatePatient(selectedPatient.id, {
      name: editName.trim(),
      age: editAge.trim(),
      gender: editGender,
      phone: editPhone.trim(),
      relationship: editRelationship.trim() || undefined,
      notes: editNotes.trim() || undefined,
    });

    setSelectedPatient({
      ...selectedPatient,
      name: editName.trim(),
      age: editAge.trim(),
      gender: editGender,
      phone: editPhone.trim(),
      relationship: editRelationship.trim() || undefined,
      notes: editNotes.trim() || undefined,
    });

    setEditPatientModalVisible(false);
  };

  // Re-fetch current selected patient details from store
  const activeSelectedPatient = selectedPatient
    ? linkedPatients.find((p) => p.id === selectedPatient.id) || selectedPatient
    : null;

  return (
    <LinearGradient colors={COLORS.lightBackgroundGradient} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.badgeCircle}>
              <Ionicons name="people" size={24} color={COLORS.primaryTeal} />
            </View>
            <View>
              <Text style={styles.title}>{t('patientsTitle')}</Text>
              <Text style={styles.subtitle}>{t('caregiverTitle')}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleOpenAddPatient}
            activeOpacity={0.8}
            style={styles.addPatientHeaderBtn}
          >
            <Ionicons name="person-add" size={18} color={COLORS.white} />
            <Text style={styles.addPatientHeaderBtnText}>{t('addPatientBtn')}</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchPatient')}
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>{t('linkedPatients')}</Text>
          <Text style={styles.patientCountBadge}>{filteredPatients.length}</Text>
        </View>

        {/* Patient List */}
        {filteredPatients.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>{t('noPatientsFound')}</Text>
            <Button
              title={t('addPatientBtn')}
              onPress={handleOpenAddPatient}
              variant="teal"
              icon={<Ionicons name="person-add" size={18} color={COLORS.white} />}
              style={{ marginTop: 14 }}
            />
          </View>
        ) : (
          filteredPatients.map((pat) => (
            <TouchableOpacity
              key={pat.id}
              activeOpacity={0.85}
              onPress={() => setSelectedPatient(pat)}
            >
              <Card variant="glass" style={styles.patientCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.avatarCircle}>
                    <Ionicons name="person" size={22} color={COLORS.primaryTeal} />
                  </View>
                  
                  <View style={styles.patInfoCol}>
                    <Text style={styles.patName}>{pat.name}</Text>
                    <Text style={styles.patPhone}>
                      {pat.phone} {pat.relationship ? `• ${pat.relationship}` : ''}
                    </Text>
                    {pat.notes ? (
                      <Text style={styles.patNotesSnippet} numberOfLines={1}>
                        {pat.notes}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.adherenceBadge}>
                    <Text style={styles.adherenceNum}>{pat.adherencePercentage}%</Text>
                    <Text style={styles.adherenceLabel}>{t('patientAdherence')}</Text>
                  </View>
                </View>

                {/* Status Bar */}
                <View style={styles.statusRow}>
                  <View style={styles.streakBadge}>
                    <Ionicons name="leaf" size={16} color={COLORS.warmAmber} />
                    <Text style={styles.streakText}>
                      {pat.streak} {language === 'ta' ? 'நாள் தொடர்ச்சி' : 'Day Streak'}
                    </Text>
                  </View>

                  <Text style={styles.viewDetailText}>{t('viewPatientDetails')} →</Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

        {/* ========================================================================= */}
        {/* 1. ADD PATIENT MODAL / REGISTRATION FORM                                  */}
        {/* ========================================================================= */}
        <Modal visible={addPatientModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
              <Card variant="glass" style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <Ionicons name="person-add" size={22} color={COLORS.primaryTeal} />
                    <Text style={styles.modalTitle}>{t('addPatientTitle')}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setAddPatientModalVisible(false)} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={22} color={COLORS.textDark} />
                  </TouchableOpacity>
                </View>

                {/* Patient Name */}
                <Text style={styles.inputLabel}>{t('patientName')} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={language === 'ta' ? 'எ.கா: ரமேஷ் குமார்' : 'e.g. Ramesh Kumar'}
                  placeholderTextColor={COLORS.textLight}
                  value={patName}
                  onChangeText={setPatName}
                />

                {/* Age & Gender */}
                <View style={styles.rowTwoCols}>
                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>{t('patientAge')}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="65"
                      placeholderTextColor={COLORS.textLight}
                      keyboardType="numeric"
                      value={patAge}
                      onChangeText={setPatAge}
                    />
                  </View>

                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>{t('patientGender')}</Text>
                    <View style={styles.genderSelectRow}>
                      {(['male', 'female', 'other'] as const).map((g) => (
                        <TouchableOpacity
                          key={g}
                          onPress={() => setPatGender(g)}
                          style={[styles.genderChip, patGender === g && styles.genderChipActive]}
                        >
                          <Text style={[styles.genderText, patGender === g && styles.genderTextActive]}>
                            {t(g)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Phone Number */}
                <Text style={styles.inputLabel}>{t('patientPhone')} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="phone-pad"
                  value={patPhone}
                  onChangeText={setPatPhone}
                />

                {/* Relationship (Optional) */}
                <Text style={styles.inputLabel}>{t('patientRelationship')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('relationshipPlaceholder')}
                  placeholderTextColor={COLORS.textLight}
                  value={patRelationship}
                  onChangeText={setPatRelationship}
                />

                {/* Notes (Optional) */}
                <Text style={styles.inputLabel}>{t('patientNotes')}</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder={t('notesPlaceholder')}
                  placeholderTextColor={COLORS.textLight}
                  multiline
                  numberOfLines={3}
                  value={patNotes}
                  onChangeText={setPatNotes}
                />

                <ErrorBanner message={formError} onClose={() => setFormError(null)} />

                <Button
                  title={t('savePatient')}
                  onPress={handleSavePatient}
                  variant="teal"
                  icon={<Ionicons name="checkmark-circle" size={20} color={COLORS.white} />}
                  style={{ marginTop: 8 }}
                />
              </Card>
            </ScrollView>
          </View>
        </Modal>

        {/* ========================================================================= */}
        {/* 2. PATIENT DETAILS MODAL                                                  */}
        {/* ========================================================================= */}
        <Modal visible={!!activeSelectedPatient && !editPatientModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
              {activeSelectedPatient && (
                <Card variant="glass" style={styles.modalCard}>
                  {/* Header */}
                  <View style={styles.modalHeader}>
                    <View style={styles.patHeaderInfo}>
                      <Text style={styles.modalTitle}>{activeSelectedPatient.name}</Text>
                      <Text style={styles.patSubHeader}>
                        {activeSelectedPatient.phone} {activeSelectedPatient.relationship ? `• ${activeSelectedPatient.relationship}` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedPatient(null)} style={styles.modalCloseBtn}>
                      <Ionicons name="close" size={22} color={COLORS.textDark} />
                    </TouchableOpacity>
                  </View>

                  {/* Patient Info Overview */}
                  <View style={styles.infoOverviewBox}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoKey}>{t('patientAge')}:</Text>
                      <Text style={styles.infoVal}>{activeSelectedPatient.age || '60'} {language === 'ta' ? 'வயது' : 'Years'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoKey}>{t('patientGender')}:</Text>
                      <Text style={styles.infoVal}>{t(activeSelectedPatient.gender || 'male')}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoKey}>{t('patientAdherence')}:</Text>
                      <Text style={styles.infoValHighlight}>{activeSelectedPatient.adherencePercentage}%</Text>
                    </View>
                    {activeSelectedPatient.notes ? (
                      <View style={styles.notesBox}>
                        <Text style={styles.notesTitle}>{t('patientNotes')}:</Text>
                        <Text style={styles.notesContent}>{activeSelectedPatient.notes}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Caregiver Notice */}
                  <View style={styles.missedNotice}>
                    <Ionicons name="shield-checkmark" size={18} color={COLORS.primaryTeal} />
                    <Text style={styles.missedNoticeText}>{t('caregiverNotice')}</Text>
                  </View>

                  {/* Active Medicines & Upcoming Reminders Section */}
                  <View style={styles.sectionDivider}>
                    <Text style={styles.subSectionTitle}>{t('upcomingReminders')}</Text>
                    <Text style={styles.reminderCountBadge}>
                      {activeSelectedPatient.reminders?.length || 0}
                    </Text>
                  </View>

                  {(!activeSelectedPatient.reminders || activeSelectedPatient.reminders.length === 0) ? (
                    <View style={styles.noRemindersBox}>
                      <Ionicons name="medical-outline" size={32} color={COLORS.textLight} />
                      <Text style={styles.noRemindersText}>{t('noActiveMedicines')}</Text>
                    </View>
                  ) : (
                    activeSelectedPatient.reminders.map((rem: MedicineReminder) => (
                      <View key={rem.id} style={styles.reminderItemCard}>
                        <View style={styles.remLeftCol}>
                          <Text style={styles.remMedName}>{rem.medicineName}</Text>
                          <Text style={styles.remDetails}>
                            {rem.dosage} • {rem.timeOfDay} • {rem.relationToFood}
                          </Text>
                          <View style={styles.slotsRowMini}>
                            {rem.morning && <Text style={styles.slotTag}>{t('morning')}</Text>}
                            {rem.afternoon && <Text style={styles.slotTag}>{t('afternoon')}</Text>}
                            {rem.night && <Text style={styles.slotTag}>{t('night')}</Text>}
                          </View>
                        </View>

                        <View style={styles.remActionsCol}>
                          <Switch
                            value={rem.enabled !== false}
                            onValueChange={() => toggleReminderEnabled(rem.id)}
                            trackColor={{ false: '#CBD5E1', true: COLORS.primaryTeal }}
                            thumbColor={COLORS.white}
                          />
                          <TouchableOpacity
                            onPress={() => deleteReminder(rem.id)}
                            style={styles.deleteRemBtn}
                          >
                            <Ionicons name="trash-outline" size={18} color={COLORS.errorRed} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}

                  {/* Add Medicine Schedule Button -> Opens dedicated schedule screen */}
                  <Button
                    title={t('addMedicineScheduleBtn')}
                    onPress={() => {
                      const curPatId = activeSelectedPatient.id;
                      setSelectedPatient(null);
                      navigation.navigate('MedicineSchedule', { patientId: curPatId });
                    }}
                    variant="primary"
                    icon={<Ionicons name="add-circle" size={20} color={COLORS.white} />}
                    style={{ marginTop: 16 }}
                  />

                  {/* Edit Patient Button */}
                  <Button
                    title={t('editPatient')}
                    onPress={() => handleOpenEditPatient(activeSelectedPatient)}
                    variant="outline"
                    icon={<Ionicons name="create-outline" size={18} color={COLORS.primaryBlueDark} />}
                    style={{ marginTop: 10 }}
                  />
                </Card>
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* ========================================================================= */}
        {/* 3. EDIT PATIENT MODAL                                                     */}
        {/* ========================================================================= */}
        <Modal visible={editPatientModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
              <Card variant="glass" style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('editPatient')}</Text>
                  <TouchableOpacity onPress={() => setEditPatientModalVisible(false)} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={22} color={COLORS.textDark} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>{t('patientName')} *</Text>
                <TextInput style={styles.input} value={editName} onChangeText={setEditName} />

                <View style={styles.rowTwoCols}>
                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>{t('patientAge')}</Text>
                    <TextInput style={styles.input} value={editAge} onChangeText={setEditAge} keyboardType="numeric" />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>{t('patientGender')}</Text>
                    <View style={styles.genderSelectRow}>
                      {(['male', 'female', 'other'] as const).map((g) => (
                        <TouchableOpacity
                          key={g}
                          onPress={() => setEditGender(g)}
                          style={[styles.genderChip, editGender === g && styles.genderChipActive]}
                        >
                          <Text style={[styles.genderText, editGender === g && styles.genderTextActive]}>
                            {t(g)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <Text style={styles.inputLabel}>{t('patientPhone')} *</Text>
                <TextInput style={styles.input} value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" />

                <Text style={styles.inputLabel}>{t('patientRelationship')}</Text>
                <TextInput style={styles.input} value={editRelationship} onChangeText={setEditRelationship} />

                <Text style={styles.inputLabel}>{t('patientNotes')}</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  multiline
                  numberOfLines={3}
                  value={editNotes}
                  onChangeText={setEditNotes}
                />

                <Button
                  title={t('save')}
                  onPress={handleSaveEditPatient}
                  variant="teal"
                  icon={<Ionicons name="save-outline" size={20} color={COLORS.white} />}
                  style={{ marginTop: 10 }}
                />
              </Card>
            </ScrollView>
          </View>
        </Modal>

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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryTealLight,
    justifyContent: 'center',
    alignItems: 'center',
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
  addPatientHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryTeal,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    ...SHADOWS.soft,
  },
  addPatientHeaderBtnText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.white,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    marginBottom: 18,
    ...SHADOWS.soft,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textDark,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  patientCountBadge: {
    backgroundColor: COLORS.primaryBlueLight,
    color: COLORS.primaryBlueDark,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadiusCard,
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginTop: 10,
  },
  patientCard: {
    marginVertical: 6,
    padding: 18,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primaryTealLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patInfoCol: {
    flex: 1,
  },
  patName: {
    fontSize: 17,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  patPhone: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  patNotesSnippet: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  adherenceBadge: {
    alignItems: 'flex-end',
    backgroundColor: COLORS.primaryTealLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  adherenceNum: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryTeal,
  },
  adherenceLabel: {
    fontSize: 9,
    color: COLORS.primaryTeal,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.textDark,
  },
  viewDetailText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlue,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalScrollContent: {
    paddingVertical: 40,
  },
  modalCard: {
    padding: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  patHeaderInfo: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  patSubHeader: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: LAYOUT.borderRadiusInput,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: 15,
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  genderSelectRow: {
    flexDirection: 'row',
    gap: 4,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  genderChipActive: {
    backgroundColor: COLORS.primaryTeal,
    borderColor: COLORS.primaryTeal,
  },
  genderText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  genderTextActive: {
    color: COLORS.white,
  },
  infoOverviewBox: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoKey: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  infoVal: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  infoValHighlight: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryTeal,
  },
  notesBox: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textMuted,
  },
  notesContent: {
    fontSize: 13,
    color: COLORS.textDark,
    marginTop: 2,
  },
  missedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryTealLight,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
  },
  missedNoticeText: {
    fontSize: 12,
    color: COLORS.primaryTeal,
    flex: 1,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.textDark,
  },
  reminderCountBadge: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlue,
    backgroundColor: COLORS.primaryBlueLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  noRemindersBox: {
    alignItems: 'center',
    paddingVertical: 18,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
  },
  noRemindersText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  reminderItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  remLeftCol: {
    flex: 1,
  },
  remMedName: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    color: COLORS.primaryBlueDark,
  },
  remDetails: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  slotsRowMini: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  slotTag: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    color: COLORS.primaryTeal,
    backgroundColor: COLORS.primaryTealLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  remActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteRemBtn: {
    padding: 6,
  },
});
