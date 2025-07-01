<script setup lang="ts">
import {ref, computed, onMounted, watch, onUnmounted} from "vue"
import {format} from "date-fns"
import {es} from "date-fns/locale"
import {useAttendanceStore} from "../../../Attendance/store/attendance"
import {useStudentsStore} from "../../../Students/store/students"
import {useClassesStore} from "../../../Classes/store/classes"
import {useTeachersStore} from "../../store/teachers"
import TodayClassesPanel from "../../../../components/TodayClassesPanel.vue"
import AttendanceWeeklyTable from "../../../../components/AttendanceWeeklyTable.vue"
import AbsenteesList from "../../../../components/AbsenteesList.vue"
import StudentsKpi from "../../../../components/dashboard/StudentsKpi.vue"
import ClassesKpi from "../../../../components/dashboard/ClassesKpi.vue"
import EmergentClassesKpi from "../../../../components/dashboard/EmergentClassesKpi.vue"
import TeachersKpi from "../../../../components/dashboard/TeachersKpi.vue"
import MinimizablePanel from "../../../../components/dashboard/MinimizablePanel.vue"
import {
  safeGet,
  safeArrayLength,
  safeStoreAccess,
  safeFilter,
  safeFind,
  safeMath,
  isValidArray,
  isValidObject,
} from "@/utils/safeAccess"
import {useAdminErrorHandling} from "@/composables/useAdminErrorHandling"

// Estado reactivo
const attendanceStore = useAttendanceStore()
const studentsStore = useStudentsStore()
const classesStore = useClassesStore()
const teachersStore = useTeachersStore()
const todayClassesPanel = ref<InstanceType<typeof TodayClassesPanel> | null>(null)

// Error handling composable
const {handleAdminError, safeAsyncOperation, validateData} = useAdminErrorHandling()

const isLoading = ref(true)
const error = ref<string | null>(null)
const presentStudentsList = ref<any[]>([])
const studentsPresent = ref(0)
const activeClasses = ref(0)
const regularClasses = ref(0) // Changed initial value from 1 to 0
const emergentClasses = ref(0)
const expectedClasses = ref(0) // New ref for expected classes
const expectedClassrooms = ref(0) // New ref for expected classrooms
const classCompletionRate = ref(0) // New ref for class completion rate
const activeTeachers = ref(0)
const classroomsInUse = ref(0)
const attendancePercentage = ref(0)
const teacherAttendancePercentage = ref(0)
const emergentClassPercentage = ref(0)
const refreshInterval = ref<number | null>(null)

// Fecha actual formateada
const formattedCurrentDate = computed(() => {
  return format(new Date(), "d 'de' MMMM, yyyy", {locale: es})
})

// Día de la semana actual (0 = domingo, 1 = lunes, etc.)
const currentDayOfWeek = computed(() => {
  return new Date().getDay()
})

// Al montar el componente
onMounted(async () => {
  try {
    isLoading.value = true
    // Cargar datos de asistencia y estudiantes presentes
    await fetchAttendanceData()
    // Construir lista de estudiantes presentes
    presentStudentsList.value = await buildPresentStudentsList()
    studentsPresent.value = countUniquePresentStudents()
    console.log("📊 Estudiantes presentes hoy:", presentStudentsList.value)
    // Cargar datos necesarios de los almacenes
    await Promise.all([
      fetchAttendanceData(),
      loadStudentsData(),
      loadClassesData(),
      loadTeachersData(),
    ])

    // Calcular estadísticas una vez que tenemos todos los datos
    calculateStatistics()

    // Calcular las clases esperadas para hoy
    calculateExpectedClasses()

    // Configurar actualizaciones periódicas (cada 30 segundos)
    refreshInterval.value = window.setInterval(() => {
      fetchAttendanceData(true)
        .then(() => calculateStatistics())
        .catch((err) => console.error("Error en actualización automática:", err))
    }, 30000) // 30 segundos
  } catch (err: any) {
    error.value = `Error al cargar datos: ${err.message}`
    console.error("Error en AdminHomeView:", err)
  } finally {
    isLoading.value = false
  }
})

// Limpiar el intervalo al desmontar el componente
onUnmounted(() => {
  if (refreshInterval.value !== null) {
    clearInterval(refreshInterval.value)
  }
})

// Observar cambios en el store de asistencias para actualizar en tiempo real
watch(
  () => attendanceStore.attendanceDocuments.length,
  (newCount, oldCount) => {
    if (newCount !== oldCount) {
      console.log("📊 Detectado cambio en documentos de asistencia, actualizando métricas...")
      fetchAttendanceData(true)
        .then(() => calculateStatistics())
        .catch((err) => console.error("Error al actualizar tras cambio en documentos:", err))
    }
  }
)

// Observar cambios en los registros de asistencia individuales
watch(
  () => attendanceStore.records.length,
  (newCount, oldCount) => {
    if (newCount !== oldCount) {
      console.log("📊 Detectado cambio en registros de asistencia, actualizando métricas...")
      calculateStatistics()
    }
  }
)

// Observar cambios en el componente TodayClassesPanel
watch(
  () => todayClassesPanel.value,
  (newVal) => {
    if (newVal) {
      updateClassesStatistics()
    }
  },
  {immediate: true}
)

// Observar cambios en los datos del panel de clases
watch(
  () => (todayClassesPanel.value as any)?.totalClassesToday,
  (newVal) => {
    if (newVal !== undefined) {
      updateClassesStatistics()
      calculateExpectedClasses() // Recalcular clases esperadas cuando actualicen las clases totales
    }
  }
)

// Función para obtener datos de asistencia de hoy
async function fetchAttendanceData(skipLoadingState = false) {
  try {
    if (!skipLoadingState) {
      isLoading.value = true
    }

    // Obtener la fecha actual en formato YYYY-MM-DD
    const currentDate = format(new Date(), "yyyy-MM-dd")

    // Cargar los documentos de asistencia si no están ya cargados o si es una actualización forzada
    if (attendanceStore.attendanceDocuments.length === 0 || skipLoadingState) {
      await attendanceStore.fetchAttendanceDocuments()
    }

    // Filtrar documentos por la fecha actual
    const todayDocuments = attendanceStore.attendanceDocuments.filter(
      (doc) => doc.fecha === currentDate
    )

    // Construir lista de estudiantes presentes
    const presentStudents: any[] = []

    // Set para guardar IDs únicos de estudiantes presentes
    const uniqueStudentIds = new Set<string>()

    // Procesar cada documento de asistencia con validaciones seguras
    for (const doc of todayDocuments) {
      // Validar que el documento tenga la estructura correcta
      if (!doc || !isValidObject(doc.data)) {
        handleAdminError(
          new Error("Documento de asistencia con estructura inválida"),
          "processTodayAttendance"
        )
        continue
      }

      // Obtener la información de la clase con acceso seguro
      const classInfo = safeStoreAccess(classesStore, `getClassById(${doc.classId})`, null)

      // Procesar estudiantes presentes con validación segura
      const presentesArray = safeGet(doc, "data.presentes", [])
      if (isValidArray(presentesArray)) {
        presentesArray.forEach((studentId: string) => {
          if (!studentId) return

          // Añadir ID al set de estudiantes únicos
          uniqueStudentIds.add(studentId)

          // Obtener información del estudiante con acceso seguro
          const students = safeStoreAccess(studentsStore, "items", [])
          const student = safeFind(students, (s: any) => safeGet(s, "id") === studentId)

          if (student) {
            const nombre = safeGet(student, "nombre", "")
            const apellido = safeGet(student, "apellido", "")
            presentStudents.push({
              id: studentId,
              name: `${nombre} ${apellido}`.trim(),
              className: safeGet(classInfo, "name", "Clase sin nombre"),
              time: safeGet(classInfo, "schedule", "Horario no especificado"),
            })
          }
        })
      }

      // También considerar estudiantes con estado "tarde" como presentes con validación
      const tardeArray = safeGet(doc, "data.tarde", [])
      if (isValidArray(tardeArray)) {
        tardeArray.forEach((lateStudentId: string) => {
          if (!lateStudentId) return

          // Añadir ID al set de estudiantes únicos
          uniqueStudentIds.add(lateStudentId)

          // Obtener información del estudiante con acceso seguro
          const students = safeStoreAccess(studentsStore, "items", [])
          const student = safeFind(students, (s: any) => safeGet(s, "id") === lateStudentId)

          if (student) {
            const nombre = safeGet(student, "nombre", "")
            const apellido = safeGet(student, "apellido", "")
            presentStudents.push({
              id: lateStudentId,
              name: `${nombre} ${apellido}`.trim(),
              className: safeGet(classInfo, "name", "Clase sin nombre"),
              time: safeGet(classInfo, "schedule", "Horario no especificado"),
              late: true,
            })
          }
        })
      }

      // NO incluimos estudiantes justificados o ausentes según el nuevo requerimiento
    }

    // Actualizar el estado con los datos procesados
    presentStudentsList.value = presentStudents
    studentsPresent.value = uniqueStudentIds.size
  } catch (err) {
    console.error("Error en fetchAttendanceData:", err)
    throw new Error(`Error al obtener datos de asistencia: ${err}`)
  } finally {
    if (!skipLoadingState) {
      isLoading.value = false
    }
  }
}

// Función para cargar datos de estudiantes
async function loadStudentsData() {
  if (studentsStore.students.length === 0) {
    await studentsStore.fetchStudents()
  }
}

// Función para cargar datos de clases
async function loadClassesData() {
  if (classesStore.classes.length === 0) {
    await classesStore.fetchClasses()
  }
}

// Función para cargar datos de profesores
async function loadTeachersData() {
  if (teachersStore.teachers.length === 0) {
    await teachersStore.fetchTeachers()
  }
}

// Función para calcular las clases esperadas para hoy
function calculateExpectedClasses() {
  // Usar el método getClassesByDay del store para obtener las clases de hoy
  const today = currentDayOfWeek.value
  const classesForToday = classesStore.getClassesByDay(today)

  // Actualizar el número de clases esperadas
  expectedClasses.value = classesForToday.length

  // Calcular salones únicos esperados
  const uniqueClassrooms = new Set<string>()
  classesForToday.forEach((classItem) => {
    if (classItem.classroom) {
      uniqueClassrooms.add(classItem.classroom)
    }
  })
  expectedClassrooms.value = uniqueClassrooms.size

  // Calcular tasa de completado (clases activas vs. clases esperadas)
  if (expectedClasses.value > 0) {
    classCompletionRate.value = Math.round((regularClasses.value / expectedClasses.value) * 100)
  } else {
    classCompletionRate.value = 0
  }

  console.log(
    `📊 Se esperan ${expectedClasses.value} clases hoy en ${expectedClassrooms.value} salones`
  )
}

// Función para actualizar las estadísticas de clases desde el componente TodayClassesPanel
function updateClassesStatistics() {
  if (todayClassesPanel.value) {
    // Accedemos a los datos a través de métodos expuestos o con type assertion
    const panelInstance = todayClassesPanel.value as any
    activeClasses.value = panelInstance.totalClassesToday || 0
    regularClasses.value = panelInstance.totalRegularClasses || 0
    emergentClasses.value = panelInstance.totalEmergentClasses || 0

    // Calcular porcentaje de clases emergentes del total
    if (activeClasses.value > 0) {
      emergentClassPercentage.value = Math.round(
        (emergentClasses.value / activeClasses.value) * 100
      )
    } else {
      emergentClassPercentage.value = 0
    }
  }
}

// Función para calcular estadísticas adicionales
function calculateStatistics() {
  const currentDate = format(new Date(), "yyyy-MM-dd")
  const activeRooms = new Set<string>()
  const activeTeachersSet = new Set<string>()

  // Contar clases activas hoy - ahora usa el componente TodayClassesPanel
  updateClassesStatistics()

  // Actualizar salones y maestros activos
  attendanceStore.attendanceDocuments
    .filter((doc) => doc.fecha === currentDate)
    .forEach((doc) => {
      const classInfo = classesStore.getClassById(doc.classId)
      if (classInfo) {
        if (classInfo.classroom) activeRooms.add(classInfo.classroom)
        if (classInfo.teacherId) activeTeachersSet.add(classInfo.teacherId)
      }
    })

  // Actualizar contadores de salones y maestros
  classroomsInUse.value = activeRooms.size
  activeTeachers.value = activeTeachersSet.size

  // Calcular porcentajes de asistencia
  const totalActiveStudents = studentsStore.activeStudents.length
  if (totalActiveStudents > 0) {
    attendancePercentage.value = Math.round((studentsPresent.value / totalActiveStudents) * 100)
  }

  const totalTeachers = teachersStore.teachers.length
  if (totalTeachers > 0) {
    teacherAttendancePercentage.value = Math.round((activeTeachers.value / totalTeachers) * 100)
  }
}

// Función para construir lista de estudiantes presentes
async function buildPresentStudentsList() {
  try {
    const currentDate = format(new Date(), "yyyy-MM-dd")
    const presentStudents: any[] = []

    // Filtrar documentos de asistencia de hoy
    const todayDocuments = attendanceStore.attendanceDocuments.filter(
      (doc) => doc.fecha === currentDate
    )

    // Procesar cada documento para extraer estudiantes presentes
    for (const doc of todayDocuments) {
      const classInfo = classesStore.getClassById(doc.classId)

      if (doc.data && Array.isArray(doc.data.presentes)) {
        // Procesar los estudiantes marcados como presentes
        for (const studentId of doc.data.presentes) {
          const student = studentsStore.items.find((s) => s.id === studentId)

          if (student) {
            presentStudents.push({
              id: studentId,
              name: `${student.nombre || ""} ${student.apellido || ""}`.trim(),
              className: classInfo?.name || "Clase sin nombre",
              time: classInfo?.schedule?.slots?.[0]?.startTime || "Horario no especificado",
            })
          }
        }

        // También procesar estudiantes con tardanza (no justificada)
        const lateStudents = doc.data.tarde || []
        for (const lateStudentId of lateStudents) {
          const student = studentsStore.items.find((s) => s.id === lateStudentId)

          if (student) {
            presentStudents.push({
              id: lateStudentId,
              name: `${student.nombre || ""} ${student.apellido || ""}`.trim(),
              className: classInfo?.name || "Clase sin nombre",
              time: classInfo?.schedule?.slots?.[0]?.startTime || "Horario no especificado",
              late: true,
            })
          }
        }

        // NO incluimos estudiantes justificados o ausentes
      }
    }

    return presentStudents
  } catch (error) {
    console.error("Error construyendo lista de estudiantes presentes:", error)
    return []
  }
}

// Función para contar estudiantes únicos presentes hoy
function countUniquePresentStudents(): number {
  // Esta función implementa el procedimiento detallado para contar estudiantes únicos
  // utilizando los datos en attendanceStore.attendanceDocuments

  const currentDate = format(new Date(), "yyyy-MM-dd")
  const uniqueStudentIds = new Set<string>()

  attendanceStore.attendanceDocuments
    .filter((doc) => doc.fecha === currentDate)
    .forEach((doc) => {
      // Añadir cada ID de estudiante presente al conjunto
      doc.data.presentes.forEach((studentId) => {
        uniqueStudentIds.add(studentId)
      })

      // Añadir estudiantes con tardanza (no justificada)
      if (doc.data.tarde && Array.isArray(doc.data.tarde)) {
        doc.data.tarde.forEach((lateStudentId) => {
          uniqueStudentIds.add(lateStudentId)
        })
      }
    })

  return uniqueStudentIds.size
}

// Lista de maestros activos con sus datos
const activeTeachersWithData = computed(() => {
  // Obtener los IDs de los profesores activos
  const activeTeacherIds = new Set<string>()
  const currentDate = format(new Date(), "yyyy-MM-dd")

  attendanceStore.attendanceDocuments
    .filter((doc) => doc.fecha === currentDate)
    .forEach((doc) => {
      const classInfo = classesStore.getClassById(doc.classId)
      if (classInfo && classInfo.teacherId) {
        activeTeacherIds.add(classInfo.teacherId)
      }
    })
  const handleDayChange = (newDate) => {
    // Actualizar los datos de asistencia para la nueva fecha
    fetchAttendanceForDate(newDate)
  }
  // Mapear los IDs a objetos de profesor completos
  return Array.from(activeTeacherIds)
    .map((id) => {
      const teacher = teachersStore.teachers.find((t) => t.id === id)
      if (!teacher) return null

      // Obtener las clases del profesor para hoy
      const today = currentDayOfWeek.value
      const teacherClasses = classesStore.getClassesByDayAndTeacherId(today, id)

      return {
        ...teacher,
        // Añadir las clases que imparte hoy
        classes: teacherClasses.map((c) => ({
          name: c.name || "Clase sin nombre",
          time: c.schedule?.slots?.[0]?.startTime
            ? `${c.schedule.slots[0].startTime} - ${c.schedule.slots[0].endTime || ""}`
            : "Sin horario",
        })),
      }
    })
    .filter(Boolean) // Eliminar posibles nulos
})
</script>

<template>
  <div class="admin-dashboard p-6">
    <h1 class="text-3xl font-bold mb-8">Panel Administrativo</h1>
    <!-- Panel de estadísticas diarias -->
    <div class="mb-8">
      <h2 class="text-2xl font-semibold mb-4 text-white">
        Actividad del día
        <span class="text-blue-200">({{ formattedCurrentDate }})</span>
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <!-- KPI de Estudiantes Presentes -->
        <StudentsKpi
          :students-present="studentsPresent"
          :attendance-percentage="attendancePercentage"
          :total-active-students="studentsStore.activeStudents.length"
        />

        <!-- KPI de Clases Regulares -->
        <ClassesKpi
          :regular-classes="regularClasses"
          :expected-classes="expectedClasses"
          :class-completion-rate="classCompletionRate"
          :classrooms-in-use="classroomsInUse"
          :expected-classrooms="expectedClassrooms"
        />

        <!-- KPI de Clases Emergentes -->
        <EmergentClassesKpi
          v-if="emergentClasses !== 0"
          :emergent-classes="emergentClasses"
          :emergent-class-percentage="emergentClassPercentage"
          :total-classes="activeClasses"
        />

        <!-- KPI de Profesores Presentes -->
        <TeachersKpi
          :active-teachers="activeTeachers"
          :teacher-attendance-percentage="teacherAttendancePercentage"
          :total-teachers="teachersStore.teachers.length"
          :active-teachers-data="activeTeachersWithData"
        />
        <!-- Botón de acceso al Reporte Semanal -->
        <div class="mt-6 text-center">
          <router-link
            to="/admin/reporte-semanal"
            class="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Ver Reporte Semanal Completo
          </router-link>
        </div>
      </div>
    </div>

    <!-- Panel de Clases del Día -->
    <MinimizablePanel
      title="Asistencias"
      panel-id="today-classes"
      icon-class="text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-900"
      icon-path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    >
      <TodayClassesPanel ref="todayClassesPanel" />
    </MinimizablePanel>

    <!-- Tabla de Asistencia Semanal -->
    <MinimizablePanel
      title="Asistencia Semanal"
      panel-id="weekly-attendance"
      icon-class="text-green-500 dark:text-green-400 bg-green-100 dark:bg-green-900"
      icon-path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    >
      <AttendanceWeeklyTable />
    </MinimizablePanel>

    <!-- Alumnos con Mayor Ausencia -->
    <MinimizablePanel
      title="Estudiantes con Mayor Ausencia"
      panel-id="absentees"
      icon-class="text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900"
      icon-path="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    >
      <AbsenteesList :class-name="null" :limit="5" />
    </MinimizablePanel>
  </div>
</template>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background-color: #394b75;
}
</style>
