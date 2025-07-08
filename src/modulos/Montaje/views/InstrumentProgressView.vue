<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMontajeStore } from '../store/montaje'
import { useRouter, useRoute } from 'vue-router'
import { TipoInstrumento } from '../types'
import { permissionsService } from '../service/permissionsService'
import { MontajePermission } from '../types/permissions'
import InstrumentProgressGrid from '../components/InstrumentProgressGrid.vue'

const router = useRouter()
const route = useRoute()
const montajeStore = useMontajeStore()

// Estado
const isLoading = ref(true)
const error = ref<string | null>(null)
const selectedInstrument = ref<TipoInstrumento | null>(null)
const hasPermission = ref(false)

// Calcular ID de obra desde ruta
const obraId = computed(() => route.params.id?.toString() || '')

// Obtener lista de instrumentos del maestro
const teacherInstruments = computed(() => montajeStore.teacherInstruments || [])

// Determinar si hay una obra seleccionada
const hasSelectedWork = computed(() => !!montajeStore.obraActual)

// Seleccionar instrumento
async function selectInstrument(instrument: TipoInstrumento) {
  if (!hasPermission.value) return
  
  try {
    selectedInstrument.value = instrument
    await montajeStore.seleccionarInstrumento(instrument)
  } catch (err) {
    console.error('Error al seleccionar instrumento:', err)
    error.value = 'No se pudo cargar la información del instrumento'
  }
}

// Cargar información inicial
async function loadInitialData() {
  isLoading.value = true
  error.value = null
  
  try {
    // Verificar permisos RBAC
    const canViewInstruments = await permissionsService.hasPermission(
      MontajePermission.VIEW_INSTRUMENT_COMPASS_STATES
    )
    hasPermission.value = canViewInstruments
    
    if (!hasPermission.value) {
      error.value = 'No tienes permisos para ver esta página'
      return
    }
    
    // Cargar obra actual si no está cargada
    if (obraId.value && !montajeStore.obraActual) {
      await montajeStore.cargarObra(obraId.value)
    }
    
    // Cargar instrumentos del maestro
    await montajeStore.cargarInstrumentosMaestro()
    
    // Seleccionar automáticamente el primer instrumento si solo hay uno
    if (teacherInstruments.value.length === 1) {
      await selectInstrument(teacherInstruments.value[0])
    }
    
  } catch (err) {
    console.error('Error cargando datos iniciales:', err)
    error.value = 'Error al cargar información. Intenta nuevamente.'
  } finally {
    isLoading.value = false
  }
}

// Volver a la lista de obras
function goBack() {
  router.push('/montaje/obras')
}

onMounted(loadInitialData)
</script>

<template>
  <div class="instrument-progress-view">
    <!-- Barra superior con navegación y título -->
    <div class="top-bar mb-4 flex items-center gap-4">
      <button @click="goBack" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left"></i> Volver
      </button>
      
      <h2 class="text-2xl font-bold m-0">
        {{ montajeStore.obraActual?.titulo || 'Progreso por instrumento' }}
      </h2>
    </div>
    
    <!-- Pantalla de carga -->
    <div v-if="isLoading" class="loading-container py-8 text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2">Cargando información del instrumento...</p>
    </div>
    
    <!-- Mensaje de error -->
    <div v-else-if="error" class="error-container alert alert-danger">
      {{ error }}
    </div>
    
    <!-- Sin obra seleccionada -->
    <div v-else-if="!hasSelectedWork" class="no-work-selected alert alert-warning">
      No hay obra seleccionada. Por favor, selecciona una obra primero.
    </div>
    
    <!-- Sin permisos -->
    <div v-else-if="!hasPermission" class="no-permission alert alert-danger">
      No tienes permisos para ver o gestionar el progreso por instrumento.
    </div>
    
    <!-- Sin instrumentos asignados -->
    <div v-else-if="teacherInstruments.length === 0" class="no-instruments alert alert-info">
      No tienes instrumentos asignados para esta obra. 
      Contacta con tu director para que te asigne instrumentos.
    </div>
    
    <!-- Contenido principal -->
    <div v-else class="main-content">
      <!-- Selector de instrumentos (solo si hay más de uno) -->
      <div v-if="teacherInstruments.length > 1" class="instrument-selector mb-4">
        <div class="text-lg font-medium mb-2">Selecciona un instrumento:</div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="instrument in teacherInstruments"
            :key="instrument"
            @click="selectInstrument(instrument)"
            class="btn"
            :class="instrument === selectedInstrument 
              ? 'btn-primary' 
              : 'btn-outline-secondary'"
          >
            {{ instrument }}
          </button>
        </div>
      </div>
      
      <!-- Grid de progreso para el instrumento seleccionado -->
      <div v-if="selectedInstrument" class="progress-grid-container">
        <InstrumentProgressGrid 
          :obra-id="obraId" 
          :instrument-id="selectedInstrument"
          :read-only="!montajeStore.hasInstrumentStatePermission"
        />
      </div>
      
      <!-- Instrucciones si no hay instrumento seleccionado -->
      <div v-else class="no-instrument-selected p-4 bg-gray-100 rounded">
        <p class="mb-0">Selecciona un instrumento para ver y gestionar su progreso.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.instrument-progress-view {
  @apply p-4 max-w-6xl mx-auto;
}

.loading-container, .error-container, .no-work-selected,
.no-permission, .no-instruments, .no-instrument-selected {
  @apply my-8 p-6 rounded-lg;
}

/* Soporte para modo oscuro */
:root.dark .no-instrument-selected {
  @apply bg-gray-700;
}
</style>
