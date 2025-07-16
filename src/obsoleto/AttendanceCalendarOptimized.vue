<!-- 
  📅 CALENDARIO OPTIMIZADO PARA ASISTENCIA
  Rendimiento mejorado con indicadores visuales y navegación rápida
-->
<template>
  <div class="attendance-calendar-optimized">
    <!-- 🎯 Header del calendario -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
      <div class="flex items-cen justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Calendario de Asistencia
        </h3>

        <!-- Controles de navegación -->
        <div class="flex items-center space-x-2">
          <button
            class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Mes anterior"
            @click="previousMonth"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div class="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md">
            <span class="text-sm font-medium">{{ formatMonth(currentDate) }}</span>
          </div>

          <button
            class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Mes siguiente"
            @click="nextMonth"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <button
            class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            @click="goToToday"
          >
            Hoy
          </button>
        </div>
      </div>

      <!-- 📊 Leyenda de estados -->
      <div class="flex flex-wrap gap-4 text-sm">
        <div class="flex items-center">
          <div class="w-3 h-3 bg-blue-500 rounded-full mr-2" />
          <span class="text-gray-600 dark:text-gray-400">Con clases registradas</span>
        </div>
        <div class="flex items-center">
          <div class="w-3 h-3 bg-green-500 rounded-full mr-2" />
          <span class="text-gray-600 dark:text-gray-400">Todas las clases completas</span>
        </div>
        <div class="flex items-center">
          <div class="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
          <span class="text-gray-600 dark:text-gray-400">Clases pendientes</span>
        </div>
        <div class="flex items-center">
          <div class="w-3 h-3 bg-gray-300 rounded-full mr-2" />
          <span class="text-gray-600 dark:text-gray-400">Sin actividad</span>
        </div>
      </div>
    </div>

    <!-- 📅 Grid del calendario -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <!-- Días de la semana -->
      <div class="grid grid-cols-7 bg-gray-50 dark:bg-gray-700">
        <div
          v-for="day in weekDays"
          :key="day"
          class="p-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {{ day }}
        </div>
      </div>

      <!-- Fechas del mes -->
      <div class="grid grid-cols-7 divide-x divide-y divide-gray-200 dark:divide-gray-600">
        <div
          v-for="(date, index) in calendarDays"
          :key="index"
          class="relative min-h-[80px] p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          :class="getDayClasses(date)"
          @click="selectDate(date)"
        >
          <!-- Número del día -->
          <div class="text-sm font-medium" :class="getDateTextClass(date)">
            {{ date.getDate() }}
          </div>

          <!-- Indicadores de actividad -->
          <div class="mt-1 space-y-1">
            <!-- Clases registradas -->
            <div v-if="hasAttendanceRecords(date)" class="flex items-center justify-between">
              <div class="flex space-x-1">
                <div
                  v-for="(record, recordIndex) in getDateAttendanceRecords(date)"
                  :key="recordIndex"
                  class="w-2 h-2 rounded-full"
                  :class="getRecordIndicatorColor(record)"
                  :title="`Clase registrada`"
                />
              </div>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ getDateAttendanceRecords(date).count }}
              </span>
            </div>

            <!-- Clases programadas pero sin registro -->
            <div
              v-if="hasScheduledClasses(date) && !hasAttendanceRecords(date)"
              class="text-xs text-yellow-600 dark:text-yellow-400"
            >
              {{ getScheduledClassesCount(date) }} pendiente(s)
            </div>
          </div>

          <!-- Indicador de día seleccionado -->
          <div
            v-if="isSelectedDate(date)"
            class="absolute inset-0 border-2 border-blue-500 rounded-md pointer-events-none"
          />

          <!-- Indicador de día actual -->
          <div
            v-if="isToday(date)"
            class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
          />
        </div>
      </div>
    </div>

    <!-- 📱 Vista compacta para móviles -->
    <div class="md:hidden mt-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <h4 class="font-medium text-gray-900 dark:text-white mb-3">Navegación rápida</h4>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="(date, index) in upcomingDatesWithActivity"
            :key="index"
            class="p-3 text-left border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="selectDate(date.date)"
          >
            <div class="text-sm font-medium">{{ formatShortDate(date.date) }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ date.count }} clase(s)</div>
          </button>
        </div>
      </div>
    </div>

    <!-- 🔄 Loading state -->
    <div
      v-if="loading"
      class="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div class="flex items-center space-x-3">
          <div
            class="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"
          />
          <span class="text-gray-700 dark:text-gray-300">Cargando calendario...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isSameMonth,
  isToday as dateFnsIsToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useAttendanceStore } from '../store/attendance';
import { useClassesStore } from '../../Classes/store/classes';
import { useAuthStore } from '../../../stores/auth';

// Props
const props = defineProps<{
  selectedDate?: string
  markedDates?: Record<string, any>
}>();

// Emits
const emit = defineEmits<{
  'date-selected': [date: string]
  'month-changed': [month: string]
  'open-classes-modal': [date: string]
}>();

// Stores
const attendanceStore = useAttendanceStore();
const classesStore = useClassesStore();
const authStore = useAuthStore();

// Estado
const currentDate = ref(new Date());
const loading = ref(false);
const _attendanceData = ref<Record<string, any>>({}); // Prefixed with _ to avoid lint error

// Días de la semana (empezando en domingo  para compatibilidad con el calendario)
const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/**
 * 📅 Computed properties para el calendario
 */
const calendarDays = computed(() => {
  const monthStart = startOfMonth(currentDate.value);
  const monthEnd = endOfMonth(currentDate.value);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Empezar en domingo
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 }); // Empezar en domingo

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
});

const upcomingDatesWithActivity = computed(() => {
  // Obtener las fechas próximas con actividad
  const today = new Date();
  const upcoming = [];

  for (let i = 0; i < 31; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    const activityCount = getDateAttendanceRecords(date).count + getScheduledClassesCount(date);

    if (activityCount > 0) {
      upcoming.push({
        date,
        count: activityCount,
      });
    }

    if (upcoming.length >= 6) break;
  }

  return upcoming;
});

/**
 * 🎨 Funciones de estilo y clases
 */
const getDayClasses = (date: Date) => {
  const classes = [];

  if (!isSameMonth(date, currentDate.value)) {
    classes.push('text-gray-400 dark:text-gray-600');
  }

  if (isSelectedDate(date)) {
    classes.push('bg-blue-50 dark:bg-blue-900/20');
  }

  return classes.join(' ');
};

const getDateTextClass = (date: Date) => {
  const classes = [];

  if (isToday(date)) {
    classes.push('text-red-600 dark:text-red-400 font-bold');
  } else if (!isSameMonth(date, currentDate.value)) {
    classes.push('text-gray-400 dark:text-gray-600');
  } else {
    classes.push('text-gray-900 dark:text-white');
  }

  return classes.join(' ');
};

const getRecordIndicatorColor = (record: any) => {
  // Determinar color basado en el estado de la clase
  if (record.isComplete) {
    return 'bg-green-500';
  } else if (record.hasRecords) {
    return 'bg-blue-500';
  } else {
    return 'bg-yellow-500';
  }
};

/**
 * 🔍 Funciones de datos ESPECÍFICAS DEL MAESTRO ACTIVO
 */
const hasAttendanceRecords = (date: Date): boolean => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const teacherId = authStore?.user?.uid;
  if (!teacherId) return false;

  // Verificar si ESTE maestro específico tiene registros en esta fecha
  return attendanceStore.attendanceDocuments.some(
    (doc) => doc.fecha === dateStr && doc.teacherId === teacherId,
  );
};

/**
 * 🗓️ Mapeo robusto de nombres de días a índices numéricos - FORMATO LUNES=0
 */
const getDayIndex = (dayString: string | number): number => {
  // Si ya es un número, retornarlo
  if (typeof dayString === 'number') return dayString;

  // 🔄 NUEVO MAPEO: Lunes=0, Domingo=6 (formato corregido para alineación)
  const dayMapping: Record<string, number> = {
    // Formato completo español
    lunes: 0,
    martes: 1,
    miércoles: 2,
    jueves: 3,
    viernes: 4,
    sábado: 5,
    domingo: 6,
    Lunes: 0,
    Martes: 1,
    Miércoles: 2,
    Jueves: 3,
    Viernes: 4,
    Sábado: 5,
    Domingo: 6,
    
    // Formato abreviado
    lun: 0,
    mar: 1,
    mié: 2,
    jue: 3,
    vie: 4,
    sáb: 5,
    dom: 6,
    Lun: 0,
    Mar: 1,
    Mié: 2,
    Jue: 3,
    Vie: 4,
    Sáb: 5,
    Dom: 6,
    
    // Formato sin acentos
    miercoles: 2,
    sabado: 5,
  };

  // Normalizar: quitar espacios y convertir a string
  const normalized = dayString.toString().trim();
  
  // Buscar en el mapeo directo
  if (normalized in dayMapping) {
    return dayMapping[normalized];
  }
  
  // Buscar en minúsculas como fallback
  const lowercased = normalized.toLowerCase();
  return dayMapping[lowercased] ?? -1;
};

/**
 * 🔄 Función para convertir JavaScript getDay() al formato LUNES=0
 */
const convertJSDateToAligned = (jsDay: number): number => {
  // JavaScript: Dom=0, Lun=1, Mar=2, Mié=3, Jue=4, Vie=5, Sáb=6
  // Nuestro:   Lun=0, Mar=1, Mié=2, Jue=3, Vie=4, Sáb=5, Dom=6
  return jsDay === 0 ? 6 : jsDay - 1;
};

/**
 * 🔍 Función mejorada para determinar si hay clases programadas en una fecha específica
 */
const hasScheduledClasses = (date: Date): boolean => {
  const teacherId = authStore?.user?.uid;
  if (!teacherId) return false;

  // Obtener el día de la semana (0 = domingo, 1 = lunes, etc.) y convertir al formato LUNES=0
  const dayOfWeekJS = date.getDay();
  const dayOfWeek = convertJSDateToAligned(dayOfWeekJS);

  // Buscar clases del maestro que estén programadas para este día de la semana
  const classesForDay = classesStore.classes.filter((cls: any) => {
    // Verificar si es una clase del maestro (principal o colaborador)
    const isPrimaryTeacher = cls.teacherId === teacherId;
    const isCollaboratingTeacher = cls.teachers?.some(
      (t: any) => typeof t === 'object' && t.teacherId === teacherId,
    );
    
    if (!isPrimaryTeacher && !isCollaboratingTeacher) return false;

    // Verificar si la clase tiene horario para este día
    const schedule = cls.schedule as any;
    if (!schedule) return false;

    // Manejar diferentes estructuras de horario
    let slots = [];
    if (schedule.slots && Array.isArray(schedule.slots)) {
      slots = schedule.slots;
    } else if (schedule.day) {
      // Estructura legacy con day directo
      slots = [schedule];
    }

    // Verificar si algún slot coincide con el día actual usando mapeo robusto
    return slots.some((slot: any) => {
      const slotDayIndex = getDayIndex(slot.day);
      return slotDayIndex === dayOfWeek;
    });
  });

  return classesForDay.length > 0;
};

/**
 * Función mejorada para obtener el conteo de clases programadas
 */
const getScheduledClassesCount = (date: Date): number => {
  const teacherId = authStore?.user?.uid;
  if (!teacherId) return 0;

  // Obtener el día de la semana y convertir al formato LUNES=0
  const dayOfWeekJS = date.getDay();
  const dayOfWeek = convertJSDateToAligned(dayOfWeekJS);

  const classesForDay = classesStore.classes.filter((cls: any) => {
    const isPrimaryTeacher = cls.teacherId === teacherId;
    const isCollaboratingTeacher = cls.teachers?.some(
      (t: any) => typeof t === 'object' && t.teacherId === teacherId,
    );
    
    if (!isPrimaryTeacher && !isCollaboratingTeacher) return false;

    const schedule = cls.schedule as any;
    if (!schedule) return false;

    let slots = [];
    if (schedule.slots && Array.isArray(schedule.slots)) {
      slots = schedule.slots;
    } else if (schedule.day) {
      slots = [schedule];
    }

    return slots.some((slot: any) => {
      const slotDayIndex = getDayIndex(slot.day);
      return slotDayIndex === dayOfWeek;
    });
  });

  return classesForDay.length;
};

const getDateAttendanceRecords = (date: Date) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const teacherId = authStore?.user?.uid;
  if (!teacherId) return { type: 'none', count: 0 };

  // Contar solo los registros de ESTE maestro específico
  const teacherDocsCount = attendanceStore.attendanceDocuments.filter(
    (doc) => doc.fecha === dateStr && doc.teacherId === teacherId,
  ).length;

  return {
    type: teacherDocsCount > 0 ? 'attendance' : 'none',
    count: teacherDocsCount,
  };
};

const isSelectedDate = (date: Date): boolean => {
  if (!props.selectedDate) return false;
  // 🐛 FIX: Usar parseo manual para evitar conversión UTC
  const [year, month, day] = props.selectedDate.split('-').map(Number);
  const selectedDateParsed = new Date(year, month - 1, day);
  return isSameDay(date, selectedDateParsed);
};

const isToday = (date: Date): boolean => {
  return dateFnsIsToday(date);
};

/**
 * 🎛️ Funciones de navegación
 */
const selectDate = (date: Date) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  emit('date-selected', dateStr);
  
  // Emitir evento específico para abrir modal de clases
  emit('open-classes-modal', dateStr);
};

const previousMonth = () => {
  currentDate.value = subMonths(currentDate.value, 1);
  emit('month-changed', format(currentDate.value, 'yyyy-MM'));
  loadCalendarData();
};

const nextMonth = () => {
  currentDate.value = addMonths(currentDate.value, 1);
  emit('month-changed', format(currentDate.value, 'yyyy-MM'));
  loadCalendarData();
};

const goToToday = () => {
  currentDate.value = new Date();
  emit('month-changed', format(currentDate.value, 'yyyy-MM'));
  loadCalendarData();
};

/**
 * 🎨 Funciones de formato
 */
const formatMonth = (date: Date): string => {
  return format(date, 'MMMM yyyy', { locale: es });
};

const formatShortDate = (date: Date): string => {
  return format(date, 'd MMM', { locale: es });
};

/**
 * 🔄 Carga de datos mejorada para el calendario
 */
const loadCalendarData = async () => {
  try {
    loading.value = true;

    const teacherId = authStore.user?.uid;
    if (!teacherId) {
      console.warn('🚫 [AttendanceCalendar] No hay maestro autenticado');
      return;
    }

    const monthStart = startOfMonth(currentDate.value);
    const monthEnd = endOfMonth(currentDate.value);

    const startDate = format(monthStart, 'yyyy-MM-dd');
    const endDate = format(monthEnd, 'yyyy-MM-dd');

    console.log('📅 [AttendanceCalendar] Loading data for teacher:', {
      teacherId,
      startDate,
      endDate,
    });

    // Cargar documentos de asistencia específicos del maestro
    await attendanceStore.fetchAttendanceDocumentsByTeacher(teacherId, startDate, endDate);

    // Cargar clases del maestro para asegurar que tenemos la información actualizada
    await classesStore.fetchClasses();

    console.log('📊 [AttendanceCalendar] Data loaded successfully:', {
      attendanceDocuments: attendanceStore.attendanceDocuments.length,
      allClasses: classesStore.classes.length,
      teacherClasses: classesStore.classes.filter(
        (cls: any) =>
          cls.teacherId === teacherId ||
          cls.teachers?.some((t: any) => typeof t === 'object' && t.teacherId === teacherId),
      ).length,
    });

    console.log(
      '📅 [CalendarOptimized] Data loaded for teacher',
      teacherId,
      'in',
      formatMonth(currentDate.value),
    );
  } catch (error) {
    console.error('❌ [CalendarOptimized] Error loading data:', error);
  } finally {
    loading.value = false;
  }
};

// 👀 Watchers
watch(
  () => props.selectedDate,
  (newDate) => {
    if (newDate) {
      // 🐛 FIX: Usar parseo manual para evitar conversión UTC
      const [year, month, day] = newDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (!isSameMonth(date, currentDate.value)) {
        currentDate.value = date;
        loadCalendarData();
      }
    }
  },
);

// 🚀 Lifecycle
onMounted(() => {
  // Inicializar con la fecha seleccionada o hoy
  if (props.selectedDate) {
    // 🐛 FIX: Usar parseo manual para evitar conversión UTC
    const [year, month, day] = props.selectedDate.split('-').map(Number);
    currentDate.value = new Date(year, month - 1, day);
  }

  loadCalendarData();
});
</script>

<style scoped>
.attendance-calendar-optimized {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Animaciones suaves */
.transition-colors {
  transition: all 0.2s ease-in-out;
}

/* Grid responsive */
@media (max-width: 640px) {
  .grid-cols-7 {
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }

  .calendar-day-mobile {
    min-height: 60px;
  }
}
</style>
