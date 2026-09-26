import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeAppLanguage } from '../i18n';
import { scheduleMedicationReminder, cancelScheduledReminder } from '../services/notificationService';
import { createReminderApi, deleteReminderApi } from '../services/api';

export type UserMode = 'patient' | 'caregiver';

export interface MedicineReminder {
  id: string;
  patientId?: string;
  patientName: string;
  medicineName: string;
  dosage: string;
  morning?: boolean;
  afternoon?: boolean;
  night?: boolean;
  startDate?: string;
  endDate?: string;
  timeOfDay: string; // e.g. "08:00 AM", "02:00 PM", "08:00 PM"
  hour24?: number;
  minute?: number;
  relationToFood: string; // "Before Food" | "After Food" | "With Food"
  frequency: string; // "Daily", etc.
  duration?: string;
  tagText?: string;
  photoUri?: string;
  enabled: boolean;
  status: 'upcoming' | 'completed' | 'missed';
  notificationId?: string;
  lastConfirmedAt?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: string;
  gender: 'male' | 'female' | 'other' | string;
  phone: string;
  relationship?: string;
  notes?: string;
  code: string;
  adherencePercentage: number;
  streak: number;
  plantStage: 'seedling' | 'sprout' | 'healthy' | 'flowering';
  todayStatus: 'all_taken' | 'pending' | 'missed';
  reminders: MedicineReminder[];
}

// Backward-compatibility alias
export type LinkedPatient = Patient;

export interface HistoryRecord {
  id: string;
  medicineName: string;
  dosage: string;
  scheduledTime: string;
  actionTime: string;
  status: 'completed' | 'missed' | 'snoozed';
  patientName: string;
}

interface AppState {
  // Auth & Settings
  isLoggedIn: boolean;
  contact: string;
  userMode: UserMode;
  language: 'en' | 'ta';
  hasSeenOnboarding: boolean;

  // Patient Reminders & Adherence
  reminders: MedicineReminder[];
  streak: number;
  plantStage: 'seedling' | 'sprout' | 'healthy' | 'flowering';
  historyLog: HistoryRecord[];

  // Caregiver / Patients
  linkedPatients: Patient[];
  selectedPatientId: string | null;

  // App UI State
  errorMessage: string | null;
  isLoading: boolean;

  // Actions
  loginUser: (contact: string, token: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  setMode: (mode: UserMode) => Promise<void>;
  setLanguage: (lang: 'en' | 'ta') => Promise<void>;
  completeOnboarding: () => Promise<void>;
  
  // Reminders & Streak Actions
  addReminder: (reminder: Omit<MedicineReminder, 'id' | 'status' | 'enabled'>) => Promise<MedicineReminder>;
  updateReminder: (id: string, updates: Partial<MedicineReminder>) => Promise<void>;
  toggleReminderEnabled: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  markDose: (id: string, status: 'completed' | 'missed' | 'snoozed') => void;

  // Patient & Schedule Actions
  setSelectedPatientId: (id: string | null) => void;
  addPatient: (data: {
    name: string;
    age: string;
    gender: string;
    phone: string;
    relationship?: string;
    notes?: string;
  }) => Patient;
  updatePatient: (id: string, data: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  addScheduleForPatient: (patientId: string, schedule: {
    medicineName: string;
    dosage: string;
    morning?: boolean;
    afternoon?: boolean;
    night?: boolean;
    startDate?: string;
    endDate?: string;
    timeOfDay: string;
    hour24?: number;
    minute?: number;
    relationToFood: string;
    frequency: string;
    duration?: string;
    tagText?: string;
    photoUri?: string;
  }) => Promise<MedicineReminder>;
  linkPatient: (codeOrPhone: string) => boolean;

  // Error Actions
  setError: (msg: string | null) => void;
  setLoading: (loading: boolean) => void;
}

// Helper to determine plant growth stage based on streak count
const getPlantStageForStreak = (streak: number): 'seedling' | 'sprout' | 'healthy' | 'flowering' => {
  if (streak >= 14) return 'flowering';
  if (streak >= 7) return 'healthy';
  if (streak >= 3) return 'sprout';
  return 'seedling';
};

// Initial Mock Medicines
const INITIAL_PATIENT_REMINDERS: MedicineReminder[] = [
  {
    id: 'rem-1',
    patientName: 'Ravi Kumar',
    medicineName: 'Amoxicillin 500mg',
    dosage: '1 Capsule',
    morning: true,
    timeOfDay: '08:00 AM',
    hour24: 8,
    minute: 0,
    relationToFood: 'After Food',
    frequency: 'Daily',
    duration: '5 Days',
    tagText: 'White Pill Bottle',
    enabled: true,
    status: 'completed',
    lastConfirmedAt: 'Today, 8:15 AM',
  },
  {
    id: 'rem-2',
    patientName: 'Ravi Kumar',
    medicineName: 'Paracetamol 650mg',
    dosage: '1 Tablet',
    afternoon: true,
    timeOfDay: '02:00 PM',
    hour24: 14,
    minute: 0,
    relationToFood: 'After Food',
    frequency: 'As needed',
    duration: '3 Days',
    tagText: 'Blue Strip',
    enabled: true,
    status: 'upcoming',
  },
  {
    id: 'rem-3',
    patientName: 'Ravi Kumar',
    medicineName: 'Metformin 500mg',
    dosage: '1 Tablet',
    night: true,
    timeOfDay: '08:30 PM',
    hour24: 20,
    minute: 30,
    relationToFood: 'Before Food',
    frequency: 'Daily',
    duration: '30 Days',
    tagText: 'Round White Pill',
    enabled: true,
    status: 'upcoming',
  },
];

const INITIAL_LINKED_PATIENTS: Patient[] = [
  {
    id: 'pat-1',
    name: 'Ramesh Kumar',
    age: '68',
    gender: 'male',
    phone: '+91 98765 43210',
    relationship: 'Father',
    notes: 'Hypertension, takes BP medicine morning after breakfast',
    code: 'RAMESH-99',
    adherencePercentage: 92,
    streak: 8,
    plantStage: 'healthy',
    todayStatus: 'pending',
    reminders: [
      {
        id: 'c-rem-1',
        patientId: 'pat-1',
        patientName: 'Ramesh Kumar',
        medicineName: 'Amlodipine 5mg',
        dosage: '1 Tablet',
        morning: true,
        timeOfDay: '09:00 AM',
        hour24: 9,
        minute: 0,
        relationToFood: 'After Food',
        frequency: 'Daily',
        duration: '30 Days',
        enabled: true,
        status: 'completed',
      },
      {
        id: 'c-rem-2',
        patientId: 'pat-1',
        patientName: 'Ramesh Kumar',
        medicineName: 'Atorvastatin 10mg',
        dosage: '1 Tablet',
        night: true,
        timeOfDay: '09:00 PM',
        hour24: 21,
        minute: 0,
        relationToFood: 'Before Food',
        frequency: 'Daily',
        duration: '30 Days',
        enabled: true,
        status: 'upcoming',
      },
    ],
  },
  {
    id: 'pat-2',
    name: 'Lakshmi Ammal',
    age: '64',
    gender: 'female',
    phone: '+91 94432 10987',
    relationship: 'Mother',
    notes: 'Type 2 Diabetes, keep glucose monitoring updated',
    code: 'LAKSHMI-44',
    adherencePercentage: 88,
    streak: 5,
    plantStage: 'healthy',
    todayStatus: 'pending',
    reminders: [
      {
        id: 'c-rem-3',
        patientId: 'pat-2',
        patientName: 'Lakshmi Ammal',
        medicineName: 'Metformin 500mg',
        dosage: '1 Tablet',
        morning: true,
        timeOfDay: '08:30 AM',
        hour24: 8,
        minute: 30,
        relationToFood: 'After Food',
        frequency: 'Daily',
        duration: '60 Days',
        enabled: true,
        status: 'upcoming',
      },
    ],
  },
];

export const useAppStore = create<AppState>((set, get) => ({
  isLoggedIn: false,
  contact: '',
  userMode: 'patient',
  language: 'en',
  hasSeenOnboarding: false,

  reminders: INITIAL_PATIENT_REMINDERS,
  streak: 4,
  plantStage: 'sprout',
  historyLog: [
    {
      id: 'hist-1',
      medicineName: 'Amoxicillin 500mg',
      dosage: '1 Capsule',
      scheduledTime: '08:00 AM',
      actionTime: '08:15 AM',
      status: 'completed',
      patientName: 'Ravi Kumar',
    },
  ],

  linkedPatients: INITIAL_LINKED_PATIENTS,
  selectedPatientId: null,

  errorMessage: null,
  isLoading: false,

  loginUser: async (contact: string, token: string) => {
    await AsyncStorage.setItem('user_token', token);
    await AsyncStorage.setItem('user_contact', contact);
    set({ isLoggedIn: true, contact });
  },

  logoutUser: async () => {
    await AsyncStorage.removeItem('user_token');
    set({ isLoggedIn: false, contact: '' });
  },

  setMode: async (mode: UserMode) => {
    await AsyncStorage.setItem('user_mode', mode);
    set({ userMode: mode });
  },

  setLanguage: async (lang: 'en' | 'ta') => {
    await changeAppLanguage(lang);
    set({ language: lang });
  },

  completeOnboarding: async () => {
    await AsyncStorage.setItem('has_seen_onboarding', 'true');
    set({ hasSeenOnboarding: true });
  },

  setSelectedPatientId: (id) => set({ selectedPatientId: id }),

  addPatient: (data) => {
    const randomCode = `${data.name.split(' ')[0].toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
    const newPatient: Patient = {
      id: 'pat-' + Date.now(),
      name: data.name.trim(),
      age: data.age.trim(),
      gender: data.gender,
      phone: data.phone.trim(),
      relationship: data.relationship?.trim(),
      notes: data.notes?.trim(),
      code: randomCode,
      adherencePercentage: 100,
      streak: 1,
      plantStage: 'seedling',
      todayStatus: 'pending',
      reminders: [],
    };

    set((state) => ({ linkedPatients: [newPatient, ...state.linkedPatients] }));
    return newPatient;
  },

  updatePatient: (id, data) => {
    set((state) => ({
      linkedPatients: state.linkedPatients.map((p) => (p.id === id ? { ...p, ...data } : p)),
    }));
  },

  deletePatient: (id) => {
    set((state) => ({
      linkedPatients: state.linkedPatients.filter((p) => p.id !== id),
      reminders: state.reminders.filter((r) => r.patientId !== id),
    }));
  },

  addScheduleForPatient: async (patientId, schedule) => {
    const state = get();
    const patient = state.linkedPatients.find((p) => p.id === patientId);
    const patientName = patient ? patient.name : 'Patient';
    const lang = state.language;

    // 1. Schedule notification
    const notificationId = await scheduleMedicationReminder(
      schedule.medicineName,
      schedule.dosage,
      schedule.timeOfDay,
      lang,
      patientName,
      schedule.hour24,
      schedule.minute
    );

    const newRem: MedicineReminder = {
      ...schedule,
      id: 'rem-' + Date.now(),
      patientId,
      patientName,
      enabled: true,
      status: 'upcoming',
      notificationId: notificationId || undefined,
    };

    // 2. Sync with backend API
    createReminderApi({
      patient_name: patientName,
      medicine_name: schedule.medicineName,
      dosage: schedule.dosage,
      time_of_day: schedule.timeOfDay,
      relation_to_food: schedule.relationToFood,
      frequency: schedule.frequency,
      duration: schedule.duration || '30 Days',
    }).catch((e) => console.log('Backend sync schedule notice:', e?.message));

    // 3. Update Zustand store
    set((s) => ({
      reminders: [...s.reminders, newRem],
      linkedPatients: s.linkedPatients.map((p) =>
        p.id === patientId ? { ...p, reminders: [...p.reminders, newRem] } : p
      ),
    }));

    return newRem;
  },

  addReminder: async (reminderData) => {
    const state = get();
    const lang = state.language;
    const patientName = reminderData.patientName || 'Ravi Kumar';

    // 1. Schedule local notification
    const notifId = await scheduleMedicationReminder(
      reminderData.medicineName,
      reminderData.dosage,
      reminderData.timeOfDay,
      lang,
      patientName,
      reminderData.hour24,
      reminderData.minute
    );

    const newRem: MedicineReminder = {
      ...reminderData,
      id: 'rem-' + Date.now(),
      enabled: true,
      status: 'upcoming',
      notificationId: notifId || undefined,
    };

    set((s) => ({ reminders: [...s.reminders, newRem] }));
    return newRem;
  },

  updateReminder: async (id, updates) => {
    const state = get();
    const existing = state.reminders.find((r) => r.id === id);
    if (!existing) return;

    if (updates.timeOfDay && updates.timeOfDay !== existing.timeOfDay) {
      if (existing.notificationId) {
        await cancelScheduledReminder(existing.notificationId);
      }
      const newNotifId = await scheduleMedicationReminder(
        updates.medicineName || existing.medicineName,
        updates.dosage || existing.dosage,
        updates.timeOfDay,
        state.language,
        existing.patientName,
        updates.hour24,
        updates.minute
      );
      updates.notificationId = newNotifId || undefined;
    }

    set((s) => ({
      reminders: s.reminders.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      linkedPatients: s.linkedPatients.map((p) => ({
        ...p,
        reminders: p.reminders.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      })),
    }));
  },

  toggleReminderEnabled: async (id) => {
    const state = get();
    const target = state.reminders.find((r) => r.id === id);
    if (!target) return;

    const newEnabled = !target.enabled;
    let notifId = target.notificationId;

    if (!newEnabled && target.notificationId) {
      await cancelScheduledReminder(target.notificationId);
      notifId = undefined;
    } else if (newEnabled) {
      const scheduledId = await scheduleMedicationReminder(
        target.medicineName,
        target.dosage,
        target.timeOfDay,
        state.language,
        target.patientName,
        target.hour24,
        target.minute
      );
      notifId = scheduledId || undefined;
    }

    set((s) => ({
      reminders: s.reminders.map((r) => (r.id === id ? { ...r, enabled: newEnabled, notificationId: notifId } : r)),
      linkedPatients: s.linkedPatients.map((p) => ({
        ...p,
        reminders: p.reminders.map((r) => (r.id === id ? { ...r, enabled: newEnabled, notificationId: notifId } : r)),
      })),
    }));
  },

  deleteReminder: async (id) => {
    const state = get();
    const target = state.reminders.find((r) => r.id === id);
    if (target?.notificationId) {
      await cancelScheduledReminder(target.notificationId);
    }

    set((s) => ({
      reminders: s.reminders.filter((r) => r.id !== id),
      linkedPatients: s.linkedPatients.map((p) => ({
        ...p,
        reminders: p.reminders.filter((r) => r.id !== id),
      })),
    }));
  },

  markDose: (id, status) => {
    const state = get();
    const targetRem = state.reminders.find((r) => r.id === id);
    if (!targetRem) return;

    let newStreak = state.streak;
    if (status === 'completed') {
      newStreak += 1;
    } else if (status === 'missed') {
      newStreak = Math.max(0, newStreak - 1);
    }

    const newPlantStage = getPlantStageForStreak(newStreak);

    const newHistoryRecord: HistoryRecord = {
      id: 'hist-' + Date.now(),
      medicineName: targetRem.medicineName,
      dosage: targetRem.dosage,
      scheduledTime: targetRem.timeOfDay,
      actionTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status,
      patientName: targetRem.patientName,
    };

    set((s) => ({
      reminders: s.reminders.map((r) =>
        r.id === id ? { ...r, status: status === 'snoozed' ? 'upcoming' : status } : r
      ),
      linkedPatients: s.linkedPatients.map((p) => ({
        ...p,
        reminders: p.reminders.map((r) =>
          r.id === id ? { ...r, status: status === 'snoozed' ? 'upcoming' : status } : r
        ),
      })),
      streak: newStreak,
      plantStage: newPlantStage,
      historyLog: [newHistoryRecord, ...s.historyLog],
    }));
  },

  linkPatient: (codeOrPhone: string) => {
    if (!codeOrPhone || codeOrPhone.trim().length === 0) return false;

    const newPatient: Patient = {
      id: 'pat-' + Date.now(),
      name: `Patient (${codeOrPhone.trim().toUpperCase()})`,
      age: '60',
      gender: 'other',
      phone: codeOrPhone.trim(),
      code: codeOrPhone.trim().toUpperCase(),
      adherencePercentage: 100,
      streak: 1,
      plantStage: 'seedling',
      todayStatus: 'pending',
      reminders: [],
    };

    set((s) => ({ linkedPatients: [newPatient, ...s.linkedPatients] }));
    return true;
  },

  setError: (msg) => set({ errorMessage: msg }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
