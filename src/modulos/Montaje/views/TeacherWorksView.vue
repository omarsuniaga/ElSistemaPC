<template>
  <div class="teacher-works-container">
    <div class="header-container">
      <h1 class="title">Obras por Instrumento</h1>
      <div class="instruments-filter" v-if="teacherInstruments.length > 0">
        <span class="filter-label">Filtrar por instrumento:</span>
        <select v-model="selectedInstrument" class="instrument-select">
          <option :value="null">Todos mis instrumentos</option>
          <option v-for="instrument in teacherInstruments" :key="instrument" :value="instrument">
            {{ instrument }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando obras...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="cargarObrasProfesor" class="retry-button">Reintentar</button>
    </div>
    
    <div v-else-if="obras.length === 0" class="empty-container">
      <p class="empty-message">No se encontraron obras para los instrumentos asignados</p>
    </div>
    
    <div v-else class="works-grid">
      <div 
        v-for="obra in obrasFiltradas" 
        :key="obra.id" 
        class="work-card"
        @click="verDetalleObra(obra)"
      >
        <div class="work-card-header">
          <h2 class="work-title">{{ obra.titulo }}</h2>
          <span :class="['difficulty-badge', getDifficultyClass(obra.dificultad)]">
            {{ obra.dificultad || 'Normal' }}
          </span>
        </div>
        
        <div class="work-instruments">
          <span v-for="(instrumento, i) in obra.instrumentacion" :key="i" class="instrument-tag">
            {{ instrumento }}
          </span>
        </div>
        
        <div class="work-info">
          <p v-if="obra.autor"><strong>Autor:</strong> {{ obra.autor }}</p>
          <p v-if="obra.compases"><strong>Compases:</strong> {{ obra.compases }}</p>
        </div>
        
        <div class="work-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="`width: ${calcularProgreso(obra)}%`"></div>
          </div>
          <span class="progress-text">{{ calcularProgreso(obra) }}% completado</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMontajeStore } from '../store/montaje'
import { useAuthStore } from '@/stores/auth'
import { Obra, TipoInstrumento } from '../types'

const router = useRouter()
const montajeStore = useMontajeStore()
const authStore = useAuthStore()

// Estado
const selectedInstrument = ref<TipoInstrumento | null>(null)
const currentRepertorioId = ref('principal') // Por defecto

// Getters computed
const isLoading = computed(() => montajeStore.isLoading)
const error = computed(() => montajeStore.error)
const obras = computed(() => montajeStore.obras)
const teacherInstruments = computed(() => montajeStore.teacherInstruments)

// Filtrar obras según el instrumento seleccionado
const obrasFiltradas = computed(() => {
  if (!selectedInstrument.value) {
    return obras.value
  }
  
  return obras.value.filter(obra => 
    obra.instrumentacion?.includes(selectedInstrument.value)
  )
})

// Funciones
async function cargarObrasProfesor() {
  if (!authStore.user?.uid) {
    console.error('Usuario no autenticado')
    return
  }
  
  try {
    await montajeStore.cargarObrasPorInstrumentoProfesor(currentRepertorioId.value)
  } catch (err) {
    console.error('Error al cargar obras del profesor:', err)
  }
}

function verDetalleObra(obra: Obra) {
  montajeStore.selectWork(obra)
  router.push({ name: 'MontajeWorkDetail', params: { workId: obra.id } })
}

function getDifficultyClass(dificultad?: string) {
  switch (dificultad?.toLowerCase()) {
    case 'fácil':
    case 'facil':
      return 'difficulty-easy'
    case 'medio':
    case 'intermedio':
      return 'difficulty-medium'
    case 'difícil':
    case 'dificil':
      return 'difficulty-hard'
    default:
      return 'difficulty-normal'
  }
}

function calcularProgreso(obra: Obra): number {
  // Implementar cálculo de progreso según estados de compases para esta obra
  // Por ahora retornamos un valor aleatorio entre 0-100 como ejemplo
  return Math.floor(Math.random() * 100)
}

// Vigilar cambios en el instrumento seleccionado
watch(selectedInstrument, () => {
  montajeStore.instrumentFilter = selectedInstrument.value
})

// Al montar el componente
onMounted(async () => {
  if (authStore.isTeacher && authStore.user?.uid) {
    cargarObrasProfesor()
  }
})
</script>

<style scoped>
.teacher-works-container {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 100px;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.title {
  font-size: 1.8rem;
  margin: 0;
  color: var(--color-text-primary);
}

.instruments-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.instrument-select {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.error-message {
  color: var(--color-error);
  font-weight: 500;
  margin-bottom: 1rem;
}

.retry-button {
  padding: 0.5rem 1.5rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.empty-message {
  color: var(--color-text-secondary);
  font-style: italic;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.work-card {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-border);
}

.work-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
}

.work-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.work-title {
  font-size: 1.3rem;
  margin: 0;
  color: var(--color-heading);
  flex: 1;
}

.difficulty-badge {
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
}

.difficulty-easy {
  background-color: #e6f7ea;
  color: #28a745;
}

.difficulty-medium {
  background-color: #fff8e6;
  color: #ffc107;
}

.difficulty-hard {
  background-color: #feebeb;
  color: #dc3545;
}

.difficulty-normal {
  background-color: #e6f3ff;
  color: #0d6efd;
}

.work-instruments {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.instrument-tag {
  font-size: 0.8rem;
  background-color: var(--color-background);
  color: var(--color-text-secondary);
  padding: 0.2rem 0.5rem;
  border-radius: 50px;
  border: 1px solid var(--color-border);
}

.work-info {
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.work-info p {
  margin: 0.25rem 0;
  color: var(--color-text-secondary);
}

.work-progress {
  margin-top: 1rem;
}

.progress-bar {
  height: 8px;
  background-color: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-primary);
  border-radius: 4px;
}

.progress-text {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

@media (max-width: 768px) {
  .header-container {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .works-grid {
    grid-template-columns: 1fr;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.dark-theme {
  --color-background: #1e1e2e;
  --color-background-soft: #2a2a3c;
  --color-border: #313244;
  --color-heading: #f5e0dc;
  --color-text-primary: #cdd6f4;
  --color-text-secondary: #a6adc8;
  
  .difficulty-easy {
    background-color: rgba(40, 167, 69, 0.2);
  }
  
  .difficulty-medium {
    background-color: rgba(255, 193, 7, 0.2);
  }
  
  .difficulty-hard {
    background-color: rgba(220, 53, 69, 0.2);
  }
  
  .difficulty-normal {
    background-color: rgba(13, 110, 253, 0.2);
  }
  
  .spinner {
    border-color: rgba(255, 255, 255, 0.1);
    border-left-color: var(--color-primary);
  }
}
</style>
