<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col items-center hover:shadow-lg transition cursor-pointer group relative"
    @click="$emit('open')"
  >
    <!-- Indicador de estado -->
    <span v-if="student.activo !== undefined" :class="student.activo ? 'bg-green-400' : 'bg-red-400'" class="absolute top-3 left-3 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800"></span>
    <StudentAvatar :first-name="student.nombre" :last-name="student.apellido" size="xl" />
    <div class="mt-2 text-center w-full">
      <div class="font-bold text-lg truncate">{{ student.nombre }} {{ student.apellido }}</div>
      <div class="text-sm text-gray-500 truncate">{{ student.instrumento || 'Sin instrumento asignado' }}</div>
      <div v-if="student.grupo && student.grupo.length" class="text-xs text-blue-600 dark:text-blue-300 mt-1 truncate">
        {{ student.grupo.join(', ') }}
      </div>
      <div class="mt-1">
        <span :class="attendanceColor" class="font-semibold" :title="attendance + '% asistencia'">
          {{ attendance }}% asistencia
        </span>
      </div>
    </div>
    <!-- Acciones rápidas -->
    <div class="flex gap-2 mt-3 w-full justify-center opacity-0 group-hover:opacity-100 transition-opacity">
      <button class="btn btn-xs btn-primary" @click.stop="$emit('profile')" title="Ver perfil">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      </button>
      <button class="btn btn-xs btn-secondary" @click.stop="$emit('edit')" title="Editar alumno">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 00-4-4l-8 8v3z" /></svg>
      </button>
      <button class="btn btn-xs btn-danger" @click.stop="$emit('delete')" title="Eliminar alumno">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import StudentAvatar from './StudentAvatar.vue'

const props = defineProps({
  student: {
    type: Object,
    required: true
  },
  attendance: {
    type: Number,
    required: true
  }
})

const attendanceColor = computed(() => {
  if (props.attendance >= 90) return 'text-green-600'
  if (props.attendance >= 75) return 'text-yellow-600'
  return 'text-red-600'
})
</script>

<style scoped>
.bg-white {
  background: var(--color-bg, #fff);
}
.dark .bg-white {
  background: #23272f;
}
</style> 