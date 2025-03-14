<script setup lang="ts">
import { ref, watchEffect } from 'vue'
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
          'p-2 text-center rounded-lg transition-colors',
          {
            'text-gray-400 dark:text-gray-600': !day.isCurrentMonth,
            'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-100': day.isToday,
            'bg-green-100 dark:bg-green-900/30': day.isMarked,
            'hover:bg-gray-100 dark:hover:bg-gray-700': true
          }
        ]"
        @click="emit('select', day.date)"
      >
        <span class="block text-sm">{{ day.dayOfMonth }}</span>
      </button>
    </div>
  </div>
</template>