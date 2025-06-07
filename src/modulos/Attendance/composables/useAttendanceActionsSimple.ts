import { computed } from 'vue'
import type { Student } from '../../Students/types/student'
import type { AttendanceStatus, AttendanceDocument } from '../types/attendance'
import { useAttendanceStore } from '../store/attendance'
import { useAuthStore } from '../../../stores/auth'

export function useAttendanceActionsSimple(params: {
  localStudents: any,
  localAttendanceRecords: any,
  pendingChanges: any,
  pendingJustifications: any,
  displayToast: any,
  isProcessing: any,
  selectedDate: any,
  selectedClass: any
}) {
  const {
    localStudents,
    localAttendanceRecords,
    pendingChanges,
    pendingJustifications,
    displayToast,
    isProcessing,
    selectedDate,
    selectedClass
  } = params

  const attendanceStore = useAttendanceStore()

  const pendingChangesCount = computed(() => pendingChanges.value.size)
  const hasPendingChanges = computed(() => pendingChanges.value.size > 0)

  const saveAllPendingChanges = async () => {
    if (pendingChanges.value.size === 0 && pendingJustifications.value.size === 0) {
      console.log('No hay cambios pendientes para guardar')
      return { success: true, errors: [] }
    }

    const dateToSave = selectedDate.value
    const classIdToSave = selectedClass.value

    if (!dateToSave || !classIdToSave) {
      const errorMsg = 'Fecha o clase no válida para guardar cambios'
      console.error(errorMsg)
      displayToast?.(errorMsg, 'error')
      return { success: false, errors: [errorMsg] }
    }

    console.log(`Guardando ${pendingChanges.value.size} cambios de estado y ${pendingJustifications.value.size} justificaciones para Fecha: ${dateToSave}, Clase: ${classIdToSave}`)

    try {
      isProcessing.value = true      // Combinar los registros locales con los cambios pendientes
      const finalRecords = { ...localAttendanceRecords.value }
      
      // Aplicar cambios pendientes a los registros finales
      for (const studentId of pendingChanges.value) {
        if (localAttendanceRecords.value[studentId]) {
          finalRecords[studentId] = localAttendanceRecords.value[studentId]
        }
      }
      
      // Crear arrays por estado de asistencia
      const presentes: string[] = []
      const ausentes: string[] = []
      const tarde: string[] = []
      const justificacion: any[] = []
      
      Object.entries(finalRecords).forEach(([studentId, status]) => {
        switch (status) {
          case 'Presente':
            presentes.push(studentId)
            break
          case 'Ausente':
            ausentes.push(studentId)
            break
          case 'Tardanza':
            tarde.push(studentId)
            break
          case 'Justificado':
            tarde.push(studentId) // Los justificados van en tarde
            // Agregar justificación si existe
            const justificationData = pendingJustifications.value.get(studentId)
            if (justificationData) {
              justificacion.push({
                id: studentId,
                reason: justificationData.reason || 'Justificación registrada',
                documentUrl: justificationData.documentURL || '',
                approvalStatus: 'pending',
                createdAt: new Date(),
                timeLimit: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              })
            }
            break
        }
      })

      const authStore = useAuthStore()
      const teacherId = authStore.user?.uid || ''
      
      // Crear el documento de asistencia
      const attendanceDoc: AttendanceDocument = {
        id: `${dateToSave}_${classIdToSave}`,
        classId: classIdToSave,
        fecha: dateToSave,
        teacherId,
        uid: teacherId,
        createdAt: attendanceStore.currentAttendanceDoc?.createdAt || new Date(),
        updatedAt: new Date(),
        data: {
          ausentes,
          presentes,
          tarde,
          justificacion,
          observación: attendanceStore.currentAttendanceDoc?.data.observación || ''
        }
      }
      
      // Guardar el documento completo usando el método del store
      await attendanceStore.saveAttendanceDocument(attendanceDoc)
      
      console.log(`✅ Documento guardado exitosamente para ${dateToSave} - ${classIdToSave}`)
      
      // Limpiar cambios pendientes después del guardado exitoso
      pendingChanges.value.clear()
      pendingJustifications.value.clear()

      displayToast?.('Asistencia guardada correctamente', 'success')
      
      return { success: true, errors: [] }

    } catch (error) {
      console.error('Error general en el proceso de guardado saveAllPendingChanges:', error)
      displayToast?.('Error al guardar la asistencia', 'error')
      return { success: false, errors: [error] }
    } finally {
      isProcessing.value = false
    }
  }

  const addJustification = async (studentId: string, justificationData: any) => {
    try {
      pendingJustifications.value.set(studentId, justificationData)
      console.log(`Justificación añadida para ${studentId}:`, justificationData)
      return { success: true }
    } catch (error) {
      console.error('Error adding justification:', error)
      return { success: false, error }
    }
  }
  const removeJustification = (studentId: string) => {
    try {
      pendingJustifications.value.delete(studentId)
      console.log(`Justificación eliminada para ${studentId}`)
      return { success: true }
    } catch (error) {
      console.error('Error removing justification:', error)
      return { success: false, error }
    }
  }

  const updateStudentStatus = (studentId: string, status: AttendanceStatus) => {
    localAttendanceRecords.value[studentId] = status
    pendingChanges.value.add(studentId)
    console.log(`Estado actualizado para ${studentId}: ${status}`)
  }

  const markAllAsPresent = () => {
    localStudents.value.forEach((student: Student) => {
      localAttendanceRecords.value[student.id] = 'Presente'
      pendingChanges.value.add(student.id)
    })
    console.log('Todos los estudiantes marcados como presentes')
  }

  const markAllAsAbsent = () => {
    localStudents.value.forEach((student: Student) => {
      localAttendanceRecords.value[student.id] = 'Ausente'
      pendingChanges.value.add(student.id)
    })
    console.log('Todos los estudiantes marcados como ausentes')
  }

  const markAllAsLate = () => {
    localStudents.value.forEach((student: Student) => {
      localAttendanceRecords.value[student.id] = 'Tardanza'
      pendingChanges.value.add(student.id)
    })
    console.log('Todos los estudiantes marcados como tardanza')
  }

  const resetAllStatuses = async () => {
    localStudents.value.forEach((student: Student) => {
      localAttendanceRecords.value[student.id] = 'Ausente'
    })
    pendingChanges.value.clear()
    pendingJustifications.value.clear()
    console.log('Todos los estados reiniciados')
  }
  return {
    pendingChangesCount,
    hasPendingChanges,
    saveAllPendingChanges,
    addJustification,
    removeJustification,
    updateStudentStatus,
    markAllAsPresent,
    markAllAsAbsent,
    markAllAsLate,
    resetAllStatuses
  }
}
