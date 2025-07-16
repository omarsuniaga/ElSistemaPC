<template>
  <div class="card hover:shadow-md transition-shadow duration-300">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold flex items-center">
        <CalendarIcon class="w-5 h-5 mr-2 text-blue-500" />
        Próximas Clases
      </h3>
      <router-link to="/classes" class="text-sm text-blue-500 hover:underline">
        Ver todas
      </router-link>
    </div>

    <div v-if="classes.length === 0" class="p-4 text-center text-gray-500 dark:text-gray-400">
      No hay próximas clases programadas
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="classItem in classes"
        :key="`${classItem.id}-${classItem.date}`"
        class="p-3 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div class="flex justify-between items-start">
          <div>
            <h4 class="font-medium">{{ classItem.title }}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {{ formatDate(classItem.date) }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm font-medium flex items-center justify-end">
              <ClockIcon class="w-4 h-4 mr-1 text-blue-500" />
              {{ classItem.time }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Sala: {{ classItem.room }}</p>
          </div>
        </div>
        <div class="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Profesor: {{ classItem.teacher }}</span>
          <span>{{ classItem.students }} estudiantes</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CalendarIcon, ClockIcon } from '@heroicons/vue/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UpcomingClass {
  id: string
  title: string
  date: Date
  time: string
  teacher: string
  students: number
  room: string
}

defineProps<{
  classes: UpcomingClass[]
}>();

// Función para formatear fecha
const formatDate = (date: Date) => {
  return format(date, 'EEEE, d MMMM', { locale: es });
};
</script>
