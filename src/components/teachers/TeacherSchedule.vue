<template>
  <div class="teacher-schedule">
    <!-- Controles del calendario -->
    <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      <div class="flex items-center space-x-2">
        <button 
          @click="previousWeek" 
          class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronLeftIcon class="h-5 w-5" />
        </button>
        <h2 class="text-lg font-semibold">
          {{ formatWeekRange(currentWeekStart, currentWeekEnd) }}
        </h2>
        <button 
          @click="nextWeek" 
          class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronRightIcon class="h-5 w-5" />
        </button>
      </div>
      
      <div class="flex space-x-2">
        <button 
          @click="goToToday" 
          class="btn bg-blue-500 hover:bg-blue-600 text-white text-sm"
        >
          Hoy
        </button>
        <button 
          @click="toggleView('week')" 
          class="btn" 
          :class="calendarView === 'week' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'"
        >
          Semana
        </button>
        <button 
          @click="toggleView('day')" 
          class="btn"
          :class="calendarView === 'day' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'"
        >
          Día
        </button>
      </div>
    </div>
    
    <!-- Vista de Semana -->
    <div v-if="calendarView === 'week'" class="week-view">
      <!-- Cabecera con los días de la semana -->
      <div class="grid grid-cols-8 gap-2">
        <div class="time-column"></div>
        <div 
          v-for="(day, index) in weekDays" 
          :key="index" 
          class="day-column py-2 text-center font-medium"
          :class="isToday(day) ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-t-lg' : ''"
        >
          <div>{{ formatDayName(day) }}</div>
          <div 
            class="text-xl mt-1"
            :class="isToday(day) ? 'font-bold' : ''"
          >
            {{ formatDayNumber(day) }}
          </div>
        </div>
      </div>
      
      <!-- Rejilla del horario -->
      <div class="schedule-grid mt-2 border dark:border-gray-700 rounded-lg overflow-hidden">
        <div class="grid grid-cols-8 h-[700px]">
          <!-- Columna de horas -->
          <div class="time-column border-r dark:border-gray-700 relative">
            <div 
              v-for="hour in hours" 
              :key="hour.value" 
              :style="{ top: `${(hour.value - startHour) * hourHeight}px` }"
              class="absolute w-full text-xs text-gray-500 text-right pr-2"
            >
              {{ hour.label }}
            </div>
          </div>
          
          <!-- Columnas para cada día -->
          <div 
            v-for="(day, dayIndex) in weekDays" 
            :key="dayIndex" 
            class="day-column relative border-r last:border-r-0 dark:border-gray-700"
            :class="isToday(day) ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''"
          >
            <!-- Líneas de hora -->
            <div 
              v-for="hour in hours" 
              :key="`line-${hour.value}`" 
              :style="{ top: `${(hour.value - startHour) * hourHeight}px` }"
              class="absolute w-full border-t dark:border-gray-700 pointer-events-none"
            ></div>
            
            <!-- Eventos del día -->
            <div 
              v-for="event in getEventsForDay(day)" 
              :key="event.id" 
              :style="{
                top: `${(event.startHour - startHour) * hourHeight}px`,
                height: `${event.duration * hourHeight}px`,
                left: '4px',
                right: '4px'
              }"
              class="absolute rounded-md p-2 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              :class="getEventClass(event)"
              @click="showEventDetails(event)"
            >
              <div class="font-medium text-sm truncate">{{ event.title }}</div>
              <div class="text-xs truncate">{{ formatEventTime(event) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Vista de Día -->
    <div v-else-if="calendarView === 'day'" class="day-view">
      <div class="text-center mb-4">
        <h3 class="text-xl font-semibold">
          {{ formatFullDay(selectedDay) }}
        </h3>
      </div>
      
      <div class="schedule-day-grid border dark:border-gray-700 rounded-lg overflow-hidden">
        <div class="grid grid-cols-1 sm:grid-cols-[100px_1fr] h-[700px]">
          <!-- Columna de horas -->
          <div class="time-column border-r dark:border-gray-700 relative hidden sm:block">
            <div 
              v-for="hour in hours" 
              :key="hour.value" 
              :style="{ top: `${(hour.value - startHour) * hourHeight}px` }"
              class="absolute w-full text-xs text-gray-500 text-right pr-2"
            >
              {{ hour.label }}
            </div>
          </div>
          
          <!-- Columna del día -->
          <div class="day-detail-column relative">
            <!-- Líneas de hora -->
            <div 
              v-for="hour in hours" 
              :key="`line-${hour.value}`" 
              :style="{ top: `${(hour.value - startHour) * hourHeight}px` }"
              class="absolute w-full border-t dark:border-gray-700 pointer-events-none flex"
            >
              <span class="text-xs text-gray-500 pl-2 sm:hidden">{{ hour.label }}</span>
            </div>
            
            <!-- Eventos del día -->
            <div 
              v-for="event in getEventsForDay(selectedDay)" 
              :key="event.id" 
              :style="{
                top: `${(event.startHour - startHour) * hourHeight}px`,
                height: `${event.duration * hourHeight}px`,
                left: '8px',
                right: '8px'
              }"
              class="absolute rounded-md p-2 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              :class="getEventClass(event)"
              @click="showEventDetails(event)"
            >
              <div class="font-medium">{{ event.title }}</div>
              <div class="text-sm">{{ formatEventTime(event) }}</div>
              <div class="text-sm mt-1 hidden sm:block">{{ event.location }}</div>
              <div class="text-sm mt-1 hidden md:block">{{ event.description }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Lista de eventos del día (móvil) -->
      <div class="mt-4 sm:hidden">
        <h4 class="text-lg font-medium mb-2">Clases Programadas</h4>
        <div v-if="getEventsForDay(selectedDay).length > 0" class="space-y-2">
          <div
            v-for="event in getEventsForDay(selectedDay)"
            :key="`list-${event.id}`"
            class="p-3 rounded-lg"
            :class="getEventClass(event)"
            @click="showEventDetails(event)"
          >
            <div class="font-medium">{{ event.title }}</div>
            <div class="text-sm">{{ formatEventTime(event) }}</div>
            <div class="text-sm mt-1">{{ event.location }}</div>
          </div>
        </div>
        <div v-else class="text-center text-gray-500 py-4">
          No hay clases programadas para este día
        </div>
      </div>
    </div>
    
    <!-- Modal de detalles de evento -->
    <div v-if="selectedEvent" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-xl font-semibold">{{ selectedEvent.title }}</h3>
          <button @click="selectedEvent = null" class="text-gray-500 hover:text-gray-700">
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>
        
        <div class="space-y-4">
          <div class="flex items-center text-gray-700 dark:text-gray-300">
            <ClockIcon class="h-5 w-5 mr-2" />
            <span>{{ formatEventDate(selectedEvent) }}</span>
          </div>
          
          <div class="flex items-center text-gray-700 dark:text-gray-300">
            <MapPinIcon class="h-5 w-5 mr-2" />
            <span>{{ selectedEvent.location }}</span>
          </div>
          
          <div v-if="selectedEvent.description" class="pt-2 border-t dark:border-gray-700">
            <p class="text-gray-700 dark:text-gray-300">{{ selectedEvent.description }}</p>
          </div>
          
          <div v-if="selectedEvent.studentCount" class="flex items-center text-gray-700 dark:text-gray-300">
            <UserGroupIcon class="h-5 w-5 mr-2" />
            <span>{{ selectedEvent.studentCount }} estudiantes</span>
          </div>
          
          <div class="flex justify-end pt-4 border-t dark:border-gray-700">
            <router-link 
              :to="`/classes/${selectedEvent.id}`"
              class="btn btn-primary"
            >
              Ver Detalles
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addWeeks, 
  subWeeks,
  isSameDay,
  setHours,
  setMinutes,
  addHours
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useClassesStore } from '../../stores/classes';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline';

// Stores
const classesStore = useClassesStore();

// Estado para la vista del calendario
const calendarView = ref('week');
const today = new Date();
const currentWeekStart = ref(startOfWeek(today, { weekStartsOn: 1 }));  // Semana inicia en lunes
const currentWeekEnd = ref(endOfWeek(today, { weekStartsOn: 1 }));
const selectedDay = ref(today);
const selectedEvent = ref(null);

// Constantes para el horario
const startHour = 7;  // 7:00 AM
const endHour = 21;   // 9:00 PM
const hourHeight = 60; // Altura en píxeles para una hora

// Generar horas para mostrar en el horario
const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => {
  const hour = startHour + i;
  return {
    value: hour,
    label: `${hour}:00`
  };
});

// Calcular los días de la semana actual
const weekDays = computed(() => {
  return eachDayOfInterval({
    start: currentWeekStart.value,
    end: currentWeekEnd.value
  });
});

// ID del profesor (simulado)
const teacherId = '1'; // En un caso real, se obtendría del usuario autenticado

// Eventos del calendario (clases del profesor)
const scheduleEvents = ref([]);

// Cargar las clases del profesor
const loadTeacherClasses = async () => {
  try {
    if (classesStore.classes.length === 0) {
      await classesStore.fetchClasses();
    }
    
    // Filtrar clases para este profesor
    const teacherClasses = classesStore.classes.filter(c => c.teacherId === teacherId);
    
    // Convertir clases a eventos del calendario
    scheduleEvents.value = teacherClasses.flatMap(cls => {
      // Para cada clase, crear un evento por cada día que se imparte en la semana actual
      return cls.schedule?.map(schedule => {
        // Encontrar el día de la semana correspondiente
        const dayIndex = getDayIndex(schedule.day);
        if (dayIndex < 0) return null;
        
        // Crear fecha para este evento
        const eventDate = addDays(currentWeekStart.value, dayIndex);
        
        // Parsear la hora de inicio (formato "14:30")
        const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
        const startDateTime = setMinutes(setHours(eventDate, startHour), startMinute);
        
        // Calcular la duración en horas
        const duration = schedule.duration || 1.5; // Por defecto 1.5 horas si no se especifica
        
        // Hora de finalización
        const endDateTime = addHours(startDateTime, duration);
        
        return {
          id: `${cls.id}-${schedule.day}-${schedule.startTime}`,
          classId: cls.id,
          title: cls.name,
          description: cls.description || '',
          startDateTime,
          endDateTime,
          startHour: startHour + (startMinute / 60),
          duration,
          day: schedule.day,
          location: schedule.location || 'Aula por asignar',
          studentCount: cls.studentIds?.length || 0,
          type: cls.type || 'regular',
          level: cls.level || 'Intermedio'
        };
      }).filter(Boolean);
    });
    
  } catch (error) {
    console.error('Error al cargar clases del profesor:', error);
  }
};

// Función para determinar el índice del día de la semana (0 = lunes, 6 = domingo)
const getDayIndex = (dayName) => {
  const days = {
    'Lunes': 0,
    'Martes': 1,
    'Miércoles': 2,
    'Jueves': 3,
    'Viernes': 4,
    'Sábado': 5,
    'Domingo': 6
  };
  return days[dayName] !== undefined ? days[dayName] : -1;
};

// Funciones de formato para fechas
const formatWeekRange = (start, end) => {
  if (start.getMonth() === end.getMonth()) {
    return `${format(start, 'd')} - ${format(end, 'd')} de ${format(start, 'MMMM yyyy', { locale: es })}`;
  }
  return `${format(start, 'd MMM')} - ${format(end, 'd MMM yyyy', { locale: es })}`;
};

const formatDayName = (date) => {
  return format(date, 'EEE', { locale: es });
};

const formatDayNumber = (date) => {
  return format(date, 'd');
};

const formatFullDay = (date) => {
  return format(date, "EEEE, d 'de' MMMM", { locale: es });
};

const formatEventTime = (event) => {
  const start = format(event.startDateTime, 'H:mm');
  const end = format(event.endDateTime, 'H:mm');
  return `${start} - ${end}`;
};

const formatEventDate = (event) => {
  const date = format(event.startDateTime, "EEEE d 'de' MMMM", { locale: es });
  return `${date}, ${formatEventTime(event)}`;
};

// Función para verificar si un día es hoy
const isToday = (date) => {
  return isSameDay(date, today);
};

// Funciones de navegación del calendario
const previousWeek = () => {
  currentWeekStart.value = subWeeks(currentWeekStart.value, 1);
  currentWeekEnd.value = subWeeks(currentWeekEnd.value, 1);
  loadTeacherClasses();
};

const nextWeek = () => {
  currentWeekStart.value = addWeeks(currentWeekStart.value, 1);
  currentWeekEnd.value = addWeeks(currentWeekEnd.value, 1);
  loadTeacherClasses();
};

const goToToday = () => {
  currentWeekStart.value = startOfWeek(today, { weekStartsOn: 1 });
  currentWeekEnd.value = endOfWeek(today, { weekStartsOn: 1 });
  selectedDay.value = today;
  loadTeacherClasses();
};

const toggleView = (view) => {
  calendarView.value = view;
};

// Obtener eventos para un día específico
const getEventsForDay = (day) => {
  return scheduleEvents.value.filter(event => 
    isSameDay(event.startDateTime, day)
  );
};

// Obtener clase CSS según el tipo de evento
const getEventClass = (event) => {
  const baseClasses = 'shadow border';
  
  switch (event.type) {
    case 'regular':
      return `${baseClasses} bg-blue-100 border-blue-300 text-blue-900 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-100`;
    case 'individual':
      return `${baseClasses} bg-purple-100 border-purple-300 text-purple-900 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-100`;
    case 'ensemble':
      return `${baseClasses} bg-green-100 border-green-300 text-green-900 dark:bg-green-900/30 dark:border-green-700 dark:text-green-100`;
    case 'workshop':
      return `${baseClasses} bg-yellow-100 border-yellow-300 text-yellow-900 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-100`;
    default:
      return `${baseClasses} bg-gray-100 border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100`;
  }
};

// Mostrar detalles de un evento
const showEventDetails = (event) => {
  selectedEvent.value = event;
};

// Cargar datos al montar el componente
onMounted(() => {
  loadTeacherClasses();
});
</script>

<style scoped>
.schedule-grid, .schedule-day-grid {
  position: relative;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.time-column {
  min-width: 60px;
}

.day-column {
  min-width: 100px;
}

.btn {
  @apply px-3 py-1.5 rounded-md text-sm font-medium;
}
</style>