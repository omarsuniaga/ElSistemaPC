<template>
  <div class="director-dashboard">
    <!-- Header del Dashboard -->
    <div class="dashboard-header">
      <div class="header-content">
        <h1 class="dashboard-title">
          <Icon name="heroicons:chart-bar-square" class="title-icon" />
          Dashboard Directorial de Rendimiento
        </h1>
        <p class="dashboard-subtitle">
          Vista ejecutiva del rendimiento estudiantil basada en métricas integrales
        </p>
      </div>
      <div class="header-actions">
        <button 
          class="action-btn action-primary"
          @click="refreshData"
          :disabled="loading"
        >
          <Icon name="heroicons:arrow-path" :class="{ 'animate-spin': loading }" />
          {{ loading ? 'Actualizando...' : 'Actualizar' }}
        </button>
        <button 
          class="action-btn action-secondary"
          @click="exportReport"
        >
          <Icon name="heroicons:document-arrow-down" />
          Exportar Informe
        </button>
      </div>
    </div>

    <!-- KPIs Principales -->
    <div class="kpis-section">
      <h2 class="section-title">Indicadores Clave</h2>
      <div class="kpis-grid">
        <div class="kpi-card kpi-primary">
          <div class="kpi-header">
            <Icon name="heroicons:users" class="kpi-icon" />
            <span class="kpi-label">Total Estudiantes</span>
          </div>
          <div class="kpi-value">{{ summary.totalStudents }}</div>
          <div class="kpi-trend trend-positive">
            <Icon name="heroicons:arrow-trending-up" />
            <span>+5% vs mes anterior</span>
          </div>
        </div>

        <div class="kpi-card kpi-success">
          <div class="kpi-header">
            <Icon name="heroicons:trophy" class="kpi-icon" />
            <span class="kpi-label">Rendimiento Promedio</span>
          </div>
          <div class="kpi-value">{{ summary.averageScore }}<span class="kpi-unit">/100</span></div>
          <div class="kpi-trend trend-positive">
            <Icon name="heroicons:arrow-trending-up" />
            <span>+3% vs mes anterior</span>
          </div>
        </div>

        <div class="kpi-card kpi-info">
          <div class="kpi-header">
            <Icon name="heroicons:calendar-days" class="kpi-icon" />
            <span class="kpi-label">Asistencia Promedio</span>
          </div>
          <div class="kpi-value">{{ summary.averageAttendance }}<span class="kpi-unit">%</span></div>
          <div class="kpi-trend trend-positive">
            <Icon name="heroicons:arrow-trending-up" />
            <span>+2% vs mes anterior</span>
          </div>
        </div>

        <div class="kpi-card kpi-warning">
          <div class="kpi-header">
            <Icon name="heroicons:exclamation-triangle" class="kpi-icon" />
            <span class="kpi-label">Necesitan Atención</span>
          </div>
          <div class="kpi-value">{{ studentsNeedingAttention.length }}</div>
          <div class="kpi-description">
            Estudiantes con rendimiento por debajo del umbral
          </div>
        </div>
      </div>
    </div>

    <!-- Top Performers -->
    <div class="performers-section">
      <div class="section-header">
        <h2 class="section-title">Estudiantes Destacados</h2>
        <button 
          class="view-all-btn"
          @click="$emit('view-all-top-performers')"
        >
          Ver todos
          <Icon name="heroicons:arrow-right" />
        </button>
      </div>
      <div class="performers-grid">
        <div 
          v-for="(student, index) in topPerformers.slice(0, 6)" 
          :key="student.studentId"
          class="performer-card"
          :class="{ 'performer-podium': index < 3 }"
        >
          <div class="performer-rank">
            <div class="rank-badge" :class="getRankClass(index)">
              {{ index + 1 }}
            </div>
          </div>
          <div class="performer-info">
            <div class="performer-name">{{ student.studentName }}</div>
            <div class="performer-score">{{ Math.round(student.overallScore) }} pts</div>
            <div class="performer-classification">{{ student.classification }}</div>
          </div>
          <div class="performer-metrics">
            <div class="metric-mini">
              <Icon name="heroicons:calendar-days" class="text-blue-500" />
              <span>{{ student.attendanceMetrics.attendanceRate }}%</span>
            </div>
            <div class="metric-mini">
              <Icon name="heroicons:musical-note" class="text-purple-500" />
              <span>{{ Math.round(student.repertoireMetrics.averageScore) }}</span>
            </div>
          </div>
          <button 
            class="performer-action"
            @click="$emit('view-student-details', student.studentId)"
          >
            <Icon name="heroicons:eye" />
            Ver detalles
          </button>
        </div>
      </div>
    </div>

    <!-- Alertas y Atención Requerida -->
    <div v-if="studentsNeedingAttention.length > 0" class="alerts-section">
      <div class="section-header">
        <h2 class="section-title">
          <Icon name="heroicons:exclamation-triangle" class="text-orange-500" />
          Estudiantes que Requieren Atención
        </h2>
        <button 
          class="view-all-btn"
          @click="$emit('view-all-attention-needed')"
        >
          Ver todos ({{ studentsNeedingAttention.length }})
          <Icon name="heroicons:arrow-right" />
        </button>
      </div>
      <div class="alerts-grid">
        <div 
          v-for="student in studentsNeedingAttention.slice(0, 4)" 
          :key="student.studentId"
          class="alert-card"
        >
          <div class="alert-header">
            <div class="student-name">{{ student.studentName }}</div>
            <div class="alert-level" :class="getAlertLevel(student)">
              {{ getAlertText(student) }}
            </div>
          </div>
          <div class="alert-reasons">
            <div v-if="student.attendanceMetrics.attendanceRate < 75" class="alert-reason">
              <Icon name="heroicons:calendar-x-mark" class="text-red-500" />
              <span>Asistencia baja ({{ student.attendanceMetrics.attendanceRate }}%)</span>
            </div>
            <div v-if="student.overallScore < 60" class="alert-reason">
              <Icon name="heroicons:chart-bar" class="text-orange-500" />
              <span>Rendimiento bajo ({{ Math.round(student.overallScore) }} pts)</span>
            </div>
            <div v-if="student.trends.overall < -10" class="alert-reason">
              <Icon name="heroicons:arrow-trending-down" class="text-red-500" />
              <span>Tendencia descendente</span>
            </div>
          </div>
          <div class="alert-actions">
            <button 
              class="alert-action-btn"
              @click="$emit('contact-student', student.studentId)"
            >
              <Icon name="heroicons:phone" />
              Contactar
            </button>
            <button 
              class="alert-action-btn"
              @click="$emit('view-student-details', student.studentId)"
            >
              <Icon name="heroicons:user" />
              Ver perfil
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Resumen Ejecutivo -->
    <div class="summary-section">
      <div class="section-header">
        <h2 class="section-title">Resumen Ejecutivo</h2>
      </div>
      <div class="summary-grid">
        <div class="summary-card">
          <h3 class="summary-title">Distribución por Clasificación</h3>
          <div class="classification-bars">
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

        <div class="summary-card">
          <h3 class="summary-title">Tendencias Generales</h3>
          <div class="trends-list">
            <div class="trend-item trend-positive">
              <Icon name="heroicons:arrow-trending-up" />
              <div class="trend-content">
                <span class="trend-number">{{ summary.trends.improving }}</span>
                <span class="trend-label">Estudiantes mejorando</span>
              </div>
            </div>
            <div class="trend-item trend-stable">
              <Icon name="heroicons:minus" />
              <div class="trend-content">
                <span class="trend-number">{{ summary.trends.stable }}</span>
                <span class="trend-label">Estudiantes estables</span>
              </div>
            </div>
            <div class="trend-item trend-negative">
              <Icon name="heroicons:arrow-trending-down" />
              <div class="trend-content">
                <span class="trend-number">{{ summary.trends.declining }}</span>
                <span class="trend-label">Estudiantes declinando</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <Icon name="heroicons:arrow-path" class="animate-spin text-4xl text-blue-500" />
        <p class="loading-text">Generando reporte directorial...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { usePerformanceDashboard } from '../composables/usePerformanceDashboard';

// Emit events
const emit = defineEmits<{
  'view-all-top-performers': [];
  'view-all-attention-needed': [];
  'view-student-details': [studentId: string];
  'contact-student': [studentId: string];
}>();

// Composable
const {
  loading,
  error,
  students,
  topPerformers,
  studentsNeedingAttention,
  summary,
  fetchStudentsPerformance
} = usePerformanceDashboard();

// Métodos
const refreshData = async () => {
  await fetchStudentsPerformance();
};

const exportReport = () => {
  // Implementar exportación de reporte
  console.log('Exportando reporte directorial...');
};

const getClassificationColor = (classification: string) => {
  const colors: Record<string, string> = {
    'Excelente': 'bg-green-500',
    'Muy bueno': 'bg-blue-500',
    'Bueno': 'bg-blue-400',
    'Regular': 'bg-yellow-500',
    'Necesita mejora': 'bg-orange-500',
    'Preocupante': 'bg-red-500'
  };
  return colors[classification] || 'bg-gray-500';
};

const getRankClass = (index: number) => {
  if (index === 0) return 'rank-gold';
  if (index === 1) return 'rank-silver';
  if (index === 2) return 'rank-bronze';
  return 'rank-default';
};

const getAlertLevel = (student: any) => {
  if (student.overallScore < 50 || student.attendanceMetrics.attendanceRate < 60) {
    return 'alert-critical';
  }
  if (student.overallScore < 60 || student.attendanceMetrics.attendanceRate < 75) {
    return 'alert-high';
  }
  return 'alert-medium';
};

const getAlertText = (student: any) => {
  if (student.overallScore < 50 || student.attendanceMetrics.attendanceRate < 60) {
    return 'Crítico';
  }
  if (student.overallScore < 60 || student.attendanceMetrics.attendanceRate < 75) {
    return 'Alto';
  }
  return 'Medio';
};

// Lifecycle
onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.director-dashboard {
  padding: 2rem;
  max-width: 100%;
  background: #f8fafc;
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
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dashboard-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.title-icon {
  font-size: 2.5rem;
  color: #3b82f6;
}

.dashboard-subtitle {
  color: #6b7280;
  font-size: 1.125rem;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.action-primary {
  background: #3b82f6;
  color: white;
}

.action-primary:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.action-secondary {
  background: #f3f4f6;
  color: #374151;
}

.action-secondary:hover {
  background: #e5e7eb;
}

/* KPIs */
.kpis-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.kpis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.kpi-card {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.kpi-primary::before {
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
}

.kpi-success::before {
  background: linear-gradient(90deg, #10b981, #059669);
}

.kpi-info::before {
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
}

.kpi-warning::before {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.kpi-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.kpi-icon {
  font-size: 1.5rem;
  color: #6b7280;
}

.kpi-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.kpi-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.kpi-unit {
  font-size: 1.25rem;
  color: #6b7280;
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.trend-positive {
  color: #059669;
}

.kpi-description {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

/* Performers */
.performers-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.view-all-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.view-all-btn:hover {
  background: #e5e7eb;
  transform: translateX(2px);
}

.performers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.performer-card {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.performer-podium {
  background: linear-gradient(135deg, #fef3c7, white);
  border-color: #f59e0b;
}

.performer-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

.performer-rank {
  text-align: center;
  margin-bottom: 1rem;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  font-weight: 700;
  color: white;
  font-size: 1.125rem;
}

.rank-gold {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #92400e;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
}

.rank-silver {
  background: linear-gradient(135deg, #c0c0c0, #e5e7eb);
  color: #374151;
  box-shadow: 0 4px 12px rgba(192, 192, 192, 0.4);
}

.rank-bronze {
  background: linear-gradient(135deg, #cd7f32, #d97706);
  box-shadow: 0 4px 12px rgba(205, 127, 50, 0.4);
}

.rank-default {
  background: #6b7280;
}

.performer-info {
  text-align: center;
  margin-bottom: 1rem;
}

.performer-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.performer-score {
  font-size: 1.5rem;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 0.25rem;
}

.performer-classification {
  font-size: 0.875rem;
  color: #6b7280;
}

.performer-metrics {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.metric-mini {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #4b5563;
}

.performer-action {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.performer-action:hover {
  background: #3b82f6;
  color: white;
}

/* Alerts */
.alerts-section {
  margin-bottom: 2rem;
}

.alerts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.alert-card {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  border-left: 4px solid #f59e0b;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.student-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.alert-level {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.alert-critical {
  background: #fee2e2;
  color: #dc2626;
}

.alert-high {
  background: #fed7aa;
  color: #ea580c;
}

.alert-medium {
  background: #fef3c7;
  color: #d97706;
}

.alert-reasons {
  margin-bottom: 1rem;
}

.alert-reason {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.alert-actions {
  display: flex;
  gap: 0.75rem;
}

.alert-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.alert-action-btn:hover {
  background: #e5e7eb;
}

/* Summary */
.summary-section {
  margin-bottom: 2rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.summary-card {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
}

.summary-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.classification-bars {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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

.trends-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.trend-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.75rem;
}

.trend-positive {
  border-left: 4px solid #10b981;
  color: #059669;
}

.trend-stable {
  border-left: 4px solid #6b7280;
  color: #4b5563;
}

.trend-negative {
  border-left: 4px solid #ef4444;
  color: #dc2626;
}

.trend-content {
  display: flex;
  flex-direction: column;
}

.trend-number {
  font-size: 1.5rem;
  font-weight: 700;
}

.trend-label {
  font-size: 0.875rem;
  opacity: 0.8;
}

/* Loading */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  background: white;
  padding: 3rem;
  border-radius: 1rem;
  text-align: center;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

.loading-text {
  color: #6b7280;
  margin-top: 1rem;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 1024px) {
  .director-dashboard {
    padding: 1rem;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .kpis-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .performers-grid {
    grid-template-columns: 1fr;
  }
  
  .alerts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
