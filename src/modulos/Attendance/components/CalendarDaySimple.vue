<template>
  <div 
    class="calendar-day relative min-h-[80px] p-2 cursor-pointer transition-all duration-200"
    :class="dayClasses"
    @click="handleClick"
  >
    <!-- Número del Día -->
    <div class="flex items-center justify-between mb-1">
      <span 
        class="text-sm font-medium"
        :class="dateTextClasses"
      >
        {{ dayNumber }}
      </span>
      
      <!-- Indicador de Hoy -->
      <div 
        v-if="isToday"
        class="w-2 h-2 bg-red-500 rounded-full"
        title="Hoy"
      />
    </div>

    <!-- Indicadores de Actividad -->
    <div class="space-y-1">
      <!-- Clases Programadas -->
      <div v-if="classesCount > 0" class="flex items-center justify-between">
        <div class="flex space-x-1">
          <div 
            v-for="n in Math.min(classesCount, 3)"
            :key="n"
            class="w-2 h-2 rounded-full bg-blue-500"
            :title="`Clase ${n}`"
          />
          <span 
            v-if="classesCount > 3"
            class="text-xs text-gray-500 dark:text-gray-400"
          >
            +{{ classesCount - 3 }}
          </span>
        </div>
        
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {{ classesCount }}
        </span>
      </div>

      <!-- Estado de Asistencias -->
      <div v-if="hasAttendanceRecords && !isFutureDate" class="text-xs">
        <div class="text-blue-600 dark:text-blue-400">
          Registros disponibles
        </div>
      </div>
    </div>

    <!-- Overlay de Selección -->
    <div 
      v-if="isSelected"
      class="absolute inset-0 border-2 border-blue-500 rounded-md pointer-events-none"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface IProps {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  hasAttendanceRecords?: boolean
  classesCount?: number
}

const props = withDefaults(defineProps<IProps>(), {
  hasAttendanceRecords: false,
  classesCount: 0
})

const emit = defineEmits<{
  'click': [date: Date]
}>()

// Computed properties
const dayNumber = computed(() => props.date.getDate())

const isFutureDate = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return props.date > today
})

const isInteractive = computed(() => {
  return (props.hasAttendanceRecords || props.isToday) && !isFutureDate.value
})

const dayClasses = computed(() => {
  const classes = []
  
  if (isInteractive.value) {
    classes.push('hover:bg-gray-50 dark:hover:bg-gray-700')
  }
  
  if (!props.isCurrentMonth) {
    classes.push('text-gray-400 dark:text-gray-600')
  }
  
  if (props.isSelected) {
    classes.push('bg-blue-100 dark:bg-blue-900')
  }
  
  if (props.isToday) {
    classes.push('bg-red-50 dark:bg-red-900')
  }
  
  if (isFutureDate.value) {
    classes.push('opacity-75 cursor-default')
  } else {
    classes.push('cursor-pointer')
  }
  
  if (props.hasAttendanceRecords && props.classesCount > 0) {
    classes.push('border-l-4 border-blue-500')
  }
  
  return classes.join(' ')
})

const dateTextClasses = computed(() => {
  const classes = []
  
  if (props.isToday) {
    classes.push('text-red-600 dark:text-red-400 font-bold')
  } else if (!props.isCurrentMonth) {
    classes.push('text-gray-400 dark:text-gray-600')
  } else {
    classes.push('text-gray-900 dark:text-white')
  }
  
  return classes.join(' ')
})

const handleClick = () => {
  if (!isInteractive.value) {
    return
  }
  
  emit('click', props.date)
}
</script>

<style scoped>
.calendar-day {
  border-right: 1px solid rgb(229, 231, 235);
  border-bottom: 1px solid rgb(229, 231, 235);
}

.dark .calendar-day {
  border-right-color: rgb(75, 85, 99);
  border-bottom-color: rgb(75, 85, 99);
}

.transition-all {
  transition: all 0.2s ease-in-out;
}

.hover\:bg-gray-50:hover {
  background-color: rgb(249, 250, 251);
}

.dark .hover\:bg-gray-700:hover {
  background-color: rgb(55, 65, 81);
}
</style>
