<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useMontajeStore } from '../store/montaje'
import { TipoInstrumento, EstadoCompass, COLOR_ESTADOS_COMPASS } from '../types'
import { permissionsService } from '../service/permissionsService'
import { MontajePermission } from '../types/permissions'
import { compassStateService } from '../service/compassStateService'

// Propiedades
const props = defineProps({
  obraId: {
    type: String,
    required: true
  }
})

// Estado local
const montajeStore = useMontajeStore()
const isLoading = ref(true)
const hasPermission = ref(false)
const instrumentosObra = ref<TipoInstrumento[]>([])
const estadisticasPorInstrumento = ref<Record<TipoInstrumento, any>>({})
const selectedInstrument = ref<TipoInstrumento | null>(null)
const error = ref<string | null>(null)

// Colores para estados
const colors = COLOR_ESTADOS_COMPASS

// Verificar permisos para ver reportes agregados
async function checkPermissions() {
  try {
    hasPermission.value = await permissionsService.hasPermission(
      MontajePermission.VIEW_AGGREGATED_REPORTS
    )
  } catch (error) {
    console.error('Error al verificar permisos:', error)
    hasPermission.value = false
  }
}

// Cargar instrumentos de la obra
async function loadWorkInstruments() {
  if (!props.obraId) return
  
  isLoading.value = true
  error.value = null
  
  try {
    // Cargar obra si no está cargada
    if (!montajeStore.obraActual || montajeStore.obraActual.id !== props.obraId) {
      await montajeStore.cargarObra(props.obraId)
    }
    
    // Obtener instrumentos asignados a la obra desde los metadatos o configuración
    // Nota: Esto dependerá de cómo estén estructurados los datos de la obra
    // Por ahora usamos todos los instrumentos posibles
    instrumentosObra.value = Object.values(TipoInstrumento)
    
    // Cargar estadísticas para cada instrumento
    await loadAllInstrumentStatistics()
    
  } catch (err) {
    console.error('Error cargando instrumentos de la obra:', err)
    error.value = 'No se pudieron cargar los instrumentos'
  } finally {
    isLoading.value = false
  }
}

// Cargar estadísticas para todos los instrumentos
async function loadAllInstrumentStatistics() {
  const stats: Record<TipoInstrumento, any> = {} as Record<TipoInstrumento, any>
  
  for (const instrumento of instrumentosObra.value) {
    try {
      // Obtener estadísticas para este instrumento
      const estadisticas = await compassStateService.obtenerEstadisticas(
        props.obraId,
        instrumento
      )
      
      stats[instrumento] = estadisticas
    } catch (err) {
      console.error(`Error cargando estadísticas para ${instrumento}:`, err)
    }
  }
  
  estadisticasPorInstrumento.value = stats
}

// Seleccionar instrumento para ver detalles
function selectInstrument(instrumento: TipoInstrumento) {
  selectedInstrument.value = instrumento === selectedInstrument.value 
    ? null 
    : instrumento
}

// Calcular el progreso total de la obra por todos los instrumentos
const progresoTotal = computed(() => {
  if (Object.keys(estadisticasPorInstrumento.value).length === 0) return 0
  
  let totalCompases = 0
  let totalCompletados = 0
  
  for (const instrumento in estadisticasPorInstrumento.value) {
    const stats = estadisticasPorInstrumento.value[instrumento as TipoInstrumento]
    if (stats) {
      totalCompases += stats.totalCompases || 0
      totalCompletados += stats.completados || 0
    }
  }
  
  return totalCompases > 0 ? Math.round((totalCompletados / totalCompases) * 100) : 0
})

// Calcular instrumentos con más dificultades
const instrumentosConMasDificultades = computed(() => {
  if (Object.keys(estadisticasPorInstrumento.value).length === 0) return []
  
  return Object.entries(estadisticasPorInstrumento.value)
    .map(([instrumento, stats]: [string, any]) => ({
      instrumento,
      conDificultad: stats.conDificultad || 0,
      porcentajeDificultad: stats.totalCompases > 0 
        ? Math.round((stats.conDificultad / stats.totalCompases) * 100) 
        : 0
    }))
    .sort((a, b) => b.porcentajeDificultad - a.porcentajeDificultad)
    .slice(0, 5)
})

// Formatear estado para mostrar
function formatEstado(estado: EstadoCompass): string {
  return estado.replace(/_/g, ' ').toLowerCase()
}

// Determinar clase de color según porcentaje de progreso
function getProgressColorClass(porcentaje: number): string {
  if (porcentaje >= 80) return 'bg-green-500'
  if (porcentaje >= 60) return 'bg-green-400'
  if (porcentaje >= 40) return 'bg-yellow-400'
  if (porcentaje >= 20) return 'bg-orange-400'
  return 'bg-red-500'
}

// Cargar datos cuando cambia la obra
watch(() => props.obraId, loadWorkInstruments)

// Al montar el componente
onMounted(async () => {
  await checkPermissions()
  if (hasPermission.value) {
    await loadWorkInstruments()
  }
})
</script>

<template>
  <div class="director-aggregated-heatmap">
    <!-- Verificación de permisos -->
    <div v-if="!hasPermission" class="permission-error">
      <div class="alert alert-danger">
        No tienes permisos para ver reportes agregados. Esta función está reservada para directores y administradores.
      </div>
    </div>
    
    <!-- Pantalla de carga -->
    <div v-else-if="isLoading" class="loading-container text-center py-8">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2">Cargando datos agregados...</p>
    </div>
    
    <!-- Error -->
    <div v-else-if="error" class="error-container alert alert-danger">
      {{ error }}
    </div>
    
    <!-- Contenido principal -->
    <div v-else class="heatmap-content">
      <!-- Resumen general de progreso -->
      <div class="summary-stats mb-6 p-4 bg-white rounded-lg shadow-sm">
        <h3 class="text-xl font-bold mb-4">Resumen General de Progreso</h3>
        
        <div class="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Progreso total -->
          <div class="stat-card p-3 border rounded-lg">
            <div class="stat-title text-gray-500 text-sm">Progreso Total</div>
            <div class="stat-value text-3xl font-bold">{{ progresoTotal }}%</div>
            <div class="progress-bar mt-2 h-2 rounded-full bg-gray-200">
              <div 
                class="h-2 rounded-full" 
                :class="getProgressColorClass(progresoTotal)"
                :style="{ width: `${progresoTotal}%` }"
              ></div>
            </div>
          </div>
          
          <!-- Total instrumentos -->
          <div class="stat-card p-3 border rounded-lg">
            <div class="stat-title text-gray-500 text-sm">Instrumentos</div>
            <div class="stat-value text-3xl font-bold">{{ instrumentosObra.length }}</div>
            <div class="stat-description text-sm mt-2">
              {{ Object.keys(estadisticasPorInstrumento).length }} con datos
            </div>
          </div>
          
          <!-- Instrumentos con dificultad -->
          <div class="stat-card p-3 border rounded-lg">
            <div class="stat-title text-gray-500 text-sm">Instrumentos con dificultades</div>
            <div class="stat-value text-3xl font-bold">
              {{ instrumentosConMasDificultades.length > 0 ? instrumentosConMasDificultades[0].instrumento : 'Ninguno' }}
            </div>
            <div class="stat-description text-sm mt-2" v-if="instrumentosConMasDificultades.length > 0">
              {{ instrumentosConMasDificultades[0].porcentajeDificultad }}% de compases con dificultad
            </div>
          </div>
        </div>
      </div>
      
      <!-- Mapa de calor por instrumento -->
      <div class="instrument-heatmap mb-6 p-4 bg-white rounded-lg shadow-sm">
        <h3 class="text-xl font-bold mb-4">Progreso por Instrumento</h3>
        
        <div class="instrument-grid overflow-x-auto">
          <table class="w-full table-auto">
            <thead>
              <tr class="bg-gray-100">
                <th class="px-4 py-2 text-left">Instrumento</th>
                <th class="px-4 py-2 text-center">Progreso</th>
                <th class="px-4 py-2 text-center">Completado</th>
                <th class="px-4 py-2 text-center">Con dificultad</th>
                <th class="px-4 py-2 text-center">Sin trabajar</th>
                <th class="px-4 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="instrumento in instrumentosObra" 
                :key="instrumento"
                :class="{ 'bg-blue-50': selectedInstrument === instrumento }"
                class="hover:bg-gray-50 border-b"
              >
                <td class="px-4 py-2 font-medium">{{ instrumento }}</td>
                <td class="px-4 py-2">
                  <div class="flex items-center">
                    <div class="progress-bar flex-1 h-4 bg-gray-200 rounded-full">
                      <div 
                        class="h-4 rounded-full"
                        :class="getProgressColorClass(estadisticasPorInstrumento[instrumento]?.porcentajeCompletado || 0)"
                        :style="{ width: `${estadisticasPorInstrumento[instrumento]?.porcentajeCompletado || 0}%` }"
                      ></div>
                    </div>
                    <span class="ml-2 text-sm">
                      {{ estadisticasPorInstrumento[instrumento]?.porcentajeCompletado || 0 }}%
                    </span>
                  </div>
                </td>
                <td class="px-4 py-2 text-center">
                  {{ estadisticasPorInstrumento[instrumento]?.completados || 0 }}
                  <span class="text-xs text-gray-500">compases</span>
                </td>
                <td class="px-4 py-2 text-center">
                  <span 
                    :class="{'text-red-600 font-bold': estadisticasPorInstrumento[instrumento]?.conDificultad > 0}"
                  >
                    {{ estadisticasPorInstrumento[instrumento]?.conDificultad || 0 }}
                  </span>
                </td>
                <td class="px-4 py-2 text-center">
                  {{ estadisticasPorInstrumento[instrumento]?.sinTrabajar || 0 }}
                </td>
                <td class="px-4 py-2 text-center">
                  <button 
                    @click="selectInstrument(instrumento)" 
                    class="btn btn-sm btn-outline-primary"
                  >
                    <span v-if="selectedInstrument === instrumento">Ocultar</span>
                    <span v-else>Detalles</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Detalles del instrumento seleccionado -->
      <div 
        v-if="selectedInstrument" 
        class="instrument-details p-4 bg-white rounded-lg shadow-sm"
      >
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">
            Detalles de {{ selectedInstrument }}
          </h3>
          <button 
            @click="selectedInstrument = null" 
            class="btn btn-sm btn-outline-secondary"
          >
            Cerrar
          </button>
        </div>
        
        <div v-if="estadisticasPorInstrumento[selectedInstrument]" class="stats-detail">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div 
              v-for="(estado, i) in Object.values(EstadoCompass)" 
              :key="`estado-${i}`"
              class="estado-card p-3 border rounded-lg"
            >
              <div class="flex items-center gap-2">
                <div 
                  class="color-box w-4 h-4 rounded" 
                  :style="{ backgroundColor: colors[estado].hex }"
                ></div>
                <div class="text-sm">{{ formatEstado(estado) }}</div>
              </div>
              <div class="text-xl font-bold mt-1">
                {{ estadisticasPorInstrumento[selectedInstrument][estado.toLowerCase()] || 0 }}
              </div>
              <div class="text-xs text-gray-500">compases</div>
            </div>
          </div>
          
          <!-- Recomendaciones basadas en datos -->
          <div class="recommendations p-3 bg-blue-50 rounded-lg">
            <h4 class="font-bold mb-2">Recomendaciones</h4>
            <ul class="text-sm">
              <li v-if="estadisticasPorInstrumento[selectedInstrument].conDificultad > 0" class="mb-1">
                🔍 Revisar {{ estadisticasPorInstrumento[selectedInstrument].conDificultad }} compases con dificultades
              </li>
              <li v-if="estadisticasPorInstrumento[selectedInstrument].sinTrabajar > 0" class="mb-1">
                🚀 Priorizar {{ estadisticasPorInstrumento[selectedInstrument].sinTrabajar }} compases sin trabajar
              </li>
              <li v-if="estadisticasPorInstrumento[selectedInstrument].porcentajeCompletado >= 80" class="mb-1">
                🎉 Instrumento casi completo, programar ensayo completo
              </li>
              <li v-if="estadisticasPorInstrumento[selectedInstrument].porcentajeCompletado < 30" class="mb-1">
                ⚠️ Progreso bajo, considerar asignar más tiempo de ensayo
              </li>
            </ul>
          </div>
        </div>
        
        <div v-else class="no-data alert alert-info">
          No hay datos detallados disponibles para este instrumento.
        </div>
      </div>
      
      <!-- Instrumentos con más dificultades -->
      <div class="difficulty-summary p-4 bg-white rounded-lg shadow-sm mt-6">
        <h3 class="text-xl font-bold mb-4">Instrumentos con Más Dificultades</h3>
        
        <div v-if="instrumentosConMasDificultades.length > 0" class="difficulty-chart">
          <div 
            v-for="item in instrumentosConMasDificultades"
            :key="item.instrumento"
            class="difficulty-item flex items-center mb-2"
          >
            <div class="instrument-name w-32 font-medium">{{ item.instrumento }}</div>
            <div class="progress-container flex-1 h-6 bg-gray-200 rounded-full">
              <div 
                class="h-6 bg-red-500 rounded-full flex items-center justify-end pr-2"
                :style="{ width: `${item.porcentajeDificultad}%` }"
              >
                <span v-if="item.porcentajeDificultad > 10" class="text-white text-xs">
                  {{ item.conDificultad }} compases
                </span>
              </div>
            </div>
            <div class="percentage w-16 text-right ml-2">
              {{ item.porcentajeDificultad }}%
            </div>
          </div>
        </div>
        
        <div v-else class="no-difficulties alert alert-success">
          No se han identificado dificultades específicas en los instrumentos.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.director-aggregated-heatmap {
  @apply w-full;
}

/* Soporte para modo oscuro */
:root.dark .summary-stats,
:root.dark .instrument-heatmap,
:root.dark .instrument-details,
:root.dark .difficulty-summary {
  @apply bg-gray-800 text-white;
}

:root.dark .recommendations {
  @apply bg-blue-900;
}

:root.dark .bg-gray-50 {
  @apply bg-gray-700;
}

:root.dark .bg-gray-100 {
  @apply bg-gray-700;
}

:root.dark .bg-blue-50 {
  @apply bg-blue-900;
}

:root.dark .border {
  @apply border-gray-700;
}

:root.dark .hover\:bg-gray-50:hover {
  @apply bg-gray-700;
}

:root.dark tr.bg-blue-50 {
  @apply bg-blue-900;
}
</style>
