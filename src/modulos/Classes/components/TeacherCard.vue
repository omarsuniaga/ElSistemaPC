<template>
  <div v-if="teacher" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
    <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Profesor</h3>
    <div class="flex items-center space-x-4">
      <div class="flex-shrink-0">
        <img v-if="teacher.photoUrl" :src="teacher.photoUrl" alt="Foto del Profesor" class="w-16 h-16 rounded-full object-cover shadow-sm">
        <div v-else class="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
      <div class="flex-grow min-w-0">
        <h4 class="text-xl font-semibold text-gray-800 dark:text-white truncate">{{ teacher.name || 'Profesor no asignado' }}</h4>
        <p v-if="teacher.specialties && teacher.specialties.length" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          <span class="font-medium">Especialidades:</span> {{ teacher.specialties.join(', ') }}
        </p>
        <p v-if="teacher.email" class="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
          <span class="font-medium">Email:</span> {{ teacher.email }}
        </p>
      </div>
    </div>
    <div v-if="teacher.biography" class="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
      <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Biografía</h5>
      <p class="text-sm text-gray-700 dark:text-gray-300">{{ teacher.biography }}</p>
    </div>
    <div v-if="teacher.contactInfo" class="mt-3">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        <span class="font-medium">Contacto:</span> {{ teacher.contactInfo }}
      </p>
    </div>
  </div>
  <div v-else class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
    <p class="text-gray-500 dark:text-gray-400">Información del profesor no disponible.</p>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

interface TeacherCardData {
  name?: string;
  photoUrl?: string;
  specialties?: string[];
  biography?: string;
  email?: string;
  contactInfo?: string;
  // Add other relevant teacher fields
}

defineProps<{
  teacher: TeacherCardData | null;
}>();
</script>

<style scoped>
/* Transitions for smooth theme switching */
div {
  transition: background-color 0.3s ease, color 0.3s ease;
}
</style>
