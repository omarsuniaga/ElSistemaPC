/**
 * Composable para gestionar las operaciones de asistencia
 * Extrae toda la lógica de asistencia del AttendanceView.vue
 */
import {computed} from "vue"
import {useAuthStore} from "@/stores/auth"
import {useAttendanceStore} from "@/modulos/Attendance/store/attendance"
import {useStudentsStore} from "@/modulos/Students/store/students"
import {useClassesStore} from "@/modulos/Classes/store/classes"
import {useTeacherClassCache} from "@/composables/useTeacherClassCache"
import {recordAttendance, addClassObservation} from "@/modulos/Attendance/service/attendanceUnified"
import type {AttendanceStatus, ClassObservation} from "@/modulos/Attendance/types/attendance"
import type {SelectedStudent} from "@/modulos/Students/types/student"
import type {useAttendanceState} from "./useAttendanceState"

export function useAttendanceOperations(state: ReturnType<typeof useAttendanceState>) {
  const authStore = useAuthStore()
  const attendanceStore = useAttendanceStore()
  const studentsStore = useStudentsStore()
  const classesStore = useClassesStore()
  const teacherCache = useTeacherClassCache()

  // ============= COMPUTED PROPERTIES =============
  const currentTeacherId = computed(() => authStore.user?.uid || "")

  const getObservationsCount = computed(() => {
    return attendanceStore.currentAttendanceDoc?.data.observación ? 1 : 0
  })

  // ============= ATTENDANCE MANAGEMENT =============
  const handleUpdateStatus = async (studentId: string, status: string) => {
    const validStatus = status as AttendanceStatus
    const previousStatus = attendanceStore.attendanceRecords[studentId]

    console.log(`[AttendanceOps] Actualizando estado de asistencia:`)
    console.log(`- Estudiante: ${studentId}`)
    console.log(`- Estado anterior: ${previousStatus}`)
    console.log(`- Estado nuevo: ${validStatus}`)

    try {
      // Use unified service with automatic permission validation
      const result = await recordAttendance(state.selectedClass.value, currentTeacherId.value, {
        studentId,
        status: validStatus,
        date: state.selectedDate.value,
        classId: state.selectedClass.value,
        metadata: {
          previousStatus,
          updatedAt: new Date().toISOString(),
          source: "attendance-view",
        },
      })

      if (result.success) {
        // Update local state only if operation was successful
        attendanceStore.attendanceRecords[studentId] = validStatus

        // Invalidate cache to maintain synchronization
        await teacherCache.invalidateOnEvent("attendance-updated")

        state.showToast("Asistencia actualizada correctamente", "success")

        // Verify data after update
        setTimeout(() => verifyAttendanceDataIntegrity(), 100)
      } else {
        // Handle errors by type
        if (result.requiresPermission) {
          state.showToast(`Sin permisos: ${result.error}`, "error")
          console.warn("Permisos insuficientes:", result.error)
        } else {
          state.showToast(`Error: ${result.error}`, "error")
          console.error("Error actualizando asistencia:", result.error)
        }
        return
      }
    } catch (error) {
      console.error("Error inesperado actualizando asistencia:", error)
      state.showToast("Error inesperado. Intente nuevamente.", "error")
      return
    }

    // Show observation alert if needed
    if (status === "Ausente" || status === "Tardanza") {
      state.showObservationAlert.value = true
      setTimeout(() => {
        state.showObservationAlert.value = false
      }, 3000)
    }
  }

  // ============= DATA LOADING =============
  const loadAttendanceData = async (className: string) => {
    try {
      console.log("[AttendanceOps] loadAttendanceData:", {
        className,
        selectedDate: state.selectedDate.value,
      })
      state.isLoading.value = true
      state.loadingMessage.value = "Cargando asistencia..."

      // Reset attendance records
      attendanceStore.attendanceRecords = {}
      attendanceStore.selectedClass = className
      attendanceStore.selectedDate = state.selectedDate.value

      console.log("[AttendanceOps] Before fetchAttendanceDocument")

      // Fetch attendance document
      const attendanceDoc = await attendanceStore.fetchAttendanceDocument(
        state.selectedDate.value,
        className
      )

      console.log(
        "[AttendanceOps] After fetchAttendanceDocument, document:",
        attendanceDoc ? "FOUND" : "NOT FOUND"
      )

      // Load students for the class
      const students = studentsStore.getStudentsByClass(className)
      console.log("[AttendanceOps] Students for class:", students.length)

      // Initialize attendance records for students not already in the document
      students.forEach((student) => {
        if (!(student.id in attendanceStore.attendanceRecords)) {
          attendanceStore.attendanceRecords[student.id] = "Ausente"
        }
      })

      // Only log final records in development or when debugging is needed
      if (
        process.env.NODE_ENV === "development" &&
        window.localStorage.getItem("attendance-debug") === "true"
      ) {
        console.log(
          "[AttendanceOps] Final attendance records after initialization:",
          attendanceStore.attendanceRecords
        )
      }

      // Verify data integrity
      verifyAttendanceDataIntegrity()

      // Only update analytics if needed (with caching)
      if (window.localStorage.getItem("attendance-analytics-enabled") === "true") {
        await attendanceStore.updateAnalytics(true)
      }
    } catch (err) {
      console.error("Error loading attendance data:", err)
      state.showToast("Error al cargar datos de asistencia", "error")
    } finally {
      state.isLoading.value = false
      state.loadingMessage.value = ""
    }
  }

  const forceReloadAttendanceData = async () => {
    try {
      console.log("[AttendanceOps] Forzando recarga de datos de asistencia...")
      state.isLoading.value = true
      state.loadingMessage.value = "Recargando datos de asistencia..."

      // Clear current data
      attendanceStore.attendanceRecords = {}
      attendanceStore.currentAttendanceDoc = null

      // Reload with force flag
      await attendanceStore.fetchAttendanceDocument(
        state.selectedDate.value,
        state.selectedClass.value,
        true
      )

      // Reinitialize student records
      const students = studentsStore.getStudentsByClass(state.selectedClass.value)
      students.forEach((student) => {
        if (!(student.id in attendanceStore.attendanceRecords)) {
          attendanceStore.attendanceRecords[student.id] = "Ausente"
        }
      })

      // Verify integrity after reload
      verifyAttendanceDataIntegrity()

      state.showToast("Datos de asistencia recargados correctamente", "success")
    } catch (err) {
      console.error("Error recargando datos:", err)
      state.showToast("Error al recargar datos de asistencia", "error")
    } finally {
      state.isLoading.value = false
      state.loadingMessage.value = ""
    }
  }

  // ============= OBSERVATIONS MANAGEMENT =============
  const handleOpenObservation = async (
    student: SelectedStudent | null,
    observation?: ClassObservation | null
  ) => {
    console.log(
      "[AttendanceOps] handleOpenObservation llamado con estudiante:",
      student,
      "y observación:",
      observation
    )

    // Validate permissions before opening modal
    const currentClass = state.availableClasses.value?.find(
      (cls) => cls.id === state.selectedClass.value
    )
    if (currentClass?.isSharedClass && currentClass?.teacherPermissions) {
      const canAdd = currentClass.teacherPermissions.canAddObservations
      const canView = currentClass.teacherPermissions.canViewObservations

      if (!canAdd && !canView) {
        state.showToast(
          "No tienes permisos para gestionar observaciones en esta clase compartida",
          "error"
        )
        return
      }

      if (observation && !canView) {
        state.showToast(
          "No tienes permisos para ver observaciones en esta clase compartida",
          "error"
        )
        return
      }

      if (!observation && !canAdd) {
        state.showToast(
          "No tienes permisos para crear observaciones en esta clase compartida",
          "error"
        )
        return
      }
    }

    state.selectedStudentForObs.value = student
    state.observationToEdit.value = observation || null
    state.showObservationsModal.value = true

    console.log(
      "[AttendanceOps] Estado después de setear showObservationsModal:",
      state.showObservationsModal.value
    )
  }

  const handleObservationAdded = async (observations: string) => {
    try {
      state.isLoading.value = true
      state.loadingMessage.value = "Guardando observación..."

      console.log(
        `[AttendanceOps] Guardando observación para clase ${state.selectedClass.value} - fecha ${state.selectedDate.value}:`,
        observations
      )

      // Use unified service with automatic permission validation
      const result = await addClassObservation(state.selectedClass.value, currentTeacherId.value, {
        text: observations,
        date: state.selectedDate.value,
        type: "class-observation",
        studentId: state.selectedStudentForObs.value?.id || undefined,
      })

      if (result.success) {
        // Also update traditional store for compatibility
        await attendanceStore.updateObservations(
          state.selectedDate.value,
          state.selectedClass.value,
          observations
        )

        // Invalidate cache to maintain synchronization
        await teacherCache.invalidateOnEvent("observation-added")

        // Verify data after saving observation
        setTimeout(() => verifyAttendanceDataIntegrity(), 100)

        state.showToast("Observación guardada correctamente", "success")
        state.showObservationsModal.value = false
      } else {
        // Handle errors by type
        if (result.requiresPermission) {
          state.showToast(`Sin permisos para observaciones: ${result.error}`, "error")
          console.warn("Permisos insuficientes para observaciones:", result.error)
        } else {
          state.showToast(`Error guardando observación: ${result.error}`, "error")
          console.error("Error guardando observación:", result.error)
        }
      }
    } catch (err) {
      console.error("Error inesperado saving observation:", err)
      state.showToast("Error inesperado al guardar la observación", "error")
    } finally {
      state.isLoading.value = false
      state.loadingMessage.value = ""
    }
  }

  // ============= JUSTIFICATION MANAGEMENT =============
  const handleOpenJustification = (student: SelectedStudent) => {
    const studentData = studentsStore
      .getStudentsByClass(state.selectedClass.value)
      .find((s: any) => s.id === student.id)
    state.selectedStudentForJustification.value = studentData
    state.showJustificationModal.value = true
  }

  const handleSaveJustification = async (data: {
    reason: string
    documentUrl?: string
    file?: File
  }) => {
    try {
      if (!state.selectedStudentForJustification.value) return

      state.isLoading.value = true
      state.loadingMessage.value = "Guardando justificación..."

      const studentId = state.selectedStudentForJustification.value.id
      const previousStatus = attendanceStore.attendanceRecords[studentId]

      console.log(`[AttendanceOps] Guardando justificación para estudiante ${studentId}:`)
      console.log(`- Estado anterior: ${previousStatus}`)
      console.log(`- Razón: ${data.reason}`)

      // Update attendance status to justified
      attendanceStore.attendanceRecords[studentId] = "Justificado"

      // Save justification
      if (data.file) {
        await attendanceStore.addJustificationToAttendance(
          studentId,
          state.selectedDate.value,
          state.selectedClass.value,
          data.reason,
          data.file
        )
      } else {
        // Create JustificationData object for the store function
        const justificationData = {
          studentId,
          classId: state.selectedClass.value,
          fecha: state.selectedDate.value,
          reason: data.reason,
          documentUrl: data.documentUrl || "",
          approvalStatus: "pending" as const,
          createdAt: new Date(),
          timeLimit: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }
        await attendanceStore.addJustification(justificationData)
      }

      // Verify data integrity after justification
      setTimeout(() => verifyAttendanceDataIntegrity(), 100)

      state.showJustifiedAbsenceModal.value = false
      state.showToast("Justificación guardada correctamente", "success")
    } catch (err) {
      console.error("Error saving justification:", err)
      state.showToast("Error al guardar la justificación", "error")

      // Restore previous status if error occurred
      if (state.selectedStudentForJustification.value) {
        const studentId = state.selectedStudentForJustification.value.id
        const currentDoc = attendanceStore.currentAttendanceDoc
        if (currentDoc) {
          if (currentDoc.data.presentes?.includes(studentId)) {
            attendanceStore.attendanceRecords[studentId] = "Presente"
          } else if (currentDoc.data.tarde?.includes(studentId)) {
            attendanceStore.attendanceRecords[studentId] = "Tardanza"
          } else {
            attendanceStore.attendanceRecords[studentId] = "Ausente"
          }
        }
      }
    } finally {
      state.isLoading.value = false
      state.loadingMessage.value = ""
    }
  }

  // ============= EMERGENCY CLASS MANAGEMENT =============
  const handleEmergencyClassSubmitted = async (emergencyClassData: any) => {
    console.log("[AttendanceOps] Datos de clase emergente recibidos:", emergencyClassData)

    try {
      console.log("[AttendanceOps] Clase emergente creada exitosamente:", {
        id: emergencyClassData.emergencyClassId,
        nombre: emergencyClassData.className,
        tipo: emergencyClassData.classType,
        fecha: emergencyClassData.date,
        horario: `${emergencyClassData.startTime} - ${emergencyClassData.endTime}`,
        instrumento: emergencyClassData.instrument,
        motivo: emergencyClassData.reason,
        estudiantes: emergencyClassData.selectedStudents,
        maestro: emergencyClassData.teacherId,
      })

      state.showToast("Clase emergente creada exitosamente", "success")
      state.showEmergencyClassModal.value = false

      // Load attendance view for the emergency class
      state.selectedClass.value =
        emergencyClassData.emergencyClassId || emergencyClassData.className
      state.selectedDate.value = emergencyClassData.date

      // Load emergency class attendance data
      await loadEmergencyClassAttendanceData(emergencyClassData)

      // Change to attendance view
      state.updateView("attendance-form")
    } catch (error) {
      console.error("[AttendanceOps] Error al procesar clase emergente:", error)
      state.showToast("Error al procesar la clase emergente", "error")
    }
  }

  const loadEmergencyClassAttendanceData = async (emergencyClassData: any) => {
    try {
      console.log(
        "[AttendanceOps] Cargando datos de asistencia para clase emergente:",
        emergencyClassData
      )
      state.isLoading.value = true
      state.loadingMessage.value = "Preparando clase emergente..."

      // Use store method to create attendance document
      const attendanceDocId = await attendanceStore.createEmergencyClassAttendanceDocument({
        emergencyClassId: emergencyClassData.emergencyClassId,
        className: emergencyClassData.className,
        date: emergencyClassData.date,
        selectedStudents: emergencyClassData.selectedStudents,
        teacherId: emergencyClassData.teacherId,
      })

      console.log("[AttendanceOps] Documento de asistencia creado con ID:", attendanceDocId)

      // Update selectedClassName computed
      state.selectedClass.value = emergencyClassData.emergencyClassId

      // Verify data integrity
      verifyAttendanceDataIntegrity()

      state.showToast("Clase emergente preparada para tomar asistencia", "success")
    } catch (err) {
      console.error("Error loading emergency class attendance data:", err)
      state.showToast("Error al preparar la clase emergente", "error")
      throw err
    } finally {
      state.isLoading.value = false
      state.loadingMessage.value = ""
    }
  }

  // ============= DEBUGGING HELPERS =============
  const verifyAttendanceDataIntegrity = () => {
    const debugEnabled = window.localStorage.getItem("attendance-debug") === "true"

    if (!debugEnabled) {
      // Quick verification without detailed logs
      if (attendanceStore.currentAttendanceDoc) {
        const doc = attendanceStore.currentAttendanceDoc
        const totalInArrays =
          (doc.data.presentes?.length || 0) +
          (doc.data.ausentes?.length || 0) +
          (doc.data.tarde?.length || 0)
        const totalInRecords = Object.keys(attendanceStore.attendanceRecords).length

        if (totalInArrays !== totalInRecords) {
          console.warn(
            "[AttendanceOps] ⚠️ Data inconsistency detected - enable debug mode for details"
          )
        }
      }
      return
    }

    // Detailed debugging when enabled
    console.log("=== VERIFICACIÓN DE INTEGRIDAD DE DATOS ===")
    console.log("Fecha seleccionada:", state.selectedDate.value)
    console.log("Clase seleccionada:", state.selectedClass.value)
    console.log(
      "Documento actual en store:",
      attendanceStore.currentAttendanceDoc
        ? JSON.parse(JSON.stringify(attendanceStore.currentAttendanceDoc))
        : null
    )
    console.log(
      "Registros de asistencia en store:",
      JSON.parse(JSON.stringify(attendanceStore.attendanceRecords))
    )

    if (attendanceStore.currentAttendanceDoc) {
      const doc = attendanceStore.currentAttendanceDoc
      console.log("Arrays de Firestore:")
      console.log("- Presentes:", doc.data.presentes)
      console.log("- Ausentes:", doc.data.ausentes)
      console.log("- Tarde:", doc.data.tarde)
      console.log("- Justificaciones:", doc.data.justificacion)

      // Verify consistency
      const totalInArrays =
        (doc.data.presentes?.length || 0) +
        (doc.data.ausentes?.length || 0) +
        (doc.data.tarde?.length || 0)
      const totalInRecords = Object.keys(attendanceStore.attendanceRecords).length

      console.log(`Total en arrays de Firestore: ${totalInArrays}`)
      console.log(`Total en registros de asistencia: ${totalInRecords}`)

      if (totalInArrays !== totalInRecords) {
        console.warn("⚠️ INCONSISTENCIA DETECTADA: Los totales no coinciden")
      } else {
        console.log("✅ Datos consistentes")
      }
    }
    console.log("=== FIN VERIFICACIÓN ===")
  }

  const runAttendanceDebug = async () => {
    try {
      if (!state.selectedClass.value || !state.selectedDate.value) {
        state.showToast("Selecciona una clase y fecha para hacer debugging", "error")
        return
      }

      state.isLoading.value = true
      state.loadingMessage.value = "Ejecutando debugging del sistema de asistencia..."

      console.log("[AttendanceOps] Ejecutando debugging avanzado...")

      // Run the advanced debugging function
      const debugResults = await attendanceStore.debugAttendanceSystem(
        state.selectedDate.value,
        state.selectedClass.value,
        authStore.user?.uid ?? ""
      )

      // Show results in console and UI
      if (debugResults?.targetDocument) {
        state.showToast("✅ Documento encontrado - revisar consola para detalles", "success")
        console.log("[AttendanceOps] Debugging completado - documento encontrado")
      } else {
        state.showToast("❌ No se encontró documento - revisar consola para detalles", "error")
        console.log("[AttendanceOps] Debugging completado - documento NO encontrado")
      }

      // Also verify current state
      verifyAttendanceDataIntegrity()
    } catch (err) {
      console.error("[AttendanceOps] Error en debugging:", err)
      state.showToast("Error ejecutando debugging", "error")
    } finally {
      state.isLoading.value = false
      state.loadingMessage.value = ""
    }
  }

  return {
    // Computed
    currentTeacherId,
    getObservationsCount,

    // Attendance management
    handleUpdateStatus,
    loadAttendanceData,
    forceReloadAttendanceData,

    // Observations
    handleOpenObservation,
    handleObservationAdded,

    // Justifications
    handleOpenJustification,
    handleSaveJustification,

    // Emergency classes
    handleEmergencyClassSubmitted,
    loadEmergencyClassAttendanceData,

    // Debugging
    verifyAttendanceDataIntegrity,
    runAttendanceDebug,
  }
}
