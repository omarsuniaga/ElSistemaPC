<template>
  <div class="bg-white rounded-lg shadow-sm p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-900">📅 Calendario de Ensayos</h2>
      <div class="flex items-center gap-3">
        <select
          v-model="currentView"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="month">Mes</option>
          <option value="week">Semana</option>
          <option value="day">Día</option>
        </select>
        <button
          class="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          @click="goToToday"
        >
          Hoy
        </button>
        <button
          class="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          @click="showCreateEvent = true"
        >
          ➕ Nuevo Evento
        </button>
      </div>
    </div>

    <!-- Calendar Navigation -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <button
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          @click="navigateCalendar(-1)"
        >
          ←
        </button>
        <h3 class="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
          {{ formatCalendarTitle() }}
        </h3>
        <button
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          @click="navigateCalendar(1)"
        >
          →
        </button>
      </div>
      
      <!-- View filters -->
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1 text-sm">
          <input
            id="filter-general"
            v-model="filters.general"
            type="checkbox"
            class="rounded"
          >
          <label for="filter-general" class="text-gray-700">General</label>
        </div>
        <div class="flex items-center gap-1 text-sm">
          <input
            id="filter-sectional"
            v-model="filters.sectional"
            type="checkbox"
            class="rounded"
          >
          <label for="filter-sectional" class="text-gray-700">Seccional</label>
        </div>
        <div class="flex items-center gap-1 text-sm">
          <input
            id="filter-performance"
            v-model="filters.performance"
            type="checkbox"
            class="rounded"
          >
          <label for="filter-performance" class="text-gray-700">Presentación</label>
        </div>
      </div>
    </div>

    <!-- Month View -->
    <div v-if="currentView === 'month'" class="grid grid-cols-7 gap-1">
      <!-- Day headers -->
      <div 
        v-for="day in dayHeaders" 
        :key="day"
        class="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50"
      >
        {{ day }}
      </div>
      
      <!-- Calendar days -->
      <div
        v-for="day in calendarDays"
        :key="day.date"
        :class="[
          'min-h-[120px] p-2 border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors',
          day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400',
          day.isToday ? 'bg-blue-100 border-blue-300' : '',
          day.isSelected ? 'bg-blue-200 border-blue-400' : ''
        ]"
        @click="selectDay(day)"
      >
        <div class="font-medium text-sm mb-1">{{ day.dayNumber }}</div>
        <div class="space-y-1">
          <div
            v-for="event in getEventsForDay(day.date)"
            :key="event.id"
            :class="[
              'text-xs p-1 rounded truncate cursor-pointer',
              getEventColor(event.type)
            ]"
            :title="event.title"
            @click.stop="selectEvent(event)"
          >
            {{ event.title }}
          </div>
        </div>
      </div>
    </div>

    <!-- Week View -->
    <div v-if="currentView === 'week'" class="space-y-4">
      <div class="grid grid-cols-8 gap-1">
        <div class="p-3 text-center text-sm font-medium text-gray-500"></div>
        <div 
          v-for="day in weekDays" 
          :key="day.date"
          class="p-3 text-center text-sm font-medium text-gray-700"
        >
          <div>{{ day.dayName }}</div>
          <div class="text-lg font-bold">{{ day.dayNumber }}</div>
        </div>
      </div>
      
      <!-- Time slots -->
      <div class="grid grid-cols-8 gap-1 max-h-96 overflow-y-auto">
        <div v-for="hour in timeSlots" :key="hour" class="contents">
          <div class="p-2 text-xs text-gray-500 text-right">
            {{ formatHour(hour) }}
          </div>
          <div
            v-for="day in weekDays"
            :key="`${day.date}-${hour}`"
            class="min-h-[60px] border border-gray-200 p-1 relative"
          >
            <div
              v-for="event in getEventsForDayAndHour(day.date, hour)"
              :key="event.id"
              :class="[
                'absolute inset-1 text-xs p-1 rounded cursor-pointer',
                getEventColor(event.type)
              ]"
              :title="event.title"
              @click="selectEvent(event)"
            >
              {{ event.title }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Day View -->
    <div v-if="currentView === 'day'" class="space-y-2">
      <div class="text-center text-lg font-semibold text-gray-900 mb-4">
        {{ formatDayTitle(selectedDate) }}
      </div>
      
      <div class="space-y-2 max-h-96 overflow-y-auto">
        <div v-for="hour in timeSlots" :key="hour" class="flex items-start gap-3">
          <div class="w-16 text-sm text-gray-500 text-right pt-2">
            {{ formatHour(hour) }}
          </div>
          <div class="flex-1 min-h-[60px] border-l border-gray-200 pl-3 relative">
            <div
              v-for="event in getEventsForDayAndHour(selectedDate, hour)"
              :key="event.id"
              :class="[
                'p-3 rounded-lg cursor-pointer mb-2',
                getEventColor(event.type)
              ]"
              @click="selectEvent(event)"
            >
              <div class="font-medium">{{ event.title }}</div>
              <div class="text-sm opacity-75">{{ event.startTime }} - {{ event.endTime }}</div>
              <div v-if="event.location" class="text-sm opacity-75">📍 {{ event.location }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Details Modal -->
    <div v-if="selectedEvent" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h3 class="text-lg font-bold mb-4">{{ selectedEvent.title }}</h3>
        
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="font-medium">Tipo:</span>
            <span class="px-2 py-1 rounded text-sm" :class="getEventColor(selectedEvent.type)">
              {{ getEventTypeLabel(selectedEvent.type) }}
            </span>
          </div>
          
          <div class="flex items-center gap-2">
            <span class="font-medium">📅 Fecha:</span>
            <span>{{ formatEventDate(selectedEvent.date) }}</span>
          </div>
          
          <div class="flex items-center gap-2">
            <span class="font-medium">⏰ Hora:</span>
            <span>{{ selectedEvent.startTime }} - {{ selectedEvent.endTime }}</span>
          </div>
          
          <div v-if="selectedEvent.location" class="flex items-center gap-2">
            <span class="font-medium">📍 Ubicación:</span>
            <span>{{ selectedEvent.location }}</span>
          </div>
          
          <div v-if="selectedEvent.description" class="flex items-start gap-2">
            <span class="font-medium">📝 Descripción:</span>
            <span>{{ selectedEvent.description }}</span>
          </div>
          
          <div v-if="selectedEvent.attendees && selectedEvent.attendees.length > 0" class="flex items-start gap-2">
            <span class="font-medium">👥 Participantes:</span>
            <span>{{ selectedEvent.attendees.length }} personas</span>
          </div>
        </div>
        
        <div class="flex gap-3 mt-6">
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            @click="editEvent(selectedEvent)"
          >
            ✏️ Editar
          </button>
          <button
            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            @click="deleteEvent(selectedEvent)"
          >
            🗑️ Eliminar
          </button>
          <button
            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            @click="selectedEvent = null"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- Create Event Modal -->
    <ScheduleSessionModal
      v-if="showCreateEvent"
      @session-scheduled="onEventCreated"
      @close="showCreateEvent = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek, getHours, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import ScheduleSessionModal from './ScheduleSessionModal.vue';

interface CalendarEvent {
  id: string
  title: string
  type: 'general' | 'sectional' | 'individual' | 'performance' | 'meeting'
  date: string
  startTime: string
  endTime: string
  location?: string
  description?: string
  attendees?: string[]
  workIds?: string[]
}

interface CalendarDay {
  date: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
}

const currentView = ref<'month' | 'week' | 'day'>('month');
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const selectedEvent = ref<CalendarEvent | null>(null);
const showCreateEvent = ref(false);

const filters = ref({
  general: true,
  sectional: true,
  performance: true,
  individual: true,
  meeting: true,
});

// Sample events data
const events = ref<CalendarEvent[]>([
  {
    id: '1',
    title: 'Ensayo General - Sinfonía No. 40',
    type: 'general',
    date: '2024-01-15',
    startTime: '19:00',
    endTime: '21:30',
    location: 'Sala Principal',
    description: 'Ensayo completo de la Sinfonía No. 40 de Mozart',
  },
  {
    id: '2',
    title: 'Ensayo Seccional - Cuerdas',
    type: 'sectional',
    date: '2024-01-17',
    startTime: '18:00',
    endTime: '20:00',
    location: 'Sala 2',
  },
  {
    id: '3',
    title: 'Concierto de Primavera',
    type: 'performance',
    date: '2024-01-20',
    startTime: '20:00',
    endTime: '22:00',
    location: 'Teatro Municipal',
  },
]);

const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM

const currentDate = computed(() => new Date(selectedDate.value));

const calendarDays = computed(() => {
  const start = startOfWeek(startOfMonth(currentDate.value));
  const end = endOfWeek(endOfMonth(currentDate.value));
  
  return eachDayOfInterval({ start, end }).map(date => ({
    date: format(date, 'yyyy-MM-dd'),
    dayNumber: parseInt(format(date, 'd')),
    isCurrentMonth: isSameMonth(date, currentDate.value),
    isToday: isToday(date),
    isSelected: format(date, 'yyyy-MM-dd') === selectedDate.value,
  }));
});

const weekDays = computed(() => {
  const start = startOfWeek(currentDate.value);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    return {
      date: format(date, 'yyyy-MM-dd'),
      dayName: format(date, 'EEE', { locale: es }),
      dayNumber: parseInt(format(date, 'd')),
    };
  });
});

const filteredEvents = computed(() => {
  return events.value.filter(event => filters.value[event.type]);
});

const formatCalendarTitle = () => {
  if (currentView.value === 'month') {
    return format(currentDate.value, 'MMMM yyyy', { locale: es });
  } else if (currentView.value === 'week') {
    const start = startOfWeek(currentDate.value);
    const end = endOfWeek(currentDate.value);
    return `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM yyyy', { locale: es })}`;
  } else {
    return format(currentDate.value, 'EEEE, d MMMM yyyy', { locale: es });
  }
};

const formatDayTitle = (dateString: string) => {
  return format(new Date(dateString), 'EEEE, d MMMM yyyy', { locale: es });
};

const formatEventDate = (dateString: string) => {
  return format(new Date(dateString), 'd MMMM yyyy', { locale: es });
};

const formatHour = (hour: number) => {
  return `${hour.toString().padStart(2, '0')}:00`;
};

const getEventsForDay = (dateString: string) => {
  return filteredEvents.value.filter(event => event.date === dateString);
};

const getEventsForDayAndHour = (dateString: string, hour: number) => {
  return filteredEvents.value.filter(event => {
    if (event.date !== dateString) return false;
    const eventHour = parseInt(event.startTime.split(':')[0]);
    return eventHour === hour;
  });
};

const getEventColor = (type: string) => {
  const colors = {
    general: 'bg-blue-100 text-blue-800 border-blue-200',
    sectional: 'bg-green-100 text-green-800 border-green-200',
    individual: 'bg-purple-100 text-purple-800 border-purple-200',
    performance: 'bg-red-100 text-red-800 border-red-200',
    meeting: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };
  return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getEventTypeLabel = (type: string) => {
  const labels = {
    general: 'Ensayo General',
    sectional: 'Ensayo Seccional',
    individual: 'Ensayo Individual',
    performance: 'Presentación',
    meeting: 'Reunión',
  };
  return labels[type] || type;
};

const navigateCalendar = (direction: number) => {
  const currentDateObj = new Date(selectedDate.value);
  
  if (currentView.value === 'month') {
    const newDate = direction > 0 ? addMonths(currentDateObj, 1) : subMonths(currentDateObj, 1);
    selectedDate.value = format(newDate, 'yyyy-MM-dd');
  } else if (currentView.value === 'week') {
    const newDate = direction > 0 ? addWeeks(currentDateObj, 1) : subWeeks(currentDateObj, 1);
    selectedDate.value = format(newDate, 'yyyy-MM-dd');
  } else {
    const newDate = direction > 0 ? addDays(currentDateObj, 1) : subDays(currentDateObj, 1);
    selectedDate.value = format(newDate, 'yyyy-MM-dd');
  }
};

const goToToday = () => {
  selectedDate.value = format(new Date(), 'yyyy-MM-dd');
};

const selectDay = (day: CalendarDay) => {
  selectedDate.value = day.date;
};

const selectEvent = (event: CalendarEvent) => {
  selectedEvent.value = event;
};

const editEvent = (event: CalendarEvent) => {
  // Implement edit functionality
  console.log('Edit event:', event);
  selectedEvent.value = null;
};

const deleteEvent = (event: CalendarEvent) => {
  if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
    events.value = events.value.filter(e => e.id !== event.id);
    selectedEvent.value = null;
  }
};

const onEventCreated = (sessionData: any) => {
  const newEvent: CalendarEvent = {
    id: sessionData.id,
    title: sessionData.title,
    type: sessionData.type,
    date: sessionData.date,
    startTime: sessionData.startTime,
    endTime: calculateEndTime(sessionData.startTime, sessionData.duration),
    location: sessionData.location,
    description: sessionData.objectives,
    attendees: sessionData.attendees || [],
    workIds: sessionData.workIds,
  };
  
  events.value.push(newEvent);
  showCreateEvent.value = false;
};

const calculateEndTime = (startTime: string, duration: number) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + duration;
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  
  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
};

onMounted(() => {
  // Load events from storage or API
});
</script>