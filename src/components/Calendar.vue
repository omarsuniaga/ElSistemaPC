<script setup lang="ts">
import { ref, watchEffect, watch } from 'vue'
import { 
  startOfMonth,
  format,
  isToday,
  isSameMonth,
  parseISO,
  startOfWeek,
  addDays,
  getDate
} from 'date-fns'
import { es } from 'date-fns/locale'

const props = defineProps<{
  selectedDate: string
  markedDates?: string[]
}>()

const emit = defineEmits<{
  (e: 'select', date: string): void
  (e: 'day-click', date: any): void
}>()

// Estado para los días del calendario
const calendarDays = ref<{
  date: string
  dayOfMonth: number
  isCurrentMonth: boolean
  isToday: boolean
  isMarked: boolean
  dayName: string
}[]>([])

// Nombres de los días de la semana en español
const weekDays = ref(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'])

// Función para verificar si una fecha está marcada
const isDateMarked = (date) => {
  if (!props.markedDates || props.markedDates.length === 0) return false;
  
  // Normalizar formato de fecha para comparación
  const normalizedDate = typeof date === 'string' 
    ? date 
    : date.date ? date.date : format(date, 'yyyy-MM-dd');
  
  return props.markedDates.some(markedDate => markedDate === normalizedDate);
};

const generateCalendar = () => {
  const currentDate = parseISO(props.selectedDate)
  const firstDay = startOfMonth(currentDate)
  // Comenzar la semana en lunes (1)
  const startDate = startOfWeek(firstDay, { weekStartsOn: 1, locale: es })
  const days = []

  for (let i = 0; i < 42; i++) {
    const date = addDays(startDate, i)
    const dateStr = format(date, 'yyyy-MM-dd')
    
    days.push({
      date: dateStr,
      dayOfMonth: getDate(date),
      isCurrentMonth: isSameMonth(date, currentDate),
      isToday: isToday(date),
      isMarked: props.markedDates?.includes(dateStr) ?? false,
      dayName: format(date, 'EEEE', { locale: es })
    })
  }

  calendarDays.value = days
}

// Regenerar el calendario cuando cambie la fecha seleccionada o las fechas marcadas
watchEffect(() => {
  generateCalendar()
})

watch(() => [props.selectedDate, props.markedDates], () => {
  generateCalendar();
}, { deep: true });

// Define interface for calendar day
interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isMarked: boolean;
  dayName: string;
}

// Mejorar el manejador de clic para prevenir múltiples emisiones del mismo evento
const onClick = (day: CalendarDay): void => {
  if (!day || !day.date) {
    return;
  }
  
  // Emitir solo la cadena de fecha
  const dateString: string = typeof day.date === 'string' ? day.date : String(day.date);
  emit('select', dateString);
  
  // Emitir el evento de clic
  emit('day-click', day);
};
</script>

<template>
  <div class="calendar">
    <!-- Weekday headers -->
    <div class="grid grid-cols-7 mb-2">
      <div
        v-for="day in weekDays"
        :key="day"
        class="text-center text-sm font-medium text-gray-500 dark:text-gray-400"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar grid -->
    <div class="grid grid-cols-7 gap-1">
      <button
        v-for="day in calendarDays"
        :key="day.date"
        :class="[
          'p-2 text-center rounded-lg transition-colors relative',
          {
            'text-gray-400 dark:text-gray-600': !day.isCurrentMonth,
            'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-100': day.isToday,
            'hover:bg-gray-100 dark:hover:bg-gray-700': true,
            'font-bold border-2 border-blue-500 dark:border-blue-400': day.date === selectedDate
          }
        ]"
        @click="onClick(day)"
      >
        <span class="block text-sm">{{ day.dayOfMonth }}</span>
        <!-- Indicador de registro para fechas marcadas -->
        <span 
          v-if="day.isMarked" 
          class="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400"
          :title="`Hay registros de asistencia para ${day.date}`"
        ></span>
      </button>
    </div>
  </div>
</template>