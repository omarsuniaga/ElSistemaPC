<template>
  <div class="attendance-list-container">
    <div v-if="isLoading" class="loading-overlay">Cargando lista de asistencia...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    
    <div v-else>
      <!-- Header simplificado -->
      <div class="list-header">
        <h2>Lista de Asistencia</h2>
        <button class="save-button" :disabled="isLoading" @click="saveAttendance">
          Guardar Cambios
        </button>
      </div>

      <!-- Tabla de estudiantes -->
      <div class="student-table">
        <div v-for="student in attendanceList" :key="student.id" class="student-row">
          <span class="student-name">{{ student.nombre }} {{ student.apellido }}</span>
          <div class="status-buttons">
            <button 
              :class="{ 'active': student.status === 'Presente' }"
              @click="updateStudentStatus(student.id, 'Presente')"
            >Presente</button>
            <button 
              :class="{ 'active': student.status === 'Ausente' }"
              @click="updateStudentStatus(student.id, 'Ausente')"
            >Ausente</button>
            <button 
              :class="{ 'active': student.status === 'Tardanza' }"
              @click="updateStudentStatus(student.id, 'Tardanza')"
            >Tardanza</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAttendance } from '../composables/useAttendance';

// El composable se encarga de la lógica, incluyendo leer la ruta
const { 
  isLoading, 
  error,
  attendanceList, 
  updateStudentStatus, 
  saveAttendance, 
} = useAttendance();

</script>

<style scoped>
.attendance-list-container { max-width: 800px; margin: auto; padding: 1rem; }
.list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.student-table { display: flex; flex-direction: column; gap: 0.5rem; }
.student-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border: 1px solid #eee; border-radius: 4px; }
.status-buttons { display: flex; gap: 0.5rem; }
.status-buttons button { padding: 0.25rem 0.5rem; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; }
.status-buttons button.active { background-color: #3498db; color: white; border-color: #3498db; }
.loading-overlay, .error-message { text-align: center; padding: 2rem; }
</style>