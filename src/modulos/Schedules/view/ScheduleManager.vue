<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTeachersStore } from '../../Teachers/store/teachers'
import { useClassesStore } from '../../Classes/store/classes'
import { useStudentsStore } from '../../Students/store/students'
import ScheduleManagerComponent from '../components/ScheduleManager.vue'

// Estado reactivo
const isLoading = ref(false)
const error = ref<string | null>(null)

// Función para cargar datos
const loadData = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    // Carga paralela de los datos necesarios
    await Promise.all([
      useTeachersStore().fetchTeachers(),
      useClassesStore().fetchClasses(),
      useStudentsStore().fetchStudents()
    ]);
    
    return true
  } catch (err) {
    console.error("Error al cargar datos:", err);
    error.value = "Error al cargar datos. Por favor, intenta nuevamente."
    return false
  } finally {
    isLoading.value = false
  }
}

// Inicializar datos al montar el componente
onMounted(async () => {
  await loadData()
})
</script>

<template>
  <div class="schedule-manager-view p-4 max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">Gestión de Horarios</h1>
    
    <!-- Estado de carga -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      <span class="ml-3">Cargando datos...</span>
    </div>
    
    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg text-red-700 dark:text-red-400 mb-6">
      {{ error }}
      <button @click="loadData" class="ml-2 underline">Reintentar</button>
    </div>
    
    <!-- Contenido principal -->
    <div v-else>
      <!-- Usar el componente ScheduleManager -->
      <ScheduleManagerComponent />
    </div>
  </div>
</template>

<style scoped>
.schedule-manager-view {
  min-height: 70vh;
}
</style>
