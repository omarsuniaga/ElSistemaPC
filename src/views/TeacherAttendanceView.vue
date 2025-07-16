<!-- src/modulos/attendance/views/TeacherAttendanceView.vue -->
<template>
  <div class="p-4 space-y-4">
    <AttendanceHeader
      :selected-date="state.selectedDate"
      :selected-class="state.selectedClass"
      role="maestro"
      @change-view="state.view.value = $event"
      @analytics="modal.open('analytics')"
      @report="modal.open('report')"
    />
    <Calendar
      v-if="state.view.value === 'calendar'"
      :selected-date="state.selectedDate"
      :marked-dates="markedDates"
      :current-user="currentUserInfo"
      class="mx-auto"
      @select="handleDateChange"
    />
    <DateClassSelector
      v-else-if="state.view.value === 'class-select'"
      v-model="state.selectedClass"
      :selected-date="state.selectedDate"
      :classes-with-records="classesWithRecords"
      :is-loading="state.loading"
      @update:model-value="handleClassSelect"
      @date-change="handleDateChange"
    />

    <!-- Vista: Lista de Asistencia -->
    <AttendanceList
      v-else-if="state.view.value === 'attendance-form'"
      :selected-date="state.selectedDate"
      :selected-class="state.selectedClass"
      @saved="handleSaved"
      @error="toast.error($event)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAttendanceState } from '../modulos/Attendance/composables/useAttendanceState';
import { useModal } from '../modulos/Attendance/composables/useModal';
import { useToast } from '../modulos/Attendance/composables/useToast';
import { useAttendanceStore } from '../modulos/Attendance/store/attendance';
import { useAuthStore } from '../stores/auth';

import AttendanceHeader from '../components/AttendanceHeader.vue';
import Calendar from '@/components/Calendar.vue';
import DateClassSelector from '@/modulos/Classes/components/DateClassSelector.vue';
import AttendanceList from '../components/AttendanceList.vue';

// Estado centralizado para maestro
const state = useAttendanceState('maestro');
const modal = useModal();
const toast = useToast();
const authStore = useAuthStore(); // Inicializa el store de autenticación
const attendanceStore = useAttendanceStore();
const router = useRouter();

// Clases con registro en la fecha seleccionada
const classesWithRecords = ref<string[]>([]);
const markedDates = ref<string[]>([]); // Array para almacenar las fechas marcadas
/**
 * Verifica si existe un registro de asistencia para la fecha y clase especificadas
 * @param date Fecha a verificar en formato yyyy-MM-dd
 * @param classId ID opcional de la clase a verificar (si no se proporciona, verifica cualquier clase en esa fecha)
 * @returns Promesa que resuelve a true si existe un registro, false en caso contrario
 */
const checkExistingAttendance = async (date: string, classId?: string): Promise<boolean> => {
  try {
    // Verificar primero en los documentos ya cargados en memoria
    if (classId) {
      // Buscar para una clase específica
      const existingInMemory = attendanceStore.attendanceDocuments.some(
        (doc) => doc.fecha === date && doc.classId === classId,
      );

      if (existingInMemory) return true;

      // Si no está en memoria, intentar cargarlo de Firebase
      try {
        const docResult = await attendanceStore.fetchAttendanceDocument(date, classId);
        const hasExistingData =
          docResult &&
          (docResult.data.presentes.length > 0 ||
            docResult.data.ausentes.length > 0 ||
            docResult.data.tarde.length > 0);

        return !!hasExistingData;
      } catch (e) {
        // Si no existe el documento, retornamos false sin error
        return false;
      }
    } else {
      // Buscar cualquier documento con esta fecha
      const existingInMemory = attendanceStore.attendanceDocuments.some((doc) => doc.fecha === date);

      return existingInMemory;
    }
  } catch (error) {
    console.error('Error verificando asistencia existente:', error);
    return false;
  }
};

// Propiedad computada para obtener las fechas marcadas (formato string[])
// const markedDates = computed(() => {
//   if (!attendanceStore.attendanceDocuments || attendanceStore.attendanceDocuments.length === 0) {
//     return [];
//   }

// Obtener fechas únicas de los documentos de asistencia cargados
const dates = attendanceStore.attendanceDocuments
  .filter((doc) => typeof doc.fecha === 'string')
  .map((doc) => doc.fecha);

// Quitar duplicados
//   const uniqueDates = Array.from(new Set(dates));
//   console.log('TeacherAttendanceView > markedDates:', uniqueDates);
//   return uniqueDates;
//  });

// Propiedad computada para obtener información del usuario actual
const currentUserInfo = computed(() => authStore.user); // Ajustamos para usar la propiedad user

/** Actualiza la lista de clases que ya tienen asistencia registrada para la fecha seleccionada */
function updateClassesForSelectedDate() {
  // Solo filtramos los documentos ya existentes en el store por la fecha seleccionada
  classesWithRecords.value = attendanceStore.attendanceDocuments
    .filter((doc) => doc.fecha === state.selectedDate.value)
    .map((doc) => doc.classId);
}

/** Carga todos los documentos de asistencia desde Firebase */
async function fetchAllAttendanceDocuments() {
  try {
    // Esta llamada debería traer TODOS los documentos sin filtro por fecha
    await attendanceStore.fetchAttendanceDocuments();
    console.log('Documentos cargados:', attendanceStore.attendanceDocuments.length);
    // Una vez cargados todos los documentos, filtramos solo por la fecha actual
    updateClassesForSelectedDate();
  } catch (error) {
    console.error('Error al cargar documentos de asistencia:', error);
  }
}

/** Maneja cambio de fecha */
async function handleDateChange(date: string) {
  await state.setDate(date);
  state.view.value = 'class-select';
  updateClassesForSelectedDate(); // Usamos la nueva función que solo filtra, sin fetch
}

/** Maneja selección de clase */
function handleClassSelect(classId: string) {
  state.setClass(classId);
  state.view.value = 'attendance-form';
  state.loadCurrent();
}

/** Cuando se guarda la asistencia */
function handleSaved() {
  toast.success('Asistencia guardada');

  // Al guardar, volvemos a cargar todos los documentos para reflejar el cambio
  fetchAllAttendanceDocuments();
}

/**
 * Verifica todos los documentos de asistencia para una clase específica en un mes
 * Útil para cargar datos de marcas en el calendario de forma eficiente
 */
async function verifyAttendanceMarksForMonth(month: number, year: number, classId?: string) {
  try {
    // Si no tenemos documentos cargados, primero cargarlos
    if (!attendanceStore.attendanceDocuments || attendanceStore.attendanceDocuments.length === 0) {
      await fetchAllAttendanceDocuments();
    }

    // Generar un array con todos los días del mes
    const daysInMonth = new Date(year, month, 0).getDate();
    const dateChecks: Promise<boolean>[] = [];

    // Para cada día del mes, verificar si hay asistencia registrada
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      if (classId) {
        // Si se proporciona un ID de clase, verificar solo para esa clase
        dateChecks.push(checkExistingAttendance(date, classId));
      } else {
        // De lo contrario, solo verificamos si hay documentos con esa fecha
        const hasDoc = attendanceStore.attendanceDocuments.some((doc) => doc.fecha === date);
        dateChecks.push(Promise.resolve(hasDoc));
      }
    }

    // Esperar a que todas las verificaciones terminen
    const results = await Promise.all(dateChecks);

    console.log(
      `Verificadas ${results.filter(Boolean).length} fechas con asistencia para ${month}/${year}`,
    );

    // Forzar una actualización del calendario
    updateClassesForSelectedDate();
  } catch (error) {
    console.error('Error al verificar fechas marcadas:', error);
  }
}

// Ejecuta una vez al montar el componente
onMounted(async () => {
  await state.init();
  markedDates.value.push(
    '2025-05-05',
    '2025-05-06',
    '2025-05-07',
    '2025-05-08',
    '2025-05-09',
    '2025-05-10',
  );
  console.log('Fechas de prueba para el calendario:', markedDates.value);

  // Para pruebas, no necesitamos cargar los documentos reales
  // ya que estamos usando un array de prueba fijo
  /* 
  await fetchAllAttendanceDocuments()
  
  // Verificar las fechas marcadas para el mes actual
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // getMonth() devuelve 0-11
  const currentYear = today.getFullYear();
  
  // Verificar asistencia para el mes actual
  await verifyAttendanceMarksForMonth(currentMonth, currentYear);
  */

  // Asegurarnos de que el calendario muestre el mes actual para ver las fechas de prueba
  // console.log('Mes actual seleccionado:', new Date().toISOString().slice(0, 7));
});

// Cada vez que cambia la fecha, solo filtramos los datos ya existentes
watch(
  () => state.selectedDate.value,
  () => {
    updateClassesForSelectedDate();
  },
);
</script>

<style scoped>
/* Estilos opcionales */
</style>
