<script setup lang="ts">
import { computed } from 'vue';
import type { Student } from '../../Students/types/student';
import type { AttendanceStatus } from '../types/attendance';
import AttendanceTableHeader from './AttendanceTableHeader.vue';
import AttendanceTableRow from './AttendanceTableRow.vue';

const props = defineProps<{
  students: Student[];
  attendanceRecords: Record<string, AttendanceStatus>;
  isDisabled: boolean;
  pendingChanges: Set<string>;
}>();

const emit = defineEmits<{
  (e: 'update-status', studentId: string, status: AttendanceStatus): void;
  (e: 'open-justification', student: Student): void;
  (e: 'mark-all-present'): void;
  (e: 'mark-all-absent'): void;
  (e: 'mark-all-late'): void;
  (e: 'reset-all'): void;
}>();

// Sort students by name
const sortedStudents = computed(() => {
  return [...props.students].sort((a, b) => {
    const nameA = `${a.nombre} ${a.apellido}`.toLowerCase();
    const nameB = `${b.nombre} ${b.apellido}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });
});
</script>

<template>
  <div v-if="students.length === 0" class="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
    <p class="text-gray-500 dark:text-gray-400">
      No hay estudiantes para mostrar o la clase no está seleccionada.
    </p>
  </div>
  
  <div v-else class="w-full overflow-x-auto rounded-lg">
    <table class="w-full divide-y divide-gray-200 dark:divide-gray-700">
      <AttendanceTableHeader 
        :is-disabled="isDisabled"
        @mark-all-present="emit('mark-all-present')"
        @mark-all-absent="emit('mark-all-absent')"
        @mark-all-late="emit('mark-all-late')"
        @reset-all="emit('reset-all')"
      />
      
      <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        <AttendanceTableRow
          v-for="student in sortedStudents"
          :key="student.id"
          :student="student"
          :attendance-status="attendanceRecords[student.id]"
          :is-disabled="isDisabled"
          :is-pending="pendingChanges.has(student.id)"
          @update-status="(studentId, status) => emit('update-status', studentId, status)"
          @open-justification="emit('open-justification', $event)"
        />
      </tbody>
    </table>
  </div>
</template>
