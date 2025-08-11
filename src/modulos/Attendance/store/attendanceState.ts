import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AttendanceRecord {
  id: string
  classId: string
  date: string
  teacherId: string
  data: {
    presentes?: string[]
    ausentes?: string[]
    tarde?: string[]
    justificacion?: Array<{
      studentId: string
      reason: string
      attachments?: string[]
    }>
  }
  observations?: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}

export interface AttendanceStats {
  totalRecords: number
  completedRecords: number
  pendingRecords: number
  completionRate: number
}

export interface DayAttendanceData {
  date: string
  totalClasses: number
  completedAttendances: number
  pendingAttendances: number
  classes: Array<{
    id: string
    name: string
    status: 'complete' | 'partial' | 'pending'
  }>
}

/**
 * Store para el estado de asistencia
 * Maneja el estado reactivo de los registros de asistencia
 */
export const useAttendanceStateStore = defineStore('attendanceState', () => {
  // Estado reactivo
  const attendanceRecords = ref<Record<string, AttendanceRecord>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastSync = ref<Date | null>(null)
  const selectedDate = ref<Date | null>(null)
  const selectedClassId = ref<string | null>(null)

  // Cache para optimizar consultas
  const dateCache = ref<Record<string, DayAttendanceData>>({})
  const classCache = ref<Record<string, AttendanceRecord[]>>({})

  // Computed properties
  const totalRecords = computed(() => Object.keys(attendanceRecords.value).length)

  const recordsByDate = computed(() => {
    const grouped: Record<string, AttendanceRecord[]> = {}
    
    Object.values(attendanceRecords.value).forEach(record => {
      if (!grouped[record.date]) {
        grouped[record.date] = []
      }
      grouped[record.date].push(record)
    })
    
    return grouped
  })

  const recordsByClass = computed(() => {
    const grouped: Record<string, AttendanceRecord[]> = {}
    
    Object.values(attendanceRecords.value).forEach(record => {
      if (!grouped[record.classId]) {
        grouped[record.classId] = []
      }
      grouped[record.classId].push(record)
    })
    
    return grouped
  })

  const currentMonthRecords = computed(() => {
    if (!selectedDate.value) return []
    
    const currentMonth = selectedDate.value.getMonth()
    const currentYear = selectedDate.value.getFullYear()
    
    return Object.values(attendanceRecords.value).filter(record => {
      const recordDate = new Date(record.date)
      return recordDate.getMonth() === currentMonth && 
             recordDate.getFullYear() === currentYear
    })
  })

  const monthStats = computed((): AttendanceStats => {
    const records = currentMonthRecords.value
    const completed = records.filter(record => 
      record.data.presentes?.length || 
      record.data.ausentes?.length || 
      record.data.tarde?.length
    ).length
    
    return {
      totalRecords: records.length,
      completedRecords: completed,
      pendingRecords: records.length - completed,
      completionRate: records.length > 0 ? (completed / records.length) * 100 : 0
    }
  })

  // Getters
  const getRecordById = (id: string) => attendanceRecords.value[id]
  
  const getRecordsByDate = (date: string) => recordsByDate.value[date] || []
  
  const getRecordsByClass = (classId: string) => recordsByClass.value[classId] || []
  
  const getRecordByClassAndDate = (classId: string, date: string) => {
    return Object.values(attendanceRecords.value).find(
      record => record.classId === classId && record.date === date
    )
  }

  const hasRecordForDate = (date: string) => {
    return recordsByDate.value[date]?.length > 0
  }

  const getAttendanceStatus = (classId: string, date: string) => {
    const record = getRecordByClassAndDate(classId, date)
    if (!record) return 'pending'
    
    const hasData = record.data.presentes?.length || 
                   record.data.ausentes?.length || 
                   record.data.tarde?.length
    
    return hasData ? 'complete' : 'partial'
  }

  // Mutations
  const setAttendanceRecords = (records: Record<string, AttendanceRecord>) => {
    attendanceRecords.value = records
  }

  const addAttendanceRecord = (record: AttendanceRecord) => {
    attendanceRecords.value[record.id] = record
  }

  const updateAttendanceRecord = (id: string, updates: Partial<AttendanceRecord>) => {
    if (attendanceRecords.value[id]) {
      attendanceRecords.value[id] = { ...attendanceRecords.value[id], ...updates }
    }
  }

  const removeAttendanceRecord = (id: string) => {
    delete attendanceRecords.value[id]
  }

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const setError = (value: string | null) => {
    error.value = value
  }

  const setLastSync = (date: Date) => {
    lastSync.value = date
  }

  const setSelectedDate = (date: Date | null) => {
    selectedDate.value = date
  }

  const setSelectedClassId = (classId: string | null) => {
    selectedClassId.value = classId
  }

  const clearCache = () => {
    dateCache.value = {}
    classCache.value = {}
  }

  const clearAll = () => {
    attendanceRecords.value = {}
    loading.value = false
    error.value = null
    lastSync.value = null
    selectedDate.value = null
    selectedClassId.value = null
    clearCache()
  }

  return {
    // Estado
    attendanceRecords,
    loading,
    error,
    lastSync,
    selectedDate,
    selectedClassId,
    dateCache,
    classCache,

    // Computed
    totalRecords,
    recordsByDate,
    recordsByClass,
    currentMonthRecords,
    monthStats,

    // Getters
    getRecordById,
    getRecordsByDate,
    getRecordsByClass,
    getRecordByClassAndDate,
    hasRecordForDate,
    getAttendanceStatus,

    // Mutations
    setAttendanceRecords,
    addAttendanceRecord,
    updateAttendanceRecord,
    removeAttendanceRecord,
    setLoading,
    setError,
    setLastSync,
    setSelectedDate,
    setSelectedClassId,
    clearCache,
    clearAll
  }
})
