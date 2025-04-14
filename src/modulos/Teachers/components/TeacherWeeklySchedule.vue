<template>
  <div class="teacher-weekly-schedule container mx-auto px-4 py-6 md:py-8">
    <div class="space-y-8">
      <template v-for="day in weekDays" :key="day">
        <!-- Fix: Removed v-scope directive and :set attribute -->
        <div>
          <!-- Store the result in a computed property or use it directly -->
          <div v-if="classesStore.getClassByDaysAndTeacher(props.teacherId, day).length > 0" class="day-section">
            <div class="mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">{{ day }}</h3>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              <div
                v-for="class_ in classesStore.getClassByDaysAndTeacher(props.teacherId, day)"
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
                      <span>{{ formatClassDuration(getScheduleForDay(class_, day)!.startTime, getScheduleForDay(class_, day)!.endTime) }}</span>
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
import { useClassesStore } from '../../Classes/store/classes' // Adjust path if needed
import {
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  MusicalNoteIcon
} from '@heroicons/vue/24/outline'

// Interfaces (assuming they are correct)
interface ScheduleSlot {
  day: string;
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
}>()

// Store
const classesStore = useClassesStore()

// State
const selectedClass = ref<ClassData | null>(null)
const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Methods
const selectClass = (class_: ClassData) => {
  if (class_?.id) {
    console.log('Selected class:', class_.id)
    selectedClass.value = class_
    // You might want to emit an event or navigate here
    // emit('classSelected', class_)
  }
}

// Helper to get schedule slot for a specific day
const getScheduleForDay = (class_: ClassData, day: string): ScheduleSlot | undefined => {
  return class_.schedule?.slots.find(slot => slot.day === day)
}

// Format time range for display
const formatScheduleTime = (scheduleSlot: ScheduleSlot | undefined): string => {
  if (!scheduleSlot) return 'Horario no disponible'
  return `${scheduleSlot.startTime} - ${scheduleSlot.endTime}`
}

// Format class duration
const formatClassDuration = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return 'N/A';

  // Basic time validation (HH:MM format)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    console.warn('Invalid time format for duration calculation:', startTime, endTime);
    return 'Duración inválida';
  }

  try {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const startDate = new Date(0, 0, 0, startHours, startMinutes);
    const endDate = new Date(0, 0, 0, endHours, endMinutes);

    // Handle cases where end time is on the next day (e.g., 22:00 - 01:00)
    if (endDate <= startDate) {
      console.warn('End time is before or same as start time:', startTime, endTime);
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
    console.error("Error calculating duration:", error);
    return 'Error';
  }
}
</script>

<style scoped>
/* Clean up - no additional styles needed as we're using Tailwind */
</style>