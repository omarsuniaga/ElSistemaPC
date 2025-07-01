<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useStudentsStore} from "../modulos/Students/store/students"
import {useAttendanceStore} from "../modulos/Attendance/store/attendance"
import {useClassesStore} from "../modulos/Classes/store/classes"
import {useToast} from "../components/ui/toast/use-toast" // Descomentar si se usa toast
import type {Student} from "../modulos/Students/types/student"
import type {AttendanceDocument} from "../modulos/Attendance/types/attendance" // Importar tipo
import {formatISO, isValid, parseISO} from "date-fns" // Asegúrate de importar isValid y formatISO

// Stores
const studentsStore = useStudentsStore()
const attendanceStore = useAttendanceStore()
const classesStore = useClassesStore()
const {toast, triggerNotification} = useToast() // Descomentar si se usa toast

// Estado del componente
const startDate = ref("")
const endDate = ref("")
const isLoading = ref(false)
const error = ref<string | null>(null)
const results = ref<AbsenceResult[]>([])
const searchPerformed = ref(false) // Para saber si se realizó una búsqueda
const weeklyAbsences = ref<any[]>([])
const monthlyAbsences = ref<any[]>([])

// Interfaces para manejar los datos
interface AbsenceResult {
  student: Student
  absenceCount: number
  absenceDates: string[]
  missedClassIds: Set<string>
  missedClassNames: string[]
}

// Normalizar formato de fecha para comparaciones
const normalizeDate = (dateStr: string | Date): Date => {
  if (!dateStr) return new Date(0) // Fecha inválida si no hay string/Date

  if (dateStr instanceof Date) {
    // Si ya es Date, asegurarse que es válido
    return isValid(dateStr) ? dateStr : new Date(0)
  }

  if (typeof dateStr === "string") {
    // 1. Intentar parsear con parseISO (para YYYY-MM-DD, ISO 8601)
    const isoDate = parseISO(dateStr)
    if (isValid(isoDate)) {
      return isoDate
    }

    // 2. Intentar parsear formato DD/MM/YYYY
    const ddmmyyyyPattern = /^(\\d{1,2})[/.-](\\d{1,2})[/.-](\\d{4})$/
    const ddmmyyyyMatch = dateStr.match(ddmmyyyyPattern)

    if (ddmmyyyyMatch) {
      const [_, day, month, year] = ddmmyyyyMatch
      const constructedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      if (isValid(constructedDate)) {
        return constructedDate
      }
    }

    // 3. Como último recurso, intentar crear una fecha directamente
    // Esto puede ser menos fiable dependiendo del navegador/entorno
    const directDate = new Date(dateStr)
    if (isValid(directDate)) {
      return directDate
    }
  }

  console.warn("Formato de fecha no reconocido o inválido:", dateStr)
  return new Date(0) // Devolver fecha inválida si todo falla
}

// --- Función Principal de Búsqueda ---
async function searchAbsences() {
  // Validación básica de fechas
  if (!startDate.value || !endDate.value) {
    error.value = "Por favor, seleccione fecha de inicio y fin."
    return
  }

  // Normalizar las fechas del rango ANTES de usarlas
  const rangeStartDate = normalizeDate(startDate.value)
  const rangeEndDate = normalizeDate(endDate.value)

  // Validar las fechas normalizadas
  if (
    !isValid(rangeStartDate) ||
    rangeStartDate.getTime() === 0 ||
    !isValid(rangeEndDate) ||
    rangeEndDate.getTime() === 0 ||
    rangeEndDate < rangeStartDate
  ) {
    error.value = "Rango de fechas inválido. Verifique las fechas seleccionadas."
    console.error("Fechas normalizadas inválidas:", {
      startInput: startDate.value,
      startNormalized: rangeStartDate,
      endInput: endDate.value,
      endNormalized: rangeEndDate,
    })
    return
  }

  // **MODIFICACIÓN:** Obtener solo la parte de la fecha (YYYY-MM-DD) para comparación
  const rangeStartYYYYMMDD = formatISO(rangeStartDate, {representation: "date"})
  const rangeEndYYYYMMDD = formatISO(rangeEndDate, {representation: "date"})

  console.log(`Buscando ausencias desde: ${rangeStartYYYYMMDD} hasta: ${rangeEndYYYYMMDD}`) // Log con formato YYYY-MM-DD

  isLoading.value = true
  error.value = null
  results.value = []
  searchPerformed.value = true // Marcar que se intentó una búsqueda

  try {
    // 1. Asegurar que estudiantes y clases estén cargados
    if (studentsStore.students.length === 0) await studentsStore.fetchStudents()
    if (classesStore.classes.length === 0) await classesStore.fetchClasses()

    // 2. Obtener documentos de asistencia optimizados por rango de fechas
    const {start, end} = actualDateRange.value
    console.log(`Fetching attendance documents for range: ${start} to ${end}`)

    // Usar consulta optimizada por rango de fechas
    const documentsInRange = await attendanceStore.fetchAttendanceDocuments(start, end)
    console.log(`Total documentos en rango: ${documentsInRange.length}`)

    // 3. Procesar los documentos para agregar ausencias
    const absencesMap = new Map<string, {count: number; classIds: Set<string>; dates: string[]}>()

    documentsInRange.forEach((doc) => {
      if (!doc.fecha || !doc.data?.ausentes || !Array.isArray(doc.data.ausentes)) {
        return // Omitir documentos sin fecha o sin array de ausentes
      }

      // Los documentos ya están filtrados por rango, procesamos directamente
      doc.data.ausentes.forEach((studentId: string) => {
        if (!studentId) return // Ignorar IDs vacíos

        const currentData = absencesMap.get(studentId) || {
          count: 0,
          classIds: new Set<string>(),
          dates: [],
        }
        currentData.count += 1
        if (doc.classId) {
          currentData.classIds.add(doc.classId)
        }
        currentData.dates.push(doc.fecha) // Guardar la fecha original del registro
        absencesMap.set(studentId, currentData)
      })
    })

    console.log(`Estudiantes con ausencias encontradas en el rango: ${absencesMap.size}`)

    // 4. Enriquecer con datos de estudiante y clase
    const finalResults: AbsenceResult[] = []
    for (const [studentId, data] of absencesMap.entries()) {
      const student = studentsStore.getStudentById(studentId) // Usar getter del store

      if (student) {
        // Solo incluir si encontramos al estudiante
        const missedClassNames = Array.from(data.classIds)
          .map((classId) => classesStore.getClassById(classId)?.name) // Usar getter del store
          .filter((name): name is string => !!name) // Filtrar clases no encontradas y asegurar tipo string

        finalResults.push({
          student, // Guardar el objeto estudiante completo
          absenceCount: data.count,
          missedClassNames:
            missedClassNames.length > 0 ? missedClassNames : ["Clase no especificada"],
          // Añadir las fechas específicas de ausencia al resultado
          absenceDates: data.dates,
          missedClassIds: data.classIds,
        })
      } else {
        console.warn(`Estudiante con ID ${studentId} ausente pero no encontrado en el store.`)
      }
    }

    // Ordenar resultados (opcional, por ejemplo por número de ausencias)
    results.value = finalResults.sort((a, b) => b.absenceCount - a.absenceCount)

    if (results.value.length === 0) {
      console.log("No se encontraron resultados de ausencias para el rango especificado.")
    } else {
      console.log("Resultados encontrados:", results.value)
      triggerNotification("Análisis completado: " + results.value.length + " inasistencias")
    }
  } catch (err: any) {
    console.error("Error durante la búsqueda de ausencias:", err)
    error.value = "Ocurrió un error al buscar las ausencias. Intente de nuevo."
    toast({title: "Error", description: error.value, variant: "destructive"}) // Descomentar si se usa toast
  } finally {
    isLoading.value = false
  }
}

// --- Funciones Helper ---
const getInitials = (name: string, surname: string) => {
  if (!name || !surname) return ""
  return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase()
}

const contactStudent = (student: Student) => {
  console.log("Contactar estudiante:", student)
  // Implementar lógica de contacto
}

const viewAttendance = (student: Student) => {
  console.log("Ver asistencia de:", student)
  // Implementar navegación a detalle de asistencia
}

// These methods are required by TeachersHomeView.vue
const analyzeWeeklyAbsences = async () => {
  console.log("AbsenceAlertList: Analizando ausencias semanales...")

  // Obtener rango de la semana actual
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)) // Iniciar semana en lunes
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  // Establecer fechas para la búsqueda
  startDate.value = formatISO(weekStart, {representation: "date"})
  endDate.value = formatISO(weekEnd, {representation: "date"})

  // Buscar ausencias
  await searchAbsences()

  // Convertir resultados al formato esperado por TeachersHomeView
  weeklyAbsences.value = results.value.map((result) => ({
    student: result.student,
    absences: result.absenceCount,
    absenceDates: result.absenceDates,
    classNames: result.missedClassNames,
  }))

  return weeklyAbsences.value
}

const analyzeMonthlyAbsences = async () => {
  console.log("AbsenceAlertList: Analizando ausencias mensuales...")

  // Obtener rango del mes actual
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  monthEnd.setHours(23, 59, 59, 999)

  // Establecer fechas para la búsqueda
  startDate.value = formatISO(monthStart, {representation: "date"})
  endDate.value = formatISO(monthEnd, {representation: "date"})

  // Buscar ausencias
  await searchAbsences()

  // Convertir resultados al formato esperado
  monthlyAbsences.value = results.value.map((result) => ({
    student: result.student,
    absences: result.absenceCount,
    absenceDates: result.absenceDates,
    classNames: result.missedClassNames,
  }))

  return monthlyAbsences.value
}

const getWeeklyAbsences = () => {
  return weeklyAbsences.value
}

const getMonthlyAbsences = () => {
  return monthlyAbsences.value
}

// Create a computed property for date ranges debug information
const dateRanges = computed(() => ({
  startDate: startDate.value,
  endDate: endDate.value,
  normalized: {
    start: startDate.value ? normalizeDate(startDate.value) : null,
    end: endDate.value ? normalizeDate(endDate.value) : null,
  },
}))

// Expose methods required by TeachersHomeView
defineExpose({
  analyzeWeeklyAbsences,
  analyzeMonthlyAbsences,
  getWeeklyAbsences,
  getMonthlyAbsences,
  debugDateInfo: dateRanges,
})

// Inicializar búsqueda al montar el componente
onMounted(async () => {
  if (!startDate.value || !endDate.value) {
    // Si no hay fechas seleccionadas, usar por defecto la semana actual
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)) // Iniciar semana en lunes
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    startDate.value = formatISO(weekStart, {representation: "date"})
    endDate.value = formatISO(weekEnd, {representation: "date"})
  }
  await attendanceStore.fetchAttendanceDocuments()
})
</script>

<template>
  <div class="absence-alert-list p-4">
    <h2 class="text-xl font-bold mb-4">Alertas de Inasistencias</h2>

    <!-- Selector de fecha -->
    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <div class="flex-1">
        <label class="block text-sm font-medium text-gray-700 mb-1">Desde</label>
        <input
          v-model="startDate"
          type="date"
          class="w-full rounded-md border-gray-300 dark:text-black shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div class="flex-1">
        <label class="block text-sm font-medium dark:text-white text-gray-700 mb-1">Hasta</label>
        <input
          v-model="endDate"
          type="date"
          class="w-full rounded-md border-gray-300 dark:text-black shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div class="flex items-end">
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          :disabled="isLoading"
          @click="searchAbsences"
        >
          {{ isLoading ? "Buscando..." : "Buscar" }}
        </button>
      </div>
    </div>

    <!-- Estado de carga -->
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      <span class="ml-2">Cargando datos de asistencia...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md mb-6">
      {{ error }}
    </div>

    <!-- Resultados -->
    <!-- Modificación en la visualización de resultados para usar normalizeDate -->
    <div v-if="!isLoading && results.length > 0" class="results-list space-y-4">
      <h3 class="text-xl font-semibold mb-4 text-gray-700">
        Resultados de la Búsqueda ({{ results.length }} estudiantes)
      </h3>
      <div
        v-for="result in results"
        :key="result.student.id"
        class="bg-white shadow rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start hover:shadow-md transition"
      >
        <!-- ... Resto del div del resultado ... -->
        <div class="flex-grow text-sm text-gray-700 space-y-1 w-full md:w-auto">
          <!-- ... Total Ausencias y Clases Ausentes ... -->

          <!-- Mostrar fechas normalizadas -->
          <div v-if="result.absenceDates && result.absenceDates.length > 0">
            <span class="font-medium">Fechas Ausente:</span>
            <ul class="list-disc list-inside ml-1 text-xs">
              <li v-for="(dateStr, index) in result.absenceDates.slice(0, 5)" :key="index">
                {{ new Date(normalizeDate(dateStr)).toLocaleDateString("es-ES") }}
                <!-- Mostrar fecha original si la normalización falla -->
                <span
                  v-if="!isValid(normalizeDate(dateStr)) || normalizeDate(dateStr).getTime() === 0"
                  class="text-red-500 text-xs"
                  >(Fecha original: {{ dateStr }})</span
                >
              </li>
              <li v-if="result.absenceDates.length > 5" class="italic">
                ... y {{ result.absenceDates.length - 5 }} más
              </li>
            </ul>
          </div>
        </div>
        <div class="flex space-x-2">
          <button
            class="p-1 text-blue-600 hover:text-blue-800"
            title="Contactar"
            @click="() => contactStudent(result.student)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"
              />
            </svg>
          </button>
          <button
            class="p-1 text-gray-600 hover:text-gray-800"
            title="Ver detalles"
            @click="() => viewAttendance(result.student)"
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
          </button>
        </div>
      </div>
    </div>

    <!-- Sin resultados -->
    <div v-else-if="startDate && endDate && !isLoading" class="py-8 text-center text-gray-500">
      No se encontraron inasistencias en el rango de fechas seleccionado.
    </div>
  </div>
</template>

<style scoped>
.results-list {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}
</style>
