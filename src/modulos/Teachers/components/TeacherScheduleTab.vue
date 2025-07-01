<script setup lang="ts">
import {PlusIcon} from "@heroicons/vue/24/outline"
import TeacherWeeklySchedule from "./TeacherWeeklySchedule.vue"
import type {ClassData} from "../types/teacherTypes" // Assuming types are moved

defineProps<{
  teacherClasses: ClassData[]
  currentTeacherId: string
}>()
const emit = defineEmits(["add-class", "view-class"])
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
    <h2
      class="text-lg font-semibold mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
    >
      <span>Horario Semanal</span>
      <button
        class="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 self-end sm:self-center"
        @click="emit('add-class')"
      >
        <PlusIcon class="w-4 h-4" />
        Nueva Clase
      </button>
    </h2>
    <TeacherWeeklySchedule
      :classes="teacherClasses"
      :teacher-id="currentTeacherId"
      @view-class="(id) => emit('view-class', id)"
    />
  </div>
</template>
