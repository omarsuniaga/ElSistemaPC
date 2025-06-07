<template>
  <div :class="['space-y-4 p-4 rounded-lg', 'bg-white dark:bg-gray-900', cssClassRef]">
    <!-- Encabezado con botón volver -->
    <div class="flex justify-between items-center mb-2">
      <button @click="$emit('back')" class="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none">
        ← Volver
      </button>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Clases para {{ formatDate(localDate) }}
      </h2>
      <button @click="debugAttendance" class="px-2 py-1 bg-red-500 text-white rounded text-xs">
        DEBUG
      </button>
    </div>

    <!-- Spinner de carga -->
    <div v-if="loading" class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 dark:border-blue-400"></div>
    </div>

    <!-- Mensaje de error -->
    <div v-else-if="error" class="text-center text-red-600 dark:text-red-400 p-2">
      {{ error }}
    </div>

    <!-- Lista de clases -->
    <ul v-else-if="filteredClasses.length" class="space-y-3">
      <li v-for="c in filteredClasses" :key="c.id" @click="selectClass(c)"
          class="relative flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 transition shadow-sm">

        <!-- Status Indicator (Top Right) -->
        <span v-if="attendanceStatusLoading[`${c.id}|${localDate}`]"
              class="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 bg-gray-400 text-white rounded-full z-10">
          ...
        </span>
        <span v-else-if="attendanceStatus[`${c.id}|${localDate}`] === true"
              class="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 bg-green-500 text-white rounded-full z-10">
          Registrado
        </span>
        <span v-else-if="attendanceStatus[`${c.id}|${localDate}`] === false"
              class="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 bg-yellow-400 text-black rounded-full z-10">
          Pendiente
        </span>

        <!-- Left Content Block -->
        <div class="flex-grow mr-4">
          <div class="text-lg font-medium text-gray-900 dark:text-gray-100 pr-20">
            {{ c.name }} 
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ formatScheduleForDisplay(c, localDate) }} 
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-500 mt-0.5">
            Alumnos: {{ getStudentCountForClass(c.id) }} 
          </div>
          <div v-if="c.instrument || c.level" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            <span v-if="c.instrument">{{ c.instrument }}</span>
            <span v-if="c.level && c.instrument"> · </span>
            <span v-if="c.level">{{ c.level }}</span>
          </div>
        </div>

        <!-- Right Chevron Icon -->
        <ChevronRightIcon class="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
      </li>
    </ul>

    <!-- Estado sin clases -->
    <div v-else class="text-center py-6 text-gray-500 dark:text-gray-400">
      No hay clases asignadas para esta fecha.
    </div>

    <!-- Modal Calendario -->
    <div v-if="showCalendarModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Seleccionar Fecha
          </h3>
          <button @click="closeCalendar"
            class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none">
            ✕
          </button>
        </div>
        <Calendar 
          v-model="localDate" 
          :markedDates="markedDates"
          @day-click="handleCalendarSelect"
          @update:modelValue="handleCalendarSelect" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import { useClassesStore } from '../store/classes';
import { useStudentsStore } from '../../Students/store/students';
import { useAttendanceStore } from '../../Attendance/store/attendance';
import { useOptimizedAttendance } from '../../Attendance/composables/useOptimizedAttendance';
import { useAuthStore } from '../../Auth/store/auth';
import { format, parseISO, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronRightIcon } from '@heroicons/vue/24/outline';
import { defineAsyncComponent } from 'vue';

const toast = useToast();
const router = useRouter();
const classesStore = useClassesStore();
const studentsStore = useStudentsStore();
const attendanceStore = useAttendanceStore();
const authStore = useAuthStore();
const { checkAttendanceExists } = useOptimizedAttendance();
const Calendar = defineAsyncComponent(() => import('../../../components/Calendar.vue'));

interface RecordEntry {
  classId: string;
  date: string;
}

const props = defineProps({
  modelValue: String,
  selectedDate: { type: String, required: true },
  cssClass: { type: [String, Object, Array], default: '' },
  classesWithRecords: {
    type: Array as () => RecordEntry[],
    default: () => [],
  },
  markedDates: { type: Array as () => string[], default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'update:selectedDate', 'date-change', 'back']);

const loading = ref(false);
const error = ref('');
const showCalendarModal = ref(false);
const classStudentCounts = ref<Record<string, number>>({});

const localDate = ref(props.selectedDate);
watch(() => props.selectedDate, val => { localDate.value = val; });

const cssClassRef = computed(() => props.cssClass);

const formatTime = (timeStr: string): string => {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return '';
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  return format(date, 'p', { locale: es }); 
};

const formatScheduleForDisplay = (classItem: any, dateStr: string): string => {
  if (!classItem.schedule || !classItem.schedule.slots || !dateStr) {
    return 'Horario no disponible';
  }
  try {
    const selectedDateObj = parseISO(dateStr);
    const dayOfWeekJs = getDay(selectedDateObj); 

    const dayNamesEs = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const selectedDayNameEs = dayNamesEs[dayOfWeekJs].toLowerCase();

    const slot = classItem.schedule.slots.find((s: any) => {
      if (typeof s.day === 'number') {
        return s.day === dayOfWeekJs;
      }
      if (typeof s.day === 'string') {
        return s.day.toLowerCase() === selectedDayNameEs;
      }
      return false;
    });

    if (slot && slot.startTime && slot.endTime) {
      const startTimeFormatted = formatTime(slot.startTime);
      const endTimeFormatted = formatTime(slot.endTime);
      return `${startTimeFormatted} - ${endTimeFormatted}`;
    }
    return 'No programado para este día';
  } catch (e) {
    console.error("Error formatting schedule:", e);
    return 'Error al obtener horario';
  }
};

const getStudentCountForClass = (classId: string): number => {
  return classStudentCounts.value[classId] || 0;
};

const attendanceSet = computed(
  () => new Set(props.classesWithRecords.map(r => `${r.classId}|${r.date}`))
);

const hasAttendanceRecord = async (classId: string, date: string): Promise<boolean> => {
  try {
    console.log('[DateClassSelector] ===== CHECKING ATTENDANCE RECORD =====');
    console.log('[DateClassSelector] Input:', { classId, date });
    console.log('[DateClassSelector] Available attendance documents:');
    
    attendanceStore.attendanceDocuments.forEach((doc, index) => {
      console.log(`[DateClassSelector] Doc ${index}:`, {
        id: doc.id,
        classId: doc.classId,
        fecha: doc.fecha,
        matches: (doc.classId === classId && doc.fecha === date)
      });
    });
    
    // First check the attendance store cache
    const record = attendanceStore.attendanceDocuments.find(
      doc => doc.classId === classId && doc.fecha === date
    );
    
    if (record) {
      console.log('[DateClassSelector] ✅ Found record in store cache:', record.id);
      return true;
    }
    
    console.log('[DateClassSelector] ❌ No record found in store cache');
    
    // If not in cache, use optimized query to check Firestore
    console.log('[DateClassSelector] Checking Firestore...');
    const exists = await checkAttendanceExists(classId, date);
    console.log('[DateClassSelector] Firestore query result:', exists);
    
    return exists;
  } catch (error) {
    console.error('[DateClassSelector] Error checking attendance record:', error);
    return false;
  }
};

const attendanceStatus = ref<Record<string, boolean>>({});
const attendanceStatusLoading = ref<Record<string, boolean>>({});

const checkAttendanceStatus = async (classId: string, date: string) => {
  const key = `${classId}|${date}`;
  console.log('[DateClassSelector] Starting attendance check for:', { classId, date, key });
  attendanceStatusLoading.value[key] = true;
  
  try {
    const hasRecord = await hasAttendanceRecord(classId, date);
    console.log('[DateClassSelector] Attendance check result:', { classId, date, hasRecord });
    attendanceStatus.value[key] = hasRecord;
  } catch (error) {
    console.error('[DateClassSelector] Error checking attendance status:', error);
    attendanceStatus.value[key] = false;
  } finally {
    attendanceStatusLoading.value[key] = false;
    console.log('[DateClassSelector] Attendance status set:', { key, status: attendanceStatus.value[key] });
  }
};

const formatDate = (date: string) => {
  try {
    return format(parseISO(date), "PPPP", { locale: es });
  } catch (e) {
    console.error("Error formatting date:", e);
    return date;
  }
};

const validateDate = (date: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    error.value = 'Formato de fecha inválido.';
    return false;
  }
  try {
    const parsed = parseISO(date);
    format(parsed, 'yyyy-MM-dd'); 
    if (isNaN(parsed.getTime())) {
        throw new Error('Invalid date value');
    }
    return true;
  } catch (e) {
    console.error('Error al validar fecha:', e);
    error.value = 'Error al validar la fecha.';
    return false;
  }
};

const filteredClasses = ref<any[]>([]);
watch(localDate, async () => {
  loading.value = true;
  error.value = '';
  try {
    if (!validateDate(localDate.value)) {
      return;
    }

    if (!authStore.user?.uid) {
      throw new Error('Usuario no autenticado');
    }    
    if (!classesStore.classes.length) await classesStore.fetchClasses();
    
    if (!studentsStore.students.length && authStore.user?.uid) {
      await studentsStore.fetchStudents();
    }

    if (!attendanceStore.attendanceDocuments.length) {
      console.log('[DateClassSelector] Loading attendance documents...');
      await attendanceStore.fetchAttendanceDocuments();
      console.log('[DateClassSelector] Loaded attendance documents:', attendanceStore.attendanceDocuments.length);
    }

    const dayIndex = parseISO(localDate.value).getDay();
    const teacherId = authStore.user.uid;
    
    if (!teacherId) {
      throw new Error('ID de profesor no disponible');
    }

    filteredClasses.value = classesStore.classes.filter(
      c =>
        c.teacherId === teacherId &&
        c.schedule?.slots?.some(
          s =>
            (typeof s.day === 'number' && s.day === dayIndex) ||
            (typeof s.day === 'string' && 
              s.day.toLowerCase().includes(
                format(parseISO(localDate.value), 'EEEE', { locale: es })
                  .toLowerCase()
              ))
        )
    );

    const counts: Record<string, number> = {};
    for (const cls of filteredClasses.value) {
      counts[cls.id] = studentsStore.getStudentsByClass(cls.id)?.length || 0;
    }
    classStudentCounts.value = counts;

    emit('update:selectedDate', localDate.value);
    emit('date-change', localDate.value);

    // Check attendance status for all filtered classes
    console.log('[DateClassSelector] ===== STARTING ATTENDANCE CHECK =====');
    console.log('[DateClassSelector] Date selected:', localDate.value);
    console.log('[DateClassSelector] Filtered classes:');
    filteredClasses.value.forEach((c, index) => {
      console.log(`[DateClassSelector] Class ${index}:`, {
        id: c.id,
        name: c.name,
        teacherId: c.teacherId
      });
    });
    
    attendanceStatus.value = {};
    attendanceStatusLoading.value = {};
    if (filteredClasses.value.length > 0) {
      console.log('[DateClassSelector] Starting parallel attendance checks...');
      // Use Promise.all to check all classes in parallel for better performance
      const statusChecks = filteredClasses.value.map(async (c) => {
        console.log(`[DateClassSelector] Checking attendance for class: ${c.name} (${c.id})`);
        await checkAttendanceStatus(c.id, localDate.value);
      });
      
      await Promise.all(statusChecks);
      console.log('[DateClassSelector] ===== FINAL ATTENDANCE STATUS =====');
      console.log('[DateClassSelector] Final attendance status:', attendanceStatus.value);
    }
  } catch (err) {
    console.error('Error al cargar las clases:', err);
    error.value = err instanceof Error ? err.message : 'No se pudieron cargar las clases';
  } finally {
    loading.value = false;
  }
}, { immediate: true });

const selectClass = async (c: any) => {
  console.log('Clase seleccionada:', c);
  try {
    attendanceStore.selectedClass = c.id;
    
    const studentList = studentsStore.getStudentsByClass(c.id);
    if (studentList.length === 0) {
      if(studentsStore.students.length === 0) {
         await studentsStore.fetchStudents();
      }
      const recheckedStudentList = studentsStore.getStudentsByClass(c.id);
      if (recheckedStudentList.length === 0) {
        toast.warning('No hay estudiantes registrados en esta clase');
        return;
      }
    }
    
    await attendanceStore.fetchAttendanceDocument(localDate.value, c.id);
        
    const datePath = localDate.value.replace(/-/g, '');
    const targetRoute = {
      name: 'TeacherAttendanceDetail',
      params: { date: datePath, classId: c.id }
    };
    
    const currentRoute = router.currentRoute.value;
    const isSameRoute = currentRoute.name === targetRoute.name && 
                      currentRoute.params.date === targetRoute.params.date &&
                      currentRoute.params.classId === targetRoute.params.classId;
    
    if (isSameRoute) {
      router.replace({ ...targetRoute, query: { _reload: Date.now() } });
    } else {
      await router.push(targetRoute);
    }
  } catch (err) {
    console.error('Error al seleccionar la clase:', err);
    toast.error('Error al cargar la asistencia de la clase');
  }
};

const debugAttendance = async () => {
  console.log('=== MANUAL DEBUG ATTENDANCE ===');
  console.log('Current date:', localDate.value);
  console.log('Attendance store documents:', attendanceStore.attendanceDocuments);
  console.log('Filtered classes:', filteredClasses.value);
  
  // Manually test each class
  for (const classItem of filteredClasses.value) {
    console.log(`Testing class: ${classItem.name} (${classItem.id})`);
    const hasRecord = await hasAttendanceRecord(classItem.id, localDate.value);
    console.log(`Result for ${classItem.name}: ${hasRecord}`);
  }
};

const openCalendar = () => { showCalendarModal.value = true; };
const closeCalendar = () => { showCalendarModal.value = false; };
const handleCalendarSelect = (date: string) => {
  localDate.value = date;
  emit('update:selectedDate', date);
  emit('date-change', date);
  closeCalendar();
};
</script>
