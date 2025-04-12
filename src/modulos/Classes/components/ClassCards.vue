<script setup lang="ts">
import ClassCard from './ClassCard.vue'
import type { Class as ClassType } from '../types/class'


const props = defineProps<{
  classes: ClassType[];
  studentCounts: Record<string, number>;
  topStudents: Record<string, Array<{id: string, nombre: string, apellido: string}>>;
}>()

const emit = defineEmits<{
  (e: 'edit', id: string): void;
  (e: 'delete', id: string): void;
  (e: 'manage-students', id: string): void;
}>()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <ClassCard
      v-for="classItem in classes"
      :key="classItem.id"
      :class-data="classItem"
      :student-count="studentCounts[classItem.id] || 0"
      :top-students="topStudents[classItem.id] || []"
      @edit="emit('edit', $event)"
      @delete="emit('delete', $event)"
      @manage-students="emit('manage-students', $event)"
    />
  </div>
</template>