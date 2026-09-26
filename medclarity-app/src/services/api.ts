// MedClarity AI — Unified FastAPI Service Integration Layer

import { Platform } from 'react-native';

const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();
console.log('[FE-BASE-URL-RESOLVED]', API_BASE_URL, 'Platform:', Platform.OS);

export interface StructuredMedicine {
  medicine_name?: string;
  name?: string;
  dosage?: string;
  simple_dosage?: string;
  time_of_day?: string;
  frequency?: string;
  relation_to_food?: string;
  simple_timing?: string;
  duration?: string;
  simple_duration?: string;
  purpose?: string;
  simple_purpose?: string;
  side_effects?: string;
}

export type MedicineItem = StructuredMedicine;

export interface NormalizedMedicine {
  name: string;
  dosage: string;
  timing: string;
  purpose: string;
  duration: string;
  time_of_day?: string;
  relation_to_food?: string;
  frequency?: string;
  side_effects?: string;
  raw: any;
}

export function normalizeMedicineItem(med: any): NormalizedMedicine {
  if (!med) {
    return {
      name: 'Unknown Medication',
      dosage: 'As prescribed',
      timing: 'Take as directed',
      purpose: 'Medication',
      duration: 'As directed',
      raw: med,
    };
  }

  const name =
    med.medicine_name ||
    med.name ||
    med.medicineName ||
    med.drug_name ||
    med.title ||
    'Medication';

  const dosage =
    med.simple_dosage ||
    med.dosage ||
    med.dosage_strength ||
    'As prescribed';

  const timing =
    med.simple_timing ||
    med.relation_to_food ||
    med.time_of_day ||
    med.frequency ||
    'Take as directed';

  const purpose =
    med.simple_purpose ||
    med.purpose ||
    'Prescribed medication';

  const duration =
    med.simple_duration ||
    med.duration ||
    'As directed';

  return {
    name: String(name),
    dosage: String(dosage),
    timing: String(timing),
    purpose: String(purpose),
    duration: String(duration),
    time_of_day: med.time_of_day ? String(med.time_of_day) : undefined,
    relation_to_food: med.relation_to_food ? String(med.relation_to_food) : undefined,
    frequency: med.frequency ? String(med.frequency) : undefined,
    side_effects: med.side_effects ? String(med.side_effects) : undefined,
    raw: med,
  };
}

export interface PrescriptionAnalysisResult {
  patient_name: string;
  patient_advisory_en: string;
  medicines: StructuredMedicine[];
  helpful_tips: string[];
}

export interface OcrResponse {
  raw_ocr: string;
  error?: string;
}

export interface PrescriptionProcessResponse {
  patient_name?: string;
  raw_ocr?: string;
  patient_advisory_en?: string;
  simplified_en?: {
    patient_greeting?: string;
    simple_summary?: string;
    medicines?: StructuredMedicine[];
    helpful_tips?: string[];
  };
  tamil_guide?: {
    patient_greeting?: string;
    simple_summary?: string;
    medicines?: StructuredMedicine[];
    helpful_tips?: string[];
    safety_advisory?: string;
  };
  translated_guide?: any;
  reminders?: StructuredMedicine[];
  rag_sources?: string[];
  error?: string;
}

export interface ApiReminder {
  id?: number;
  patient_name: string;
  medicine_name: string;
  dosage: string;
  time_of_day: string;
  frequency: string;
  relation_to_food: string;
  duration: string;
}

// 1. OCR Extraction using FastAPI Backend (/api/ocr)
export async function runOcrApi(imageUriOrBase64: string): Promise<OcrResponse> {
  const endpoint = '/api/ocr';
  const fullUrl = `${API_BASE_URL}${endpoint}`;

  console.log('[CP-RN-1]');
  console.log('Backend URL:', API_BASE_URL);
  console.log('[CP-RN-2]');
  console.log('Endpoint:', endpoint);
  console.log('[CP-RN-3]');
  console.log('Request started');

  try {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      let blob: Blob;
      if (imageUriOrBase64.startsWith('data:') || imageUriOrBase64.startsWith('blob:') || imageUriOrBase64.startsWith('http')) {
        const res = await fetch(imageUriOrBase64);
        blob = await res.blob();
      } else {
        const res = await fetch(`data:image/jpeg;base64,${imageUriOrBase64}`);
        blob = await res.blob();
      }
      formData.append('file', new File([blob], 'prescription.jpg', { type: blob.type || 'image/jpeg' }));
    } else {
      let uri = imageUriOrBase64;
      if (!uri.startsWith('data:') && !uri.startsWith('file:') && !uri.startsWith('http')) {
        uri = `data:image/jpeg;base64,${imageUriOrBase64}`;
      }
      formData.append('file', {
        uri,
        name: 'prescription.jpg',
        type: 'image/jpeg',
      } as any);
    }

    const response = await fetch(fullUrl, {
      method: 'POST',
      body: formData,
    });

    console.log('[CP-RN-4]');
    console.log('Status code:', response.status);

    if (!response.ok) {
      const errorResponseBody = await response.text();
      console.log('[CP-RN-6]');
      console.log('Status code:', response.status);
      console.log('Response body:', errorResponseBody);
      const fullError = new Error(errorResponseBody);
      console.log('Full error:', fullError);
      throw fullError;
    }

    const data = await response.json();
    console.log('[CP-RN-5]');
    console.log('OCR successful');

    let rawOcrText = data.raw_ocr || '';
    if (typeof rawOcrText === 'string' && rawOcrText.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(rawOcrText);
        if (parsed.raw_transcription) {
          rawOcrText = parsed.raw_transcription;
        }
      } catch (e) {}
    }

    return { raw_ocr: rawOcrText };
  } catch (error: any) {
    if (!error.message || !error.message.includes('[CP-RN-6]')) {
      console.log('[CP-RN-6]');
      console.log('Status code:', 500);
      console.log('Response body:', error?.message || 'Unknown network error');
      console.log('Full error:', error);
    }
    throw error;
  }
}

// 2. Medical Structuring & Translation using FastAPI Backend (/api/process-text)
export async function processPrescriptionTextApi(
  text: string,
  targetLang: 'Tamil' | 'English' = 'Tamil'
): Promise<PrescriptionProcessResponse> {
  const endpoint = '/api/process-text';
  const fullUrl = `${API_BASE_URL}${endpoint}`;

  console.log('[CP-RN-1]');
  console.log('Backend URL:', API_BASE_URL);
  console.log('[CP-RN-2]');
  console.log('Endpoint:', endpoint);
  console.log('[CP-RN-3]');
  console.log('Request started');

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        target_lang: targetLang,
      }),
    });

    console.log('[CP-RN-4]');
    console.log('Status code:', response.status);

    if (!response.ok) {
      const errorResponseBody = await response.text();
      console.log('[CP-RN-6]');
      console.log('Status code:', response.status);
      console.log('Response body:', errorResponseBody);
      const fullError = new Error(errorResponseBody);
      console.log('Full error:', fullError);
      throw fullError;
    }

    const data: PrescriptionProcessResponse = await response.json();
    console.log('[CP-RN-5]');
    console.log('OCR successful');

    return data;
  } catch (error: any) {
    if (!error.message || !error.message.includes('[CP-RN-6]')) {
      console.log('[CP-RN-6]');
      console.log('Status code:', 500);
      console.log('Response body:', error?.message || 'Unknown network error');
      console.log('Full error:', error);
    }
    throw error;
  }
}

// 3. Reminders Fetching Endpoint
export async function fetchRemindersApi(): Promise<ApiReminder[]> {
  console.log(`[API CALL] Fetching reminders from ${API_BASE_URL}/api/reminders`);
  const response = await fetch(`${API_BASE_URL}/api/reminders`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to load reminders (Status ${response.status}): ${errText}`);
  }

  const reminders: ApiReminder[] = await response.json();
  return reminders;
}

// 4. Create Reminder Endpoint
export async function createReminderApi(reminder: Omit<ApiReminder, 'id'>): Promise<ApiReminder> {
  console.log(`[API CALL] Creating reminder via ${API_BASE_URL}/api/reminders`, reminder);
  const response = await fetch(`${API_BASE_URL}/api/reminders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(reminder),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create reminder (Status ${response.status}): ${errorText}`);
  }

  const created: ApiReminder = await response.json();
  return created;
}

// 5. Delete Reminder Endpoint
export async function deleteReminderApi(reminderId: number): Promise<void> {
  console.log(`[API CALL] Deleting reminder ID ${reminderId}`);
  const response = await fetch(`${API_BASE_URL}/api/reminders/${reminderId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to delete reminder ID ${reminderId} (Status ${response.status}): ${errText}`);
  }
}

// 5b. Log Reminder Trigger Event Endpoint
export async function logReminderTriggerApi(
  patientName: string,
  medicineName: string,
  timeString: string,
  status: string = 'Notification Sent'
): Promise<void> {
  try {
    const fullUrl = `${API_BASE_URL}/api/reminders/trigger-log`;
    await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_name: patientName,
        medicine_name: medicineName,
        time: timeString,
        status,
      }),
    });
  } catch (e: any) {
    console.log('[TRIGGER LOG WARN]', e?.message);
  }
}

// 6. Audio Stream Endpoint URL
export function getAudioStreamUrl(text: string, lang: 'en' | 'ta' = 'en'): string {
  const encodedText = encodeURIComponent(text);
  return `${API_BASE_URL}/api/audio?text=${encodedText}&lang=${lang}`;
}

// 7. Auth Endpoints
export async function requestOtpApi(contact: string): Promise<{ success: boolean; message: string }> {
  console.log(`[AUTH API] Requesting OTP for: ${contact}`);
  const endpoint = '/api/auth/request-otp';
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  if (!contact || contact.trim().length < 5) {
    throw new Error('Please enter a valid phone number or email address.');
  }
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: contact, contact }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to request OTP (${response.status}): ${errText}`);
  }
  const data = await response.json();
  return { success: true, message: data.message || ('OTP sent successfully to ' + contact) };
}

export async function verifyOtpApi(contact: string, otp: string): Promise<{ success: boolean; token: string }> {
  console.log(`[AUTH API] Verifying OTP ${otp} for: ${contact}`);
  const endpoint = '/api/auth/verify-otp';
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  if (otp.length !== 6) {
    throw new Error('Invalid OTP code. Please enter all 6 digits.');
  }
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: contact, contact, otp }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Invalid OTP code (${response.status}): ${errText}`);
  }
  const data = await response.json();
  return { success: true, token: data.token || ('auth-token-' + Date.now()) };
}
