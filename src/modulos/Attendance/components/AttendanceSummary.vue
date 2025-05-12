<script setup lang="ts">
import type { AttendanceStatus } from '../types/attendance';

defineProps<{
  attendanceRecords: Record<string, AttendanceStatus>;
  pendingChangesCount: number;
  hasPendingChanges: boolean;
  onSave: () => void;
}>();
</script>

<template>
  <!-- Pending changes notification -->
  <div v-if="hasPendingChanges" class="my-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
    <p class="font-medium text-yellow-800 flex items-center justify-between">
      <span>
        <span class="w-2 h-2 bg-amber-500 rounded-full animate-pulse inline-block mr-1"></span>
        Cambios pendientes: {{ pendingChangesCount }}
      </span>
      <button 
        @click="onSave" 
        class="ml-2 px-2 py-1 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 rounded-md">
        Guardar ahora
      </button>
    </p>
  </div>

  <!-- Attendance summary cards -->
  <div v-if="Object.keys(attendanceRecords).length > 0" class="mb-4 flex flex-wrap gap-2 text-sm">
    <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full">
      Presentes: {{ Object.values(attendanceRecords).filter(s => s === 'Presente').length }}
    </div>
    <div class="bg-red-100 text-red-800 px-3 py-1 rounded-full">
      Ausentes: {{ Object.values(attendanceRecords).filter(s => s === 'Ausente').length }}
    </div>
    <div class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
      Tardanzas: {{ Object.values(attendanceRecords).filter(s => s === 'Tardanza').length }}
    </div>
    <div class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
      Justificados: {{ Object.values(attendanceRecords).filter(s => s === 'Justificado').length }}
    </div>
    <div v-if="hasPendingChanges" class="bg-amber-100 text-amber-800 px-3 py-1 rounded-full flex items-center">
      <span class="w-2 h-2 bg-amber-500 rounded-full animate-pulse mr-1"></span>
      Cambios pendientes: {{ pendingChangesCount }}
    </div>
  </div>
</template>
