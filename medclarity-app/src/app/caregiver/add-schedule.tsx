import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MedicineScheduleScreen } from '../../screens/MedicineScheduleScreen';

export default function CaregiverAddScheduleRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const navigation = {
    goBack: () => router.back(),
    canGoBack: () => router.canGoBack(),
    navigate: (route: string) => router.push('/caregiver' as any),
  };

  return <MedicineScheduleScreen navigation={navigation} route={{ params }} />;
}
