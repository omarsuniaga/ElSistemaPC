/**
 * 🚀 SISTEMA DE ASISTENCIA OPTIMIZADO
 * Mejora significativa en rendimiento y experiencia de usuario
 */

import {ref, computed, reactive} from "vue"
import {useAttendanceStore} from "../store/attendance"
import {useClassesStore} from "../../Classes/store/classes"
import {useStudentsStore} from "../../Students/store/students"
import {useAuthStore} from "../../../stores/auth"
import type {AttendanceStatus} from "../types/attendance"

export function useAttendanceOptimized() {
  const attendanceStore = useAttendanceStore()
  const classesStore = useClassesStore()
  const studentsStore = useStudentsStore()
  const authStore = useAuthStore()

  // 🎯 Estado optimizado
  const state = reactive({
    loading: false,
    error: null as string | null,
    selectedDate: "",
    selectedClass: "",
    pendingUpdates: new Set<string>(),
  })

  // 📊 Cache simple pero efectivo
  const cache = new Map<string, {data: any; timestamp: number}>()
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

  /**
   * 💾 Sistema de cache optimizado
   */
  const setCache = (key: string, data: any): void => {
    cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  const getCache = (key: string): any => {
    const entry = cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > CACHE_TTL) {
      cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * 🚀 Carga optimizada de asistencia
   */
  const loadAttendance = async (date: string, classId: string) => {
    const cacheKey = `attendance_${date}_${classId}`

    // Verificar cache primero
    const cached = getCache(cacheKey)
    if (cached) {
      console.log("📊 [AttendanceOptimized] Cache hit:", cacheKey)
      return cached
    }

    try {
      state.loading = true
      state.error = null

      console.log("🔍 [AttendanceOptimized] Loading from source:", {date, classId})

      const document = await attendanceStore.fetchAttendanceDocument(date, classId)
      const records = attendanceStore.records || []

      // Guardar en cache
      setCache(cacheKey, records)

      return records
    } catch (err: any) {
      console.error("❌ [AttendanceOptimized] Error loading:", err)
      state.error = "Error al cargar asistencia"
      throw err
    } finally {
      state.loading = false
    }
  }

  /**
   * ⚡ Actualización rápida de estado
   */
  const updateStudentStatus = async (
    studentId: string,
    newStatus: AttendanceStatus,
    date: string,
    classId: string
  ) => {
    const updateKey = `${date}_${classId}_${studentId}`

    try {
      state.pendingUpdates.add(updateKey)

      // Actualización inmediata en UI
      attendanceStore.attendanceRecords[studentId] = newStatus

      // Actualizar cache
      const cacheKey = `attendance_${date}_${classId}`
      const cached = getCache(cacheKey)
      if (cached) {
        const updated = cached.map((record: any) =>
          record.studentId === studentId
            ? {...record, status: newStatus, updatedAt: new Date()}
            : record
        )
        setCache(cacheKey, updated)
      }

      // Guardar en base de datos
      await saveAttendanceDocument(date, classId)

      console.log("✅ [AttendanceOptimized] Updated:", updateKey)
    } catch (err: any) {
      console.error("❌ [AttendanceOptimized] Error updating:", err)
      state.error = "Error al actualizar asistencia"
      throw err
    } finally {
      state.pendingUpdates.delete(updateKey)
    }
  }

  /**
   * 💾 Guardado optimizado
   */
  const saveAttendanceDocument = async (date: string, classId: string) => {
    const records = attendanceStore.attendanceRecords
    const teacherId = authStore.user?.uid

    if (!teacherId) {
      throw new Error("Usuario no autenticado")
    }

    // Organizar datos por estado
    const presentes: string[] = []
    const ausentes: string[] = []
    const tarde: string[] = []
    const justificados: string[] = []

    Object.entries(records).forEach(([studentId, status]) => {
      switch (status) {
        case "Presente":
          presentes.push(studentId)
          break
        case "Ausente":
          ausentes.push(studentId)
          break
        case "Tardanza":
          tarde.push(studentId)
          break
        case "Justificado":
          justificados.push(studentId)
          break
      }
    })

    const document = {
      id: `${date}_${classId}`,
      fecha: date,
      classId,
      teacherId,
      data: {
        presentes,
        ausentes,
        tarde,
        justificacion: justificados.map((id) => ({
          id,
          studentId: id,
          reason: "",
          fecha: date,
          classId,
          approvalStatus: "approved" as const,
          createdAt: new Date(),
          timeLimit: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return await attendanceStore.saveAttendanceDocument(document)
  }

  /**
   * 📊 Estadísticas rápidas
   */
  const getQuickStats = (records: Record<string, AttendanceStatus>) => {
    const stats = {
      presente: 0,
      ausente: 0,
      tardanza: 0,
      justificado: 0,
      total: 0,
    }

    Object.values(records).forEach((status) => {
      switch (status) {
        case "Presente":
          stats.presente++
          break
        case "Ausente":
          stats.ausente++
          break
        case "Tardanza":
          stats.tardanza++
          break
        case "Justificado":
          stats.justificado++
          break
      }
    })

    stats.total = stats.presente + stats.ausente + stats.tardanza + stats.justificado

    return {
      ...stats,
      attendanceRate: stats.total > 0 ? ((stats.presente + stats.tardanza) / stats.total) * 100 : 0,
    }
  }

  /**
   * 🎯 Estudiantes de una clase
   */
  const getClassStudents = async (classId: string) => {
    const cacheKey = `class_students_${classId}`
    const cached = getCache(cacheKey)
    if (cached) return cached

    // Verificar si es clase emergente
    const isEmergency = await attendanceStore.isEmergencyClass(classId)

    let students: any[] = []

    if (isEmergency) {
      const emergencyStudents = await attendanceStore.getEmergencyClassStudents(classId)
      students = emergencyStudents
        .map((id: string) => studentsStore.getStudentById(id))
        .filter(Boolean)
    } else {
      const classData = classesStore.getClassById(classId)
      if (classData?.studentIds) {
        students = classData.studentIds
          .map((id: string) => studentsStore.getStudentById(id))
          .filter(Boolean)
      }
    }

    // Cache por 10 minutos (los estudiantes no cambian frecuentemente)
    cache.set(cacheKey, {
      data: students,
      timestamp: Date.now(),
    })

    return students
  }

  /**
   * 🧹 Limpieza de cache
   */
  const clearExpiredCache = () => {
    const now = Date.now()
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        cache.delete(key)
      }
    }
  }

  // 🎯 Computed properties reactivas
  const currentRecords = computed(() => attendanceStore.attendanceRecords)

  const isUpdating = computed(() => (studentId: string) => {
    const key = `${state.selectedDate}_${state.selectedClass}_${studentId}`
    return state.pendingUpdates.has(key)
  })

  const stats = computed(() => getQuickStats(currentRecords.value))

  const cacheInfo = computed(() => ({
    size: cache.size,
    pendingUpdates: state.pendingUpdates.size,
  }))

  return {
    // Estado
    state,
    currentRecords,
    stats,
    cacheInfo,

    // Métodos principales
    loadAttendance,
    updateStudentStatus,
    saveAttendanceDocument,
    getClassStudents,

    // Utilidades
    isUpdating,
    clearExpiredCache,
    getQuickStats,

    // Acceso directo a stores para compatibilidad
    attendanceStore,
    classesStore,
    studentsStore,
    authStore,
  }
}
