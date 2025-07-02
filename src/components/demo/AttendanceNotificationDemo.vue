<template>
  <div class="notification-demo">
    <div class="demo-header">
      <h2>🔔 Demo Sistema de Notificaciones de Asistencia</h2>
      <p>Esta página simula reportes de asistencia para demostrar el sistema de notificaciones en tiempo real</p>
    </div>

    <div class="demo-controls">
      <div class="control-section">
        <h3>📋 Simular Reporte de Asistencia</h3>
        <div class="form-group">
          <label>Maestro:</label>
          <select v-model="selectedTeacher">
            <option value="">Seleccionar maestro...</option>
            <option v-for="teacher in mockTeachers" :key="teacher.id" :value="teacher">
              {{ teacher.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Clase:</label>
          <select v-model="selectedClass">
            <option value="">Seleccionar clase...</option>
            <option v-for="clase in mockClasses" :key="clase.id" :value="clase">
              {{ clase.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Tipo de Reporte:</label>
          <select v-model="reportType">
            <option value="normal">Normal (sin problemas)</option>
            <option value="some_absences">Algunas ausencias</option>
            <option value="many_absences">Muchas ausencias (urgente)</option>
            <option value="late_students">Muchos estudiantes tarde</option>
          </select>
        </div>

        <div class="form-actions">
          <button 
            :disabled="!selectedTeacher || !selectedClass || creating"
            class="btn-simulate"
            @click="simulateAttendanceReport"
          >
            <component :is="creating ? 'div' : PlusCircleIcon" class="w-5 h-5" :class="creating ? 'animate-spin' : ''" />
            {{ creating ? 'Creando...' : 'Simular Reporte' }}
          </button>

          <button :disabled="creating" class="btn-multiple" @click="simulateMultipleReports">
            <BoltIcon class="w-5 h-5" />
            Simular 3 Reportes Aleatorios
          </button>
        </div>
      </div>

      <div class="control-section">
        <h3>🔍 Estado del Sistema</h3>
        <div class="system-status">
          <div class="status-item" :class="{ active: systemStatus.isActive }">
            <component :is="systemStatus.isActive ? CheckCircleIcon : XCircleIcon" class="w-5 h-5" />
            <span>Sistema: {{ systemStatus.isActive ? 'Activo' : 'Inactivo' }}</span>
          </div>
          <div class="status-item">
            <Icon name="clock" />
            <span>Activo por: {{ formatUptime(systemStatus.uptime) }}</span>
          </div>
          <div class="status-item" :class="{ error: systemStatus.lastError }">
            <Icon :name="systemStatus.lastError ? 'alert-triangle' : 'check'" />
            <span>{{ systemStatus.lastError || 'Sin errores' }}</span>
          </div>
        </div>

        <div class="system-actions">
          <button class="btn-refresh" @click="refreshSystemStatus">
            <Icon name="refresh" />
            Actualizar Estado
          </button>
          <button class="btn-restart" @click="restartSystem">
            <Icon name="rotate-ccw" />
            Reiniciar Sistema
          </button>
        </div>
      </div>
    </div>

    <div class="demo-logs">
      <h3>📝 Log de Actividad</h3>
      <div class="log-container">
        <div 
          v-for="(log, index) in activityLog" 
          :key="index" 
          :class="['log-entry', log.type]"
        >
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
        <div v-if="activityLog.length === 0" class="log-empty">
          No hay actividad registrada
        </div>
      </div>
      <button class="btn-clear" @click="clearLogs">
        <Icon name="trash-2" />
        Limpiar Logs
      </button>
    </div>

    <div class="demo-info">
      <h3>ℹ️ Información</h3>
      <ul>
        <li>Los reportes simulados se almacenan en Firebase y activarán notificaciones reales</li>
        <li>Las notificaciones aparecerán en el Panel de Administración</li>
        <li>El sistema detecta automáticamente reportes con problemas (ausencias, tardanzas)</li>
        <li>Los reportes "urgentes" generan notificaciones de alta prioridad</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import {
  PlayIcon,
  StopIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  PlusCircleIcon,
  BoltIcon,
  CheckIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'
import notificationSystem from '../../services/attendanceNotificationManager'

interface MockTeacher {
  id: string
  name: string
  uid: string
}

interface MockClass {
  id: string
  name: string
  studentIds: string[]
}

interface LogEntry {
  timestamp: Date
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export default defineComponent({
  name: 'AttendanceNotificationDemo',
  components: {
    PlayIcon,
    StopIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    InformationCircleIcon,
    PlusCircleIcon,
    BoltIcon,
    CheckIcon,
    ArrowPathIcon,
    TrashIcon
  },
  setup() {
    const selectedTeacher = ref<MockTeacher | null>(null)
    const selectedClass = ref<MockClass | null>(null)
    const reportType = ref('normal')
    const creating = ref(false)
    const activityLog = ref<LogEntry[]>([])
    const systemStatus = ref({
      isActive: false,
      uptime: 0,
      lastError: null as string | null
    })

    // Datos de prueba
    const mockTeachers: MockTeacher[] = [
      { id: 'teacher1', name: 'Ana García', uid: 'teacher1' },
      { id: 'teacher2', name: 'Carlos Rodríguez', uid: 'teacher2' },
      { id: 'teacher3', name: 'María López', uid: 'teacher3' },
      { id: 'teacher4', name: 'José Martínez', uid: 'teacher4' }
    ]

    const mockClasses: MockClass[] = [
      { 
        id: 'class1', 
        name: 'Piano Básico A', 
        studentIds: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'] 
      },
      { 
        id: 'class2', 
        name: 'Guitarra Intermedio', 
        studentIds: ['s9', 's10', 's11', 's12', 's13', 's14'] 
      },
      { 
        id: 'class3', 
        name: 'Violín Avanzado', 
        studentIds: ['s15', 's16', 's17', 's18', 's19'] 
      },
      { 
        id: 'class4', 
        name: 'Coro Infantil', 
        studentIds: ['s20', 's21', 's22', 's23', 's24', 's25', 's26', 's27', 's28', 's29'] 
      }
    ]

    /**
     * Genera datos de asistencia basados en el tipo de reporte
     */
    const generateAttendanceData = (type: string, totalStudents: number) => {
      const studentIds = Array.from({ length: totalStudents }, (_, i) => `student_${i + 1}`)
      
      switch (type) {
        case 'normal':
          return {
            presentes: studentIds.slice(0, Math.floor(totalStudents * 0.9)),
            ausentes: studentIds.slice(Math.floor(totalStudents * 0.9)),
            tarde: [],
            justificacion: []
          }
        
        case 'some_absences':
          const presentCount = Math.floor(totalStudents * 0.7)
          return {
            presentes: studentIds.slice(0, presentCount),
            ausentes: studentIds.slice(presentCount, presentCount + 2),
            tarde: studentIds.slice(presentCount + 2),
            justificacion: []
          }
        
        case 'many_absences':
          const manyPresentCount = Math.floor(totalStudents * 0.5)
          return {
            presentes: studentIds.slice(0, manyPresentCount),
            ausentes: studentIds.slice(manyPresentCount),
            tarde: [],
            justificacion: []
          }
        
        case 'late_students':
          const lateCount = Math.floor(totalStudents * 0.4)
          return {
            presentes: studentIds.slice(0, totalStudents - lateCount),
            ausentes: [],
            tarde: studentIds.slice(totalStudents - lateCount),
            justificacion: []
          }
        
        default:
          return {
            presentes: studentIds,
            ausentes: [],
            tarde: [],
            justificacion: []
          }
      }
    }

    /**
     * Simula un reporte de asistencia
     */
    const simulateAttendanceReport = async () => {
      if (!selectedTeacher.value || !selectedClass.value) return

      try {
        creating.value = true

        const attendanceData = generateAttendanceData(
          reportType.value, 
          selectedClass.value.studentIds.length
        )

        // Crear documento de asistencia en Firebase
        const attendanceDoc = {
          teacherId: selectedTeacher.value.uid,
          classId: selectedClass.value.id,
          fecha: new Date().toISOString().split('T')[0],
          data: attendanceData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }

        await addDoc(collection(db, 'ASISTENCIAS'), attendanceDoc)

        // Log de actividad
        addLog(`✅ Reporte creado para ${selectedClass.value.name} por ${selectedTeacher.value.name}`, 'success')
        addLog(`📊 Stats: ${attendanceData.presentes.length} presentes, ${attendanceData.ausentes.length} ausentes, ${attendanceData.tarde.length} tarde`, 'info')

        // Limpiar selección
        selectedTeacher.value = null
        selectedClass.value = null
        reportType.value = 'normal'

      } catch (error) {
        console.error('Error simulando reporte:', error)
        addLog(`❌ Error creando reporte: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error')
      } finally {
        creating.value = false
      }
    }

    /**
     * Simula múltiples reportes aleatorios
     */
    const simulateMultipleReports = async () => {
      const reportTypes = ['normal', 'some_absences', 'many_absences', 'late_students']
      
      addLog('🔄 Iniciando simulación de múltiples reportes...', 'info')

      for (let i = 0; i < 3; i++) {
        const randomTeacher = mockTeachers[Math.floor(Math.random() * mockTeachers.length)]
        const randomClass = mockClasses[Math.floor(Math.random() * mockClasses.length)]
        const randomType = reportTypes[Math.floor(Math.random() * reportTypes.length)]

        selectedTeacher.value = randomTeacher
        selectedClass.value = randomClass
        reportType.value = randomType

        await simulateAttendanceReport()
        
        // Esperar un poco entre reportes
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      addLog('✅ Simulación de múltiples reportes completada', 'success')
    }

    /**
     * Actualiza el estado del sistema
     */
    const refreshSystemStatus = async () => {
      try {
        const status = notificationSystem.getStatus()
        systemStatus.value = {
          isActive: status.isActive,
          uptime: status.uptime,
          lastError: status.lastError
        }
        addLog('🔄 Estado del sistema actualizado', 'info')
      } catch (error) {
        addLog(`❌ Error actualizando estado: ${error}`, 'error')
      }
    }

    /**
     * Reinicia el sistema de notificaciones
     */
    const restartSystem = async () => {
      try {
        addLog('🔄 Reiniciando sistema de notificaciones...', 'warning')
        await notificationSystem.restart()
        await refreshSystemStatus()
        addLog('✅ Sistema reiniciado correctamente', 'success')
      } catch (error) {
        addLog(`❌ Error reiniciando sistema: ${error}`, 'error')
      }
    }

    /**
     * Agrega una entrada al log
     */
    const addLog = (message: string, type: LogEntry['type'] = 'info') => {
      activityLog.value.unshift({
        timestamp: new Date(),
        message,
        type
      })

      // Mantener solo los últimos 50 logs
      if (activityLog.value.length > 50) {
        activityLog.value = activityLog.value.slice(0, 50)
      }
    }

    /**
     * Limpia los logs
     */
    const clearLogs = () => {
      activityLog.value = []
    }

    /**
     * Formatea el tiempo de actividad
     */
    const formatUptime = (seconds: number): string => {
      if (seconds < 60) return `${seconds}s`
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
      return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
    }

    /**
     * Formatea la hora
     */
    const formatTime = (date: Date): string => {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    // Actualizar estado cada 5 segundos
    let statusInterval: number

    onMounted(() => {
      refreshSystemStatus()
      statusInterval = setInterval(refreshSystemStatus, 5000)
      addLog('🚀 Demo de notificaciones de asistencia iniciado', 'info')
    })

    onUnmounted(() => {
      if (statusInterval) {
        clearInterval(statusInterval)
      }
    })

    return {
      selectedTeacher,
      selectedClass,
      reportType,
      creating,
      activityLog,
      systemStatus,
      mockTeachers,
      mockClasses,
      simulateAttendanceReport,
      simulateMultipleReports,
      refreshSystemStatus,
      restartSystem,
      clearLogs,
      formatUptime,
      formatTime
    }
  }
})
</script>

<style scoped>
.notification-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
}

.demo-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.demo-header h2 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 2rem;
}

.demo-header p {
  margin: 0;
  color: #64748b;
  font-size: 1.125rem;
}

.demo-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.control-section {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.control-section h3 {
  margin: 0 0 1.5rem 0;
  color: #1e293b;
  font-size: 1.25rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-simulate,
.btn-multiple,
.btn-refresh,
.btn-restart,
.btn-clear {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn-simulate {
  background: #3b82f6;
  color: white;
  flex: 1;
}

.btn-simulate:hover:not(:disabled) {
  background: #2563eb;
}

.btn-simulate:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-multiple {
  background: #8b5cf6;
  color: white;
  flex: 1;
}

.btn-multiple:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-refresh {
  background: #10b981;
  color: white;
}

.btn-refresh:hover {
  background: #059669;
}

.btn-restart {
  background: #f59e0b;
  color: white;
}

.btn-restart:hover {
  background: #d97706;
}

.btn-clear {
  background: #ef4444;
  color: white;
  margin-top: 1rem;
}

.btn-clear:hover {
  background: #dc2626;
}

.system-status {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: #f1f5f9;
  color: #475569;
}

.status-item.active {
  background: #dcfce7;
  color: #166534;
}

.status-item.error {
  background: #fef2f2;
  color: #dc2626;
}

.system-actions {
  display: flex;
  gap: 0.5rem;
}

.demo-logs {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.demo-logs h3 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 1.25rem;
}

.log-container {
  background: #1e293b;
  border-radius: 0.5rem;
  padding: 1rem;
  height: 300px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
}

.log-entry {
  display: flex;
  gap: 1rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid #334155;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-time {
  color: #94a3b8;
  white-space: nowrap;
}

.log-message {
  color: #e2e8f0;
}

.log-entry.success .log-message {
  color: #4ade80;
}

.log-entry.warning .log-message {
  color: #fbbf24;
}

.log-entry.error .log-message {
  color: #f87171;
}

.log-entry.info .log-message {
  color: #60a5fa;
}

.log-empty {
  color: #64748b;
  text-align: center;
  padding: 2rem;
  font-style: italic;
}

.demo-info {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.demo-info h3 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 1.25rem;
}

.demo-info ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #475569;
  line-height: 1.6;
}

.demo-info li {
  margin-bottom: 0.5rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .notification-demo {
    padding: 1rem;
  }
  
  .demo-controls {
    grid-template-columns: 1fr;
  }
  
  .form-actions,
  .system-actions {
    flex-direction: column;
  }
}
</style>
