<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Próximas Clases (24h)</h2>

    <div class="space-y-4">
      <template v-if="upcomingClasses.length > 0">
        <div
          v-for="classItem in upcomingClasses"
          :key="classItem.id"
          class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-4 border-l-4 border-blue-500"
        >
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-medium text-lg text-gray-900 dark:text-white">
                {{ classItem.name }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                {{ classItem.level }} - {{ classItem.instrument || "Sin instrumento" }}
              </p>

              <div class="mt-2 flex items-center text-sm">
                <span class="font-medium mr-2 text-gray-700 dark:text-gray-300"
                  >Próxima sesión:</span
                >
                <!-- Use the prop function for formatting -->
                <span class="text-gray-600 dark:text-gray-400">{{
                  formatDateTime(classItem.nextSessionDate || getNextSession(classItem))
                }}</span>
              </div>

              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Aula: {{ classItem.classroom || "Sin asignar" }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Estudiantes: {{ classItem.studentIds?.length || 0 }}
              </p>
            </div>

            <div class="flex space-x-2">
              <button
                class="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md"
                title="Editar clase"
                @click="$emit('edit-class', classItem.id)"
              >
                <PencilIcon class="h-5 w-5" />
              </button>
              <button
                class="p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-md"
                title="Gestionar estudiantes"
                @click="$emit('manage-students', classItem.id)"
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

<script setup lang="ts">
import { type PropType } from 'vue';
import { PencilIcon, UserGroupIcon } from '@heroicons/vue/24/outline';

// Define types for class data
interface ClassScheduleSlot {
  day: string | number
  startTime: string
  endTime: string
}
interface ClassData {
  id: string
  name: string
  level: string
  instrument?: string
  classroom?: string
  studentIds?: string[]
  schedule?: {
    slots?: ClassScheduleSlot[]
  }
  nextSessionDate?: Date // Added in parent's computed property
}

const props = defineProps({
  upcomingClasses: {
    type: Array as PropType<ClassData[]>,
    required: true,
  },
  formatDateTime: {
    // Function prop
    type: Function as PropType<(date: Date) => string>,
    required: true,
  },
  getNextSession: {
    // Function prop
    type: Function as PropType<(classItem: ClassData) => Date>,
    required: true,
  },
});

const emit = defineEmits(['edit-class', 'manage-students']); // Emits for actions
</script>

<style scoped>
/* Add any specific styles for the upcoming classes section here */
</style>
