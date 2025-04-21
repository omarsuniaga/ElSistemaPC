// src/modulos/attendance/composables/useAttendanceState.ts
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useClassesStore } from '@/modulos/Classes/store/classes'
import { useStudentsStore } from '@/modulos/Students/store/students'
import { useAttendanceStore } from '@/modulos/Attendance/store/attendance'
import { useToast } from '@/modulos/attendance/composables/useToast'

export function useAttendanceState(role: 'admin' | 'maestro' = 'maestro') {
  const auth        = useAuthStore()
  const classesStore = useClassesStore()
  const studentsStore = useStudentsStore()
  const attendanceStore = useAttendanceStore()
  const toast       = useToast()

  /*** Estado reactivo ***/
  const selectedDate  = ref<string>( new Date().toISOString().slice(0,10) )
  const selectedClass = ref<string>('')
  const view          = ref<'calendar'|'class-select'|'attendance-form'>('calendar')
  const loading       = ref<boolean>(false)
  const error         = ref<string|null>(null)

  /*** Derived ***/
  // Lista de clases según rol
  const classOptions = computed(() => {
    return role === 'admin'
      ? classesStore.classes
      : classesStore.classes.filter(c => c.teacherId === auth.user?.uid)
  })

  // Alumnos de la clase seleccionada
  const students = computed(() =>
    selectedClass.value
      ? studentsStore.getStudentsByClass(selectedClass.value)
      : []
  )

  // Registros de asistencia cargados
  const attendanceRecords = computed(() => attendanceStore.attendanceRecords)

  // Estados de fecha para pintar el calendario
  const dateStatuses = computed(() =>
    attendanceStore.dateAttendanceStatuses
  )

  // IDs de clases que ya tienen asistencia en la fecha seleccionada
  const classesWithRecords = computed(() =>
    attendanceStore.attendanceDocuments
      .filter(doc => doc.fecha === selectedDate.value)
      .map(doc => doc.classId)
  )

  /*** Actions ***/
  // Carga inicial de datos
  async function init() {
    loading.value = true
    error.value = null
    try {
      await Promise.all([
        classesStore.fetchClasses(),
        studentsStore.fetchStudents(),
        attendanceStore.fetchAllAttendanceDates(),
      ])
    } catch (e: any) {
      error.value = e.message || 'Error al inicializar datos'
      toast.error(error.value)
    } finally {
      loading.value = false
    }
  }

  // Cambia la fecha y sincroniza el store
  async function setDate(date: string) {
    selectedDate.value = date
    attendanceStore.selectedDate = date
  }

  // Cambia la clase y sincroniza el store
  async function setClass(id: string) {
    selectedClass.value = id
    attendanceStore.selectedClass = id
  }

  // Carga el documento + registros para la fecha y clase actuales
  async function loadCurrent() {
    if (!selectedClass.value) return
    loading.value = true
    error.value = null
    try {
      await attendanceStore.fetchAttendanceDocument(
        selectedDate.value,
        selectedClass.value
      )
    } catch (e: any) {
      error.value = e.message || 'Error al cargar asistencia'
      toast.error(error.value)
    } finally {
      loading.value = false
    }
  }

  // Guarda todos los cambios en el documento actual
  async function save() {
    loading.value = true
    error.value = null
    try {
      await attendanceStore.saveAllAttendanceChanges()
      toast.success('Asistencia guardada')
    } catch (e: any) {
      error.value = e.message || 'Error al guardar asistencia'
      toast.error(error.value)
    } finally {
      loading.value = false
    }
  }

  // Cancela y vuelve a la vista de calendario
  function cancel() {
    view.value = 'calendar'
  }

  return {
    // state
    selectedDate,
    selectedClass,
    view,
    loading,
    error,

    // derived
    classOptions,
    students,
    attendanceRecords,
    dateStatuses,
    classesWithRecords,

    // actions
    init,
    setDate,
    setClass,
    loadCurrent,
    save,
    cancel,
  }
}
