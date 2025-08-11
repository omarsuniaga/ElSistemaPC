<template>
  <div class="professional-calendar-layout">
    <!-- Modal gestor de criterios -->
    <CriteriaManagerModal
      v-if="showCriteriaModal"
      :model-value="showCriteriaModal"
      :criteria="criteriaList"
      @update:modelValue="showCriteriaModal = $event"
      @update:criteria="updateCriteriaList"
    />

    <!-- Contenido principal del calendario -->
    <div class="calendar-main">
      <!-- Encabezado mejorado con navegación y filtros -->
      <EnhancedCalendarHeader
        :current-month-year="currentMonthFormatted"
        :loading="loading"
        @previous-month="goToPreviousMonth"
        @next-month="goToNextMonth"
        @go-to-today="goToToday"
        @refresh="refreshCalendar"
        @export="exportCalendarData"
        @new-class="navigateToNewClass"
        @view-changed="changeView"
        @teacher-changed="filterByTeacher"
        @status-changed="filterByStatus"
      />

      <!-- Estadísticas del mes -->
      <CalendarStats 
        :stats="monthStats"
        :loading="loading"
        @export-stats="exportStats"
        @refresh="refreshStats"
      />

      <!-- Leyenda de estados -->
      <div class="legend">
        <div class="legend-item">
          <div class="legend-dot complete"></div>
          <span>Completo</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot partial"></div>
          <span>Parcial</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot scheduled"></div>
          <span>Programado</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot none"></div>
          <span>Sin actividad</span>
        </div>
      </div>

      <!-- Cuadrícula del calendario -->
      <div class="calendar-container">
        <!-- Días de la semana -->
        <div class="weekdays-header">
          <div 
            v-for="day in weekDays" 
            :key="day" 
            class="weekday"
          >
            {{ day }}
          </div>
        </div>
        
        <!-- Días del mes -->
        <div class="calendar-grid">
          <template v-for="day in calendarDays" :key="day.date.getTime()">
            <div 
              class="calendar-day"
              :class="[
                { 
                  'current-month': day.isCurrentMonth,
                  'today': day.isToday,
                  'selected': day.isSelected,
                  'has-attendance': day.hasAttendance,
                  'other-month': !day.isCurrentMonth
                },
                getDayClasses(day)
              ]"
              @click="selectDate(day.date)"
            >
              <div class="day-number">
                {{ day.date.getDate() }}
                <span v-if="day.isToday" class="today-badge">Hoy</span>
              </div>
              
              <div 
                v-if="day.hasAttendance" 
                class="day-indicator"
                :class="getDayIndicatorColor(day)"
              ></div>
              
              <div 
                v-if="day.attendanceStatus" 
                class="attendance-status"
                :class="day.attendanceStatus"
                :title="getAttendanceStatusText(day)"
              >
                {{ getAttendanceStatusIcon(day) }}
              </div>
              
              <div class="day-events">
                <template v-if="getClassesForDate(day.date).length > 0">
                  <div 
                    v-for="classItem in getClassesForDate(day.date).slice(0, 2)" 
                    :key="classItem.id"
                    class="event-dot"
                    :class="classItem.status"
                    :title="`${classItem.name} - ${classItem.time}`"
                  ></div>
                </template>
                <div 
                  v-if="getClassesForDate(day.date).length > 2" 
                  class="more-events"
                >
                  +{{ getClassesForDate(day.date).length - 2 }} más
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Panel lateral de clases -->
    <ClassListDrawer
      :is-open="showDrawer"
      :classes="classesForSelectedDate"
      :selected-date="selectedDate"
      @close="closeDrawer"
      @class-selected="goToAttendance"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Componentes
import CriteriaManagerModal from '../components/CriteriaManagerModal.vue';
import ClassListDrawer from '../components/calendar/ClassListDrawer.vue';
import EnhancedCalendarHeader from '../components/calendar/EnhancedCalendarHeader.vue';
import CalendarStats from '../components/calendar/CalendarStats.vue';

// Composición
import { useEnhancedCalendar } from '../composables/useEnhancedCalendar';
import { useClassManagement } from '../composables/useClassManagement';
import { useAttendanceStats } from '../composables/useAttendanceStats';
import { useCriteria } from '../composables/useCriteria';

// Tipos
import type { CalendarDay, ClassForDay } from '../types/calendar';

// Router
const router = useRouter();

// Días de la semana
const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Inicializar composables
const {
  // Estado
  currentMonth,
  selectedDate,
  loading,
  
  // Computed
  currentMonthFormatted,
  calendarDays,
  
  // Métodos
  goToPreviousMonth,
  goToNextMonth,
  goToToday,
  selectDate,
  hasClasses
} = useEnhancedCalendar();

const {
  // Estado
  showDrawer,
  classesForSelectedDate,
  
  // Métodos
  closeDrawer,
  loadClassesForSelectedDate
} = useClassManagement(selectedDate);

const {
  // Estado
  monthStats,
  
  // Métodos
  refreshStats,
  loadMonthStats
} = useAttendanceStats(currentMonth);

const {
  // Estado
  showCriteriaModal,
  criteriaList,
  
  // Métodos
  updateCriteriaList,
  handleManageCriteria
} = useCriteria();

// Métodos del componente
const refreshCalendar = () => {
  loadMonthStats();
  loadClassesForSelectedDate();
};

const exportCalendarData = () => {
  // Implementar lógica de exportación
  console.log('Exportando datos del calendario...');
};

const exportStats = () => {
  // Implementar lógica de exportación de estadísticas
  console.log('Exportando estadísticas...');
};

const navigateToNewClass = () => {
  router.push({ name: 'CreateClass' });
};

const changeView = (view: string) => {
  // Cambiar entre vista mensual/semanal/diaria
  console.log('Cambiando a vista:', view);
};

const filterByTeacher = (teacherId: string) => {
  // Filtrar por profesor
  console.log('Filtrando por profesor:', teacherId);
};

const filterByStatus = (status: string) => {
  // Filtrar por estado
  console.log('Filtrando por estado:', status);
};

// Navegación a la vista de asistencia
const goToAttendance = (classItem: ClassForDay) => {
  if (!selectedDate.value) return;
  
  router.push({
    name: 'TeacherAttendanceDetail',
    params: {
      date: format(selectedDate.value, 'yyyy-MM-dd'),
      classId: classItem.id,
    },
  });
};

// Cargar datos iniciales
onMounted(() => {
  refreshCalendar();
});

// Watchers
watch(currentMonth, () => {
  refreshCalendar();
});

watch(selectedDate, (newDate) => {
  if (newDate) {
    loadClassesForSelectedDate();
  }
});
</script>

<style scoped>
/* Estilos del calendario */
.professional-calendar-layout {
  @apply flex flex-col h-full bg-white rounded-lg shadow-sm;
}

.calendar-main {
  @apply flex-1 p-4 overflow-auto;
}

.legend {
  @apply flex gap-4 my-4 justify-center flex-wrap;
}

.legend-item {
  @apply flex items-center gap-2 text-sm text-gray-600;
}

.legend-dot {
  @apply w-3 h-3 rounded-full;
}

.legend-dot.complete {
  @apply bg-green-500;
}

.legend-dot.partial {
  @apply bg-yellow-500;
}

.legend-dot.scheduled {
  @apply bg-blue-500;
}

.legend-dot.none {
  @apply bg-gray-300;
}

.calendar-container {
  @apply mt-4;
}

.weekdays-header {
  @apply grid grid-cols-7 gap-1 mb-2;
}

.weekday {
  @apply text-center text-sm font-medium text-gray-500 py-2;
}

.calendar-grid {
  @apply grid grid-cols-7 gap-1;
}

.calendar-day {
  @apply min-h-24 p-2 border border-gray-200 rounded-md cursor-pointer transition-colors;
  @apply hover:bg-gray-50;
}

.calendar-day.other-month {
  @apply bg-gray-50 text-gray-400;
}

.calendar-day.today {
  @apply bg-blue-50 border-blue-200;
}

.calendar-day.selected {
  @apply bg-blue-100 border-blue-300;
}

.day-number {
  @apply text-sm font-medium mb-1 flex justify-between items-start;
}

.today-badge {
  @apply bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full;
}

.day-indicator {
  @apply w-6 h-1 rounded-full mb-1 mx-auto;
}

.attendance-status {
  @apply text-center text-xs mb-1;
}

.day-events {
  @apply space-y-1 mt-1;
}

.event-dot {
  @apply w-2 h-2 rounded-full mx-auto;
}

.more-events {
  @apply text-xs text-center text-gray-500 truncate;
}

/* Estados de asistencia */
.complete {
  @apply bg-green-500;
}

.partial {
  @apply bg-yellow-500;
}

.scheduled {
  @apply bg-blue-500;
}

.pending {
  @apply bg-gray-300;
}

.absent {
  @apply bg-red-500;
}

.excused {
  @apply bg-purple-500;
}
</style>
