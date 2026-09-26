import { Platform } from 'react-native';
import { logReminderTriggerApi } from './api';

// Rotating warm, non-repetitive phrases (English & Tamil)
const REMINDER_PHRASES_EN = [
  "Good day! Whenever you're ready, here is your friendly medicine reminder.",
  "Time for your dose! Taking care of your health today helps your tree grow.",
  "Hello! It's time to take your scheduled medicine.",
  "A quick reminder for your medication. You're doing great keeping up!",
];

const REMINDER_PHRASES_TA = [
  "வணக்கம்! உங்கள் மருந்தை உட்கொள்ள வேண்டிய நேரம் இது.",
  "உங்கள் ஆரோக்கியத்தைக் காக்க உங்கள் மருந்தை சரியான நேரத்தில் சாப்பிடுங்கள்.",
  "அன்பான நினைவூட்டல்! உங்கள் இன்றைய மருந்தை மறந்துவிடாதீர்கள்.",
  "உங்கள் உடல்நலனைப் பேண இன்றைய மருந்தை உட்கொள்ளவும்.",
];

export async function initNotificationHandler(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.error('Failed to initialize notification handler:', error);
  }
}

export function getRandomReminderPhrase(lang: 'en' | 'ta' = 'en'): string {
  const list = lang === 'ta' ? REMINDER_PHRASES_TA : REMINDER_PHRASES_EN;
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const Notifications = await import('expo-notifications');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

export async function cancelScheduledReminder(notificationId?: string): Promise<void> {
  if (!notificationId || Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`[NOTIFICATION CANCELLED] ID: ${notificationId}`);
  } catch (error) {
    console.log('Error canceling notification:', error);
  }
}

export async function scheduleMedicationReminder(
  medicineName: string,
  dosage: string,
  timeString: string, // e.g. "08:30 AM" or "20:30"
  lang: 'en' | 'ta' = 'en',
  patientName: string = 'Ravi Kumar',
  hour24?: number,
  minute?: number
): Promise<string | null> {
  // Always log trigger event to backend for developer verification
  logReminderTriggerApi(patientName, `${medicineName} (${dosage})`, timeString, 'Notification Sent')
    .catch((err) => console.log('Log trigger catch:', err?.message));

  if (Platform.OS === 'web') {
    console.log(`[WEB SIMULATION - REMINDER SCHEDULED] Patient: ${patientName} | Medicine: ${medicineName} | Time: ${timeString}`);
    return `web-notif-${Date.now()}`;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.log('Notification permission not granted, continuing with in-app tracking.');
    return null;
  }

  try {
    const Notifications = await import('expo-notifications');
    const warmMessage = getRandomReminderPhrase(lang);
    const title = lang === 'ta' ? `மருந்து நேரம்: ${medicineName}` : `Medication Time: ${medicineName}`;
    const body = `${warmMessage} (${dosage} - ${timeString})`;

    // Parse hour & minute if not provided directly
    let schedHour = hour24;
    let schedMin = minute;

    if (schedHour === undefined || schedMin === undefined) {
      const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const p = match[3] ? match[3].toUpperCase() : null;
        if (p === 'PM' && h < 12) h += 12;
        if (p === 'AM' && h === 12) h = 0;
        schedHour = h;
        schedMin = m;
      } else {
        schedHour = 8;
        schedMin = 0;
      }
    }

    // Schedule exact daily recurring notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { medicineName, dosage, patientName, timeString, type: 'medication_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: schedHour,
        minute: schedMin,
      } as any,
    });

    console.log(`[EXPO NOTIFICATION SCHEDULED] ID: ${notificationId} for ${medicineName} at ${schedHour}:${schedMin}`);
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule local notification with exact trigger, falling back to seconds trigger:', error);
    try {
      const Notifications = await import('expo-notifications');
      const fallbackId = await Notifications.scheduleNotificationAsync({
        content: {
          title: lang === 'ta' ? `மருந்து நேரம்: ${medicineName}` : `Medication Time: ${medicineName}`,
          body: `${dosage} - ${timeString}`,
        },
        trigger: {
          seconds: 5,
        } as any,
      });
      return fallbackId;
    } catch (e) {
      return null;
    }
  }
}
