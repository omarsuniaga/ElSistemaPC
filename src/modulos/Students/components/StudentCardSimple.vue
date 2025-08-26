<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col items-center hover:shadow-lg transition cursor-pointer group relative"
  >
    <!-- Status indicator -->
    <span
      v-if="student.activo !== undefined"
      :class="student.activo ? 'bg-green-400' : 'bg-red-400'"
      class="absolute top-3 left-3 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800"
    />
    
    <!-- Simple Avatar -->
    <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
      {{ getInitials(student.nombre, student.apellido) }}
    </div>
    
    <!-- Student Info -->
    <div class="mt-2 text-center w-full">
      <div class="font-bold text-lg truncate">
        {{ student.nombre }} {{ student.apellido }}
      </div>
      <div class="text-sm text-gray-500 truncate">
        {{ student.instrumento || "Sin instrumento asignado" }}
      </div>
      <div
        v-if="student.grupo && Array.isArray(student.grupo) && student.grupo.length"
        class="text-xs text-blue-600 dark:text-blue-300 mt-1 truncate"
      >
        {{ student.grupo.join(", ") }}
      </div>
      
      <!-- Attendance percentage -->
      <div class="mt-1">
        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
          {{ attendance }}% asistencia
        </span>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="mt-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        @click.stop="$emit('profile')"
        class="p-1 text-blue-600 hover:bg-blue-100 rounded"
        title="Ver perfil"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
      
      <button
        @click.stop="$emit('edit')"
        class="p-1 text-green-600 hover:bg-green-100 rounded"
        title="Editar"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      
      <button
        @click.stop="$emit('delete')"
        class="p-1 text-red-600 hover:bg-red-100 rounded"
        title="Eliminar"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Student {
  id: string;
  nombre: string;
  apellido: string;
  instrumento?: string;
  grupo?: string[] | string;
  activo?: boolean;
}

interface Props {
  student: Student;
  attendance?: number;
}

withDefaults(defineProps<Props>(), {
  attendance: 0
});

defineEmits<{
  profile: [];
  edit: [];
  delete: [];
}>();

// Helper function to get initials
const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}` || 'SN';
};
</script>

<style scoped>
/* Additional hover effects */
.group:hover {
  transform: translateY(-1px);
}

/* Dark mode improvements */
.dark .group:hover {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
}
</style>