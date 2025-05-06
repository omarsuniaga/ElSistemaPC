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
    <ul v-else-if="filteredClasses.length" class="space-y-2">
      <li v-for="c in filteredClasses" :key="c.id" @click="selectClass(c)" class="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer
               bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 transition">
        <div>
          <div class="text-lg font-medium text-gray-900 dark:text-gray-100">
            {{ c.name }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <span v-if="c.instrument">{{ c.instrument }}</span>
            <span v-if="c.level">· {{ c.level }}</span>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <span v-if="attendanceStatus[`${c.id}|${localDate}`]"
            class="text-xs font-semibold px-2 py-1 bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-200 rounded-full">
            Clase Vista
          </span>
          <span v-else
            class="text-xs font-semibold px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full">
            Sin Registrar
          </span>
          <ChevronRightIcon class="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
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
        <Calendar :selected-date="localDate" :date-statuses="[]" :markedDates="markedDates"
          @select="handleCalendarSelect" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useClassesStore } from '../store/classes';
import { useAttendanceStore } from '../../Attendance/store/attendance';
import { useAuthStore } from '../../../stores/auth';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronRightIcon } from '@heroicons/vue/24/outline';
import Calendar from '../../../components/Calendar.vue';
import { useRouter } from 'vue-router';

type RecordEntry = { classId: string; date: string };
const props = defineProps({
  modelValue: String,
  selectedDate: { type: String, required: true },
  cssClass: { type: [String, Object, Array], default: '' },
  classesWithRecords: { type: Array as () => RecordEntry[], default: () => [] },
  markedDates: { type: Array as () => string[], default: () => [] },
});
// Declarar correctamente los eventos emitidos para v-model usage
const emit = defineEmits(['update:modelValue', 'update:selectedDate', 'date-change', 'back']);


const classesStore = useClassesStore();
const attendanceStore = useAttendanceStore();
const authStore = useAuthStore();
const router = useRouter();

const loading = ref(false);
const error = ref('');
const showCalendarModal = ref(false);

// localDate para manejar cambios en calendario
const localDate = ref(props.selectedDate);
watch(() => props.selectedDate, val => { localDate.value = val; });

const cssClassRef = computed(() => props.cssClass);

const attendanceSet = computed(
  () => new Set(props.classesWithRecords.map(r => `${r.classId}|${r.date}`))
);
const hasAttendanceRecord = async (classId: string, date: string): Promise<boolean> => {
  try {
    if (!classId || !date) return false;

    // Use the getAttendanceByDateAndClass method to check if records exist
    const records = await attendanceStore.getAttendanceByDateAndClass(date, classId);

    // Check if any records were returned
    return records && records.length > 0;
  } catch (error) {
    console.error("Error checking attendance records:", error);
    return false;
  }
};

// Add a reactive property to cache attendance status results
const attendanceStatus = ref<Record<string, boolean>>({});

// Method to check and cache attendance status for a class
const checkAttendanceStatus = async (classId: string, date: string) => {
  const key = `${classId}|${date}`;
  if (attendanceStatus.value[key] === undefined) {
    attendanceStatus.value[key] = await hasAttendanceRecord(classId, date);
  }
  return attendanceStatus.value[key];
};

const formatDate = (date: string) => {
  try {
    return format(parseISO(date), "EEEE d 'de' MMMM", { locale: es });
  } catch {
    return date;
  }
};

const filteredClasses = ref<any[]>([]);
watch(localDate, async () => {
  loading.value = true;
  error.value = '';
  try {
    if (!classesStore.classes.length) await classesStore.fetchClasses();
    if (!attendanceStore.attendanceDocuments.length)
      await attendanceStore.fetchAttendanceDocuments();

    const dayIndex = parseISO(localDate.value).getDay();
    const teacherId = authStore.user?.uid;
    filteredClasses.value = classesStore.classes.filter(
      c =>
        c.teacherId === teacherId &&
        c.schedule?.slots?.some(
          s =>
            s.day === dayIndex ||
            String(s.day)
              .toLowerCase()
              .includes(
                format(parseISO(localDate.value), 'EEEE', { locale: es })
                  .toLowerCase()
              )
        )
    );
    // Emitir eventos correctos en camelCase
    emit('update:selectedDate', localDate.value);
    emit('date-change', localDate.value);

    // Clear previous attendance status cache when date changes
    attendanceStatus.value = {};

    // Prefetch attendance status for all filtered classes
    if (filteredClasses.value.length > 0) {
      await Promise.all(
        filteredClasses.value.map(c => checkAttendanceStatus(c.id, localDate.value))
      );
    }
  } catch (error) {
    error.value = 'No se pudieron cargar las clases';
  } finally {
    loading.value = false;
  }
}, { immediate: true });

const selectClass = (c: any) => {
  emit('update:modelValue', c.id);
  const datePath = localDate.value.replace(/-/g, '');
  try {
    router.push({ name: 'AttendanceList', params: { date: datePath, classId: c.id } });
  } catch {
    router.push(`/attendance/${datePath}/${c.id}`);
  }
};

const openCalendar = () => { showCalendarModal.value = true; };
const closeCalendar = () => { showCalendarModal.value = false; };
const handleCalendarSelect = (date: string) => {
  localDate.value = date;
  closeCalendar();
};
</script>
