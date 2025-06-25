<template>
  <div class="attendance-overview">
    <div class="overview-header">
      <h3 class="section-title">
        <i class="fas fa-chart-pie"></i>
        Resumen de Asistencia
      </h3>
      <div class="period-badge">
        {{ periodText }}
      </div>
    </div>

    <div class="stats-grid">
      <!-- Estudiantes totales -->
      <div class="stat-card students-card">
        <div class="stat-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalStudents }}</div>
          <div class="stat-label">Estudiantes</div>
        </div>
      </div>

      <!-- Sesiones totales -->
      <div class="stat-card sessions-card">
        <div class="stat-icon">
          <i class="fas fa-calendar-check"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalSessions }}</div>
          <div class="stat-label">Sesiones</div>
        </div>
      </div>

      <!-- Tasa de asistencia -->
      <div class="stat-card attendance-card">
        <div class="stat-icon">
          <i class="fas fa-percentage"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.attendanceRate }}%</div>
          <div class="stat-label">Asistencia</div>
          <div class="stat-progress">
            <div 
              class="progress-bar attendance-bar" 
              :style="{ width: stats.attendanceRate + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Presentes -->
      <div class="stat-card present-card">
        <div class="stat-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalPresent }}</div>
          <div class="stat-label">Presentes</div>
          <div class="stat-percentage">
            {{ getPercentage(stats.totalPresent) }}%
          </div>
        </div>
      </div>

      <!-- Tardías -->
      <div class="stat-card late-card">
        <div class="stat-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalLate }}</div>
          <div class="stat-label">Tardías</div>
          <div class="stat-percentage">
            {{ getPercentage(stats.totalLate) }}%
          </div>
        </div>
      </div>

      <!-- Ausentes -->
      <div class="stat-card absent-card">
        <div class="stat-icon">
          <i class="fas fa-times-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalAbsent }}</div>
          <div class="stat-label">Ausentes</div>
          <div class="stat-percentage">
            {{ getPercentage(stats.totalAbsent) }}%
          </div>
        </div>
      </div>

      <!-- Justificadas -->
      <div class="stat-card justified-card">
        <div class="stat-icon">
          <i class="fas fa-clipboard-check"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalJustified }}</div>
          <div class="stat-label">Justificadas</div>
          <div class="stat-percentage">
            {{ getPercentage(stats.totalJustified) }}%
          </div>
        </div>
      </div>

      <!-- Tasa de ausencias -->
      <div class="stat-card absence-card">
        <div class="stat-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.absenceRate }}%</div>
          <div class="stat-label">Ausencias</div>
          <div class="stat-progress">
            <div 
              class="progress-bar absence-bar" 
              :style="{ width: stats.absenceRate + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Indicadores de rendimiento -->
    <div class="performance-indicators">
      <div class="indicator-card">
        <div class="indicator-header">
          <i class="fas fa-trophy"></i>
          <span>Indicadores de Rendimiento</span>
        </div>
        <div class="indicators-list">
          <div class="indicator-item">
            <span class="indicator-label">Asistencia Excelente</span>
            <span :class="['indicator-value', getPerformanceClass(stats.attendanceRate)]">
              {{ getPerformanceText(stats.attendanceRate) }}
            </span>
          </div>
          <div class="indicator-item">
            <span class="indicator-label">Puntualidad</span>
            <span :class="['indicator-value', getPunctualityClass()]">
              {{ getPunctualityText() }}
            </span>
          </div>
          <div class="indicator-item">
            <span class="indicator-label">Participación</span>
            <span :class="['indicator-value', getParticipationClass()]">
              {{ getParticipationText() }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'AttendanceOverview',
  props: {
    stats: {
      type: Object,
      required: true
    },
    totalStudents: {
      type: Number,
      required: true
    },
    periodText: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const getPercentage = (value) => {
      if (props.stats.totalSessions === 0) return 0
      return Math.round((value / props.stats.totalSessions) * 100)
    }

    const getPerformanceClass = (rate) => {
      if (rate >= 90) return 'excellent'
      if (rate >= 80) return 'good'
      if (rate >= 70) return 'average'
      return 'poor'
    }

    const getPerformanceText = (rate) => {
      if (rate >= 90) return 'Excelente'
      if (rate >= 80) return 'Buena'
      if (rate >= 70) return 'Regular'
      return 'Deficiente'
    }

    const getPunctualityClass = () => {
      const lateRate = getPercentage(props.stats.totalLate)
      if (lateRate <= 5) return 'excellent'
      if (lateRate <= 10) return 'good'
      if (lateRate <= 20) return 'average'
      return 'poor'
    }

    const getPunctualityText = () => {
      const lateRate = getPercentage(props.stats.totalLate)
      if (lateRate <= 5) return 'Excelente'
      if (lateRate <= 10) return 'Buena'
      if (lateRate <= 20) return 'Regular'
      return 'Deficiente'
    }

    const getParticipationClass = () => {
      const participationRate = props.stats.attendanceRate
      if (participationRate >= 85) return 'excellent'
      if (participationRate >= 75) return 'good'
      if (participationRate >= 65) return 'average'
      return 'poor'
    }

    const getParticipationText = () => {
      const participationRate = props.stats.attendanceRate
      if (participationRate >= 85) return 'Alta'
      if (participationRate >= 75) return 'Media'
      if (participationRate >= 65) return 'Regular'
      return 'Baja'
    }

    return {
      getPercentage,
      getPerformanceClass,
      getPerformanceText,
      getPunctualityClass,
      getPunctualityText,
      getParticipationClass,
      getParticipationText
    }
  }
}
</script>

<style scoped>
.attendance-overview {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: #212529;
  font-size: 20px;
  font-weight: 600;
}

.section-title i {
  color: #0d6efd;
}

.period-badge {
  padding: 6px 12px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #e9ecef;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.students-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.sessions-card { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; }
.attendance-card { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; }
.present-card { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; }
.late-card { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; }
.absent-card { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); color: #333; }
.justified-card { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; }
.absence-card { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); color: #333; }

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 28px;
  opacity: 0.9;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  font-weight: 500;
}

.stat-percentage {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 2px;
}

.stat-progress {
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.attendance-bar {
  background: rgba(255, 255, 255, 0.9);
}

.absence-bar {
  background: #dc3545;
}

.performance-indicators {
  border-top: 1px solid #e9ecef;
  padding-top: 20px;
}

.indicator-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.indicator-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #495057;
  font-weight: 600;
}

.indicators-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.indicator-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
}

.indicator-label {
  color: #495057;
  font-size: 14px;
}

.indicator-value {
  font-weight: 600;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
}

.indicator-value.excellent {
  background: #d4edda;
  color: #155724;
}

.indicator-value.good {
  background: #d1ecf1;
  color: #0c5460;
}

.indicator-value.average {
  background: #fff3cd;
  color: #856404;
}

.indicator-value.poor {
  background: #f8d7da;
  color: #721c24;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .overview-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
    text-align: center;
  }
  
  .indicators-list {
    gap: 6px;
  }
  
  .indicator-item {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }
}
</style>
