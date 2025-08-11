import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useAttendanceStateStore } from './attendanceState'
import { useAttendanceActionsStore } from './attendanceActions'
import { useAttendanceReportsStore } from './attendanceReports'

/**
 * Store principal de asistencia que integra todos los sub-stores
 * Proporciona una interfaz unificada para el módulo de asistencia
 */
export const useAttendanceStore = defineStore('attendance', () => {
  // Sub-stores
  const stateStore = useAttendanceStateStore()
  const actionsStore = useAttendanceActionsStore()
  const reportsStore = useAttendanceReportsStore()

  // Computed properties que combinan datos de múltiples stores
  const isLoading = computed(() => 
    stateStore.loading || reportsStore.reportLoading
  )

  const hasError = computed(() => 
    stateStore.error || reportsStore.reportError
  )

  const allErrors = computed(() => {
    const errors = []
    if (stateStore.error) errors.push(stateStore.error)
    if (reportsStore.reportError) errors.push(reportsStore.reportError)
    return errors
  })

  // Métodos de conveniencia que combinan funcionalidad
  const initializeAttendanceModule = async () => {
    try {
      await actionsStore.fetchAttendanceRecords()
    } catch (error) {
      console.error('Error initializing attendance module:', error)
      throw error
    }
  }

  const getAttendanceForCalendar = async (startDate: string, endDate: string) => {
    try {
      const stats = await actionsStore.getAttendanceStats(startDate, endDate)
      return stats.records
    } catch (error) {
      console.error('Error getting attendance for calendar:', error)
      throw error
    }
  }

  const saveAttendanceAndUpdateState = async (data: any) => {
    try {
      const record = await actionsStore.saveAttendanceRecord(data)
      // El estado se actualiza automáticamente en actionsStore
      return record
    } catch (error) {
      console.error('Error saving attendance:', error)
      throw error
    }
  }

  const generateAndCacheReport = async (startDate: string, endDate: string, classIds?: string[]) => {
    try {
      const report = await reportsStore.generatePeriodReport(startDate, endDate, classIds)
      return report
    } catch (error) {
      console.error('Error generating report:', error)
      throw error
    }
  }

  // Métodos de limpieza
  const clearAllData = () => {
    stateStore.clearAll()
    reportsStore.clearReportCache()
  }

  const refreshData = async () => {
    try {
      stateStore.clearCache()
      await actionsStore.fetchAttendanceRecords()
    } catch (error) {
      console.error('Error refreshing data:', error)
      throw error
    }
  }

  return {
    // Sub-stores (para acceso directo si es necesario)
    stateStore,
    actionsStore,
    reportsStore,

    // Estado combinado
    isLoading,
    hasError,
    allErrors,

    // Métodos de conveniencia
    initializeAttendanceModule,
    getAttendanceForCalendar,
    saveAttendanceAndUpdateState,
    generateAndCacheReport,
    clearAllData,
    refreshData,

    // Re-exportar métodos más utilizados para conveniencia
    // Estado
    attendanceRecords: stateStore.attendanceRecords,
    selectedDate: stateStore.selectedDate,
    selectedClassId: stateStore.selectedClassId,
    monthStats: stateStore.monthStats,

    // Getters
    getRecordById: stateStore.getRecordById,
    getRecordsByDate: stateStore.getRecordsByDate,
    getRecordsByClass: stateStore.getRecordsByClass,
    getRecordByClassAndDate: stateStore.getRecordByClassAndDate,
    hasRecordForDate: stateStore.hasRecordForDate,
    getAttendanceStatus: stateStore.getAttendanceStatus,

    // Acciones
    fetchAttendanceRecords: actionsStore.fetchAttendanceRecords,
    fetchAttendanceByDate: actionsStore.fetchAttendanceByDate,
    fetchAttendanceByClass: actionsStore.fetchAttendanceByClass,
    saveAttendanceRecord: actionsStore.saveAttendanceRecord,
    updateObservations: actionsStore.updateObservations,
    deleteAttendanceRecord: actionsStore.deleteAttendanceRecord,
    getAttendanceStats: actionsStore.getAttendanceStats,

    // Reportes
    currentReport: reportsStore.currentReport,
    currentMetrics: reportsStore.currentMetrics,
    generatePeriodReport: reportsStore.generatePeriodReport,
    generateWeeklyReport: reportsStore.generateWeeklyReport,
    generateMonthlyReport: reportsStore.generateMonthlyReport,
    exportReportToPDF: reportsStore.exportReportToPDF,
    sendReportByEmail: reportsStore.sendReportByEmail,

    // Mutaciones
    setSelectedDate: stateStore.setSelectedDate,
    setSelectedClassId: stateStore.setSelectedClassId,
    setLoading: stateStore.setLoading,
    setError: stateStore.setError
  }
})

// Exportar tipos para uso en otros módulos
export type { AttendanceRecord, AttendanceStats, DayAttendanceData } from './attendanceState'
export type { SaveAttendanceData } from './attendanceActions'
export type { 
  StudentAttendanceReport, 
  ClassAttendanceReport, 
  PeriodReport, 
  AttendanceMetrics 
} from './attendanceReports'
