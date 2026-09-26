import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ReminderSetupScreen } from '../../screens/ReminderSetupScreen';

export default function ReminderSetupRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ medicinesToSetup?: string; currentIndex?: string }>();

  let medicinesToSetup: any[] = [];
  if (params.medicinesToSetup) {
    try {
      medicinesToSetup = JSON.parse(params.medicinesToSetup);
    } catch (e: any) {
      console.log('Error parsing medicinesToSetup params:', e?.message);
    }
  }
  const currentIndex = parseInt(params.currentIndex || '0', 10);

  const navigation = {
    goBack: () => router.back(),
    push: (route: string, newParams?: any) => {
      if (route === 'ReminderSetup') {
        router.push({
          pathname: '/patient/reminder-setup',
          params: {
            medicinesToSetup: JSON.stringify(newParams?.medicinesToSetup || []),
            currentIndex: (newParams?.currentIndex || 0).toString(),
          },
        });
      }
    },
    replace: (route: string, newParams?: any) => {
      if (route === 'ReminderSuccess') {
        router.replace({
          pathname: '/patient/reminder-success',
          params: {
            medicineName: newParams?.medicineName,
            dosage: newParams?.dosage,
            timeOfDay: newParams?.timeOfDay,
            relationToFood: newParams?.relationToFood,
          },
        });
      }
    },
  };

  return (
    <ReminderSetupScreen
      navigation={navigation}
      route={{
        params: {
          medicinesToSetup,
          currentIndex,
        },
      }}
    />
  );
}
