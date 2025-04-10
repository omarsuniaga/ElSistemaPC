import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export const useAttendanceStore = defineStore('attendance', () => {
  const analyticsData = ref<AttendanceAnalytics>({
    totalClasses: 0,
    attendanceRate: 0,
    commonAbsenceReasons: []
  });
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      loading.value = true;
      error.value = null;
      
      const querySnapshot = await getDocs(collection(db, 'attendance_analytics'));
      // Implementar lógica de procesamiento de datos aquí
      analyticsData.value = processAnalyticsData(querySnapshot);
    } catch (err) {
      error.value = 'Error fetching analytics data';
      console.error('Fetch analytics error:', err);
    } finally {
      loading.value = false;
    }
  };

  return {
    analyticsData,
    loading,
    error,
    fetchAnalytics
  };
});

interface AttendanceAnalytics {
  totalClasses: number;
  attendanceRate: number;
  commonAbsenceReasons: string[];
  // Agregar más propiedades según necesidades
}

function processAnalyticsData(snapshot: any): AttendanceAnalytics {
  const data: AttendanceAnalytics = {
    totalClasses: snapshot.size,
    attendanceRate: 0,
    commonAbsenceReasons: []
  };

  const absenceReasonsMap = new Map<string, number>();
  let presentCount = 0;

  snapshot.forEach((doc: any) => {
    const docData = doc.data();
    presentCount += docData.present ? 1 : 0;
    
    if (docData.absenceReason) {
      absenceReasonsMap.set(docData.absenceReason,
        (absenceReasonsMap.get(docData.absenceReason) || 0) + 1
      );
    }
  });

  data.attendanceRate = snapshot.size > 0 
    ? Math.round((presentCount / snapshot.size) * 100) 
    : 0;

  data.commonAbsenceReasons = Array.from(absenceReasonsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([reason]) => reason);

  return data;
}