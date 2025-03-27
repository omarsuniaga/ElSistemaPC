<script setup lang="ts">
import {
  ClipboardDocumentCheckIcon,
  BookOpenIcon,
  AcademicCapIcon,
  PencilIcon
} from '@heroicons/vue/24/outline';

const emit = defineEmits(['start-activity', 'start-editing']);
</script>

<template>
  <div class="flex justify-center mt-2 gap-4">
    <button 
      @click="$emit('start-activity', 'attendance')"
      class="flex flex-col items-center text-xs text-gray-600 dark:text-gray-300"
    >
      <div class="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
        <ClipboardDocumentCheckIcon class="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
      </div>
      <span>Asistencia</span>
    </button>
    
    <button 
      @click="$emit('start-activity', 'content')"
      class="flex flex-col items-center text-xs text-gray-600 dark:text-gray-300"
    >
      <div class="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
        <BookOpenIcon class="h-4 w-4 text-green-600 dark:text-green-400" />
      </div>
      <span>Contenido</span>
    </button>
    
    <button 
      @click="$emit('start-activity', 'evaluation')"
      class="flex flex-col items-center text-xs text-gray-600 dark:text-gray-300"
    >
      <div class="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
        <AcademicCapIcon class="h-4 w-4 text-amber-600 dark:text-amber-400" />
      </div>
      <span>Evaluación</span>
    </button>
    
    <button 
      @click="$emit('start-editing')"
      class="flex flex-col items-center text-xs text-gray-600 dark:text-gray-300"
    >
      <div class="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
        <PencilIcon class="h-4 w-4 text-purple-600 dark:text-purple-400" />
      </div>
      <span>Editar clase</span>
    </button>
  </div>
</template>