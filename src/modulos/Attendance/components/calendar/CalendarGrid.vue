<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
    <!-- Encabezados de días de la semana -->
    <div class="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
      <div
        v-for="day in weekDays"
        :key="day"
        class="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700"
      >
        {{ day }}
      </div>
    </div>

    <!-- Grid de días -->
    <div class="grid grid-cols-7">
      <CalendarDay
        v-for="(day, index) in calendarDays"
        :key="`${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`"
        :date="day.date"
        :is-current-month="day.isCurrentMonth"
        :is-today="day.isToday"
        :is-selected="day.isSelected"
        :has-attendance-records="day.hasAttendanceRecords"
        :teacher-id="teacherId"
        @click="handleDayClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CalendarDay from '../CalendarDay.vue'

interface CalendarDayData {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  hasAttendanceRecords: boolean
}

interface Props {
  calendarDays: CalendarDayData[]
  selectedDate: Date | null
  teacherId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'day-click': [date: Date]
}>()

const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const handleDayClick = (date: Date) => {
  emit('day-click', date)
}
</script>
