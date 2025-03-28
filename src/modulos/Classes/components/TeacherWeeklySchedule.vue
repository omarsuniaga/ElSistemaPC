<script setup lang="ts">
import { ref, computed } from 'vue';

interface ClassSlot {
  day: number | string;
  startTime: string;
  endTime: string;
}

interface ClassSchedule {
  slots: ClassSlot[];
}

interface ClassItem {
  id: string;
  name: string;
  classroom?: string;
  schedule: ClassSchedule;
  duration?: number;
  startTime?: string;
  endTime?: string;
}

interface ScheduleMap {
  [day: number]: {
    [hour: number]: ClassItem[];
  };
}

const props = defineProps({
  classes: {
    type: Array as () => ClassItem[],
    required: true,
    default: () => []
  }
});

const emit = defineEmits(['view-class']);

// Horario académico: de 8am a 8pm
const timeSlots = Array.from({ length: 13 }, (_, i) => i + 8);
const days = [
  { id: 0, name: 'Domingo' },
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
// Organiza las clases por día y hora
const classesSchedule = computed(() => {
  const schedule: ScheduleMap = {};
  
  days.forEach(day => {
    schedule[day.id] = {};
    timeSlots.forEach(hour => {
      schedule[day.id][hour] = [];
    });
  });
  // Lista de colores para las clases
  const colors = [
    'bg-blue-200 dark:bg-blue-900',
    'bg-green-200 dark:bg-green-900',
    'bg-purple-200 dark:bg-purple-900',
    'bg-yellow-200 dark:bg-yellow-900',
    'bg-red-200 dark:bg-red-900',
    'bg-pink-200 dark:bg-pink-900',
    'bg-indigo-200 dark:bg-indigo-900',
  ];
  
  // Asignar color según el ID de la clase (de forma pseudoaleatoria pero consistente)
  const index = classId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

// Organiza las clases por día y hora
const classesSchedule = computed(() => {
  const schedule = {};
  
  days.forEach(day => {
    schedule[day.id] = {};
    timeSlots.forEach(hour => {
      schedule[day.id][hour] = [];
    });
  });
  
  if (!props.classes || !Array.isArray(props.classes)) {
    console.warn('[TeacherWeeklySchedule] No se recibieron clases válidas:', props.classes);
    return schedule;
  }

  props.classes.forEach(classItem => {
    if (!classItem || !classItem.schedule || !Array.isArray(classItem.schedule.slots)) {
      console.log('[TeacherWeeklySchedule] Clase sin horarios válidos:', classItem);
      return;
    }
    
    classItem.schedule.slots.forEach(slot => {
      if (!slot || typeof slot.day === 'undefined' || !slot.startTime || !slot.endTime) {
        console.log('[TeacherWeeklySchedule] Slot de horario inválido:', slot);
        return;
      }

      try {
        // Convertir day a número entero con seguridad
        const day = typeof slot.day === 'string' ? parseInt(slot.day, 10) : Number(slot.day);
        
        // Validar que el día esté dentro del rango válido (0-6)
        if (isNaN(day) || day < 0 || day > 6 || !schedule[day]) {
          console.log(`[TeacherWeeklySchedule] Día inválido (${slot.day}):`, slot);
          return;
        }

        // Extraer la hora de inicio con manejo de errores
        const startTimeParts = String(slot.startTime).split(':');
        if (!startTimeParts || startTimeParts.length < 1) {
          console.log(`[TeacherWeeklySchedule] Formato de hora de inicio inválido (${slot.startTime}):`, slot);
          return;
        }
        const startHour = parseInt(startTimeParts[0], 10);
        
        // Extraer la hora de fin con manejo de errores
        const endTimeParts = String(slot.endTime).split(':');
        if (!endTimeParts || endTimeParts.length < 1) {
          console.log(`[TeacherWeeklySchedule] Formato de hora de fin inválido (${slot.endTime}):`, slot);
          return;
        }
        const endHour = parseInt(endTimeParts[0], 10);
        
        // Validar que las horas sean números válidos
        if (isNaN(startHour) || isNaN(endHour)) {
          console.log(`[TeacherWeeklySchedule] Horas inválidas (${slot.startTime}-${slot.endTime}):`, slot);
          return;
        }
        
        // Solo agregamos la clase si está dentro del horario mostrado
        if (startHour >= timeSlots[0] && startHour < timeSlots[timeSlots.length - 1]) {
          const duration = endHour - startHour;
          
          // Verificar que el día y la hora existen en la estructura schedule
          if (schedule[day] && schedule[day][startHour]) {
            schedule[day][startHour].push({
              ...classItem,
              duration: duration > 0 ? duration : 1, // Asegurar duración mínima de 1 hora
              startTime: slot.startTime,
              endTime: slot.endTime
            });
          }
        }
      } catch (error) {
        console.error('[TeacherWeeklySchedule] Error al procesar slot:', slot, error);
      }
    });
  });
  
  return schedule;
});

// Maneja el clic en una clase
const handleClassClick = (classId) => {
  emit('view-class', classId);
};
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
    <div class="min-w-[800px]">
      <!-- Cabecera con los días -->
      <div class="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
        <div class="p-3 font-medium text-gray-500 dark:text-gray-400 text-center">Hora</div>
        <div 
          v-for="day in days" 
          :key="day.id" 
          class="p-3 font-medium text-gray-700 dark:text-gray-300 text-center"
        >
          {{ day.name }}
        </div>
      </div>

      <!-- Filas de horario -->
      <div v-for="hour in timeSlots" :key="hour" class="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
        <!-- Columna de la hora -->
        <div class="p-2 text-center text-sm text-gray-600 dark:text-gray-400 font-medium">
          {{ formatHour(hour) }}
        </div>

        <!-- Columnas de los días -->
        <div 
          v-for="day in days" 
          :key="`${hour}-${day.id}`" 
          class="p-1 border-l border-gray-200 dark:border-gray-700 min-h-[60px] relative"
        >
          <!-- Clases en este horario -->
          <div 
            v-for="classItem in classesSchedule[day.id][hour]" 
            :key="`${day.id}-${hour}-${classItem.id}`"
            :class="[
              getClassColor(classItem.id),
              'absolute inset-x-1 rounded-md p-2 overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow'
            ]"
            :style="`height: calc(${classItem.duration} * 60px - 8px);`"
            @click="handleClassClick(classItem.id)"
          >
            <div class="font-medium text-sm truncate">{{ classItem.name }}</div>
            <div class="text-xs truncate">{{ classItem.startTime }} - {{ classItem.endTime }}</div>
            <div class="text-xs truncate">{{ classItem.classroom || 'Sin aula' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
