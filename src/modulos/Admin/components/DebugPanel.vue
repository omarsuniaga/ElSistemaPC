<template>
  <div
    class="fixed bottom-4 right-4 bg-white border-2 border-blue-500 rounded-lg p-4 shadow-lg max-w-md z-50"
  >
    <div class="flex items-center justify-between mb-2">
      <h4 class="text-sm font-bold text-blue-700">🔧 Debug Panel</h4>
      <button class="text-gray-500 hover:text-gray-700" @click="$emit('close')">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <div class="space-y-2 text-xs">
      <div class="flex justify-between">
        <span>Loading:</span>
        <span :class="isLoading ? 'text-orange-600' : 'text-green-600'">
          {{ isLoading ? "Sí" : "No" }}
        </span>
      </div>

      <div class="flex justify-between">
        <span>Total Students:</span>
        <span class="font-mono">{{ students.length }}</span>
      </div>

      <div class="flex justify-between">
        <span>Filtered Students:</span>
        <span class="font-mono">{{ filteredStudents.length }}</span>
      </div>

      <div class="flex justify-between">
        <span>Paginated Students:</span>
        <span class="font-mono">{{ paginatedStudents.length }}</span>
      </div>

      <div class="flex justify-between">
        <span>Current User:</span>
        <span class="font-mono text-xs">{{ currentUser?.email || "N/A" }}</span>
      </div>

      <div class="flex justify-between">
        <span>User Role:</span>
        <span class="font-mono text-xs">{{ currentUser?.role || "N/A" }}</span>
      </div>

      <div class="flex justify-between">
        <span>Can View Students:</span>
        <span :class="canViewStudent ? 'text-green-600' : 'text-red-600'">
          {{ canViewStudent ? "Sí" : "No" }}
        </span>
      </div>

      <hr class="my-2" />

      <div class="space-y-1">
        <button
          class="w-full bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
          @click="refreshData"
        >
          🔄 Recargar Datos
        </button>

        <button
          class="w-full bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600"
          @click="clearCache"
        >
          🗑️ Limpiar Caché
        </button>

        <button
          class="w-full bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600"
          @click="logDebugInfo"
        >
          📋 Log Debug Info
        </button>
      </div>

      <!-- Sample student data if available -->
      <div v-if="students.length > 0" class="mt-2">
        <details class="text-xs">
          <summary class="cursor-pointer text-blue-600 hover:text-blue-800">
            Ver estructura del primer estudiante
          </summary>
          <pre class="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">{{
            JSON.stringify(students[0], null, 2)
          }}</pre>
        </details>
      </div>

      <!-- Error display -->
      <div v-if="error" class="mt-2 p-2 bg-red-100 text-red-700 rounded text-xs">
        <strong>Error:</strong> {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useAdminStudentsStore } from '../store/adminStudents';
import { useRBACStore } from '@/stores/rbacStore';

// Stores
const authStore = useAuthStore();
const studentsStore = useAdminStudentsStore();
const rbacStore = useRBACStore();

// Computed
const currentUser = computed(() => authStore.user);
const students = computed(() => studentsStore.students);
const isLoading = computed(() => studentsStore.isLoading);
const error = computed(() => studentsStore.error);
const filteredStudents = computed(() => studentsStore.filteredStudents);
const paginatedStudents = computed(() => {
  // Esta es una aproximación - necesitaríamos acceso a la paginación del componente padre
  return filteredStudents.value.slice(0, 20);
});
const canViewStudent = computed(() => rbacStore.hasPermission('students', 'view'));

// Methods
const refreshData = async () => {
  console.log('🔄 Refrescando datos de estudiantes...');
  await studentsStore.loadStudents();
};

const clearCache = () => {
  console.log('🗑️ Limpiando caché de estudiantes...');
  const keys = Object.keys(localStorage).filter((key) => key.startsWith('students_'));
  keys.forEach((key) => {
    localStorage.removeItem(key);
    console.log(`Removed cache key: ${key}`);
  });
  refreshData();
};

const logDebugInfo = () => {
  console.group('🔍 ADMIN STUDENTS DEBUG INFO');
  console.log('Current User:', currentUser.value);
  console.log('Students Count:', students.value.length);
  console.log('Filtered Students Count:', filteredStudents.value.length);
  console.log('Is Loading:', isLoading.value);
  console.log('Error:', error.value);
  console.log('Can View Students:', canViewStudent.value);
  console.log('RBAC Permissions:', rbacStore.userPermissions);
  if (students.value.length > 0) {
    console.log('Sample Student:', students.value[0]);
  }
  console.log(
    'LocalStorage Students Cache:',
    Object.keys(localStorage).filter((key) => key.startsWith('students_')),
  );
  console.groupEnd();
};
</script>
