<template>
  <div class="performance-dashboard">
    <!-- Header con resumen general -->
    <div class="dashboard-header">
      <div class="header-content">
        <h1 class="dashboard-title">Dashboard de Rendimiento Estudiantil</h1>
        <p class="dashboard-subtitle">
          Análisis integral del desempeño académico basado en asistencia, repertorio y observaciones
        </p>
      </div>
      <div class="header-actions">
        <button 
          class="btn btn-primary"
          @click="refreshData"
          :disabled="loading"
        >
          <Icon name="heroicons:arrow-path" :class="{ 'animate-spin': loading }" />
          Actualizar
        </button>
        <button 
          class="btn btn-secondary"
          @click="showFilters = !showFilters"
        >
          <Icon name="heroicons:funnel" />
          Filtros
        </button>
        <button 
          class="btn btn-secondary"
          @click="exportData"
        >
          <Icon name="heroicons:arrow-down-tray" />
          Exportar
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div v-if="showFilters" class="filters-section">
      <div class="filters-grid">
        <div class="filter-group">
          <label class="filter-label">Clasificación</label>
          <multiselect
            v-model="selectedClassifications"
            :options="classificationOptions"
            multiple
            placeholder="Todas las clasificaciones"
            :close-on-select="false"
            class="filter-multiselect"
          />
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Asistencia mínima (%)</label>
          <input
            v-model.number="minAttendance"
            type="range"
            min="0"
            max="100"
            class="filter-range"
          />
          <span class="range-value">{{ minAttendance }}%</span>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Puntuación mínima</label>
          <input
            v-model.number="minScore"
            type="range"
            min="0"
            max="100"
            class="filter-range"
          />
          <span class="range-value">{{ minScore }}</span>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Rango de fechas</label>
          <div class="date-range">
            <input
              v-model="dateRange.start"
              type="date"
              class="filter-date"
            />
            <span class="date-separator">a</span>
            <input
              v-model="dateRange.end"
              type="date"
              class="filter-date"
            />
          </div>
        </div>
      </div>
      
      <div class="filter-actions">
        <button class="btn btn-sm btn-primary" @click="applyFilters">
          Aplicar Filtros
        </button>
        <button class="btn btn-sm btn-secondary" @click="clearFilters">
          Limpiar
        </button>
      </div>
    </div>

    <!-- Métricas de resumen -->
    <div class="summary-section">
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-icon bg-blue-100 text-blue-600">
            <Icon name="heroicons:users" />
          </div>
          <div class="summary-content">
            <div class="summary-number">{{ summary.totalStudents }}</div>
            <div class="summary-label">Total Estudiantes</div>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="summary-icon bg-green-100 text-green-600">
            <Icon name="heroicons:chart-bar" />
          </div>
          <div class="summary-content">
            <div class="summary-number">{{ summary.averageScore }}</div>
            <div class="summary-label">Promedio General</div>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="summary-icon bg-purple-100 text-purple-600">
            <Icon name="heroicons:calendar-days" />
          </div>
          <div class="summary-content">
            <div class="summary-number">{{ summary.averageAttendance }}%</div>
            <div class="summary-label">Asistencia Promedio</div>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="summary-icon bg-orange-100 text-orange-600">
            <Icon name="heroicons:arrow-trending-up" />
          </div>
          <div class="summary-content">
            <div class="summary-number">{{ summary.trends.improving }}</div>
            <div class="summary-label">Mejorando</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Gráfico de distribución de clasificaciones -->
    <div class="chart-section">
      <div class="chart-card">
        <h3 class="chart-title">Distribución por Clasificación</h3>
        <div class="classification-chart">
          <div 
            v-for="(count, classification) in summary.classifications" 
            :key="classification"
            class="classification-bar"
          >
            <div class="classification-label">{{ classification }}</div>
            <div class="classification-progress">
              <div 
                class="classification-fill"
                :class="getClassificationColor(classification)"
                :style="{ width: `${(count / summary.totalStudents) * 100}%` }"
              ></div>
            </div>
            <div class="classification-count">{{ count }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs para diferentes vistas -->
    <div class="tabs-section">
      <div class="tabs-header">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-button"
          :class="{ 'tab-active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <Icon :name="tab.icon" />
          {{ tab.label }}
          <span v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</span>
        </button>
      </div>
      
      <div class="tabs-content">
        <!-- Vista general -->
        <div v-if="activeTab === 'general'" class="tab-panel">
          <div class="students-grid">
            <StudentPerformanceCard
              v-for="student in paginatedStudents"
              :key="student.studentId"
              :performance="student"
              :show-trend="true"
              :show-recommendations="false"
              :show-actions="true"
              @view-details="handleViewDetails"
              @view-profile="handleViewProfile"
              @needs-attention="handleNeedsAttention"
            />
          </div>
          
          <!-- Paginación -->
          <div v-if="totalPages > 1" class="pagination">
            <button 
              class="pagination-btn"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              <Icon name="heroicons:chevron-left" />
              Anterior
            </button>
            
            <div class="pagination-info">
              Página {{ currentPage }} de {{ totalPages }}
            </div>
            
            <button 
              class="pagination-btn"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              Siguiente
              <Icon name="heroicons:chevron-right" />
            </button>
          </div>
        </div>

        <!-- Top performers -->
        <div v-if="activeTab === 'top'" class="tab-panel">
          <div class="top-performers">
            <div class="performers-header">
              <h3>Mejores Estudiantes</h3>
              <p class="text-sm text-gray-600">Los 10 estudiantes con mejor rendimiento general</p>
            </div>
            <div class="performers-list">
              <div 
                v-for="(student, index) in topPerformers" 
                :key="student.studentId"
                class="performer-item"
              >
                <div class="performer-rank">
                  <div class="rank-badge" :class="getRankClass(index)">
                    {{ index + 1 }}
                  </div>
                </div>
                <StudentPerformanceCard
                  :performance="student"
                  :highlighted="index < 3"
                  :compact="true"
                  @view-details="handleViewDetails"
                  @view-profile="handleViewProfile"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Necesitan atención -->
        <div v-if="activeTab === 'attention'" class="tab-panel">
          <div class="attention-section">
            <div class="attention-header">
              <h3>Estudiantes que Necesitan Atención</h3>
              <p class="text-sm text-gray-600">
                Estudiantes con bajo rendimiento, asistencia irregular o tendencia descendente
              </p>
            </div>
            <div class="attention-list">
              <StudentPerformanceCard
                v-for="student in studentsNeedingAttention"
                :key="student.studentId"
                :performance="student"
                :show-recommendations="true"
                class="attention-card"
                @view-details="handleViewDetails"
                @view-profile="handleViewProfile"
                @needs-attention="handleNeedsAttention"
              />
            </div>
          </div>
        </div>

        <!-- Análisis detallado -->
        <div v-if="activeTab === 'analysis'" class="tab-panel">
          <div class="analysis-section">
            <div class="analysis-grid">
              <div class="analysis-card">
                <h4>Tendencias Generales</h4>
                <div class="trends-summary">
                  <div class="trend-item">
                    <Icon name="heroicons:arrow-trending-up" class="text-green-500" />
                    <span>{{ summary.trends.improving }} estudiantes mejorando</span>
                  </div>
                  <div class="trend-item">
                    <Icon name="heroicons:minus" class="text-gray-500" />
                    <span>{{ summary.trends.stable }} estudiantes estables</span>
                  </div>
                  <div class="trend-item">
                    <Icon name="heroicons:arrow-trending-down" class="text-red-500" />
                    <span>{{ summary.trends.declining }} estudiantes declinando</span>
                  </div>
                </div>
              </div>
              
              <div class="analysis-card">
                <h4>Alertas Activas</h4>
                <div class="alerts-summary">
                  <div class="alert-item">
                    <Icon name="heroicons:exclamation-triangle" class="text-yellow-500" />
                    <span>{{ getAlertsCount('attendance') }} con asistencia baja</span>
                  </div>
                  <div class="alert-item">
                    <Icon name="heroicons:exclamation-circle" class="text-red-500" />
                    <span>{{ getAlertsCount('performance') }} con rendimiento preocupante</span>
                  </div>
                  <div class="alert-item">
                    <Icon name="heroicons:arrow-trending-down" class="text-orange-500" />
                    <span>{{ getAlertsCount('trend') }} con tendencia descendente</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <Icon name="heroicons:arrow-path" class="animate-spin text-4xl text-blue-500" />
        <p class="loading-text">Cargando datos de rendimiento...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { usePerformanceDashboard } from '../composables/usePerformanceDashboard';
import StudentPerformanceCard from './StudentPerformanceCard.vue';
import type { PerformanceFilters } from '../types/performance';

// Props
interface Props {
  studentIds?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: false,
  refreshInterval: 300000 // 5 minutos
});

// Composable
const {
  loading,
  error,
  students,
  filteredStudents,
  topPerformers,
  studentsNeedingAttention,
  summary,
  fetchStudentsPerformance,
  updateFilters,
  exportData: exportPerformanceData
} = usePerformanceDashboard();

// Estado local
const showFilters = ref(false);
const activeTab = ref('general');
const currentPage = ref(1);
const pageSize = 12;

// Filtros
const selectedClassifications = ref<string[]>([]);
const minAttendance = ref(0);
const minScore = ref(0);
const dateRange = ref({
  start: '',
  end: ''
});

// Opciones
const classificationOptions = [
  'Excelente',
  'Muy bueno', 
  'Bueno',
  'Regular',
  'Necesita mejora',
  'Preocupante'
];

// Tabs
const tabs = computed(() => [
  {
    id: 'general',
    label: 'Vista General',
    icon: 'heroicons:squares-2x2',
    count: filteredStudents.value.length
  },
  {
    id: 'top',
    label: 'Top Performers',
    icon: 'heroicons:trophy',
    count: topPerformers.value.length
  },
  {
    id: 'attention',
    label: 'Necesitan Atención',
    icon: 'heroicons:exclamation-triangle',
    count: studentsNeedingAttention.value.length
  },
  {
    id: 'analysis',
    label: 'Análisis',
    icon: 'heroicons:chart-bar-square'
  }
]);

// Paginación
const totalPages = computed(() => 
  Math.ceil(filteredStudents.value.length / pageSize)
);

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredStudents.value.slice(start, end);
});

// Métodos
const refreshData = async () => {
  await fetchStudentsPerformance(props.studentIds);
};

const applyFilters = () => {
  const filters: Partial<PerformanceFilters> = {
    classification: selectedClassifications.value,
    minAttendance: minAttendance.value,
    minScore: minScore.value,
    dateRange: dateRange.value
  };
  
  updateFilters(filters);
  currentPage.value = 1; // Reset a primera página
};

const clearFilters = () => {
  selectedClassifications.value = [];
  minAttendance.value = 0;
  minScore.value = 0;
  dateRange.value = { start: '', end: '' };
  
  updateFilters({
    classification: [],
    minAttendance: 0,
    minScore: 0,
    dateRange: { start: '', end: '' }
  });
  
  currentPage.value = 1;
};

const exportData = () => {
  const data = exportPerformanceData();
  // Implementar descarga de CSV/Excel
  console.log('Exporting data:', data);
};

// Handlers de eventos
const handleViewDetails = (studentId: string) => {
  // Emit event o navigate to details
  console.log('View details for student:', studentId);
};

const handleViewProfile = (studentId: string) => {
  // Navigate to student profile
  console.log('View profile for student:', studentId);
};

const handleNeedsAttention = (studentId: string) => {
  // Handle attention needed action
  console.log('Student needs attention:', studentId);
};

// Utilidades
const getClassificationColor = (classification: string) => {
  const classMap: Record<string, string> = {
    'Excelente': 'bg-green-500',
    'Muy bueno': 'bg-blue-500',
    'Bueno': 'bg-blue-400',
    'Regular': 'bg-yellow-500',
    'Necesita mejora': 'bg-orange-500',
    'Preocupante': 'bg-red-500'
  };
  return classMap[classification] || 'bg-gray-500';
};

const getRankClass = (index: number) => {
  if (index === 0) return 'rank-gold';
  if (index === 1) return 'rank-silver';
  if (index === 2) return 'rank-bronze';
  return 'rank-default';
};

const getAlertsCount = (type: 'attendance' | 'performance' | 'trend') => {
  return students.value.filter(student => {
    switch (type) {
      case 'attendance':
        return student.attendanceMetrics.attendanceRate < 75;
      case 'performance':
        return student.overallScore < 60;
      case 'trend':
        return student.trends.overall < -10;
      default:
        return false;
    }
  }).length;
};

// Watchers
watch(() => props.studentIds, refreshData, { immediate: false });

// Lifecycle
onMounted(() => {
  refreshData();
  
  // Auto refresh si está habilitado
  if (props.autoRefresh) {
    setInterval(refreshData, props.refreshInterval);
  }
});
</script>

<style scoped>
.performance-dashboard {
  padding: 1.5rem;
  max-width: 100%;
  margin: 0 auto;
  background-color: #f9fafb;
  min-height: 100vh;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dashboard-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.dashboard-subtitle {
  color: #6b7280;
  font-size: 1rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

/* Filters */
.filters-section {
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.filter-range {
  width: 100%;
}

.range-value {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-date {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
}

.date-separator {
  color: #6b7280;
  font-size: 0.875rem;
}

.filter-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

/* Summary */
.summary-section {
  margin-bottom: 2rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.summary-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.summary-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.summary-number {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
}

.summary-label {
  color: #6b7280;
  font-size: 0.875rem;
}

/* Chart */
.chart-section {
  margin-bottom: 2rem;
}

.chart-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1f2937;
}

.classification-chart {
  space-y: 0.75rem;
}

.classification-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.classification-label {
  width: 120px;
  font-size: 0.875rem;
  color: #374151;
  flex-shrink: 0;
}

.classification-progress {
  flex: 1;
  height: 1.5rem;
  background-color: #f3f4f6;
  border-radius: 0.75rem;
  overflow: hidden;
}

.classification-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.classification-count {
  width: 2rem;
  text-align: center;
  font-weight: 500;
  color: #374151;
  flex-shrink: 0;
}

/* Tabs */
.tabs-section {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tabs-header {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.tab-button:hover {
  color: #374151;
  background-color: #f3f4f6;
}

.tab-active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background-color: white;
}

.tab-count {
  background-color: #e5e7eb;
  color: #374151;
  padding: 0.125rem 0.375rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.tab-active .tab-count {
  background-color: #dbeafe;
  color: #3b82f6;
}

.tabs-content {
  padding: 1.5rem;
}

/* Students grid */
.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  color: #6b7280;
  font-size: 0.875rem;
}

/* Top performers */
.performers-header {
  margin-bottom: 1.5rem;
}

.performers-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.performers-list {
  space-y: 1rem;
}

.performer-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.performer-rank {
  flex-shrink: 0;
}

.rank-badge {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
}

.rank-gold {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #92400e;
}

.rank-silver {
  background: linear-gradient(135deg, #c0c0c0, #e5e7eb);
  color: #374151;
}

.rank-bronze {
  background: linear-gradient(135deg, #cd7f32, #d97706);
}

.rank-default {
  background-color: #6b7280;
}

/* Attention section */
.attention-header {
  margin-bottom: 1.5rem;
}

.attention-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.attention-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.attention-card {
  border-left: 4px solid #f59e0b;
}

/* Analysis */
.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.analysis-card {
  background-color: #f9fafb;
  padding: 1.5rem;
  border-radius: 0.5rem;
}

.analysis-card h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.trends-summary,
.alerts-summary {
  space-y: 0.75rem;
}

.trend-item,
.alert-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #374151;
}

/* Loading */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  text-align: center;
}

.loading-text {
  color: #6b7280;
  margin-top: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .performance-dashboard {
    padding: 1rem;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .students-grid {
    grid-template-columns: 1fr;
  }
  
  .tabs-header {
    flex-wrap: wrap;
  }
  
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
