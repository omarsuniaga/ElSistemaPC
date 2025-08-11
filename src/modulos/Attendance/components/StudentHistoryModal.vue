<template>
  <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Historial de Asistencia</h3>
        <button @click="$emit('close')" class="close-button">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div v-if="student" class="student-info">
          <div class="student-avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="student-details">
            <h4>{{ student.nombre }} {{ student.apellido }}</h4>
            <p class="student-id">ID: {{ student.id }}</p>
          </div>
        </div>

        <div class="history-section">
          <div class="section-header">
            <h5>Registro de Asistencia</h5>
            <div class="history-stats">
              <span class="stat-item">
                <i class="fas fa-calendar-alt"></i>
                {{ history.length }} registros
              </span>
            </div>
          </div>

          <div v-if="history.length === 0" class="empty-state">
            <i class="fas fa-calendar-times"></i>
            <p>No hay registros de asistencia disponibles</p>
          </div>

          <div v-else class="history-list">
            <div 
              v-for="(record, index) in sortedHistory" 
              :key="index" 
              class="history-item"
            >
              <div class="history-date">
                <i class="fas fa-calendar"></i>
                <span>{{ formatDate(record.date) }}</span>
              </div>
              
              <div class="history-status">
                <span 
                  :class="['status-badge', getStatusClass(record.status)]"
                >
                  <i :class="getStatusIcon(record.status)"></i>
                  {{ getStatusText(record.status) }}
                </span>
              </div>

              <div v-if="record.observations" class="history-observations">
                <i class="fas fa-sticky-note"></i>
                <span>{{ record.observations }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="attendanceStats" class="stats-section">
          <h5>Estadísticas</h5>
          <div class="stats-grid">
            <div class="stat-card presente">
              <i class="fas fa-check-circle"></i>
              <div class="stat-info">
                <span class="stat-number">{{ attendanceStats.presente }}</span>
                <span class="stat-label">Presente</span>
              </div>
            </div>
            
            <div class="stat-card ausente">
              <i class="fas fa-times-circle"></i>
              <div class="stat-info">
                <span class="stat-number">{{ attendanceStats.ausente }}</span>
                <span class="stat-label">Ausente</span>
              </div>
            </div>
            
            <div class="stat-card tarde">
              <i class="fas fa-clock"></i>
              <div class="stat-info">
                <span class="stat-number">{{ attendanceStats.tarde }}</span>
                <span class="stat-label">Tardanza</span>
              </div>
            </div>
            
            <div class="stat-card justificado">
              <i class="fas fa-file-alt"></i>
              <div class="stat-info">
                <span class="stat-number">{{ attendanceStats.justificado }}</span>
                <span class="stat-label">Justificado</span>
              </div>
            </div>
          </div>
          
          <div class="attendance-rate">
            <div class="rate-label">Tasa de Asistencia</div>
            <div class="rate-bar">
              <div 
                class="rate-fill" 
                :style="{ width: attendanceStats.rate + '%' }"
              ></div>
            </div>
            <div class="rate-percentage">{{ attendanceStats.rate.toFixed(1) }}%</div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-primary">
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface AttendanceRecord {
  date: string
  status: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado'
  observations?: string
}

interface Props {
  visible: boolean
  student: any
  history: AttendanceRecord[]
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const sortedHistory = computed(() => {
  return [...props.history].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
})

const attendanceStats = computed(() => {
  if (props.history.length === 0) return null
  
  const stats = {
    presente: 0,
    ausente: 0,
    tarde: 0,
    justificado: 0
  }
  
  props.history.forEach(record => {
    switch (record.status) {
      case 'Presente':
        stats.presente++
        break
      case 'Ausente':
        stats.ausente++
        break
      case 'Tardanza':
        stats.tarde++
        break
      case 'Justificado':
        stats.justificado++
        break
    }
  })
  
  const totalClasses = props.history.length
  const attendedClasses = stats.presente + stats.tarde + stats.justificado
  const rate = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0
  
  return {
    ...stats,
    rate
  }
})

const handleOverlayClick = () => {
  emit('close')
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getStatusClass = (status: string) => {
  const classes = {
    'Presente': 'presente',
    'Ausente': 'ausente',
    'Tardanza': 'tarde',
    'Justificado': 'justificado'
  }
  return classes[status as keyof typeof classes] || 'ausente'
}

const getStatusIcon = (status: string) => {
  const icons = {
    'Presente': 'fas fa-check-circle',
    'Ausente': 'fas fa-times-circle',
    'Tardanza': 'fas fa-clock',
    'Justificado': 'fas fa-file-alt'
  }
  return icons[status as keyof typeof icons] || 'fas fa-question-circle'
}

const getStatusText = (status: string) => {
  const texts = {
    'Presente': 'Presente',
    'Ausente': 'Ausente',
    'Tardanza': 'Tardanza',
    'Justificado': 'Justificado'
  }
  return texts[status as keyof typeof texts] || status
}
</script>

<style scoped>
.modal-overlay {
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

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #495057;
  font-size: 1.25rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #f8f9fa;
  color: #495057;
}

.modal-body {
  padding: 1.5rem;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.student-avatar {
  width: 50px;
  height: 50px;
  background-color: #3498db;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.student-details h4 {
  margin: 0 0 0.25rem 0;
  color: #495057;
}

.student-id {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.history-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h5 {
  margin: 0;
  color: #495057;
  font-size: 1.1rem;
}

.history-stats {
  display: flex;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
  font-size: 0.9rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: #6c757d;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #dee2e6;
}

.history-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 200px;
  color: #495057;
  font-weight: 500;
}

.history-status {
  min-width: 120px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.presente {
  background-color: #d4edda;
  color: #155724;
  border-left-color: #28a745;
}

.status-badge.ausente {
  background-color: #f8d7da;
  color: #721c24;
  border-left-color: #dc3545;
}

.status-badge.tarde {
  background-color: #fff3cd;
  color: #856404;
  border-left-color: #ffc107;
}

.status-badge.justificado {
  background-color: #d1ecf1;
  color: #0c5460;
  border-left-color: #17a2b8;
}

.history-observations {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  color: #6c757d;
  font-size: 0.9rem;
}

.stats-section h5 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1.1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.stat-card i {
  font-size: 1.5rem;
}

.stat-card.presente i {
  color: #28a745;
}

.stat-card.ausente i {
  color: #dc3545;
}

.stat-card.tarde i {
  color: #ffc107;
}

.stat-card.justificado i {
  color: #17a2b8;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 1.25rem;
  font-weight: bold;
  color: #495057;
}

.stat-label {
  font-size: 0.8rem;
  color: #6c757d;
}

.attendance-rate {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.rate-label {
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.5rem;
}

.rate-bar {
  height: 8px;
  background-color: #dee2e6;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.rate-fill {
  height: 100%;
  background-color: #28a745;
  transition: width 0.3s ease;
}

.rate-percentage {
  text-align: center;
  font-weight: bold;
  color: #495057;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
  
  .student-info {
    flex-direction: column;
    text-align: center;
  }
  
  .history-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .history-date {
    min-width: auto;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
