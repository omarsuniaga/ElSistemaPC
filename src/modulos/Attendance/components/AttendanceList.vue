<template>
  <div class="attendance-list-container">
    <div v-if="isLoading" class="loading-overlay">Cargando lista de asistencia...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    
    <div v-else>
      <!-- Header simplificado -->
      <div class="list-header">
        <h2>Lista de Asistencia</h2>
        <div class="header-actions">
          <button 
            class="observations-button" 
            @click="openObservationsModal"
            title="Gestionar observaciones de clase"
          >
            📝 Observaciones
          </button>
          <button 
            class="save-button" 
            :disabled="isLoading" 
            @click="saveAttendance"
          >
            Guardar Cambios
          </button>
        </div>
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

    <!-- Modal de observaciones de clase -->
    <ClassObservationsManager
      :is-open="showObservationsModal"
      :class-id="classId"
      :selected-date="selectedDate"
      @close="closeObservationsModal"
      @observation-created="handleObservationCreated"
      @observation-updated="handleObservationUpdated"
      @observation-deleted="handleObservationDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAttendance } from '../composables/useAttendance';
import ClassObservationsManager from '../../Observations/components/ClassObservationsManager.vue';

// El composable se encarga de la lógica, incluyendo leer la ruta
const { 
  isLoading, 
  error,
  attendanceList, 
  updateStudentStatus, 
  saveAttendance,
  classId,
  selectedDate
} = useAttendance();

// Estado para el modal de observaciones
const showObservationsModal = ref(false);

// Métodos para manejar el modal de observaciones
const openObservationsModal = () => {
  showObservationsModal.value = true;
};

const closeObservationsModal = () => {
  showObservationsModal.value = false;
};

// Manejadores de eventos de observaciones
const handleObservationCreated = (observation: any) => {
  console.log('Observación creada:', observation);
  // Aquí puedes implementar lógica adicional si es necesario
};

const handleObservationUpdated = (observation: any) => {
  console.log('Observación actualizada:', observation);
  // Aquí puedes implementar lógica adicional si es necesario
};

const handleObservationDeleted = (observationId: string) => {
  console.log('Observación eliminada:', observationId);
  // Aquí puedes implementar lógica adicional si es necesario
};
</script>

<style scoped>
.attendance-list-container { max-width: 800px; margin: auto; padding: 1rem; }
.list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.header-actions { display: flex; gap: 0.5rem; }
.observations-button { 
  padding: 0.5rem 1rem; 
  background-color: #f39c12; 
  color: white; 
  border: none; 
  border-radius: 4px; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  gap: 0.25rem;
}
.observations-button:hover { background-color: #e67e22; }
.save-button { 
  padding: 0.5rem 1rem; 
  background-color: #2ecc71; 
  color: white; 
  border: none; 
  border-radius: 4px; 
  cursor: pointer; 
}
.save-button:hover { background-color: #27ae60; }
.save-button:disabled { background-color: #95a5a6; cursor: not-allowed; }
.student-table { display: flex; flex-direction: column; gap: 0.5rem; }
.student-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border: 1px solid #eee; border-radius: 4px; }
.status-buttons { display: flex; gap: 0.5rem; }
.status-buttons button { padding: 0.25rem 0.5rem; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; }
.status-buttons button.active { background-color: #3498db; color: white; border-color: #3498db; }
.loading-overlay, .error-message { text-align: center; padding: 2rem; }
</style>