<template>
  <div class="teacher-weekly-schedule container mx-auto px-4 py-6 md:py-8">
    <div class="space-y-8">
      <template v-for="day in weekDays" :key="day">
        <div>
          <!-- Usar computed property para obtener clases por día -->
          <div v-if="getClassesForDay(day).length > 0" class="day-section">
            <div class="mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">{{ day }}</h3>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              <div
                v-for="class_ in getClassesForDay(day)"
                :key="class_.id"
                class="class-item bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-1 cursor-pointer overflow-hidden flex flex-col"
                @click="selectClass(class_)"
              >
                <div class="p-4 flex-grow">
                  <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 truncate" :title="class_.name">
                    {{ class_.name }}
                  </h4>

                  <div class="class-details space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div class="flex items-center">
                      <ClockIcon class="h-5 w-5 mr-2 text-blue-500 flex-shrink-0" />
                      <span>{{ formatScheduleTime(getScheduleForDay(class_, day)) }}</span>
                    </div>

                    <div v-if="getScheduleForDay(class_, day)?.startTime && getScheduleForDay(class_, day)?.endTime" class="flex items-center">
                      <ClockIcon class="h-5 w-5 mr-2 text-purple-500 flex-shrink-0" />
                      <span>{{ formatClassDuration(getScheduleForDay(class_, day)?.startTime || '', getScheduleForDay(class_, day)?.endTime || '') }}</span>
                    </div>

                    <div v-if="class_.classroom" class="flex items-center">
                      <MapPinIcon class="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                      <span>{{ class_.classroom }}</span>
                    </div>

                    <div v-if="class_.instrument" class="flex items-center">
                      <MusicalNoteIcon class="h-5 w-5 mr-2 text-orange-500 flex-shrink-0" />
                      <span>{{ class_.instrument }}</span>
                    </div>
                  </div>
                </div>

                <div class="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2">
                  <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <UserGroupIcon class="h-5 w-5 mr-2 flex-shrink-0" />
                    <span>{{ class_.studentIds?.length || 0 }} {{ class_.studentIds?.length === 1 ? 'estudiante' : 'estudiantes' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-day text-center py-6 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <p class="text-gray-500 dark:text-gray-400 italic">No hay clases programadas para {{ day }}.</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useClassesStore } from '../../../modulos/Classes/store/classes' // Ruta corregida
import {
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  MusicalNoteIcon
} from '@heroicons/vue/24/outline'

// Interfaces
interface ScheduleSlot {
  day: string | number;
  startTime: string;
  endTime: string;
}

interface ClassData {
  id: string;
  name: string;
  description?: string;
  level?: string;
  instrument?: string;
  teacherId?: string;
  studentIds?: string[];
  schedule?: {
    slots: ScheduleSlot[];
  };
  classroom?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Props
const props = defineProps<{
  teacherId: string;
  classes: ClassData[];
}>()

// Emits
const emit = defineEmits(['view-class'])

// Store
const classesStore = useClassesStore()

// State
const selectedClass = ref<ClassData | null>(null)

// Días de la semana con mapeo numérico
const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const dayToNumber = {
  'Lunes': 1,
  'Martes': 2,
  'Miércoles': 3,
  'Jueves': 4,
  'Viernes': 5,
  'Sábado': 6,
  'Domingo': 0
}

// Obtener clases para un día específico
const getClassesForDay = (day: string) => {
  // Convertir el nombre del día a su valor numérico
  const dayNumber = dayToNumber[day as keyof typeof dayToNumber];
  
  return props.classes.filter(classItem => {
    if (!classItem.schedule?.slots || !Array.isArray(classItem.schedule.slots)) {
      return false;
    }
    
    return classItem.schedule.slots.some(slot => {
      // Manejar tanto valores numéricos como strings
      if (typeof slot.day === 'number') {
        return slot.day === dayNumber;
      } else if (typeof slot.day === 'string') {
        // Normalizar el nombre del día
        const normalizedDay = slot.day.toLowerCase().trim();
        return normalizedDay === day.toLowerCase() || 
               normalizedDay === day.slice(0, 3).toLowerCase() || 
               parseInt(normalizedDay) === dayNumber;
      }
      return false;
    });
  });
};

// Methods
const selectClass = (class_: ClassData) => {
  if (class_?.id) {
    console.log('Selected class:', class_.id)
    selectedClass.value = class_
    emit('view-class', class_.id)
  }
}

// Helper para obtener el slot de horario para un día específico
const getScheduleForDay = (class_: ClassData, day: string): ScheduleSlot | undefined => {
  if (!class_.schedule?.slots || !Array.isArray(class_.schedule.slots)) {
    return undefined;
  }
  
  const dayNumber = dayToNumber[day as keyof typeof dayToNumber];
  
  return class_.schedule.slots.find(slot => {
    if (typeof slot.day === 'number') {
      return slot.day === dayNumber;
    } else if (typeof slot.day === 'string') {
      const normalizedDay = slot.day.toLowerCase().trim();
      return normalizedDay === day.toLowerCase() || 
             normalizedDay === day.slice(0, 3).toLowerCase() || 
             parseInt(normalizedDay) === dayNumber;
    }
    return false;
  });
}

// Formatear rango de tiempo para mostrar
const formatScheduleTime = (scheduleSlot: ScheduleSlot | undefined): string => {
  if (!scheduleSlot) return 'Horario no disponible'
  return `${scheduleSlot.startTime} - ${scheduleSlot.endTime}`
}

// Formatear duración de clase
const formatClassDuration = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return 'N/A';

  // Validación básica del formato de hora (HH:MM)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    console.warn('Formato de hora inválido para cálculo de duración:', startTime, endTime);
    return 'Duración inválida';
  }

  try {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const startDate = new Date(0, 0, 0, startHours, startMinutes);
    const endDate = new Date(0, 0, 0, endHours, endMinutes);

    // Manejar casos donde la hora de finalización es anterior a la de inicio
    if (endDate <= startDate) {
      console.warn('La hora de finalización es anterior o igual a la de inicio:', startTime, endTime);
      return 'Duración inválida';
    }

    const totalMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

    if (totalMinutes <= 0) return 'Duración inválida';

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let durationString = '';
    if (hours > 0) {
      durationString += `${hours}h`;
    }
    if (minutes > 0) {
      durationString += `${hours > 0 ? ' ' : ''}${minutes}min`;
    }

    return durationString || '0min';

  } catch (error) {
    console.error("Error calculando duración:", error);
    return 'Error';
  }
}
</script>

<style scoped>
/* Estilos para mejorar la visualización */
.day-section {
  transition: all 0.3s ease;
}

.class-item {
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.class-item:hover {
  border-left-color: #3b82f6; /* Azul para resaltar al pasar el mouse */
}

/* Colores para los días de la semana */
.day-section:nth-child(1) h3 { color: #ef4444; /* Lunes - Rojo */ }
.day-section:nth-child(2) h3 { color: #f97316; /* Martes - Naranja */ }
.day-section:nth-child(3) h3 { color: #eab308; /* Miércoles - Amarillo */ }
.day-section:nth-child(4) h3 { color: #22c55e; /* Jueves - Verde */ }
.day-section:nth-child(5) h3 { color: #3b82f6; /* Viernes - Azul */ }
.day-section:nth-child(6) h3 { color: #8b5cf6; /* Sábado - Púrpura */ }
.day-section:nth-child(7) h3 { color: #ec4899; /* Domingo - Rosa */ }

/* Modo oscuro */
.dark .day-section:nth-child(1) h3 { color: #fca5a5; /* Lunes - Rojo claro */ }
.dark .day-section:nth-child(2) h3 { color: #fdba74; /* Martes - Naranja claro */ }
.dark .day-section:nth-child(3) h3 { color: #fde047; /* Miércoles - Amarillo claro */ }
.dark .day-section:nth-child(4) h3 { color: #86efac; /* Jueves - Verde claro */ }
.dark .day-section:nth-child(5) h3 { color: #93c5fd; /* Viernes - Azul claro */ }
.dark .day-section:nth-child(6) h3 { color: #c4b5fd; /* Sábado - Púrpura claro */ }
.dark .day-section:nth-child(7) h3 { color: #f9a8d4; /* Domingo - Rosa claro */ }
</style>