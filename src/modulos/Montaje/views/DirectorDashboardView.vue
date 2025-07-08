<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMontajeStore } from '../store/montaje'
import { permissionsService } from '../service/permissionsService'
import { MontajePermission } from '../types/permissions'
import DirectorAggregatedHeatmap from '../components/DirectorAggregatedHeatmap.vue'

const router = useRouter()
const route = useRoute()
const montajeStore = useMontajeStore()

// Estado
const isLoading = ref(true)
const error = ref<string | null>(null)
const hasPermission = ref(false)

// Calcular ID de obra desde ruta
const obraId = computed(() => route.params.id?.toString() || '')

// Determinar si hay una obra seleccionada
const hasSelectedWork = computed(() => !!montajeStore.obraActual)

// Cargar datos iniciales
async function loadInitialData() {
  isLoading.value = true
  error.value = null
  
  try {
    // Verificar permisos RBAC para ver reportes agregados
    const canViewAggregated = await permissionsService.hasPermission(
      MontajePermission.VIEW_AGGREGATED_REPORTS
    )
    hasPermission.value = canViewAggregated
    
    if (!hasPermission.value) {
      error.value = 'No tienes permisos para ver esta página. Esta función está reservada para directores y administradores.'
      return
    }
    
    // Cargar obra actual si no está cargada
    if (obraId.value && !montajeStore.obraActual) {
      await montajeStore.cargarObra(obraId.value)
    }
    
  } catch (err) {
    console.error('Error cargando datos del dashboard:', err)
    error.value = 'Error al cargar información. Intenta nuevamente.'
  } finally {
    isLoading.value = false
  }
}

// Volver a la lista de obras
function goBack() {
  router.push('/montaje/obras')
}

// Al montar el componente
onMounted(loadInitialData)
</script>

<template>
  <div class="director-dashboard">
    <!-- Barra superior con navegación y título -->
    <div class="top-bar mb-4 flex items-center gap-4">
      <button @click="goBack" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left"></i> Volver
      </button>
      
      <h2 class="text-2xl font-bold m-0">
        {{ montajeStore.obraActual?.titulo 
          ? `Dashboard de Director: ${montajeStore.obraActual.titulo}` 
          : 'Dashboard de Director' }}
      </h2>
    </div>
    
    <!-- Pantalla de carga -->
    <div v-if="isLoading" class="loading-container py-8 text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2">Cargando dashboard...</p>
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
      No tienes permisos para ver el dashboard de director.
      Esta función está reservada para usuarios con rol de Director o Administrador.
    </div>
    
    <!-- Contenido principal -->
    <div v-else class="dashboard-content">
      <div class="intro-text mb-6">
        <div class="alert alert-info">
          <h4 class="alert-heading">Dashboard de Director</h4>
          <p>
            Esta vista te permite monitorear el progreso de todos los instrumentos en la obra seleccionada.
            Podrás identificar fácilmente los instrumentos con más dificultades o que necesitan atención.
          </p>
        </div>
      </div>
      
      <!-- Mapa de calor agregado -->
      <DirectorAggregatedHeatmap :obra-id="obraId" />
    </div>
  </div>
</template>

<style scoped>
.director-dashboard {
  @apply p-4 max-w-6xl mx-auto;
}

.loading-container, .error-container, 
.no-work-selected, .no-permission {
  @apply my-8 p-6 rounded-lg;
}

/* Soporte para modo oscuro */
:root.dark .intro-text .alert-info {
  @apply bg-blue-900 border-blue-800 text-white;
}
</style>
