<script setup lang="ts">
import { PencilIcon, UserGroupIcon } from '@heroicons/vue/24/outline';
import type { ClassData } from '../types/teacherTypes'; // Assuming types are moved

defineProps<{ 
  upcomingClasses: ClassData[];
  getNextSession: (classItem: ClassData) => Date;
  formatDateTime: (date: Date) => string;
}>();
const emit = defineEmits(['edit-class', 'manage-students']);
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
    <h2 class="text-lg font-semibold mb-4">Próximas Clases (24h)</h2>
    <div class="space-y-4">
      <template v-if="upcomingClasses.length > 0">
        <div
          v-for="classItem in upcomingClasses"
          :key="classItem.id"
          class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-3 sm:p-4 border-l-4 border-blue-500"
        >
          <div class="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div class="flex-grow">
              <h3 class="font-medium text-lg">{{ classItem.name }}</h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                {{ classItem.level }} - {{ classItem.instrument || 'Sin instrumento' }}
              </p>
              <div class="mt-2 flex items-center text-sm">
                <span class="font-medium mr-2 whitespace-nowrap">Próxima sesión:</span>
                <span>{{ formatDateTime(getNextSession(classItem)) }}</span>
              </div>
              <p class="mt-1 text-sm text-gray-500">Aula: {{ classItem.classroom || 'Sin asignar' }}</p>
              <p class="text-sm text-gray-500">Estudiantes: {{ classItem.studentIds?.length || 0 }}</p>
            </div>
            <div class="flex space-x-2 self-end sm:self-start">
              <button
                @click="emit('edit-class', classItem.id)"
                class="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md"
                title="Editar clase"
              >
                <PencilIcon class="h-5 w-5" />
              </button>
              <button
                @click="emit('manage-students', classItem.id)"
                class="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-md"
                title="Gestionar estudiantes"
              >
                <UserGroupIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="py-12 text-center text-gray-500 dark:text-gray-400">
        No tienes clases programadas para las próximas 24 horas.
      </div>
    </div>
  </div>
</template>
