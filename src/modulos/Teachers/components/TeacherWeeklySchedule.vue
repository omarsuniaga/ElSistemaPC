<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
  classes: {
    type: Array,
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
  { id: 6, name: 'Sábado' }
];

// Formatea la hora para mostrarla (9 -> "09:00")
const formatHour = (hour) => {
  return `${hour.toString().padStart(2, '0')}:00`;
};

// Obtiene el color de fondo según la clase
const getClassColor = (classId) => {
  // Lista de colores para las clases
  const colors = [
    'bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
    'bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-200',
    'bg-purple-200 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200',
    'bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200',
    'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200',
    'bg-pink-200 dark:bg-pink-900/50 text-pink-800 dark:text-pink-200',
    'bg-indigo-200 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200',
  ];
  
  if (!classId) return colors[0]; // Color por defecto si no hay ID
  
  // Asignar color según el ID de la clase (de forma pseudoaleatoria pero consistente)
  const stringId = String(classId);
  const index = stringId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

// Parse para horario en formato string (ej: "15:30")
const parseTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return { hour: 8, minutes: 0 }; // Valor por defecto
  
  try {
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      return {
        hour: parseInt(parts[0], 10) || 8,
        minutes: parseInt(parts[1], 10) || 0
      };
    }
    return { hour: parseInt(timeStr, 10) || 8, minutes: 0 };
  } catch (error) {
    console.warn(`[TeacherWeeklySchedule] Error al parsear hora: ${timeStr}`, error);
    return { hour: 8, minutes: 0 };
  }
};

// Parse para día de la semana (acepta número, string, nombre del día)
const parseDay = (day) => {
  if (day === undefined || day === null) return 1; // Default: Lunes
  
  // Si ya es un número entre 0-6, lo devolvemos
  if (typeof day === 'number' && day >= 0 && day <= 6) {
    return day;
  }
  
  // Si es string, intentamos convertirlo
  if (typeof day === 'string') {
    // Intenta convertir a número primero
    const dayNum = parseInt(day, 10);
    if (!isNaN(dayNum) && dayNum >= 0 && dayNum <= 6) {
      return dayNum;
    }
    
    // Si es nombre de día, buscar su índice
    const dayLower = day.toLowerCase();
    const dayMap = {
      'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3, 
      'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6,
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 
      'thursday': 4, 'friday': 5, 'saturday': 6,
      'dom': 0, 'lun': 1, 'mar': 2, 'mié': 3, 'mie': 3, 
      'jue': 4, 'vie': 5, 'sáb': 6, 'sab': 6,
      'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6
    };
    
    if (dayMap[dayLower] !== undefined) {
      return dayMap[dayLower];
    }
  }
  
  // Si no se pudo determinar, devolver Lunes
  return 1;
};

// Procesa una clase y extrae sus slots de horario
const processClassSchedule = (classItem) => {
  if (!classItem) return [];
  
  try {
    // 1. Estructura esperada con schedule.slots
    if (classItem.schedule && Array.isArray(classItem.schedule.slots)) {
      return classItem.schedule.slots.map(slot => {
        if (!slot) return null;
        
        // Validar estructura básica
        const day = parseDay(slot.day);
        const startTime = parseTime(slot.startTime);
        const endTime = parseTime(slot.endTime);
        
        return {
          day,
          startTime: startTime.hour,
          endTime: endTime.hour,
          startTimeStr: `${startTime.hour}:${String(startTime.minutes).padStart(2, '0')}`,
          endTimeStr: `${endTime.hour}:${String(endTime.minutes).padStart(2, '0')}`,
          valid: true
        };
      }).filter(slot => slot && slot.valid);
    }
    
    // 2. Estructura alternativa con days + startTime + endTime
    if (classItem.schedule && classItem.schedule.days) {
      const days = Array.isArray(classItem.schedule.days) 
        ? classItem.schedule.days 
        : [classItem.schedule.days];
      
      const startTime = parseTime(classItem.schedule.startTime);
      const endTime = parseTime(classItem.schedule.endTime);
      
      return days.map(day => {
        const parsedDay = parseDay(day);
        return {
          day: parsedDay,
          startTime: startTime.hour,
          endTime: endTime.hour,
          startTimeStr: `${startTime.hour}:${String(startTime.minutes).padStart(2, '0')}`,
          endTimeStr: `${endTime.hour}:${String(endTime.minutes).padStart(2, '0')}`,
          valid: true
        };
      });
    }
    
    // 3. Horario como string (ej: "Lunes 15:30 - 17:30")
    if (typeof classItem.schedule === 'string') {
      const parts = classItem.schedule.split(' ');
      if (parts.length >= 3) {
        const dayPart = parts[0];
        const startPart = parts[1];
        const endPart = parts.length > 3 ? parts[3] : ""; // Asumiendo formato "Día HH:MM - HH:MM"
        
        const day = parseDay(dayPart);
        const startTime = parseTime(startPart);
        const endTime = parseTime(endPart);
        
        return [{
          day,
          startTime: startTime.hour,
          endTime: endTime.hour,
          startTimeStr: `${startTime.hour}:${String(startTime.minutes).padStart(2, '0')}`,
          endTimeStr: `${endTime.hour}:${String(endTime.minutes).padStart(2, '0')}`,
          valid: true
        }];
      }
    }
    
    // 4. Caso de formato desconocido o sin horario
    return [];
  } catch (error) {
    console.error('[TeacherWeeklySchedule] Error procesando horario de clase:', error);
    console.log('Clase con error:', classItem);
    return [];
  }
};

// Organiza las clases por día y hora
const classesSchedule = computed(() => {
  const schedule = {};
  
  // Inicializar estructura
  days.forEach(day => {
    schedule[day.id] = {};
    timeSlots.forEach(hour => {
      schedule[day.id][hour] = [];
    });
  });
  
  // Procesar cada clase
  props.classes.forEach(classItem => {
    try {
      if (!classItem) return;
      
      const slots = processClassSchedule(classItem);
      
      slots.forEach(slot => {
        if (!slot || typeof slot.day !== 'number' || typeof slot.startTime !== 'number') {
          return;
        }
        
        const { day, startTime, endTime, startTimeStr, endTimeStr } = slot;
        
        // Verificar que el día y hora están dentro de los rangos aceptados
        if (day < 0 || day > 6 || !schedule[day]) {
          console.warn('[TeacherWeeklySchedule] Día inválido:', day);
          return;
        }
        
        if (startTime < timeSlots[0] || startTime >= timeSlots[timeSlots.length - 1]) {
          console.warn('[TeacherWeeklySchedule] Hora de inicio fuera de rango:', startTime);
          return;
        }
        
        const duration = Math.max(1, endTime - startTime);
        
        schedule[day][startTime].push({
          ...classItem,
          duration,
          startTime: startTimeStr,
          endTime: endTimeStr
        });
      });
    } catch (error) {
      console.error('[TeacherWeeklySchedule] Error procesando clase:', error);
      console.log('Clase con error:', classItem);
    }
  });
  
  return schedule;
});

// Maneja el clic en una clase
const handleClassClick = (classId) => {
  emit('view-class', classId);
};

// Debugging y diagnóstico
onMounted(() => {
  if (props.classes.length > 0) {
    console.log(`[TeacherWeeklySchedule] Procesando ${props.classes.length} clases`);
    
    // Mostrar la primera clase como ejemplo
    if (props.classes[0]) {
      const sampleClass = props.classes[0];
      console.log('[TeacherWeeklySchedule] Ejemplo de clase:', {
        id: sampleClass.id,
        name: sampleClass.name,
        schedule: sampleClass.schedule
      });
      
      const slots = processClassSchedule(sampleClass);
      console.log('[TeacherWeeklySchedule] Slots procesados:', slots);
    }
  } else {
    console.log('[TeacherWeeklySchedule] No hay clases para mostrar');
  }
});

// Observar cambios en las clases
watch(() => props.classes, (newClasses) => {
  console.log(`[TeacherWeeklySchedule] Clases actualizadas: ${newClasses.length}`);
}, { deep: true });
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
    <!-- Mensaje si no hay clases -->
    <div v-if="!props.classes || props.classes.length === 0" class="p-6 text-center text-gray-500">
      No hay clases programadas. Para añadir una nueva clase, haz clic en el botón "Nueva Clase".
    </div>
    
    <div v-else class="min-w-[800px]">
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
            v-for="(classItem, index) in classesSchedule[day.id][hour]" 
            :key="`${day.id}-${hour}-${classItem.id || index}`"
            :class="[
              getClassColor(classItem.id),
              'absolute inset-x-1 rounded-md p-2 overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow'
            ]"
            :style="`height: calc(${classItem.duration} * 60px - 8px);`"
            @click="handleClassClick(classItem.id)"
          >
            <div class="font-medium text-sm truncate">{{ classItem.name || 'Sin nombre' }}</div>
            <div class="text-xs truncate">{{ classItem.startTime || '' }} - {{ classItem.endTime || '' }}</div>
            <div class="text-xs truncate">{{ classItem.classroom || 'Sin aula' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
