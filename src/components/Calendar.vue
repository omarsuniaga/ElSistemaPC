<script setup lang="ts">
import { ref, watchEffect, watch, computed } from 'vue'
import { 
  startOfMonth,
  format,
  isToday,
  isSameMonth,
  parseISO,
  startOfWeek,
  addDays,
  getDate,
  addMonths,
  subMonths
} from 'date-fns'
import { es } from 'date-fns/locale'

const props = defineProps<{
  currentMonth?: Date
  markedDates?: string[]
  selectedDate?: string
}>()

const emit = defineEmits<{
  (e: 'select', date: string): void
  (e: 'day-click', date: any): void
  (e: 'month-change', date: Date): void
}>()

// Estado para el mes actual
const displayedMonth = ref(props.currentMonth || new Date())

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

// Formato del mes y año actual para mostrar en el encabezado
const currentMonthLabel = computed(() => {
  return format(displayedMonth.value, 'MMMM yyyy', { locale: es })
})

// Función para verificar si una fecha está marcada
const isDateMarked = (date) => {
  if (!props.markedDates || props.markedDates.length === 0) return false;
  
  // Normalizar formato de fecha para comparación
  const normalizedDate = typeof date === 'string' 
    ? date 
    : date.date ? date.date : format(date, 'yyyy-MM-dd');
  
  return props.markedDates.some(markedDate => markedDate === normalizedDate);
};

// Función para navegar al mes anterior
const previousMonth = () => {
  displayedMonth.value = subMonths(displayedMonth.value, 1)
  emit('month-change', displayedMonth.value)
}

// Función para navegar al mes siguiente
const nextMonth = () => {
  displayedMonth.value = addMonths(displayedMonth.value, 1)
  emit('month-change', displayedMonth.value)
}

// Función para ir al mes actual
const goToCurrentMonth = () => {
  displayedMonth.value = new Date()
  emit('month-change', displayedMonth.value)
}

const generateCalendar = () => {
  const firstDay = startOfMonth(displayedMonth.value)
  // Comenzar la semana en lunes (1)
  const startDate = startOfWeek(firstDay, { weekStartsOn: 1, locale: es })
  const days = []

  for (let i = 0; i < 42; i++) {
    const date = addDays(startDate, i)
    const dateStr = format(date, 'yyyy-MM-dd')
    
    days.push({
      date: dateStr,
      dayOfMonth: getDate(date),
      isCurrentMonth: isSameMonth(date, displayedMonth.value),
      isToday: isToday(date),
      isMarked: props.markedDates?.includes(dateStr) ?? false,
      dayName: format(date, 'EEEE', { locale: es })
    })
  }

  calendarDays.value = days
}

// Regenerar el calendario cuando cambie el mes mostrado o las fechas marcadas
watchEffect(() => {
  generateCalendar()
})

// Observar cambios en props
watch(() => [props.currentMonth, props.markedDates], ([newMonth, newMarkedDates]) => {
  if (newMonth) {
    displayedMonth.value = newMonth
  }
  generateCalendar();
}, { deep: true });

// Si se proporciona currentMonth como prop, actualizar el mes mostrado
if (props.currentMonth) {
  displayedMonth.value = props.currentMonth
}

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
    <!-- Month navigation header -->
    <div class="flex justify-between items-center mb-4">
      <button 
        @click="previousMonth" 
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
        title="Mes anterior"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <div class="flex items-center">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 capitalize">
          {{ currentMonthLabel }}
        </h3>
        <button 
          @click="goToCurrentMonth" 
          class="ml-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs"
          title="Ir al mes actual"
        >
          Hoy
        </button>
      </div>
      
      <button 
        @click="nextMonth" 
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
        title="Mes siguiente"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
    
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
            'font-bold border-2 border-blue-500 dark:border-blue-400': day.date === props.selectedDate
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