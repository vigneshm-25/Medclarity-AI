import React from 'react';
import { useRouter } from 'expo-router';
import { CaregiverHomeScreen } from '../../screens/CaregiverHomeScreen';

export default function CaregiverPatientsRoute() {
  const router = useRouter();

  const navigation = {
    goBack: () => router.back(),
    canGoBack: () => router.canGoBack(),
    navigate: (route: string, params?: any) => {
      if (route === 'MedicineSchedule') {
        router.push({
          pathname: '/caregiver/add-schedule' as any,
          params: { patientId: params?.patientId },
        });
      } else {
        router.push('/caregiver' as any);
      }
    },
  };

  return <CaregiverHomeScreen navigation={navigation} />;
}
