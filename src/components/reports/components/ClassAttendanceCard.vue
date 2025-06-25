
<template>
  <div class="class-attendance-card">
    <div class="card-header">
      <div class="class-info">
        <h4 class="class-name">
          <i class="fas fa-music"></i>
          {{ classData.name }}
        </h4>
        <div class="class-meta">
          <span class="student-count">
            <i class="fas fa-users"></i>
            {{ classData.students.length }} estudiante{{ classData.students.length !== 1 ? 's' : '' }}
          </span>
          <span class="session-count">
            <i class="fas fa-calendar-check"></i>
            {{ classData.attendanceRecords.length }} sesión{{ classData.attendanceRecords.length !== 1 ? 'es' : '' }}
          </span>
        </div>
      </div>
      
      <div class="class-actions">
        <button 
          @click="toggleExpanded"
          class="expand-btn"
          :class="{ active: isExpanded }"
        >
          <i :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
        </button>
        <button 
          @click="openClassDetails"
          class="details-btn"
        >
          <i class="fas fa-eye"></i>
          Ver detalles
        </button>
      </div>
    </div>

    <div class="card-stats">
      <div class="stats-row">
        <div class="stat-item present">
          <div class="stat-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ classStats.totalPresent }}</div>
            <div class="stat-label">Presentes</div>
            <div class="stat-percentage">{{ getPercentage(classStats.totalPresent) }}%</div>
          </div>
        </div>

        <div class="stat-item late">
          <div class="stat-icon">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ classStats.totalLate }}</div>
            <div class="stat-label">Tardías</div>
            <div class="stat-percentage">{{ getPercentage(classStats.totalLate) }}%</div>
          </div>
        </div>

        <div class="stat-item absent">
          <div class="stat-icon">
            <i class="fas fa-times-circle"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ classStats.totalAbsent }}</div>
            <div class="stat-label">Ausentes</div>
            <div class="stat-percentage">{{ getPercentage(classStats.totalAbsent) }}%</div>
          </div>
        </div>

        <div class="stat-item justified">
          <div class="stat-icon">
            <i class="fas fa-clipboard-check"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ classStats.totalJustified }}</div>
            <div class="stat-label">Justificadas</div>
            <div class="stat-percentage">{{ getPercentage(classStats.totalJustified) }}%</div>
          </div>
        </div>
      </div>

      <div class="attendance-rate-bar">
        <div class="rate-info">
          <span class="rate-label">Tasa de asistencia:</span>
          <span class="rate-value">{{ classStats.attendanceRate }}%</span>
        </div>
        <div class="progress-container">
          <div 
            class="progress-fill" 
            :style="{ width: classStats.attendanceRate + '%' }"
            :class="getAttendanceRateClass(classStats.attendanceRate)"
          ></div>
        </div>
      </div>
    </div>

    <!-- Expanded content -->
    <transition name="expand">
      <div v-if="isExpanded" class="expanded-content">
        <!-- Recent sessions -->
        <div class="recent-sessions">
          <h5 class="section-subtitle">
            <i class="fas fa-history"></i>
            Sesiones Recientes
          </h5>
          <div class="sessions-list">
            <div 
              v-for="session in recentSessions"
              :key="session.id"
              class="session-item"
            >
              <div class="session-date">
                <i class="fas fa-calendar-alt"></i>
                {{ formatDate(session.fecha) }}
              </div>
              <div class="session-stats">
                <span class="session-present">{{ getSessionPresent(session) }} presentes</span>
                <span class="session-absent">{{ getSessionAbsent(session) }} ausentes</span>
              </div>
              <div class="session-rate">
                {{ getSessionRate(session) }}%
              </div>
            </div>
          </div>
        </div>

        <!-- Student summary -->
        <div class="students-summary">
          <h5 class="section-subtitle">
            <i class="fas fa-user-graduate"></i>
            Resumen por Estudiante
          </h5>
          <div class="students-grid">
            <div 
              v-for="student in classData.students"
              :key="student.id"
              class="student-summary-card"
            >
              <div class="student-name">{{ student.name }}</div>
              <div class="student-attendance-summary">
                <div class="attendance-dots">
                  <span 
                    v-for="(status, date) in student.attendance"
                    :key="date"
                    :class="['attendance-dot', status]"
                    :title="`${formatDate(date)}: ${getStatusText(status)}`"
                  ></span>
                </div>
                <div class="student-rate">
                  {{ getStudentAttendanceRate(student) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export default {
  name: 'ClassAttendanceCard',
  props: {
    classData: {
      type: Object,
      required: true
    }
  },
  emits: ['view-details'],
  setup(props, { emit }) {
    const isExpanded = ref(false)

    // Estadísticas de la clase
    const classStats = computed(() => {
      let totalPresent = 0
      let totalAbsent = 0
      let totalLate = 0
      let totalJustified = 0
      let totalSessions = 0

      props.classData.students.forEach(student => {
        Object.values(student.attendance || {}).forEach(status => {
          totalSessions++
          switch (status) {
            case 'present':
              totalPresent++
              break
            case 'absent':
              totalAbsent++
              break
            case 'late':
              totalLate++
              break
            case 'justified':
              totalJustified++
              break
          }
        })
      })

      const attendanceRate = totalSessions > 0 
        ? Math.round(((totalPresent + totalLate) / totalSessions) * 100) 
        : 0

      return {
        totalPresent,
        totalAbsent,
        totalLate,
        totalJustified,
        totalSessions,
        attendanceRate
      }
    })

    // Sesiones recientes (últimas 5)
    const recentSessions = computed(() => {
      return props.classData.attendanceRecords
        .slice()
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 5)
    })

    const getPercentage = (value) => {
      if (classStats.value.totalSessions === 0) return 0
      return Math.round((value / classStats.value.totalSessions) * 100)
    }

    const getAttendanceRateClass = (rate) => {
      if (rate >= 90) return 'excellent'
      if (rate >= 80) return 'good'
      if (rate >= 70) return 'average'
      return 'poor'
    }

    const formatDate = (dateString) => {
      try {
        const date = parseISO(dateString)
        return format(date, 'dd MMM', { locale: es })
      } catch (error) {
        return dateString
      }
    }

    const getSessionPresent = (session) => {
      const data = session.data || {}
      const presentes = data.presentes || []
      const tarde = data.tarde || []
      return presentes.length + tarde.length
    }

    const getSessionAbsent = (session) => {
      const data = session.data || {}
      const ausentes = data.ausentes || []
      return ausentes.length
    }

    const getSessionRate = (session) => {
      const present = getSessionPresent(session)
      const absent = getSessionAbsent(session)
      const total = present + absent
      return total > 0 ? Math.round((present / total) * 100) : 0
    }

    const getStudentAttendanceRate = (student) => {
      const attendanceEntries = Object.values(student.attendance || {})
      if (attendanceEntries.length === 0) return 0
      
      const presentCount = attendanceEntries.filter(status => 
        status === 'present' || status === 'late'
      ).length
      
      return Math.round((presentCount / attendanceEntries.length) * 100)
    }

    const getStatusText = (status) => {
      const texts = {
        'present': 'Presente',
        'absent': 'Ausente',
        'late': 'Tardía',
        'justified': 'Justificada'
      }
      return texts[status] || 'Desconocido'
    }

    const toggleExpanded = () => {
      isExpanded.value = !isExpanded.value
    }

    const openClassDetails = () => {
      emit('view-details', props.classData)
    }

    return {
      isExpanded,
      classStats,
      recentSessions,
      getPercentage,
      getAttendanceRateClass,
      formatDate,
      getSessionPresent,
      getSessionAbsent,
      getSessionRate,
      getStudentAttendanceRate,
      getStatusText,
      toggleExpanded,
      openClassDetails
    }
  }
}
</script>

<style scoped>
.class-attendance-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.class-attendance-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.class-info {
  flex: 1;
}

.class-name {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 8px 0;
  color: #212529;
  font-size: 18px;
  font-weight: 600;
}

.class-name i {
  color: #0d6efd;
}

.class-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #6c757d;
}

.class-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.class-actions {
  display: flex;
  gap: 8px;
}

.expand-btn, .details-btn {
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.expand-btn:hover, .details-btn:hover {
  background: #f8f9fa;
  border-color: #0d6efd;
  color: #0d6efd;
}

.expand-btn.active {
  background: #0d6efd;
  color: white;
  border-color: #0d6efd;
}

.card-stats {
  padding: 20px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.stat-item.present { background: #d4edda; border-color: #c3e6cb; }
.stat-item.late { background: #fff3cd; border-color: #ffeaa7; }
.stat-item.absent { background: #f8d7da; border-color: #f5c6cb; }
.stat-item.justified { background: #d1ecf1; border-color: #bee5eb; }

.stat-icon {
  font-size: 18px;
}

.stat-item.present .stat-icon { color: #155724; }
.stat-item.late .stat-icon { color: #856404; }
.stat-item.absent .stat-icon { color: #721c24; }
.stat-item.justified .stat-icon { color: #0c5460; }

.stat-content {
  text-align: center;
}

.stat-number {
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #495057;
  margin-top: 2px;
}

.stat-percentage {
  font-size: 11px;
  opacity: 0.8;
  margin-top: 1px;
}

.attendance-rate-bar {
  border-top: 1px solid #e9ecef;
  padding-top: 16px;
}

.rate-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.rate-label {
  color: #495057;
  font-size: 14px;
}

.rate-value {
  font-weight: 600;
  font-size: 16px;
  color: #212529;
}

.progress-container {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.excellent { background: #28a745; }
.progress-fill.good { background: #17a2b8; }
.progress-fill.average { background: #ffc107; }
.progress-fill.poor { background: #dc3545; }

.expanded-content {
  border-top: 1px solid #e9ecef;
  padding: 20px;
  background: #f8f9fa;
}

.section-subtitle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  color: #495057;
  font-size: 16px;
  font-weight: 600;
}

.section-subtitle i {
  color: #0d6efd;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.session-item {
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.session-date {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #495057;
  font-size: 14px;
  flex: 1;
}

.session-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6c757d;
}

.session-rate {
  font-weight: 600;
  color: #212529;
  font-size: 14px;
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.student-summary-card {
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.student-name {
  font-weight: 600;
  color: #212529;
  margin-bottom: 8px;
  font-size: 14px;
}

.student-attendance-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.attendance-dots {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}

.attendance-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  cursor: pointer;
}

.attendance-dot.present { background: #28a745; }
.attendance-dot.late { background: #ffc107; }
.attendance-dot.absent { background: #dc3545; }
.attendance-dot.justified { background: #17a2b8; }

.student-rate {
  font-size: 12px;
  font-weight: 600;
  color: #495057;
}

.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to, .expand-leave-from {
  opacity: 1;
  max-height: 1000px;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .class-actions {
    align-self: stretch;
    justify-content: space-between;
  }
  
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .students-grid {
    grid-template-columns: 1fr;
  }
  
  .session-item {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
}
</style>
