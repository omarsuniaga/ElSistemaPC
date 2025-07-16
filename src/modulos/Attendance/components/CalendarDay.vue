<!--
  📅 DÍA DEL CALENDARIO - COMPONENTE ATÓMICO
  Representa un día individual en el calendario
-->
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
      <div v-if="classesInfo.scheduled > 0" class="flex items-center justify-between">
        <div class="flex space-x-1">
          <div 
            v-for="n in Math.min(classesInfo.scheduled, 3)"
            :key="n"
            class="w-2 h-2 rounded-full"
            :class="getClassIndicatorColor(n)"
            :title="`Clase ${n}`"
          />
          <span 
            v-if="classesInfo.scheduled > 3"
            class="text-xs text-gray-500 dark:text-gray-400"
          >
            +{{ classesInfo.scheduled - 3 }}
          </span>
        </div>
        
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {{ classesInfo.scheduled }}
        </span>
      </div>

      <!-- Estado de Asistencias -->
      <div v-if="attendanceInfo.total > 0 && !isFutureDate" class="text-xs">
        <div 
          v-if="attendanceInfo.completed === attendanceInfo.total"
          class="text-green-600 dark:text-green-400 flex items-center"
        >
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          Completas
        </div>
        
        <div 
          v-else-if="attendanceInfo.completed > 0"
          class="text-yellow-600 dark:text-yellow-400"
        >
          {{ attendanceInfo.completed }}/{{ attendanceInfo.total }}
        </div>
        
        <div 
          v-else
          class="text-yellow-600 dark:text-yellow-400"
        >
          {{ attendanceInfo.pending }} pendientes
        </div>
      </div>
    </div>

    <!-- Overlay de Selección -->
    <div 
      v-if="isSelected"
      class="absolute inset-0 border-2 border-blue-500 rounded-md pointer-events-none"
    />

    <!-- Loading State -->
    <div 
      v-if="loading"
      class="absolute inset-0 bg-white bg-opacity-75 dark:bg-gray-800 dark:bg-opacity-75 flex items-center justify-center rounded-md"
    >
      <div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { format } from 'date-fns';
import { CalendarService } from '../services/CalendarService';

// Props
interface Props {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  teacherId?: string
  // Nueva prop para indicar si el día tiene registros de asistencia
  hasAttendanceRecords?: boolean
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'click': [date: Date]
}>();

// Composables - Funciones simplificadas
const validateClassForDay = (classItem: any, dayOfWeek: number) => {
  if (!classItem?.name) return false;
  
  // Ensayo General solo martes (2), jueves (4), sábado (6)
  if (classItem.name === 'Ensayo General') {
    return [2, 4, 6].includes(dayOfWeek);
  }
  
  return true;
};

const debugClass = (classItem: any, date: string) => {
  const dayOfWeek = new Date(date).getDay();
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  
  console.log(`[DEBUG] Clase: ${classItem.name}`);
  console.log(`[DEBUG] Fecha: ${date} (${dayNames[dayOfWeek]})`);
  console.log(`[DEBUG] Día de la semana: ${dayOfWeek}`);
  console.log(`[DEBUG] ¿Debe aparecer?: ${validateClassForDay(classItem, dayOfWeek)}`);
};

// Estado
const loading = ref(false);
const classesInfo = ref({
  scheduled: 0,
  total: 0,
});
const attendanceInfo = ref({
  total: 0,
  completed: 0,
  pending: 0,
});

// Computed
const dayNumber = computed(() => props.date.getDate());

const dateString = computed(() => format(props.date, 'yyyy-MM-dd'));

const dayClasses = computed(() => {
  const classes = [];
  
  // Aplicar hover solo a fechas interactivas
  if (isInteractive.value) {
    classes.push('hover:bg-gray-50 dark:hover:bg-gray-700');
  }
  
  // Estado del mes
  if (!props.isCurrentMonth) {
    classes.push('text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-900');
  } else {
    classes.push('bg-white dark:bg-gray-800');
  }
  
  // Estado de selección (solo permitido si es interactivo)
  if (props.isSelected && isInteractive.value) {
    classes.push('bg-blue-50 dark:bg-blue-900/20');
  }
  
  // Estado de hoy
  if (props.isToday) {
    classes.push('ring-2 ring-red-500 ring-opacity-50');
  }
  
  // Fechas futuras (deshabilitadas)
  if (isFutureDate.value) {
    classes.push('opacity-50 cursor-not-allowed');
  } 
  // Fechas sin registros de asistencia (excepto hoy)
  else if (!props.hasAttendanceRecords && !props.isToday) {
    classes.push('opacity-75 cursor-default');
  } 
  // Fechas interactivas
  else {
    classes.push('cursor-pointer');
  }
  
  // Estado de actividad (solo mostrar indicador si tiene registros)
  if (props.hasAttendanceRecords && classesInfo.value.scheduled > 0) {
    if (attendanceInfo.value.completed === attendanceInfo.value.total) {
      classes.push('border-l-4 border-green-500');
    } else if (attendanceInfo.value.completed > 0) {
      classes.push('border-l-4 border-yellow-500');
    } else {
      classes.push('border-l-4 border-blue-500');
    }
  }
  
  return classes.join(' ');
});

const dateTextClasses = computed(() => {
  const classes = [];
  
  if (props.isToday) {
    classes.push('text-red-600 dark:text-red-400 font-bold');
  } else if (!props.isCurrentMonth) {
    classes.push('text-gray-400 dark:text-gray-600');
  } else {
    classes.push('text-gray-900 dark:text-white');
  }
  
  return classes.join(' ');
});

// Methods
const getClassIndicatorColor = (index: number): string => {
  const colors = [
    'bg-blue-500',   // Primera clase
    'bg-green-500',  // Segunda clase
    'bg-purple-500', // Tercera clase
  ];
  
  return colors[index - 1] || 'bg-gray-500';
};

const loadDayInfo = async () => {
  if (!props.teacherId || !props.isCurrentMonth) {
    return;
  }
  
  try {
    loading.value = true;
    
    // Simular carga de información del día
    // TODO: Implementar carga real de clases y asistencias
    
    console.log(`[CalendarDay] Loading info for ${dateString.value}`);
    
    // Simular datos para demo
    const dayOfWeek = props.date.getDay();
    const hasClasses = [1, 2, 4, 6].includes(dayOfWeek); // Lun, Mar, Jue, Sáb
    
    if (hasClasses) {
      classesInfo.value = {
        scheduled: Math.floor(Math.random() * 3) + 1,
        total: Math.floor(Math.random() * 3) + 1,
      };
      
      attendanceInfo.value = {
        total: classesInfo.value.scheduled,
        completed: Math.floor(Math.random() * classesInfo.value.scheduled),
        pending: 0,
      };
      
      attendanceInfo.value.pending = attendanceInfo.value.total - attendanceInfo.value.completed;
    } else {
      classesInfo.value = { scheduled: 0, total: 0 };
      attendanceInfo.value = { total: 0, completed: 0, pending: 0 };
    }
    
  } catch (error) {
    console.error('[CalendarDay] Error loading day info:', error);
  } finally {
    loading.value = false;
  }
};

// Verificar si la fecha es futura comparando con la fecha actual
const isFutureDate = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalizar a medianoche
  return props.date > today;
});

// Verificar si el día es interactuable (no es futuro y tiene registros o es hoy)
const isInteractive = computed(() => {
  // Si tiene registros de asistencia o es hoy
  return (props.hasAttendanceRecords || props.isToday) && !isFutureDate.value;
});

const handleClick = () => {
  // Sólo permitir interacción si no es fecha futura y tiene registros o es hoy
  if (!isInteractive.value) {
    console.log(`[CalendarDay] Día no interactuable: ${dateString.value}`, {
      isFuture: isFutureDate.value,
      hasAttendanceRecords: props.hasAttendanceRecords,
      isToday: props.isToday
    });
    return;
  }
  
  console.log(`[CalendarDay] Clicked: ${dateString.value}`);
  emit('click', props.date);
};

// Watchers
watch(
  [() => props.teacherId, () => props.isCurrentMonth, dateString],
  () => {
    loadDayInfo();
  },
  { immediate: true },
);
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

/* Animaciones */
.transition-all {
  transition: all 0.2s ease-in-out;
}

/* Hover effects */
.hover\\:bg-gray-50:hover {
  background-color: rgb(249, 250, 251);
}

.dark .hover\\:bg-gray-700:hover {
  background-color: rgb(55, 65, 81