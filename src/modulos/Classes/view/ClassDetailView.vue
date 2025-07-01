<script setup lang="ts">
import {ref, onMounted, computed, watch} from "vue"
import {useRoute, useRouter} from "vue-router"
import {useClassesStore} from "../store/classes"
import {useTeachersStore} from "../../Teachers/store/teachers"
import {useStudentsStore} from "../../Students/store/students"
import {useAttendanceStore} from "../../Attendance/store/attendance"
import AppImage from "@/components/ui/AppImage.vue"
import type {ClassData} from "../types/class"

// Icons
import {
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  ClockIcon,
  BuildingOfficeIcon,
  MusicalNoteIcon,
  PrinterIcon,
  EyeIcon,
  UserPlusIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  ArrowLeftIcon,
  HomeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EllipsisHorizontalIcon,
  CalendarDaysIcon,
  CogIcon,
  AcademicCapIcon,
  ChartBarIcon,
  UsersIcon,
  BookOpenIcon,
  PhoneIcon,
  EnvelopeIcon,
  StarIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  FunnelIcon,
} from "@heroicons/vue/24/outline"

// UI Components
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/vue"
import jsPDF from "jspdf"
import "jspdf-autotable"
import {format} from "date-fns"

const route = useRoute()
const router = useRouter()
const classesStore = useClassesStore()
const teachersStore = useTeachersStore()
const studentsStore = useStudentsStore()
const attendanceStore = useAttendanceStore()
const observationsStore = useAttendanceStore() // Usar el mismo store ya que maneja observaciones

const classId = computed(() => route.params.id as string)

// Estados principales
const isLoading = ref(true)
const error = ref<string | null>(null)
const classData = ref<ClassData | null>(null)
const teacher = ref<any | null>(null)
const students = ref<any[]>([])
const assistantTeachers = ref<any[]>([])
const recentObservations = ref<any[]>([])
const attendanceStats = ref<any>(null)
const attendanceHistory = ref<any[]>([])
const observationHistory = ref<any[]>([])

// Estados de modales
const showDeleteModal = ref(false)
const showEditScheduleModal = ref(false)
const showManageStudentsModal = ref(false)
const showManageTeachersModal = ref(false)
const showAttendanceHistoryModal = ref(false)
const showObservationsHistoryModal = ref(false)
const showEditClassModal = ref(false)
const showStudentDetailModal = ref(false)
const showAddStudentModal = ref(false)
const showAssignTeacherModal = ref(false)
const showEditInfoModal = ref(false)

// Estados de selección para modales
const selectedStudent = ref<any | null>(null)
const selectedTeacher = ref<any | null>(null)

// Estados de vista
const currentView = ref<"overview" | "students" | "attendance" | "observations" | "schedule">(
  "overview"
)
const studentsFilter = ref("")
const attendanceFilter = ref("all") // all, present, absent, late
const observationsFilter = ref("all") // all, positive, negative, neutral

// Estados de toast
const toastMessage = ref<{
  message: string
  type: "success" | "error" | "warning"
  id: number
} | null>(null)

// Estados de carga para acciones
const isDeleting = ref(false)
const isGeneratingPDF = ref(false)
const isSavingChanges = ref(false)
const isLoadingStudents = ref(false)
const isLoadingTeachers = ref(false)

// Estados adicionales para la UI mejorada
const showActionMenu = ref(false)
const availableStudents = ref([])
const selectedStudents = ref<string[]>([])
const selectedAssistants = ref<string[]>([])
const availableTeachers = ref<any[]>([])

// Datos del formulario de edición
const editForm = ref({
  name: "",
  description: "",
  level: "",
  classroom: "",
  instrument: "",
  color: "#3B82F6",
})

// Datos del formulario de horario
const scheduleForm = ref({
  slots: [] as Array<{
    day: string
    startTime: string
    endTime: string
    isActive: boolean
  }>,
})

const fetchClassDetails = async () => {
  isLoading.value = true
  error.value = null
  try {
    const fetchedClass = classesStore.getClassById(classId.value)
    if (!fetchedClass) {
      const classDetails = await classesStore.getClassDetails(classId.value)
      if (!classDetails) {
        throw new Error("Clase no encontrada.")
      }
      classData.value = classDetails
    } else {
      classData.value = fetchedClass
    }

    // Cargar datos relacionados
    await Promise.all([
      loadTeacherData(),
      loadStudentsData(),
      loadAssistantTeachers(),
      loadRecentObservations(),
      loadAttendanceStats(),
      loadAttendanceHistory(),
      loadObservationHistory(),
      loadAvailableStudents(),
      loadAvailableTeachers(),
    ])

    // Inicializar formularios
    initializeForms()
  } catch (e: any) {
    error.value = e.message || "Error al cargar los detalles de la clase."
    console.error("Error fetching class details:", e)
  } finally {
    isLoading.value = false
  }
}

const initializeForms = () => {
  if (classData.value) {
    editForm.value = {
      name: classData.value.name || "",
      description: classData.value.description || "",
      level: classData.value.level || "",
      classroom: classData.value.classroom || "",
      instrument: classData.value.instrument || "",
      color: "#3B82F6",
    }

    // Inicializar horario
    if (classData.value.schedule?.slots) {
      scheduleForm.value.slots = classData.value.schedule.slots.map((slot) => ({
        ...slot,
        isActive: true,
      }))
    } else {
      scheduleForm.value.slots = [
        {day: "monday", startTime: "", endTime: "", isActive: false},
        {day: "tuesday", startTime: "", endTime: "", isActive: false},
        {day: "wednesday", startTime: "", endTime: "", isActive: false},
        {day: "thursday", startTime: "", endTime: "", isActive: false},
        {day: "friday", startTime: "", endTime: "", isActive: false},
        {day: "saturday", startTime: "", endTime: "", isActive: false},
        {day: "sunday", startTime: "", endTime: "", isActive: false},
      ]
    }
  }
}

const loadTeacherData = async () => {
  if (classData.value?.teacherId) {
    let fetchedTeacher = teachersStore.getTeacherById(classData.value.teacherId)
    if (!fetchedTeacher) {
      await teachersStore.fetchTeachers()
      fetchedTeacher = teachersStore.getTeacherById(classData.value.teacherId)
    }
    teacher.value = fetchedTeacher
  }
}

const loadStudentsData = async () => {
  if (studentsStore.students.length === 0) {
    await studentsStore.fetchStudents()
  }
  students.value = studentsStore.getStudentsByClass(classId.value)
}

const loadAssistantTeachers = async () => {
  // Cargar maestros asistentes asignados a la clase desde la propiedad teachers
  if (classData.value?.teachers) {
    const assistantIds = classData.value.teachers
      .filter((t) => t.role === "assistant")
      .map((t) => t.teacherId)
    assistantTeachers.value = assistantIds
      .map((teacherId: string) => teachersStore.getTeacherById(teacherId))
      .filter(Boolean)
  }
}

const loadRecentObservations = async () => {
  try {
    // Simular observaciones recientes
    recentObservations.value = []
  } catch (error) {
    console.error("Error loading observations:", error)
  }
}

const loadAttendanceStats = async () => {
  try {
    // Simular estadísticas básicas
    attendanceStats.value = {
      averageAttendance: 85,
      totalSessions: 20,
      presentCount: 17,
      absentCount: 3,
    }
  } catch (error) {
    console.error("Error loading attendance stats:", error)
  }
}

const loadAttendanceHistory = async () => {
  try {
    // Simular historial de asistencia
    attendanceHistory.value = []
  } catch (error) {
    console.error("Error loading attendance history:", error)
  }
}

const loadObservationHistory = async () => {
  try {
    // Simular historial de observaciones
    observationHistory.value = []
  } catch (error) {
    console.error("Error loading observation history:", error)
  }
}

const loadAvailableStudents = async () => {
  try {
    isLoadingStudents.value = true
    await studentsStore.fetchStudents()
    // Filtrar estudiantes que no están en la clase actual
    availableStudents.value = studentsStore.students.filter(
      (student) => !students.value.some((classStudent) => classStudent.id === student.id)
    )
  } catch (error) {
    console.error("Error loading available students:", error)
  } finally {
    isLoadingStudents.value = false
  }
}

const loadAvailableTeachers = async () => {
  try {
    isLoadingTeachers.value = true
    await teachersStore.fetchTeachers()
    // Filtrar profesores disponibles (excluyendo el profesor principal)
    availableTeachers.value = teachersStore.teachers.filter(
      (teacher) => teacher.id !== classData.value?.teacherId
    )
  } catch (error) {
    console.error("Error loading available teachers:", error)
  } finally {
    isLoadingTeachers.value = false
  }
}

onMounted(fetchClassDetails)

watch(classId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    fetchClassDetails()
  }
})

// Manejadores de eventos principales
const confirmDelete = async () => {
  if (classData.value?.id) {
    isDeleting.value = true
    try {
      await classesStore.deleteClass(classData.value.id)
      showToastHandler("Clase eliminada con éxito", "success")
      router.push({name: "Classes"})
    } catch (e: any) {
      showToastHandler(`Error al eliminar la clase: ${e.message}`, "error")
    } finally {
      isDeleting.value = false
      showDeleteModal.value = false
    }
  }
}

const showToastHandler = (message: string, type: "success" | "error" | "warning") => {
  toastMessage.value = {message, type, id: Date.now()}
  setTimeout(() => {
    toastMessage.value = null
  }, 4000)
}

const removeToast = (id: number) => {
  if (toastMessage.value && toastMessage.value.id === id) {
    toastMessage.value = null
  }
}

const goBack = () => {
  router.go(-1)
}

// Manejadores de modales
const openDeleteModal = () => {
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
}

const openEditInfoModal = () => {
  editForm.value = {
    name: classData.value?.name || "",
    description: classData.value?.description || "",
    level: classData.value?.level || "",
    classroom: classData.value?.classroom || "",
    instrument: classData.value?.instrument || "",
    color: "#3B82F6",
  }
  showEditInfoModal.value = true
}

const closeEditInfoModal = () => {
  showEditInfoModal.value = false
}

const saveClassInfo = async () => {
  isSavingChanges.value = true
  try {
    const updatedData = {
      id: classData.value?.id,
      ...editForm.value,
    }

    await classesStore.updateClass(updatedData)
    classData.value = {...classData.value, ...editForm.value}
    showToastHandler("Información actualizada correctamente", "success")
    closeEditInfoModal()
  } catch (e: any) {
    showToastHandler(`Error al actualizar la información: ${e.message}`, "error")
  } finally {
    isSavingChanges.value = false
  }
}

// Gestión de horarios
const openEditScheduleModal = () => {
  showEditScheduleModal.value = true
}

const closeEditScheduleModal = () => {
  showEditScheduleModal.value = false
}

const saveSchedule = async () => {
  isSavingChanges.value = true
  try {
    const activeSlots = scheduleForm.value.slots.filter(
      (slot) => slot.isActive && slot.startTime && slot.endTime
    )

    const updatedData = {
      id: classData.value?.id,
      schedule: {
        slots: activeSlots.map((slot) => ({
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
      },
    }

    await classesStore.updateClass(updatedData)

    if (classData.value) {
      classData.value.schedule = updatedData.schedule
    }

    showToastHandler("Horario actualizado correctamente", "success")
    closeEditScheduleModal()
  } catch (e: any) {
    showToastHandler(`Error al actualizar el horario: ${e.message}`, "error")
  } finally {
    isSavingChanges.value = false
  }
}

// Gestión de estudiantes
const openManageStudentsModal = () => {
  selectedStudents.value = []
  showManageStudentsModal.value = true
}

const closeManageStudentsModal = () => {
  showManageStudentsModal.value = false
  selectedStudents.value = []
}

const addStudentsToClass = async () => {
  if (selectedStudents.value.length === 0) {
    showToastHandler("Selecciona al menos un estudiante", "warning")
    return
  }

  isSavingChanges.value = true
  try {
    // Simular añadir estudiantes (implementar según la API disponible)
    for (const studentId of selectedStudents.value) {
      // await classesStore.addStudentToClass(classId.value, studentId);
      console.log(`Adding student ${studentId} to class ${classId.value}`)
    }

    await loadStudentsData()
    await loadAvailableStudents()

    showToastHandler(
      `${selectedStudents.value.length} estudiante(s) añadido(s) correctamente`,
      "success"
    )
    closeManageStudentsModal()
  } catch (e: any) {
    showToastHandler(`Error al añadir estudiantes: ${e.message}`, "error")
  } finally {
    isSavingChanges.value = false
  }
}

const removeStudentFromClass = async (studentId: string) => {
  try {
    // Simular remover estudiante (implementar según la API disponible)
    console.log(`Removing student ${studentId} from class ${classId.value}`)
    await loadStudentsData()
    await loadAvailableStudents()
    showToastHandler("Estudiante removido de la clase", "success")
  } catch (e: any) {
    showToastHandler(`Error al remover estudiante: ${e.message}`, "error")
  }
}

const openStudentDetail = (student: any) => {
  selectedStudent.value = student
  showStudentDetailModal.value = true
}

const closeStudentDetailModal = () => {
  showStudentDetailModal.value = false
  selectedStudent.value = null
}

// Gestión de profesores
const openManageTeachersModal = () => {
  selectedAssistants.value = []
  showManageTeachersModal.value = true
}

const closeManageTeachersModal = () => {
  showManageTeachersModal.value = false
  selectedAssistants.value = []
}

const saveTeacherAssignments = async () => {
  isSavingChanges.value = true
  try {
    // Simular actualización de profesores asistentes
    console.log("Updating assistant teachers:", selectedAssistants.value)

    await loadAssistantTeachers()
    showToastHandler("Profesores asistentes actualizados", "success")
    closeManageTeachersModal()
  } catch (e: any) {
    showToastHandler(`Error al actualizar profesores: ${e.message}`, "error")
  } finally {
    isSavingChanges.value = false
  }
}

const assignMainTeacher = async (teacherId: string) => {
  isSavingChanges.value = true
  try {
    const updatedData = {
      id: classData.value?.id,
      teacherId,
    }

    await classesStore.updateClass(updatedData)

    if (classData.value) {
      classData.value.teacherId = teacherId
    }

    await loadTeacherData()
    await loadAvailableTeachers()
    showToastHandler("Profesor principal asignado correctamente", "success")
  } catch (e: any) {
    showToastHandler(`Error al asignar profesor: ${e.message}`, "error")
  } finally {
    isSavingChanges.value = false
  }
}

// Historial de asistencia y observaciones
const openAttendanceHistoryModal = () => {
  showAttendanceHistoryModal.value = true
}

const closeAttendanceHistoryModal = () => {
  showAttendanceHistoryModal.value = false
}

const openObservationsHistoryModal = () => {
  showObservationsHistoryModal.value = true
}

const closeObservationsHistoryModal = () => {
  showObservationsHistoryModal.value = false
}

// Navegación a otras vistas
const handleTakeAttendance = () => {
  const today = new Date()
  const dateString = format(today, "yyyyMMdd")

  router.push({
    name: "AttendanceList",
    params: {
      classId: classData.value?.id,
      date: dateString,
    },
  })
}

const handleManageObservations = () => {
  router.push({
    name: "ClassObservations",
    params: {classId: classData.value?.id},
  })
}

const goToStudentProfile = (studentId: string) => {
  router.push({
    name: "StudentProfile",
    params: {id: studentId},
  })
}

const goToTeacherProfile = (teacherId: string) => {
  router.push({
    name: "TeacherDetail",
    params: {id: teacherId},
  })
}

// Generar PDF con información detallada de la clase
const generateClassReport = async () => {
  if (!classData.value) {
    showToastHandler("No hay datos de la clase para generar el reporte", "warning")
    return
  }

  isGeneratingPDF.value = true
  try {
    const doc = new jsPDF()

    // === CONFIGURACIÓN DE COLORES Y ESTILOS ===
    const primaryColor: [number, number, number] = [59, 130, 246] // Azul
    const secondaryColor: [number, number, number] = [99, 102, 241] // Índigo
    const accentColor: [number, number, number] = [16, 185, 129] // Verde
    const warningColor: [number, number, number] = [245, 158, 11] // Ámbar
    const textColor: [number, number, number] = [31, 41, 55] // Gris oscuro
    const lightGray: [number, number, number] = [243, 244, 246] // Gris claro
    const backgroundColor: [number, number, number] = [249, 250, 251] // Fondo

    let yPos = 30

    // === ENCABEZADO PRINCIPAL CON DISEÑO PROFESIONAL ===
    // Fondo del encabezado
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, 210, 55, "F")

    // Logo/Título principal
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(26)
    doc.setFont(undefined, "bold")
    doc.text("ACADEMIA DE MÚSICA", 20, 25)

    // Subtítulo
    doc.setFontSize(16)
    doc.setFont(undefined, "normal")
    doc.text("Reporte Detallado de Clase", 20, 35)

    // Fecha y hora de generación
    doc.setFontSize(11)
    doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 20, 45)

    // Número de página
    doc.setFont(undefined, "bold")
    doc.text("Página 1", 170, 45)

    yPos = 75

    // === INFORMACIÓN PRINCIPAL DE LA CLASE ===
    // Fondo de sección
    doc.setFillColor(...lightGray)
    doc.rect(15, yPos - 8, 180, 12, "F")

    doc.setTextColor(...textColor)
    doc.setFontSize(18)
    doc.setFont(undefined, "bold")
    doc.text("INFORMACIÓN GENERAL", 20, yPos)
    yPos += 20

    // Nombre de la clase destacado
    doc.setFontSize(22)
    doc.setTextColor(...primaryColor)
    doc.setFont(undefined, "bold")
    doc.text(classData.value.name.toUpperCase(), 20, yPos)
    yPos += 15

    // Información básica en formato estructurado
    doc.setFontSize(12)
    doc.setTextColor(...textColor)
    doc.setFont(undefined, "normal")

    // Columna izquierda
    const leftColumnData = [
      {
        label: "Instrumento:",
        value: classData.value.instrument || "No especificado",
        color: accentColor,
      },
      {label: "Nivel:", value: classData.value.level || "No especificado", color: secondaryColor},
      {label: "Aula:", value: classData.value.classroom || "No asignada", color: warningColor},
      {label: "Estado:", value: classData.value.status || "Activa", color: accentColor},
    ]

    // Columna derecha
    const rightColumnData = [
      {
        label: "Total Estudiantes:",
        value: students.value?.length?.toString() || "0",
        color: primaryColor,
      },
      {
        label: "Horas Semanales:",
        value: `${calculateWeeklyHours.value} hrs`,
        color: secondaryColor,
      },
      {
        label: "Profesor Principal:",
        value: teacher.value?.name || "No asignado",
        color: accentColor,
      },
      {
        label: "Fecha Creación:",
        value: classData.value.createdAt
          ? format(new Date(classData.value.createdAt), "dd/MM/yyyy")
          : "N/A",
        color: warningColor,
      },
    ]

    const startY = yPos

    // Renderizar columna izquierda
    leftColumnData.forEach((item, index) => {
      doc.setFont(undefined, "bold")
      doc.setTextColor(...textColor)
      doc.text(item.label, 20, yPos)

      doc.setFont(undefined, "normal")
      doc.setTextColor(...item.color)
      doc.text(item.value, 65, yPos)

      yPos += 8
    })

    // Renderizar columna derecha
    yPos = startY
    rightColumnData.forEach((item, index) => {
      doc.setFont(undefined, "bold")
      doc.setTextColor(...textColor)
      doc.text(item.label, 110, yPos)

      doc.setFont(undefined, "normal")
      doc.setTextColor(...item.color)
      doc.text(item.value, 155, yPos)

      yPos += 8
    })

    yPos += 15

    // === DESCRIPCIÓN DE LA CLASE ===
    if (classData.value.description) {
      doc.setFillColor(...backgroundColor)
      doc.rect(15, yPos - 8, 180, 12, "F")

      doc.setTextColor(...textColor)
      doc.setFont(undefined, "bold")
      doc.setFontSize(14)
      doc.text("DESCRIPCIÓN", 20, yPos)
      yPos += 15

      doc.setFont(undefined, "normal")
      doc.setFontSize(11)
      const description = doc.splitTextToSize(classData.value.description, 170)
      doc.text(description, 20, yPos)
      yPos += description.length * 6 + 15
    }

    // === HORARIO DETALLADO ===
    doc.setFillColor(...secondaryColor)
    doc.rect(15, yPos - 8, 180, 12, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, "bold")
    doc.setFontSize(14)
    doc.text("HORARIO SEMANAL", 20, yPos)
    yPos += 20

    if (classData.value.schedule?.slots?.length) {
      const scheduleTableData = classData.value.schedule.slots.map((slot, index) => [
        (index + 1).toString(),
        formatDay(slot.day),
        slot.startTime || "N/A",
        slot.endTime || "N/A",
        `${calculateDuration(slot.startTime, slot.endTime)} min`,
        classData.value.classroom || "Sin asignar",
      ])

      ;(doc as any).autoTable({
        startY: yPos,
        head: [["#", "Día", "Inicio", "Fin", "Duración", "Aula"]],
        body: scheduleTableData,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 5,
          textColor,
          lineColor: [200, 200, 200],
          lineWidth: 0.5,
        },
        headStyles: {
          fillColor: secondaryColor,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 11,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: {cellWidth: 15, halign: "center"},
          1: {cellWidth: 35, halign: "center"},
          2: {cellWidth: 25, halign: "center"},
          3: {cellWidth: 25, halign: "center"},
          4: {cellWidth: 30, halign: "center"},
          5: {cellWidth: 50},
        },
      })

      yPos = (doc as any).lastAutoTable.finalY + 20
    } else {
      doc.setTextColor(...textColor)
      doc.setFont(undefined, "normal")
      doc.setFontSize(11)
      doc.text("⚠️ No se ha configurado un horario para esta clase", 25, yPos)
      yPos += 20
    }

    // Verificar si necesitamos nueva página
    if (yPos > 220) {
      doc.addPage()
      yPos = 30
    }

    // === ESTADÍSTICAS Y MÉTRICAS ===
    doc.setFillColor(...accentColor)
    doc.rect(15, yPos - 8, 180, 12, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, "bold")
    doc.setFontSize(14)
    doc.text("ESTADÍSTICAS Y MÉTRICAS", 20, yPos)
    yPos += 20

    const metricsData = [
      ["Métrica", "Valor Actual", "Tendencia", "Observaciones"],
      [
        "Estudiantes Inscritos",
        students.value?.length?.toString() || "0",
        students.value?.length > 10
          ? "🟢 Alto"
          : students.value?.length > 5
            ? "🟡 Medio"
            : "🔴 Bajo",
        "Capacidad recomendada: 8-12 estudiantes",
      ],
      [
        "Promedio de Asistencia",
        `${attendanceStats.value?.averageAttendance || 0}%`,
        (attendanceStats.value?.averageAttendance || 0) > 80 ? "🟢 Excelente" : "🟡 Mejorable",
        "Meta institucional: >85%",
      ],
      [
        "Horas Semanales",
        `${calculateWeeklyHours.value} hrs`,
        calculateWeeklyHours.value >= 2 ? "🟢 Adecuado" : "🟡 Insuficiente",
        "Recomendado: 2-4 hrs/semana",
      ],
      [
        "Observaciones Recientes",
        recentObservations.value?.length?.toString() || "0",
        recentObservations.value?.length > 0 ? "🟢 Activo" : "🔴 Sin actividad",
        "Seguimiento pedagógico activo",
      ],
      [
        "Sesiones Totales",
        attendanceStats.value?.totalSessions?.toString() || "0",
        attendanceStats.value?.totalSessions > 15 ? "🟢 Establecida" : "🟡 En desarrollo",
        "Historial de actividad académica",
      ],
    ]

    ;(doc as any).autoTable({
      startY: yPos,
      head: [metricsData[0]],
      body: metricsData.slice(1),
      theme: "striped",
      styles: {
        fontSize: 9,
        cellPadding: 4,
        textColor,
        lineColor: [200, 200, 200],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: accentColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: {cellWidth: 45, fontStyle: "bold"},
        1: {cellWidth: 30, halign: "center"},
        2: {cellWidth: 30, halign: "center"},
        3: {cellWidth: 75, fontSize: 8},
      },
    })

    yPos = (doc as any).lastAutoTable.finalY + 20

    // === INFORMACIÓN DEL PROFESOR ===
    if (teacher.value) {
      doc.setFillColor(...warningColor)
      doc.rect(15, yPos - 8, 180, 12, "F")

      doc.setTextColor(255, 255, 255)
      doc.setFont(undefined, "bold")
      doc.setFontSize(14)
      doc.text("INFORMACIÓN DEL PROFESOR", 20, yPos)
      yPos += 20

      const teacherInfo = [
        ["Campo", "Información"],
        ["Nombre Completo", teacher.value.name || "N/A"],
        ["Email", teacher.value.email || "N/A"],
        ["Teléfono", teacher.value.phone || "N/A"],
        [
          "Especialidades",
          teacher.value.specialties && teacher.value.specialties.length > 0
            ? teacher.value.specialties.join(", ")
            : "No especificadas",
        ],
        [
          "Biografía",
          teacher.value.biography
            ? teacher.value.biography.length > 80
              ? teacher.value.biography.substring(0, 80) + "..."
              : teacher.value.biography
            : "Sin información",
        ],
        ["Estado", teacher.value.status || "Activo"],
      ]

      ;(doc as any).autoTable({
        startY: yPos,
        head: [teacherInfo[0]],
        body: teacherInfo.slice(1),
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 4,
          textColor,
        },
        headStyles: {
          fillColor: warningColor,
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: {cellWidth: 40, fontStyle: "bold", fillColor: [254, 249, 195]},
          1: {cellWidth: 140},
        },
      })

      yPos = (doc as any).lastAutoTable.finalY + 20
    }

    // Verificar nueva página para estudiantes
    if (yPos > 200) {
      doc.addPage()
      yPos = 30
    }

    // === LISTADO DETALLADO DE ESTUDIANTES ===
    if (students.value && students.value.length > 0) {
      doc.setFillColor(...primaryColor)
      doc.rect(15, yPos - 8, 180, 12, "F")

      doc.setTextColor(255, 255, 255)
      doc.setFont(undefined, "bold")
      doc.setFontSize(14)
      doc.text("LISTADO DE ESTUDIANTES", 20, yPos)
      yPos += 20

      const studentsTableData = students.value.map((student, index) => [
        (index + 1).toString(),
        `${student.nombre || ""} ${student.apellido || ""}`.trim() || "N/A",
        student.edad?.toString() || "N/A",
        student.instrumento || classData.value.instrument || "N/A",
        student.telefono || student.tlf || "No disponible",
        student.email || "No disponible",
        student.activo ? "Activo" : "Inactivo",
      ])

      ;(doc as any).autoTable({
        startY: yPos,
        head: [["#", "Nombre Completo", "Edad", "Instrumento", "Teléfono", "Email", "Estado"]],
        body: studentsTableData,
        theme: "striped",
        styles: {
          fontSize: 9,
          cellPadding: 3,
          textColor,
          lineColor: [200, 200, 200],
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 10,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: {cellWidth: 15, halign: "center"},
          1: {cellWidth: 45},
          2: {cellWidth: 20, halign: "center"},
          3: {cellWidth: 30},
          4: {cellWidth: 30},
          5: {cellWidth: 35},
          6: {cellWidth: 25, halign: "center"},
        },
      })

      yPos = (doc as any).lastAutoTable.finalY + 20
    } else {
      doc.setTextColor(...textColor)
      doc.setFont(undefined, "normal")
      doc.setFontSize(11)
      doc.text("📝 No hay estudiantes registrados en esta clase", 20, yPos)
      yPos += 20
    }

    // === PIE DE PÁGINA PROFESIONAL ===
    const finalY = Math.max(yPos, 250)

    // Línea decorativa superior
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(2)
    doc.line(20, finalY, 190, finalY)

    // Información institucional
    doc.setFontSize(10)
    doc.setTextColor(...textColor)
    doc.setFont(undefined, "bold")
    doc.text("Academia de Música - Sistema de Gestión Académica", 20, finalY + 10)

    doc.setFont(undefined, "normal")
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(`Reporte generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 20, finalY + 18)
    doc.text(
      "www.academiamusica.com | contacto@academiamusica.com | Tel: (555) 123-4567",
      20,
      finalY + 26
    )

    // Línea decorativa inferior
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.line(20, finalY + 30, 190, finalY + 30)

    // Nota de confidencialidad
    doc.setFontSize(8)
    doc.setFont(undefined, "italic")
    doc.setTextColor(120, 120, 120)
    doc.text(
      "Documento confidencial - Solo para uso interno de la institución educativa",
      20,
      finalY + 38
    )

    // Número de página y código del reporte
    doc.setFont(undefined, "bold")
    doc.setFontSize(9)
    doc.setTextColor(...primaryColor)
    const reportId = `CR-${classData.value.id.substring(0, 8).toUpperCase()}-${format(new Date(), "yyyyMMdd")}`
    doc.text(`Código: ${reportId}`, 150, finalY + 18)
    doc.text("Página 1 de 1", 170, finalY + 26)

    // === GUARDAR EL PDF ===
    const fileName = `reporte-clase-${classData.value.name.replace(/\s+/g, "-").toLowerCase()}-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`
    doc.save(fileName)

    showToastHandler("Reporte PDF profesional generado exitosamente", "success")
  } catch (error) {
    console.error("Error generating professional PDF:", error)
    showToastHandler("Error al generar el reporte PDF: " + (error as Error).message, "error")
  } finally {
    isGeneratingPDF.value = false
  }
}

// Generar PDF con lista detallada de estudiantes
const generateStudentListPDF = async () => {
  if (!students.value || students.value.length === 0) {
    showToastHandler("No hay estudiantes registrados para generar la lista", "warning")
    return
  }

  isGeneratingPDF.value = true
  try {
    const doc = new jsPDF()

    // === CONFIGURACIÓN DE COLORES ===
    const primaryColor: [number, number, number] = [59, 130, 246] // Azul
    const secondaryColor: [number, number, number] = [16, 185, 129] // Verde
    const accentColor: [number, number, number] = [99, 102, 241] // Índigo
    const textColor: [number, number, number] = [31, 41, 55] // Gris oscuro
    const lightGray: [number, number, number] = [243, 244, 246] // Gris claro

    let yPos = 30

    // === ENCABEZADO PROFESIONAL ===
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, 210, 50, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont(undefined, "bold")
    doc.text("ACADEMIA DE MÚSICA", 20, 25)

    doc.setFontSize(16)
    doc.setFont(undefined, "normal")
    doc.text("Lista Oficial de Estudiantes", 20, 35)

    doc.setFontSize(10)
    doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 20, 43)

    yPos = 70

    // === INFORMACIÓN DE LA CLASE ===
    doc.setFillColor(...lightGray)
    doc.rect(15, yPos - 8, 180, 12, "F")

    doc.setTextColor(...textColor)
    doc.setFontSize(16)
    doc.setFont(undefined, "bold")
    doc.text("INFORMACIÓN DE LA CLASE", 20, yPos)
    yPos += 20

    // Nombre de la clase destacado
    doc.setFontSize(20)
    doc.setTextColor(...primaryColor)
    doc.setFont(undefined, "bold")
    doc.text(classData.value?.name?.toUpperCase() || "CLASE SIN NOMBRE", 20, yPos)
    yPos += 15

    // Información básica en columnas
    doc.setFontSize(11)
    doc.setTextColor(...textColor)
    doc.setFont(undefined, "normal")

    const classInfo = [
      {label: "Instrumento:", value: classData.value?.instrument || "No especificado"},
      {label: "Nivel:", value: classData.value?.level || "No especificado"},
      {label: "Profesor Principal:", value: teacher.value?.name || "No asignado"},
      {label: "Aula:", value: classData.value?.classroom || "No asignada"},
      {label: "Total de Estudiantes:", value: students.value.length.toString()},
      {label: "Horas Semanales:", value: `${calculateWeeklyHours.value} hrs`},
    ]

    // Organizar en dos columnas
    const leftColumn = classInfo.slice(0, 3)
    const rightColumn = classInfo.slice(3)

    const startY = yPos

    // Columna izquierda
    leftColumn.forEach((item) => {
      doc.setFont(undefined, "bold")
      doc.text(item.label, 20, yPos)
      doc.setFont(undefined, "normal")
      doc.text(item.value, 65, yPos)
      yPos += 7
    })

    // Columna derecha
    yPos = startY
    rightColumn.forEach((item) => {
      doc.setFont(undefined, "bold")
      doc.text(item.label, 110, yPos)
      doc.setFont(undefined, "normal")
      doc.text(item.value, 155, yPos)
      yPos += 7
    })

    yPos += 15

    // === HORARIO DE LA CLASE ===
    if (classData.value?.schedule?.slots?.length) {
      doc.setFillColor(...secondaryColor)
      doc.rect(15, yPos - 8, 180, 12, "F")

      doc.setTextColor(255, 255, 255)
      doc.setFont(undefined, "bold")
      doc.setFontSize(12)
      doc.text("HORARIO DE CLASES", 20, yPos)
      yPos += 20

      doc.setTextColor(...textColor)
      doc.setFont(undefined, "normal")
      doc.setFontSize(10)

      classData.value.schedule.slots.forEach((slot) => {
        const scheduleText = `${formatDay(slot.day)}: ${slot.startTime} - ${slot.endTime}`
        doc.text(`• ${scheduleText}`, 25, yPos)
        yPos += 6
      })

      yPos += 15
    }

    // === RESUMEN ESTADÍSTICO ===
    doc.setFillColor(...accentColor)
    doc.rect(15, yPos - 8, 180, 12, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, "bold")
    doc.setFontSize(12)
    doc.text("RESUMEN ESTADÍSTICO", 20, yPos)
    yPos += 20

    // Calcular estadísticas de estudiantes
    const ages = students.value.map((s) => parseInt(s.edad || "0")).filter((age) => age > 0)
    const avgAge =
      ages.length > 0 ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : "N/A"
    const instruments = [...new Set(students.value.map((s) => s.instrumento).filter(Boolean))]
    const emailCount = students.value.filter((s) => s.email).length
    const phoneCount = students.value.filter((s) => s.telefono || s.tlf).length

    const statsData = [
      ["Estadística", "Valor", "Porcentaje"],
      ["Total de Estudiantes", students.value.length.toString(), "100%"],
      [
        "Edad Promedio",
        avgAge,
        ages.length > 0
          ? `${((ages.length / students.value.length) * 100).toFixed(0)}% con edad registrada`
          : "Sin datos",
      ],
      [
        "Instrumentos Únicos",
        instruments.length.toString(),
        `${((instruments.length / students.value.length) * 100).toFixed(0)}% diversidad`,
      ],
      [
        "Con Email Registrado",
        emailCount.toString(),
        `${((emailCount / students.value.length) * 100).toFixed(0)}%`,
      ],
      [
        "Con Teléfono Registrado",
        phoneCount.toString(),
        `${((phoneCount / students.value.length) * 100).toFixed(0)}%`,
      ],
    ]

    ;(doc as any).autoTable({
      startY: yPos,
      head: [statsData[0]],
      body: statsData.slice(1),
      theme: "striped",
      styles: {
        fontSize: 10,
        cellPadding: 4,
        textColor,
      },
      headStyles: {
        fillColor: accentColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: {cellWidth: 60, fontStyle: "bold"},
        1: {cellWidth: 30, halign: "center"},
        2: {cellWidth: 90, halign: "center"},
      },
    })

    yPos = (doc as any).lastAutoTable.finalY + 20

    // Verificar si necesitamos nueva página
    if (yPos > 200) {
      doc.addPage()
      yPos = 30
    }

    // === LISTA DETALLADA DE ESTUDIANTES ===
    doc.setFillColor(...primaryColor)
    doc.rect(15, yPos - 8, 180, 12, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, "bold")
    doc.setFontSize(14)
    doc.text("LISTADO COMPLETO DE ESTUDIANTES", 20, yPos)
    yPos += 20

    // Preparar datos de estudiantes con información completa
    const studentsTableData = students.value.map((student, index) => {
      const fullName = `${student.nombre || ""} ${student.apellido || ""}`.trim()
      const age = student.edad || "N/A"
      const instrument = student.instrumento || classData.value?.instrument || "N/A"
      const phone = student.telefono || student.tlf || "No disponible"
      const email = student.email || "No disponible"
      const status = student.activo !== false ? "✓ Activo" : "✗ Inactivo"
      const contact = student.madre || student.padre || "N/A"

      return [
        (index + 1).toString(),
        fullName || "Nombre no disponible",
        age,
        instrument,
        phone,
        email,
        contact,
        status,
      ]
    })

    ;(doc as any).autoTable({
      startY: yPos,
      head: [
        ["#", "Nombre Completo", "Edad", "Instrumento", "Teléfono", "Email", "Contacto", "Estado"],
      ],
      body: studentsTableData,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor,
        lineColor: [200, 200, 200],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: {cellWidth: 12, halign: "center", fontStyle: "bold"},
        1: {cellWidth: 40},
        2: {cellWidth: 15, halign: "center"},
        3: {cellWidth: 25},
        4: {cellWidth: 25},
        5: {cellWidth: 30},
        6: {cellWidth: 25},
        7: {cellWidth: 18, halign: "center"},
      },
    })

    const finalY = (doc as any).lastAutoTable.finalY + 20

    // === NOTAS ADICIONALES ===
    doc.setFillColor(...lightGray)
    doc.rect(15, finalY, 180, 30, "F")

    doc.setTextColor(...textColor)
    doc.setFont(undefined, "bold")
    doc.setFontSize(11)
    doc.text("NOTAS IMPORTANTES:", 20, finalY + 10)

    doc.setFont(undefined, "normal")
    doc.setFontSize(9)
    const notes = [
      "• Esta lista es confidencial y solo debe ser utilizada para fines académicos.",
      "• Verificar la información de contacto regularmente para mantenerla actualizada.",
      "• Reportar cualquier cambio en el estado de los estudiantes al coordinador académico.",
      "• Mantener la privacidad de los datos personales según políticas institucionales.",
    ]

    let noteY = finalY + 18
    notes.forEach((note) => {
      doc.text(note, 20, noteY)
      noteY += 5
    })

    // === PIE DE PÁGINA PROFESIONAL ===
    const footerY = finalY + 50

    // Línea decorativa
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(1.5)
    doc.line(20, footerY, 190, footerY)

    // Información institucional
    doc.setFontSize(10)
    doc.setTextColor(...textColor)
    doc.setFont(undefined, "bold")
    doc.text("Academia de Música - Lista Oficial de Estudiantes", 20, footerY + 10)

    doc.setFont(undefined, "normal")
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(`Lista generada: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 20, footerY + 18)
    doc.text("Para uso exclusivo del personal académico autorizado", 20, footerY + 26)

    // Código de lista y página
    doc.setFont(undefined, "bold")
    doc.setTextColor(...primaryColor)
    const listId = `LS-${classData.value?.id?.substring(0, 8).toUpperCase() || "UNKNOWN"}-${format(new Date(), "yyyyMMdd")}`
    doc.text(`Código de Lista: ${listId}`, 130, footerY + 10)
    doc.text("Página 1 de 1", 170, footerY + 18)

    // Línea final
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.line(20, footerY + 30, 190, footerY + 30)

    // === GUARDAR EL PDF ===
    const fileName = `lista-estudiantes-${classData.value?.name?.replace(/\s+/g, "-").toLowerCase() || "clase"}-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`
    doc.save(fileName)

    showToastHandler("Lista de estudiantes generada exitosamente", "success")
  } catch (error) {
    console.error("Error generating student list PDF:", error)
    showToastHandler(
      "Error al generar la lista de estudiantes: " + (error as Error).message,
      "error"
    )
  } finally {
    isGeneratingPDF.value = false
  }
}

// Helper functions
const formatDay = (day: string): string => {
  const daysMap: Record<string, string> = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
    lunes: "Lunes",
    martes: "Martes",
    miercoles: "Miércoles",
    jueves: "Jueves",
    viernes: "Viernes",
    sabado: "Sábado",
    domingo: "Domingo",
  }
  return daysMap[day.toLowerCase()] || day
}

const calculateDuration = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return 0

  const [startH, startM] = startTime.split(":").map(Number)
  const [endH, endM] = endTime.split(":").map(Number)

  return endH * 60 + endM - (startH * 60 + startM)
}

const calculateWeeklyHours = computed(() => {
  if (!classData.value?.schedule?.slots?.length) return 0

  const totalMinutes = classData.value.schedule.slots.reduce((total, slot) => {
    return total + calculateDuration(slot.startTime, slot.endTime)
  }, 0)

  return parseFloat((totalMinutes / 60).toFixed(1))
})

const formattedSchedule = computed(() => {
  if (!classData.value?.schedule?.slots?.length) return "Sin horario"

  return classData.value.schedule.slots
    .map((slot) => `${formatDay(slot.day)} ${slot.startTime} - ${slot.endTime}`)
    .join(", ")
})

const getFirstScheduleSlot = computed(() => {
  if (!classData.value?.schedule?.slots?.length) return null
  return classData.value.schedule.slots[0]
})

// Computed property para datos resumidos de la clase
const classSummaryData = computed(() => {
  if (!classData.value) return {hoursPerWeek: 0, schedule: null}

  const hoursPerWeek = calculateWeeklyHours.value
  const schedule = classData.value.schedule?.slots
    ? {
        days: classData.value.schedule.slots.map((slot) => ({
          day: formatDay(slot.day),
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: calculateDuration(slot.startTime, slot.endTime),
        })),
      }
    : null

  return {
    hoursPerWeek,
    schedule,
  }
})

// Define interface for schedule slot
interface ScheduleSlot {
  day: string
  startTime: string
  endTime: string
}

// Define interface for schedule
interface Schedule {
  slots: ScheduleSlot[]
}

// Función para formatear la información de horario desde el objeto schedule
const formatScheduleInfo = (schedule: Schedule | undefined) => {
  if (!schedule?.slots?.length) {
    return {formatted: "", days: []}
  }

  const formattedSlots = schedule.slots.map((slot: ScheduleSlot) => {
    const day = formatDay(slot.day)
    return `${day} de ${slot.startTime || "?"} a ${slot.endTime || "?"}`
  })

  return {
    formatted: formattedSlots.join(" | "),
    days: schedule.slots.map((slot: ScheduleSlot) => ({
      day: formatDay(slot.day),
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: calculateSlotDuration(slot.startTime, slot.endTime),
    })),
  }
}

// Calcular la duración en minutos entre dos horas
const calculateSlotDuration = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 0

  // Convertir "HH:MM" a minutos
  const getMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number)
    return hours * 60 + minutes
  }

  const startMinutes = getMinutes(startTime)
  const endMinutes = getMinutes(endTime)

  // Si endMinutes es menor, asumimos que cruza la medianoche
  return endMinutes >= startMinutes
    ? endMinutes - startMinutes
    : 24 * 60 - startMinutes + endMinutes
}

// Computed property para las estadísticas de la clase
const stats = computed(() => {
  if (!classData.value) return []

  return [
    {
      label: "Instrumento",
      value: classData.value.instrument || "No especificado",
    },
    {
      label: "Nivel",
      value: classData.value.level || "No especificado",
    },
    {
      label: "Estudiantes",
      value: students.value?.length || 0,
    },
    {
      label: "Maestro",
      value: teacher.value?.name || "No asignado",
    },
  ]
})

const teacherCardData = computed(() =>
  teacher.value
    ? {
        name: teacher.value.name,
        photoUrl: teacher.value.photoURL,
        specialties: teacher.value.specialties || [],
        biography: teacher.value.biography || "",
        email: teacher.value.email || "",
        contactInfo: teacher.value.phone || "",
      }
    : null
)

const studentsCardData = computed(() => {
  if (!students.value) return []
  return students.value.map((s) => ({
    id: s.id,
    name: `${s.nombre || ""} ${s.apellido || ""}`.trim(),
    age: s.edad,
    instrument: s.instrumento,
  }))
})

// Función para editar clase (redirigir a modal de edición)
const editClass = () => {
  openEditInfoModal()
}

const addStudentToClass = () => {
  openManageStudentsModal()
}

const showAddStudentInfo = () => {
  openManageStudentsModal()
}
</script>

<template>
  <div
    class="class-detail-view bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-300"
  >
    <!-- Toast Notifications -->
    <div v-if="toastMessage" class="fixed top-4 right-4 z-50">
      <div
        class="p-4 rounded-md shadow-lg text-white transition-opacity duration-300"
        :class="{
          'bg-green-500': toastMessage.type === 'success',
          'bg-red-500': toastMessage.type === 'error',
          'bg-yellow-500': toastMessage.type === 'warning',
        }"
        role="alert"
      >
        <div class="flex items-center justify-between">
          <span class="font-medium">{{ toastMessage.message }}</span>
          <button class="ml-4 text-xl leading-none" @click="removeToast(toastMessage.id)">
            &times;
          </button>
        </div>
      </div>
    </div>

    <!-- Header with breadcrumbs and actions -->
    <header class="bg-white dark:bg-gray-800 shadow-sm mb-6">
      <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center space-x-2">
            <button
              class="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded-full transition-colors"
              @click="goBack"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
            <nav class="flex">
              <ol class="flex items-center space-x-1">
                <li>
                  <router-link
                    to="/"
                    class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Inicio
                  </router-link>
                </li>
                <li>
                  <span class="text-gray-500 dark:text-gray-400 mx-1">/</span>
                </li>
                <li>
                  <router-link
                    :to="{name: 'Classes'}"
                    class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Clases
                  </router-link>
                </li>
                <li>
                  <span class="text-gray-500 dark:text-gray-400 mx-1">/</span>
                </li>
                <li
                  v-if="classData"
                  class="text-blue-600 dark:text-blue-400 font-medium truncate max-w-[150px] sm:max-w-xs"
                >
                  {{ classData.name }}
                </li>
                <li v-else class="text-blue-600 dark:text-blue-400 font-medium">Detalles</li>
              </ol>
            </nav>
          </div>
          <div v-if="!isLoading && classData" class="flex items-center space-x-3 mt-4 sm:mt-0">
            <button
              class="inline-flex items-center px-3.5 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              @click="editClass"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 mr-1.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
                />
              </svg>
              Editar
            </button>
            <button
              class="inline-flex items-center px-3.5 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              @click="openDeleteModal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 mr-1.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="isLoading" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="animate-pulse space-y-6">
        <!-- Header Skeleton -->
        <div class="flex justify-between items-center mb-6">
          <div>
            <div class="h-4 bg-gray-300 rounded w-32 mb-2" />
            <div class="h-8 bg-gray-300 rounded w-64" />
          </div>
          <div class="flex space-x-2">
            <div class="h-10 bg-gray-300 rounded w-20" />
            <div class="h-10 bg-gray-300 rounded w-20" />
          </div>
        </div>

        <!-- Info Cards Skeleton -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div v-for="i in 4" :key="i" class="bg-white p-6 rounded-lg shadow">
            <div class="h-4 bg-gray-300 rounded w-24 mb-2" />
            <div class="h-6 bg-gray-300 rounded w-16" />
          </div>
        </div>

        <!-- Content Skeleton -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="h-6 bg-gray-300 rounded w-48 mb-4" />
          <div class="space-y-3">
            <div class="h-4 bg-gray-300 rounded w-full" />
            <div class="h-4 bg-gray-300 rounded w-3/4" />
            <div class="h-4 bg-gray-300 rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <div class="flex items-center">
          <ExclamationTriangleIcon class="h-6 w-6 mr-2" />
          <div>
            <strong class="font-bold">¡Error!</strong>
            <span class="block sm:inline ml-1">{{ error }}</span>
          </div>
        </div>
        <button
          class="mt-2 sm:mt-0 sm:ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
          @click="fetchClassDetails"
        >
          Reintentar
        </button>
      </div>
    </div>

    <!-- Content Loaded -->
    <div v-else-if="classData" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Class Title Header -->
      <div class="mb-8 text-center sm:text-left">
        <h1 class="text-3xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">
          {{ classData.name }}
        </h1>
        <p
          class="mt-2 flex items-center justify-center sm:justify-start text-lg text-gray-500 dark:text-gray-400"
        >
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mr-2"
          >
            {{ classData.instrument || "Sin instrumento" }}
          </span>
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          >
            Nivel: {{ classData.level || "No especificado" }}
          </span>
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left column - Class & Schedule info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Class Details Card -->
          <div
            class="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden transition-all hover:shadow-md"
          >
            <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 005.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"
                  />
                </svg>
                Información de la Clase
              </h2>
            </div>

            <div class="px-6 py-4">
              <div class="space-y-3">
                <div
                  v-for="stat in stats"
                  :key="stat.label"
                  class="flex items-center justify-between"
                >
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400">{{
                    stat.label
                  }}</span>
                  <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{
                    stat.value
                  }}</span>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400"
                    >Horas Semanales</span
                  >
                  <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{
                      classSummaryData.hoursPerWeek > 0
                        ? classSummaryData.hoursPerWeek + " hrs"
                        : "No especificado"
                    }}
                  </span>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400"
                    >Horas Mensuales</span
                  >
                  <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{
                      classSummaryData.hoursPerWeek > 0
                        ? classSummaryData.hoursPerWeek * 4 + " hrs"
                        : "No especificado"
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Schedule Card -->
          <div
            class="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden transition-all hover:shadow-md"
          >
            <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clip-rule="evenodd"
                  />
                </svg>
                Horario
              </h2>
            </div>

            <div class="px-6 py-4">
              <!-- Schedule Slots -->
              <div
                v-if="
                  classSummaryData.schedule &&
                  classSummaryData.schedule.days &&
                  classSummaryData.schedule.days.length > 0
                "
                class="space-y-3"
              >
                <div
                  v-for="(slot, index) in classSummaryData.schedule.days"
                  :key="index"
                  class="flex items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg"
                >
                  <div
                    class="min-w-[80px] h-16 bg-indigo-100 dark:bg-indigo-800 rounded-md flex flex-col items-center justify-center mr-4"
                  >
                    <span
                      class="text-xs uppercase font-bold text-indigo-800 dark:text-indigo-300"
                      >{{ slot.day.substring(0, 3) }}</span
                    >
                    <span class="font-bold text-xl text-indigo-700 dark:text-indigo-200">{{
                      slot.day.substring(0, 1)
                    }}</span>
                  </div>

                  <div class="flex-grow">
                    <div class="flex items-center justify-between">
                      <span class="text-gray-900 dark:text-gray-100 font-medium"
                        >{{ slot.startTime || "?" }} - {{ slot.endTime || "?" }}</span
                      >
                      <span
                        class="bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 text-xs font-bold px-2.5 py-1 rounded-full"
                      >
                        {{ slot.duration }} min
                      </span>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Clase de {{ classData.name }} - {{ classData.instrument }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- No Schedule Available -->
              <div v-else class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-12 w-12 mx-auto text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  No hay horario disponible
                </h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  No se ha configurado un horario específico para esta clase.
                </p>
                <div class="mt-4">
                  <button
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    @click="editClass"
                  >
                    Configurar horario
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Students List -->
          <div
            class="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden transition-all hover:shadow-md"
          >
            <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div class="flex items-center justify-between">
                <h2
                  class="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 mr-2 text-green-500 dark:text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"
                    />
                  </svg>
                  Estudiantes
                  <span class="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400"
                    >({{ students.length }})</span
                  >
                </h2>
                <!-- Replace RouterLink with button -->
                <button
                  class="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-500 dark:hover:text-indigo-300"
                  @click="showAddStudentInfo"
                >
                  Añadir estudiante
                </button>
              </div>
            </div>

            <div class="px-6 py-4">
              <ul v-if="students.length > 0" class="divide-y divide-gray-200 dark:divide-gray-700">
                <li
                  v-for="student in studentsCardData"
                  :key="student.id"
                  class="py-4 flex items-center"
                >
                  <div
                    class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-300 mr-4"
                  >
                    {{ student.name.charAt(0) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {{ student.name }}
                    </p>
                    <div class="flex items-center mt-1">
                      <span
                        v-if="student.age"
                        class="text-xs text-gray-500 dark:text-gray-400 mr-2"
                      >
                        {{ student.age }} años
                      </span>
                      <span
                        v-if="student.instrument"
                        class="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded"
                      >
                        {{ student.instrument }}
                      </span>
                    </div>
                  </div>
                  <router-link
                    :to="{name: 'StudentProfile', params: {id: student.id}}"
                    class="ml-3 flex-shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-500"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fill-rule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </router-link>
                </li>
              </ul>

              <!-- No Students -->
              <div v-else class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-12 w-12 mx-auto text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  No hay estudiantes
                </h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Comienza añadiendo un estudiante a esta clase.
                </p>
                <div class="mt-4">
                  <router-link
                    :to="{name: 'AddStudentToClass', params: {classId: classId}}"
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                  >
                    Añadir estudiante
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right column - Teacher info -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Teacher Card -->
          <div
            class="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden transition-all hover:shadow-md"
          >
            <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-2 text-amber-500 dark:text-amber-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clip-rule="evenodd"
                  />
                </svg>
                Profesor
              </h2>
            </div>

            <div class="px-6 py-4">
              <div v-if="teacher" class="flex flex-col items-center text-center">
                <div class="relative">
                  <div
                    class="w-32 h-32 rounded-full overflow-hidden border-4 border-amber-100 dark:border-amber-900"
                  >
                    <AppImage
                      :src="teacherCardData?.photoUrl || ''"
                      :alt="`Foto de ${teacher?.name || 'profesor'}`"
                      :rounded="true"
                      img-class="w-full h-full object-cover"
                    >
                      <template #fallback>
                        <div
                          class="w-full h-full flex items-center justify-center bg-amber-100 dark:bg-amber-800"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-16 w-16 text-amber-500 dark:text-amber-300"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clip-rule="evenodd"
                            />
                          </svg>
                        </div>
                      </template>
                    </AppImage>
                  </div>
                  <div
                    class="absolute -bottom-1 -right-1 bg-green-400 p-1 rounded-full border-2 border-white dark:border-gray-800"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                </div>

                <h3 class="mt-4 text-xl font-medium text-gray-900 dark:text-gray-100">
                  {{ teacher.name }}
                </h3>

                <div
                  v-if="teacherCardData?.specialties?.length"
                  class="mt-1 flex flex-wrap justify-center gap-1"
                >
                  <span
                    v-for="(specialty, idx) in teacherCardData.specialties"
                    :key="idx"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                  >
                    {{ specialty }}
                  </span>
                </div>

                <div class="mt-6 w-full space-y-3">
                  <div
                    v-if="teacherCardData?.email"
                    class="flex items-center border-t border-gray-200 dark:border-gray-700 pt-3"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 text-amber-500 dark:text-amber-400 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
                      />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span class="text-sm text-gray-600 dark:text-gray-400">{{
                      teacherCardData.email
                    }}</span>
                  </div>

                  <div
                    v-if="teacherCardData?.contactInfo"
                    class="flex items-center border-t border-gray-200 dark:border-gray-700 pt-3"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 text-amber-500 dark:text-amber-400 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"
                      />
                    </svg>
                    <span class="text-sm text-gray-600 dark:text-gray-400">{{
                      teacherCardData.contactInfo
                    }}</span>
                  </div>
                </div>

                <div class="mt-6 w-full">
                  <router-link
                    :to="{name: 'TeacherDetail', params: {id: teacher.id}}"
                    class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-amber-700 bg-amber-100 hover:bg-amber-200 dark:text-amber-200 dark:bg-amber-900 dark:hover:bg-amber-800 transition-colors"
                  >
                    Ver perfil completo
                  </router-link>
                </div>
              </div>

              <!-- No Teacher Assigned -->
              <div v-else class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-12 w-12 mx-auto text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Sin profesor asignado
                </h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Esta clase aún no tiene un profesor asignado.
                </p>
                <div class="mt-4">
                  <button
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700"
                    @click="editClass"
                  >
                    Asignar profesor
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Stats Card -->
          <div
            class="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden transition-all hover:shadow-md"
          >
            <div class="px-6 py-4">
              <div class="space-y-3">
                <button
                  class="w-full flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  @click="editClass"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
                    />
                  </svg>
                  Editar información
                </button>

                <router-link
                  :to="{name: 'AddStudentToClass', params: {classId: classId}}"
                  class="w-full flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"
                    />
                  </svg>
                  Añadir estudiante
                </router-link>

                <button
                  class="w-full flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  @click="openDeleteModal"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 mr-2 text-red-500 dark:text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  Eliminar clase
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center"
    >
      <div class="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <ExclamationTriangleIcon class="mx-auto h-12 w-12 text-red-600 mb-4" />
          <h3 class="text-lg leading-6 font-medium text-gray-900">Confirmar Eliminación</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500">
              ¿Estás seguro de que quieres eliminar esta clase? Esta acción no se puede deshacer y
              afectará a todos los estudiantes inscritos.
            </p>
            <p class="text-sm text-red-600 mt-2 font-medium">Esta acción no se puede deshacer.</p>
          </div>
          <div class="flex justify-center space-x-4 mt-4">
            <button
              class="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md hover:bg-gray-600 transition-colors"
              @click="closeDeleteModal"
            >
              Cancelar
            </button>
            <button
              class="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 transition-colors"
              @click="confirmDelete"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Class Info Modal -->
    <div
      v-if="showEditInfoModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="closeEditInfoModal"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800"
        @click.stop
      >
        <div class="mt-3 text-center">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
            Editar Información de la Clase
          </h3>
          <div class="mt-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Nombre</label
              >
              <input
                v-model="editForm.name"
                type="text"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Instrumento</label
              >
              <input
                v-model="editForm.instrument"
                type="text"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Nivel</label
              >
              <select
                v-model="editForm.level"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </select>
            </div>
          </div>
          <div class="items-center px-4 py-3">
            <button
              :disabled="isSavingChanges"
              class="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
              @click="saveClassInfo"
            >
              {{ isSavingChanges ? "Guardando..." : "Guardar" }}
            </button>
            <button
              class="mt-2 px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
              @click="closeEditInfoModal"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Schedule Modal -->
    <div
      v-if="showEditScheduleModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="closeEditScheduleModal"
    >
      <div
        class="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800"
        @click.stop
      >
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Editar Horario</h3>
          <div class="space-y-4">
            <div
              v-for="(slot, index) in scheduleForm.slots"
              :key="index"
              class="flex items-center space-x-4 p-4 border rounded-lg"
            >
              <input
                v-model="slot.isActive"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <select
                v-model="slot.day"
                class="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="Lunes">Lunes</option>
                <option value="Martes">Martes</option>
                <option value="Miércoles">Miércoles</option>
                <option value="Jueves">Jueves</option>
                <option value="Viernes">Viernes</option>
                <option value="Sábado">Sábado</option>
                <option value="Domingo">Domingo</option>
              </select>
              <input
                v-model="slot.startTime"
                type="time"
                class="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <input
                v-model="slot.endTime"
                type="time"
                class="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          <div class="mt-6 flex justify-end space-x-3">
            <button
              class="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md shadow-sm hover:bg-gray-400"
              @click="closeEditScheduleModal"
            >
              Cancelar
            </button>
            <button
              :disabled="isSavingChanges"
              class="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
              @click="saveSchedule"
            >
              {{ isSavingChanges ? "Guardando..." : "Guardar" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Manage Students Modal -->
    <div
      v-if="showManageStudentsModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="closeManageStudentsModal"
    >
      <div
        class="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800"
        @click.stop
      >
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Gestionar Estudiantes
          </h3>
          <div class="space-y-4">
            <div
              v-for="student in availableStudents"
              :key="student.id"
              class="flex items-center space-x-3 p-3 border rounded-lg"
            >
              <input
                v-model="selectedStudents"
                :value="student.id"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ student.nombre }} {{ student.apellido }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ student.instrumento || "Sin instrumento" }}
                </p>
              </div>
            </div>
          </div>
          <div class="mt-6 flex justify-end space-x-3">
            <button
              class="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md shadow-sm hover:bg-gray-400"
              @click="closeManageStudentsModal"
            >
              Cancelar
            </button>
            <button
              :disabled="isSavingChanges || selectedStudents.length === 0"
              class="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-green-700 disabled:opacity-50"
              @click="addStudentsToClass"
            >
              {{ isSavingChanges ? "Añadiendo..." : `Añadir (${selectedStudents.length})` }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Menu with Reports -->
    <div class="fixed bottom-6 right-6 z-40">
      <div class="relative">
        <button
          class="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          @click="showActionMenu = !showActionMenu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>

        <div
          v-if="showActionMenu"
          class="absolute bottom-24 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 w-56"
        >
          <button
            class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            @click="openEditScheduleModal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Editar Horario
          </button>

          <button
            class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            @click="openManageStudentsModal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            Gestionar Estudiantes
          </button>

          <hr class="my-2 border-gray-200 dark:border-gray-600" />
          <button
            :disabled="isGeneratingPDF"
            class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            @click="generateClassReport"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {{ isGeneratingPDF ? "Generando..." : "Reporte de Clase" }}
          </button>

          <button
            :disabled="isGeneratingPDF || students.length === 0"
            class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center disabled:opacity-50"
            @click="generateStudentListPDF"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            {{ isGeneratingPDF ? "Generando..." : "Lista de Estudiantes" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Remove the current max-width restriction to use Tailwind's built-in sizing */
.class-detail-view {
  max-width: 100%;
  margin: 0 auto;
}

/* Remove the class-content-grid defined style as we're using Tailwind's grid system */
.class-content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .class-content-grid {
    grid-template-columns: 2fr 1fr;
  }
}

/* Transitions for theme switching and hover effects */
.transition-colors {
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

.transition-all {
  transition: all 0.3s ease;
}
</style>
