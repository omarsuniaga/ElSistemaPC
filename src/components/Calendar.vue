<script setup lang="ts">
import { ref, watchEffect, watch, computed } from 'vue'
import { 
  startOfMonth,
  format,
  isToday,
  isSameMonth,
  startOfWeek,
  addDays,
  getDate,
  addMonths,
  subMonths
} from 'date-fns'
import { es } from 'date-fns/locale'

// Interfaz para la estructura de una fecha marcada
interface MarkedDateInfo {
  date: string; // Formato 'yyyy-MM-dd'
  userId: number | string; // ID del usuario que registró la actividad
  // Se pueden añadir más campos si es necesario: activityType, description, etc.
}

// Interfaz para la información del usuario actual
interface UserInfo {
  id: number | string;
  role: string; // 'Admin', 'Director', 'Teacher' u otros roles del sistema
}

// Props: se reciben la fecha actual, las fechas marcadas (pueden ser strings o MarkedDateInfo),
// la fecha seleccionada, y la información del usuario actual
const props = defineProps<{
  currentMonth?: Date,
  markedDates?: (string | MarkedDateInfo)[],
  selectedDate?: string,
  currentUser?: UserInfo,
  highlightedDates?: string[] // Mantenemos compatibilidad con otras props existentes
}>()

const emit = defineEmits<{
  (e: 'select', date: string): void,
  (e: 'day-click', date: any): void,
  (e: 'month-change', date: Date): void
}>()

// Estado del mes mostrado (si no se pasa, se usa el actual)
const displayedMonth = ref(props.currentMonth || new Date())

// Array para almacenar la información de cada día del calendario
const calendarDays = ref<{
  date: string,
  dayOfMonth: number,
  isCurrentMonth: boolean,
  isToday: boolean,
  isMarked: boolean,
  dayName: string
}[]>([])

// Nombres de los días de la semana en español
const weekDays = ref(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'])

// Etiqueta del mes actual (por ejemplo, "abril 2025")
const currentMonthLabel = computed(() => {
  return format(displayedMonth.value, 'MMMM yyyy', { locale: es })
})

// Función que determina si una fecha está marcada según el rol del usuario
const isDateMarked = (dateStr: string): boolean => {
  // Si no hay fechas marcadas, no se marca nada
  if (!props.markedDates || props.markedDates.length === 0) return false;

  // Primero verificamos el formato de markedDates para hacer el componente compatible con ambas versiones
  // Si el primer elemento es una cadena, asumimos que es el formato antiguo (array de strings)
  const isLegacyFormat = typeof props.markedDates[0] === 'string';

  // Caso 1: Formato antiguo (array de strings)
  if (isLegacyFormat) {
    return (props.markedDates as string[]).includes(dateStr);
  }
  
  // Caso 2: Nuevo formato (array de objetos) con filtrado basado en rol
  // Si no hay usuario actual, mostramos todas las fechas marcadas
  if (!props.currentUser) {
    return (props.markedDates as MarkedDateInfo[]).some(item => item.date === dateStr);
  }

  // Verifica si el usuario tiene rol de administrador o director
  const isAdminOrDirector = ['Admin', 'Director', 'Administrador'].includes(props.currentUser.role);
  
  // Filtra las fechas según el rol:
  return (props.markedDates as MarkedDateInfo[]).some(markedDate => {
    // Si la fecha no coincide, retorna falso directamente
    if (markedDate.date !== dateStr) {
      return false;
    }
    
    // Si es admin o director, muestra todas las fechas marcadas
    if (isAdminOrDirector) {
      return true;
    }
    
    // Si es maestro u otro rol, solo muestra sus propias fechas marcadas
    return markedDate.userId === props.currentUser.id;
  });
}

// Interfaz para los días del calendario
interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isMarked: boolean;
  dayName: string;
}


type DayClickEvent = CalendarDay;
// Función para generar la grilla del calendario (42 días para cubrir 6 semanas)
const generateCalendar = () => {
  const firstDayOfMonth = startOfMonth(displayedMonth.value)
  // Empezamos la semana en lunes (weekStartsOn: 1)
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 })
  const days: CalendarDay[] = []

  for (let i = 0; i < 42; i++) {
    const date = addDays(startDate, i)
    const dateStr = format(date, 'yyyy-MM-dd')
    days.push({
      date: dateStr,
      dayOfMonth: getDate(date),
      isCurrentMonth: isSameMonth(date, displayedMonth.value),
      isToday: isToday(date),
      isMarked: isDateMarked(dateStr), // Ahora usa la lógica de filtrado por usuario
      dayName: format(date, 'EEEE', { locale: es })
    })
  }
  calendarDays.value = days
}

// Funciones para navegar entre meses
const previousMonth = () => {
  displayedMonth.value = subMonths(displayedMonth.value, 1)
  emit('month-change', displayedMonth.value)
}
const nextMonth = () => {
  displayedMonth.value = addMonths(displayedMonth.value, 1)
  emit('month-change', displayedMonth.value)
}
const goToCurrentMonth = () => {
  displayedMonth.value = new Date()
  emit('month-change', displayedMonth.value)
}

// Función de manejo de clic en un día del calendario
const onClick = (day: { date: string; dayOfMonth: number; isCurrentMonth: boolean; isToday: boolean; isMarked: boolean; dayName: string; }): void => {
  if (!day || !day.date) return
  emit('select', day.date)
  emit('day-click', day)
}

// Generar el calendario cada vez que cambie el mes o las fechas marcadas
watchEffect(() => {
  generateCalendar()
})
watch(() => [props.currentMonth, props.markedDates], ([newMonth]) => {
  if (newMonth instanceof Date) displayedMonth.value = newMonth
  generateCalendar()
}, { deep: true })

// Si se pasa currentMonth como prop, usarlo para el mes mostrado
if (props.currentMonth) {
  displayedMonth.value = props.currentMonth
}

console.log('Calendar.vue > markedDates:', props.markedDates);
</script>

<template>
  <div class="calendar">
    <!-- Encabezado de navegación del mes -->
    <div class="flex justify-between items-center mb-4">
      <button @click="previousMonth" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="Mes anterior">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div class="flex items-center">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 capitalize">
          {{ currentMonthLabel }}
        </h3>
        <button @click="goToCurrentMonth" class="ml-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs" title="Ir al mes actual">
          Hoy
        </button>
      </div>
      <button @click="nextMonth" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="Mes siguiente">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Cabecera de los días de la semana -->
    <div class="grid grid-cols-7 mb-2">
      <div v-for="day in weekDays" :key="day" class="text-center text-sm font-medium text-gray-500 dark:text-gray-400">
        {{ day }}
      </div>
    </div>

    <!-- Grilla del calendario -->
    <div class="grid grid-cols-7 gap-1">
      <button v-for="day in calendarDays" :key="day.date" 
        :class="[
          'p-2 text-center rounded-lg transition-colors relative',
          {
            marked: day.isMarked,
            'text-gray-400 dark:text-gray-600': !day.isCurrentMonth,
            'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-100': day.isToday,
            'hover:bg-gray-100 dark:hover:bg-gray-700': true,
            'font-bold border-2 border-blue-500 dark:border-blue-400': day.date === props.selectedDate
          }
        ]" @click="onClick(day)">
        <span class="block text-sm">{{ day.dayOfMonth }}</span>
        <!-- Indicador para fechas con asistencia -->
        <div v-if="day.isMarked" class="date-markers">
          <!-- Punto indicador -->
          <span 
            class="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400"
            :title="`Hay registros de asistencia para ${day.date}`">
          </span>
          <!-- Texto "Marked" -->
          <span class="marked-text">Marked</span>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.date-markers {
  position: relative;
}

.marked-text {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.55rem;
  padding: 1px 2px;
  background-color: #4CAF50;
  color: white;
  border-radius: 3px;
  white-space: nowrap;
  opacity: 0.9;
  font-weight: bold;
}

.marked {
  position: relative;
}
</style>
