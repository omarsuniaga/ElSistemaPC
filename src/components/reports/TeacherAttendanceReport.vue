<template>
  <div class="teacher-attendance-report min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                Reporte de Asistencia
              </h1>
              <p class="mt-1 text-sm text-gray-600" v-if="teacherInfo">
                {{ teacherInfo.name }} • {{ selectedPeriodText }}
              </p>
            </div>
            
            <!-- Botones de vista -->
            <div class="flex items-center space-x-2">
              <div class="hidden sm:flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  @click="activeView = 'overview'"
                  :class="[
                    'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                    activeView === 'overview' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  ]"
                >
                  Resumen
                </button>
                <button
                  @click="activeView = 'charts'"
                  :class="[
                    'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                    activeView === 'charts' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  ]"
                >
                  Gráficos
                </button>
                <button
                  @click="activeView = 'grid'"
                  :class="[
                    'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                    activeView === 'grid' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  ]"
                >
                  Estudiantes
                </button>
                <button
                  @click="activeView = 'export'"
                  :class="[
                    'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                    activeView === 'export' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  ]"
                >
                  Exportar
                </button>
              </div>
              
              <button
                @click="refreshData"
                :disabled="loading"
                class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Selector de período -->
      <div class="mb-6">
        <DateRangeSelector
          v-model:period="selectedPeriod"
          v-model:custom-range="customDateRange"
          @change="handlePeriodChange"
        />
      </div>

      <!-- Estado de carga -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Cargando datos de asistencia...</p>
      </div>

      <!-- Estado de error -->
      <div v-else-if="error" class="text-center py-12">
        <div class="text-red-600 mb-4">
          <svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <button 
          @click="refreshData"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Reintentar
        </button>
      </div>

      <!-- Contenido principal -->
      <div v-else class="space-y-6">
        <!-- Vista de resumen -->
        <div v-if="activeView === 'overview'" class="space-y-6">
          <!-- Resumen general -->
          <AttendanceOverview
            :stats="overviewStats"
            :total-students="totalStudents"
            :date-range="actualDateRange"
          />

          <!-- Tarjetas de clases -->
          <div v-if="reportData && reportData.length > 0">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Clases del Maestro</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ClassAttendanceCard
                v-for="classData in reportData"
                :key="classData.classId"
                :class-data="classData"
                @view-details="showClassDetails"
              />
            </div>
          </div>

          <!-- Estado vacío -->
          <div v-else class="text-center py-12">
            <div class="text-gray-400 mb-4">
              <svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No hay datos disponibles</h3>
            <p class="text-gray-600">No se encontraron registros de asistencia para el período seleccionado.</p>
          </div>
        </div>

        <!-- Vista de gráficos -->
        <div v-if="activeView === 'charts'">
          <AttendanceCharts
            :attendance-data="reportData"
            :date-range="actualDateRange"
          />
        </div>

        <!-- Vista de grilla de estudiantes -->
        <div v-if="activeView === 'grid'">
          <StudentAttendanceGrid
            :attendance-data="reportData"
            @export-student="handleStudentExport"
          />
        </div>

        <!-- Vista de exportación -->
        <div v-if="activeView === 'export'">
          <ExportControls
            :attendance-data="reportData"
            :date-range="actualDateRange"
            :teacher-name="teacherInfo?.name"
            @export="handleExport"
          />
        </div>
      </div>
    </div>

    <!-- Modal de detalles de clase -->
    <ClassDetailsModal
      :is-open="!!selectedClassDetails"
      :class-data="selectedClassDetails"
      :date-range="actualDateRange"
      @close="closeClassDetails"
      @export="handleExport"
    />
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import DateRangeSelector from './components/DateRangeSelector.vue'
import AttendanceOverview from './components/AttendanceOverview.vue'
import ClassAttendanceCard from './components/ClassAttendanceCard.vue'
import AttendanceCharts from './components/AttendanceCharts.vue'
import StudentAttendanceGrid from './components/StudentAttendanceGrid.vue'
import ExportControls from './components/ExportControls.vue'
import ClassDetailsModal from './components/ClassDetailsModal.vue'
import { useAttendanceReport } from './composables/useAttendanceReport'

export default {
  name: 'TeacherAttendanceReport',
  components: {
    DateRangeSelector,
    AttendanceOverview,
    ClassAttendanceCard,
    AttendanceCharts,
    StudentAttendanceGrid,
    ExportControls,
    ClassDetailsModal
  },
  props: {
    teacherId: {
      type: String,
      default: null
    }
  },
  setup(props) {
    // Estado local del componente
    const selectedClassDetails = ref(null)
    const activeView = ref('overview') // 'overview', 'grid', 'charts', 'export'
    
    // Estado del composable principal
    const {
      loading,
      error,
      reportData,
      teacherInfo,
      selectedPeriod,
      customDateRange,
      selectedPeriodText,
      actualDateRange,
      overviewStats,
      chartData,
      totalStudents,
      refreshData,
      handlePeriodChange
    } = useAttendanceReport()

    // Métodos del componente
    const showClassDetails = (classData) => {
      selectedClassDetails.value = classData
    }

    const closeClassDetails = () => {
      selectedClassDetails.value = null
    }

    const handleExport = (exportConfig) => {
      console.log('Exportando con configuración:', exportConfig)
      // Aquí implementar la lógica de exportación
    }

    const handleStudentExport = (student) => {
      console.log('Exportando datos del estudiante:', student)
      // Aquí implementar la lógica de exportación de estudiante
    }

    // Inicialización
    onMounted(() => {
      refreshData()
    })

    // Watchers
    watch(() => selectedPeriod.value, () => {
      if (selectedPeriod.value !== 'custom') {
        handlePeriodChange()
      }
    })

    return {
      // Estado local
      selectedClassDetails,
      activeView,
      
      // Estado del composable
      loading,
      error,
      reportData,
      teacherInfo,
      selectedPeriod,
      customDateRange,
      selectedPeriodText,
      actualDateRange,
      overviewStats,
      chartData,
      totalStudents,
      
      // Métodos
      refreshData,
      handlePeriodChange,
      showClassDetails,
      closeClassDetails,
      handleExport,
      handleStudentExport
    }
  }
}
</script>

<style scoped>
/* Transiciones suaves */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Animaciones de carga */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Mejoras responsive */
@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

/* Estilos para impresión */
@media print {
  .teacher-attendance-report {
    background: white !important;
  }
  
  .report-header {
    box-shadow: none !important;
    border-bottom: 2px solid #000 !important;
  }
}
</style>
