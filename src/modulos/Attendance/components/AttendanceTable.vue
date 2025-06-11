<script setup lang="ts">
import { computed } from 'vue';
import type { Student } from '../../Students/types/student';
import type { AttendanceStatus } from '../types/attendance';
import AttendanceTableHeader from './AttendanceTableHeader.vue';
import AttendanceTableRow from './AttendanceTableRow.vue';
import PermissionGuard from '../../Auth/components/PermissionGuard.vue';
import { ResourceType, PermissionAction } from '../../Auth/types/permissions';
import { useRBACStore } from '@/stores/rbacStore';

const rbacStore = useRBACStore();

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

// Check if user can edit attendance
const canEditAttendance = computed(() => {
  return rbacStore.hasPermission('attendance_edit') || rbacStore.hasRole('Maestro');
});

// Check if user can view attendance
const canViewAttendance = computed(() => {
  return rbacStore.hasPermission('attendance_view') || rbacStore.hasRole('Maestro');
});

// Make sure the component is exported as default
defineExpose({});
if (import.meta.env?.PROD === false) {
  // @ts-ignore - This ensures the component has a default export
  // which helps with certain bundlers and IDE tooling
  const _default = {};
}
</script>

<template>
  <div v-if="!canViewAttendance" class="text-center py-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
    <p class="text-red-600 dark:text-red-400">
      No tienes permisos para ver los registros de asistencia.
    </p>
  </div>

  <div v-else-if="students.length === 0" class="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
    <p class="text-gray-500 dark:text-gray-400">
      No hay estudiantes para mostrar o la clase no está seleccionada.
    </p>
  </div>
  
  <div v-else class="w-full overflow-x-auto rounded-lg">
    <table class="w-full divide-y divide-gray-200 dark:divide-gray-700">
      <AttendanceTableHeader 
        :is-disabled="isDisabled || !canEditAttendance"
        @mark-all-present="canEditAttendance && emit('mark-all-present')"
        @mark-all-absent="canEditAttendance && emit('mark-all-absent')"
        @mark-all-late="canEditAttendance && emit('mark-all-late')"
        @reset-all="canEditAttendance && emit('reset-all')"
      />
      
      <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        <AttendanceTableRow
          v-for="student in sortedStudents"
          :key="student.id"
          :student="student"
          :attendance-status="attendanceRecords[student.id]"
          :is-disabled="isDisabled || !canEditAttendance"
          :is-pending="pendingChanges.has(student.id)"
          @update-status="(studentId, status) => canEditAttendance && emit('update-status', studentId, status)"
          @open-justification="canEditAttendance && emit('open-justification', $event)"
          @mark-all-present="canEditAttendance && emit('mark-all-present')"
          @mark-all-absent="canEditAttendance && emit('mark-all-absent')"
          @mark-all-late="canEditAttendance && emit('mark-all-late')"
          @reset-all="canEditAttendance && emit('reset-all')"
          :pending-changes="pendingChanges"
        />
      </tbody>
    </table>
  </div>
</template>
