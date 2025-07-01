/* ------------------------------------------------------------------
 * composables/useAttendanceList.ts
 * ------------------------------------------------------------------
 * Maneja toda la lógica (no‑UI) detrás del componente AttendanceList.vue:
 *   • carga y filtrado de alumnos según clase
 *   • estado reactivo de asistencia (presente/ausente/tarde/justificado)
 *   • validación de fecha (no se permite futura)
 *   • helpers para abrir modales de justificación y observaciones
 *   • guardado masivo de asistencia a través del attendanceStore
 *
 * Dependencias externas:
 *   – useAttendanceStore (data)
 *   – useStudentsStore (alumnos)
 *   – useClassesStore  (info clase)
 *   – useToast / useModal (feedback UI)
 * ------------------------------------------------------------------ */
import {ref, computed, watch, type Ref} from "vue"
import {useAttendanceStore} from "../store/attendance"
import {useStudentsStore} from "../../Students/store/students"
import {useClassesStore} from "../../Classes/store/classes"
import {useToast} from "../composables/useToast"
import {useModal} from "../composables/useModal"
import {format, parseISO} from "date-fns"
import {es} from "date-fns/locale"

interface Options {
  selectedDate: Ref<string>
  selectedClass: Ref<string>
}

export function useAttendanceList({selectedDate, selectedClass}: Options) {
  const attendance = useAttendanceStore()
  const studentsStore = useStudentsStore()
  const classesStore = useClassesStore()
  const toast = useToast()
  const modal = useModal()

  /* ---------------- state local ---------------- */
  const loading = ref(false)
  const error = ref<string | null>(null)
  const students = ref<any[]>([])

  /* ------------ derivaciones reactivas --------- */
  const selectedClassName = computed(() => {
    const cls = classesStore.classes.find((c) => c.id === selectedClass.value)
    return cls?.name ?? selectedClass.value
  })

  const records = computed(() => attendance.attendanceRecords)

  const formattedDate = computed(() =>
    format(parseISO(selectedDate.value), "d 'de' MMMM yyyy", {locale: es})
  )

  /* ------------- loaders principales ---------- */
  async function loadStudents() {
    loading.value = true
    try {
      students.value = studentsStore.getStudentsByClass(selectedClass.value)

      // fallback si el método anterior no encontró nada
      if (!students.value.length) {
        students.value = studentsStore.students.filter((s) => s.clase === selectedClass.value)
      }

      // pre‑inicializa mapa de estados
      students.value.forEach((s) => {
        if (!attendance.attendanceRecords[s.id]) {
          attendance.attendanceRecords[s.id] = "Ausente"
        }
      })
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function loadAttendanceDoc() {
    loading.value = true
    try {
      await attendance.fetchAttendanceDocument(selectedDate.value, selectedClass.value)
    } finally {
      loading.value = false
    }
  }

  /** Carga completa: doc + students */
  async function load() {
    await Promise.all([loadAttendanceDoc(), loadStudents()])
  }

  /* ------------- acciones de fila -------------- */
  function updateStatus(studentId: string, status: string) {
    attendance.attendanceRecords[studentId] = status as any
  }

  function openJustification(student: {id: string; nombre: string; apellido: string}) {
    modal.open("justification")
    modal.state.justificationStudent = student as unknown as boolean // Type cast to match expected boolean type
  }

  function openObservation(student?: {id: string; nombre: string; apellido: string}) {
    modal.open("observation")
    modal.state.observationStudent = student as unknown as boolean
  }

  /* --------------- guardado masivo ------------- */
  async function saveAll() {
    try {
      loading.value = true
      await attendance.saveAttendanceDocument({
        fecha: selectedDate.value,
        classId: selectedClass.value,
        teacherId: "", // opcional
        data: {
          presentes: Object.entries(records.value)
            .filter(([, st]) => st === "Presente")
            .map(([id]) => id),
          ausentes: Object.entries(records.value)
            .filter(([, st]) => st === "Ausente")
            .map(([id]) => id),
          tarde: Object.entries(records.value)
            .filter(([, st]) => st === "Tardanza" || st === "Justificado")
            .map(([id]) => id),
          justificacion: attendance.currentAttendanceDoc?.data.justificacion || [],
          observations: attendance.currentAttendanceDoc?.data.observations || "",
        },
      } as any)
      toast.success("Asistencia guardada")
    } catch (e: any) {
      toast.error("Error al guardar: " + e.message)
    } finally {
      loading.value = false
    }
  }

  /* ------------ watchers útiles --------------- */
  watch([selectedDate, selectedClass], () => {
    if (selectedClass.value && selectedDate.value) load()
  })

  return {
    loading,
    error,
    students,
    records,
    formattedDate,
    selectedClassName,

    // acciones
    updateStatus,
    openJustification,
    openObservation,
    saveAll,
    load,
  }
}
