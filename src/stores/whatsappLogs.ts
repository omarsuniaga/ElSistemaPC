import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface WhatsAppLog {
  id: string
  studentId: string
  phone: string
  message: string
  presetId?: string
  presetName?: string
  sentAt: any
  status: string
  type: string
}

export interface WhatsAppLogFilters {
  studentId: string
  dateFrom?: string // YYYY-MM-DD
  dateTo?: string // YYYY-MM-DD
}

export const useWhatsAppLogsStore = defineStore('whatsappLogs', () => {
  const logs = ref<WhatsAppLog[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const cache = ref<Map<string, {data: WhatsAppLog[]; timestamp: number}>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  function getCacheKey(filters: WhatsAppLogFilters): string {
    return JSON.stringify(filters);
  }

  function isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_DURATION;
  }

  async function fetchLogsByStudentIdAndDateRange(
    studentId: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const filters: WhatsAppLogFilters = { studentId, dateFrom, dateTo };
    const cacheKey = getCacheKey(filters);
    if (cache.value.has(cacheKey)) {
      const cached = cache.value.get(cacheKey)!;
      if (isValidCache(cached.timestamp)) {
        logs.value = cached.data;
        return cached.data;
      }
    }
    loading.value = true;
    error.value = null;
    try {
      const q = query(
        collection(db, 'whatsapp_logs'),
        where('studentId', '==', studentId),
        orderBy('sentAt', 'desc'),
      );
      const snapshot = await getDocs(q);
      let result: WhatsAppLog[] = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as WhatsAppLog,
      );
      // Filtro por rango de fechas si aplica
      if (dateFrom || dateTo) {
        result = result.filter((log) => {
          const sentAt = log.sentAt?.seconds
            ? new Date(log.sentAt.seconds * 1000)
            : new Date(log.sentAt);
          if (dateFrom && sentAt < new Date(dateFrom)) return false;
          if (dateTo && sentAt > new Date(dateTo)) return false;
          return true;
        });
      }
      logs.value = result;
      cache.value.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (err: any) {
      error.value = err.message || 'Error al cargar logs de WhatsApp';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    logs,
    loading,
    error,
    fetchLogsByStudentIdAndDateRange,
  };
});
