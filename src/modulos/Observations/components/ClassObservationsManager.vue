<template>
  <div class="observations-manager" v-if="isOpen">
    <div class="modal-overlay" @click="closeModal"></div>
    <div class="modal-container">
      <div class="modal-header">
        <h2>Observaciones de Clase</h2>
        <button class="close-button" @click="closeModal">×</button>
      </div>

      <div class="modal-body">
        <!-- Sección de filtros y búsqueda -->
        <div class="filters-section">
          <div class="search-box">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Buscar observaciones..."
              @input="filterObservations"
            >
          </div>
          <div class="filter-options">
            <select v-model="selectedType" @change="filterObservations">
              <option value="">Todos los tipos</option>
              <option value="general">General</option>
              <option value="comportamiento">Comportamiento</option>
              <option value="academico">Académico</option>
              <option value="evaluacion">Evaluación</option>
            </select>
            <select v-model="selectedPriority" @change="filterObservations">
              <option value="">Todas las prioridades</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
        </div>

        <!-- Lista de observaciones -->
        <div class="observations-list" v-if="filteredObservations.length > 0">
          <div 
            v-for="observation in filteredObservations" 
            :key="observation.id"
            class="observation-card"
            :class="{
              'priority-low': observation.priority === 'baja',
              'priority-medium': observation.priority === 'media',
              'priority-high': observation.priority === 'alta',
              'priority-critical': observation.priority === 'critica'
            }"
          >
            <div class="observation-header">
              <span class="observation-type">{{ getTypeLabel(observation.type) }}</span>
              <span class="observation-date">{{ formatDate(observation.date) }}</span>
            </div>
            <div class="observation-content">
              <p>{{ observation.text }}</p>
            </div>
            <div class="observation-footer">
              <div class="observation-author">Por: {{ observation.authorName }}</div>
              <div class="observation-actions">
                <button @click="editObservation(observation)" title="Editar">
                  ✏️
                </button>
                <button @click="deleteObservation(observation.id)" title="Eliminar">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="no-observations" v-else>
          <p>No hay observaciones para esta clase en la fecha seleccionada.</p>
        </div>

        <!-- Formulario para agregar/editar observación -->
        <div class="observation-form">
          <h3>{{ isEditing ? 'Editar Observación' : 'Nueva Observación' }}</h3>
          <div class="form-group">
            <label for="observationType">Tipo:</label>
            <select id="observationType" v-model="newObservation.type">
              <option value="general">General</option>
              <option value="comportamiento">Comportamiento</option>
              <option value="academico">Académico</option>
              <option value="evaluacion">Evaluación</option>
            </select>
          </div>
          <div class="form-group">
            <label for="observationPriority">Prioridad:</label>
            <select id="observationPriority" v-model="newObservation.priority">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
          <div class="form-group">
            <label for="observationText">Observación:</label>
            <textarea 
              id="observationText" 
              v-model="newObservation.text" 
              rows="4"
              placeholder="Escribe tu observación aquí..."
            ></textarea>
          </div>
          <div class="form-actions">
            <button 
              class="cancel-button" 
              @click="resetForm"
              v-if="isEditing"
            >Cancelar</button>
            <button 
              class="save-button" 
              @click="saveObservation"
              :disabled="!isFormValid"
            >{{ isEditing ? 'Actualizar' : 'Guardar' }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTeacherObservations } from '../../../composables/useObservationManagement';
import type { ObservationData } from '../../../stores/observations';

// Props
const props = defineProps<{
  isOpen: boolean;
  classId: string;
  selectedDate: string;
}>();

// Emits
const emit = defineEmits<{
  close: [];
  'observation-created': [observation: ObservationData];
  'observation-updated': [observation: ObservationData];
  'observation-deleted': [observationId: string];
}>();

// Composable para gestionar observaciones
const { 
  loading, 
  error, 
  fetchMyClassObservations, 
  createMyObservation, 
  updateMyObservation, 
  deleteMyObservation 
} = useTeacherObservations();

// Estado local
const observations = ref<ObservationData[]>([]);
const filteredObservations = ref<ObservationData[]>([]);
const searchQuery = ref('');
const selectedType = ref('');
const selectedPriority = ref('');
const isEditing = ref(false);
const editingId = ref<string | null>(null);

// Nueva observación
const newObservation = ref<Partial<ObservationData>>({
  text: '',
  type: 'general',
  priority: 'media',
  requiresFollowUp: false,
});

// Validación del formulario
const isFormValid = computed(() => {
  return newObservation.value.text && newObservation.value.text.trim().length > 0;
});

// Cargar observaciones cuando se abre el modal
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen && props.classId && props.selectedDate) {
    await loadObservations();
  }
});

// Cargar observaciones al montar el componente si está abierto
onMounted(async () => {
  if (props.isOpen && props.classId && props.selectedDate) {
    await loadObservations();
  }
});

// Métodos
async function loadObservations() {
  try {
    observations.value = await fetchMyClassObservations(props.classId);
    filterObservations();
  } catch (err) {
    console.error('Error al cargar observaciones:', err);
  }
}

function filterObservations() {
  filteredObservations.value = observations.value.filter(obs => {
    // Filtrar por fecha (solo mostrar observaciones de la fecha seleccionada)
    if (obs.fecha !== props.selectedDate.replace(/-/g, '')) {
      return false;
    }
    
    // Filtrar por búsqueda
    const matchesSearch = !searchQuery.value || 
      obs.text.toLowerCase().includes(searchQuery.value.toLowerCase());
    
    // Filtrar por tipo
    const matchesType = !selectedType.value || obs.type === selectedType.value;
    
    // Filtrar por prioridad
    const matchesPriority = !selectedPriority.value || obs.priority === selectedPriority.value;
    
    return matchesSearch && matchesType && matchesPriority;
  });
}

function editObservation(observation: ObservationData) {
  isEditing.value = true;
  editingId.value = observation.id;
  newObservation.value = {
    text: observation.text,
    type: observation.type,
    priority: observation.priority,
    requiresFollowUp: observation.requiresFollowUp,
  };
}

async function saveObservation() {
  try {
    if (!isFormValid.value) return;
    
    const observationData: Partial<ObservationData> = {
      ...newObservation.value,
      classId: props.classId,
      className: '', // Se llenará en el backend
      date: props.selectedDate,
      fecha: props.selectedDate.replace(/-/g, ''), // Formato YYYYMMDD
      source: 'OBSERVACIONES_CLASE',
    };
    
    let savedObservation;
    
    if (isEditing.value && editingId.value) {
      // Actualizar observación existente
      savedObservation = await updateMyObservation(editingId.value, observationData);
      emit('observation-updated', savedObservation);
    } else {
      // Crear nueva observación
      savedObservation = await createMyObservation(observationData);
      emit('observation-created', savedObservation);
    }
    
    // Recargar observaciones y resetear formulario
    await loadObservations();
    resetForm();
  } catch (err) {
    console.error('Error al guardar observación:', err);
  }
}

async function deleteObservation(id: string) {
  if (confirm('¿Estás seguro de que deseas eliminar esta observación?')) {
    try {
      await deleteMyObservation(id);
      emit('observation-deleted', id);
      await loadObservations();
    } catch (err) {
      console.error('Error al eliminar observación:', err);
    }
  }
}

function resetForm() {
  newObservation.value = {
    text: '',
    type: 'general',
    priority: 'media',
    requiresFollowUp: false,
  };
  isEditing.value = false;
  editingId.value = null;
}

function closeModal() {
  resetForm();
  emit('close');
}

function formatDate(dateString: string) {
  try {
    const [year, month, day] = dateString.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return format(date, 'dd MMM yyyy', { locale: es });
  } catch (e) {
    return dateString;
  }
}

function getTypeLabel(type: string) {
  const types: Record<string, string> = {
    'general': 'General',
    'comportamiento': 'Comportamiento',
    'academico': 'Académico',
    'evaluacion': 'Evaluación',
    'asistencia': 'Asistencia'
  };
  return types[type] || type;
}
</script>

<style scoped>
.observations-manager {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-container {
  position: relative;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #3498db;
  color: white;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
}

.modal-body {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filters-section {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-box {
  flex: 1;
  min-width: 200px;
}

.search-box input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.filter-options {
  display: flex;
  gap: 0.5rem;
}

.filter-options select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.observations-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.observation-card {
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 0.75rem;
  background-color: #f9f9f9;
  border-left: 4px solid #3498db;
}

.priority-low {
  border-left-color: #2ecc71;
}

.priority-medium {
  border-left-color: #f39c12;
}

.priority-high {
  border-left-color: #e74c3c;
}

.priority-critical {
  border-left-color: #c0392b;
  background-color: #fadbd8;
}

.observation-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  color: #666;
}

.observation-content {
  margin-bottom: 0.5rem;
}

.observation-content p {
  margin: 0;
  line-height: 1.4;
}

.observation-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #666;
}

.observation-actions {
  display: flex;
  gap: 0.5rem;
}

.observation-actions button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  border-radius: 4px;
}

.observation-actions button:hover {
  background-color: #f0f0f0;
}

.no-observations {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.observation-form {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.observation-form h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.cancel-button {
  padding: 0.5rem 1rem;
  background-color: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-button {
  padding: 0.5rem 1rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    max-height: 95vh;
  }
  
  .filters-section {
    flex-direction: column;
  }
  
  .filter-options {
    width: 100%;
  }
  
  .filter-options select {
    flex: 1;
  }
}
</style>