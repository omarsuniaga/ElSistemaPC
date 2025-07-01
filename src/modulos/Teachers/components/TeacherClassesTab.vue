<script setup lang="ts">
import {PlusIcon} from "@heroicons/vue/24/outline"
import TeacherClassesCard from "./TeacherClassesCard.vue"
import type {ClassData} from "../types/teacherTypes" // Assuming types are moved

defineProps<{sortedClasses: ClassData[]}>()
const emit = defineEmits([
  "add-class",
  "view-class",
  "edit-class",
  "delete-class",
  "manage-students",
])
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
    <h2
      class="text-lg font-semibold mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
    >
      <span>Mis Clases</span>
      <button
        class="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 self-end sm:self-center"
        @click="emit('add-class')"
      >
        <PlusIcon class="w-4 h-4" />
        Nueva Clase
      </button>
    </h2>
    <div
      class="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
    >
      <template v-if="sortedClasses.length > 0">
        <TeacherClassesCard
          v-for="classItem in sortedClasses"
          :key="classItem.id"
          :class-data="classItem"
          @view="(id) => emit('view-class', id)"
          @edit="(id) => emit('edit-class', id)"
          @delete="(id) => emit('delete-class', id)"
          @manage-students="(id) => emit('manage-students', id)"
        />
      </template>
      <div
        v-else
        class="col-span-full py-8 text-center text-gray-500 dark:text-gray-400 text-sm flex flex-col items-center justify-center"
      >
        <p>No tienes clases asignadas actualmente.</p>
        <button class="mt-2 text-blue-500 hover:underline" @click="emit('add-class')">
          Crear una nueva
        </button>
      </div>
    </div>
  </div>
</template>
