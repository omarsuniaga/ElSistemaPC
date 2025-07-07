<!-- src/modulos/attendance/views/TeacherHome.vue -->
<script setup lang="ts">
import {ref, onMounted, watch, computed} from "vue"
import {useRouter} from "vue-router"
import {format, parseISO} from "date-fns"
import {getClassesForTeacherOnDay} from "../../../utils/dayUtils"

// Componentes
import AttendanceHeader from "../../components/AttendanceHeader.vue"
import Calendar from "@/components/Calendar.vue"
import DateClassSelector from "@/modulos/Classes/components/DateClassSelector.vue"
import AttendanceList from "../../components/AttendanceList.vue"
import ClassesModal from "../../components/ClassesModal.vue"

// Composables y store
import {useAttendanceState} from "../../composables/useAttendanceState"
import {useAttendanceActionsSimple as useAttendanceActions} from "../../composables/useAttendanceActionsSimple"
import {useModal} from "../../composables/useModal"
import {useToast} from "../../composables/useToast"
import {useAttendanceStore} from "../../store/attendance"
import {useAuthStore} from "../../../../stores/auth"
import {usePredictionStore} from "@/analytics/store/predictionStore" // 1. Importar el nuevo store

// Obtener las clases del maestro
import {useClassesStore} from "../../../Classes/store/classes"

const classesStore = useClassesStore()
const authStore = useAuthStore()
const predictionStore = usePredictionStore() // 2. Inicializar el store

const {
  selectedDate,
  selectedClass,
  view,
  loading,
  students, // This is localStudents for useAttendanceActions
  attendanceRecords, // This is localAttendanceRecords
  init,
  setDate,
  setClass,
  loadCurrent,
} = useAttendanceState("maestro")

const toast = useToast()

// Provide the necessary options to useAttendanceActions
const attendanceActions = useAttendanceActions({
  localStudents: students, // Pass the students ref from useAttendanceState
  localAttendanceRecords: attendanceRecords, // Pass the attendanceRecords ref
  pendingChanges: ref(new Set<string>()), // Create a new ref for pendingChanges, or get from state if appropriate
  pendingJustifications: ref(new Map<string, {reason?: string; documentURL?: string}>()), // Create new ref for justifications
  displayToast: toast.success, // Pass the success toast function
  isProcessing: loading, // Pass the loading ref from useAttendanceState
  selectedDate, // Pass selectedDate ref
  selectedClass, // Pass selectedClass ref
})

const {
  pendingChangesCount, // Now this should be correctly initialized
} = attendanceActions

const modal = useModal()
const attendanceStore = useAttendanceStore()
const _router = useRouter() // Prefixed with _ to avoid lint error

// Estado para el modal de clases
const showClassesModal = ref(false)
const modalDate = ref("")
const classesForDate = ref<any[]>([]) // Changed to any[] to accommodate different class structures

// Getter con fechas + status (registered / none / partial)
// const statuses = attendanceStore.dateAttendanceStatuses; // Replaced by getDateStatuses from useAttendanceState

// IDs de clases que ya tienen registro en la fecha actual
const classesWithRecords = ref<string[]>([])

// Cambios para clases con records - convertir a formato esperado
const classesWithRecordsFormatted = computed(() => {
  return classesWithRecords.value.map((classId) => ({
    classId,
    date: selectedDate.value,
    hasRecord: true,
  }))
})

async function updateClassesWithRecords() {
  await attendanceStore.fetchAttendanceDocuments()
  classesWithRecords.value = attendanceStore.attendanceDocuments
    .filter((doc) => doc.fecha === selectedDate.value)
    .map((doc) => doc.classId)
}

async function handleDateChange(date: string) {
  await setDate(date)

  // Obtener las clases para la fecha seleccionada
  await fetchClassesForDate(date)

  // --- Lógica de Predicción ---
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const selected = parseISO(date)

  if (selected > today) {
    // Si la fecha es futura, generar predicciones
    console.log(`🔮 Fecha futura seleccionada. Generando predicciones para ${date}...`)
    // Limpiar predicciones antiguas para evitar mostrar datos incorrectos mientras carga
    predictionStore.clearPredictions()
    const classIds = classesForDate.value.map((c: any) => c.id)
    if (classIds.length > 0) {
      await predictionStore.generatePredictionsForClass(classIds[0], [selected])
    }
  } else {
    // Si la fecha es pasada o presente, limpiar las predicciones para no mostrar datos de riesgo
    predictionStore.clearPredictions()
  }
  // --- Fin Lógica de Predicción ---

  modalDate.value = date
  showClassesModal.value = true
}

// Función para obtener las clases programadas en una fecha específica
async function fetchClassesForDate(date: string) {
  try {
    // Función auxiliar para obtener el día de la semana de forma consistente
    const getConsistentDayOfWeek = (dateString: string): number => {
      // Probar múltiples métodos para obtener el día
      const parseISOResult = parseISO(dateString)
      const newDateResult = new Date(dateString)
      const manualParseResult = new Date(dateString + "T12:00:00") // Agregar hora para evitar zona horaria
      
      console.error(`🔍 [CONSISTENCIA] Fecha: ${dateString}`)
      console.error(`🔍 [CONSISTENCIA] parseISO: ${parseISOResult.getDay()} (${parseISOResult.toString()})`)
      console.error(`🔍 [CONSISTENCIA] new Date: ${newDateResult.getDay()} (${newDateResult.toString()})`)
      console.error(`🔍 [CONSISTENCIA] manual+T12:00: ${manualParseResult.getDay()} (${manualParseResult.toString()})`)
      
      // Obtener el día usando el método más confiable
      let dayOfWeekJS = parseISOResult.getDay()
      
      // Si hay inconsistencia, usar el método manual
      if (parseISOResult.getDay() !== newDateResult.getDay()) {
        console.error(`🚨 [CONSISTENCIA] Inconsistencia detectada, usando método manual`)
        dayOfWeekJS = manualParseResult.getDay()
      }
      
      // 🔄 CONVERTIR DE FORMATO JS (domingo=0) A FORMATO LUNES=0 
      // JavaScript: Dom=0, Lun=1, Mar=2, Mié=3, Jue=4, Vie=5, Sáb=6
      // Nuestro:   Lun=0, Mar=1, Mié=2, Jue=3, Vie=4, Sáb=5, Dom=6
      const dayOfWeekAligned = dayOfWeekJS === 0 ? 6 : dayOfWeekJS - 1
      
      console.error(`🔄 [CONVERSIÓN] JavaScript format: ${dayOfWeekJS} -> Aligned format: ${dayOfWeekAligned}`)
      console.error(`🔄 [CONVERSIÓN] ${["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][dayOfWeekJS]} -> ${dayOfWeekAligned}`)
      
      return dayOfWeekAligned
    }

    // Obtener día de la semana tanto como string como number
    const parsedDate = parseISO(date)
    const dayOfWeekNumber = getConsistentDayOfWeek(date) // Usar función consistente
    const dayOfWeekString = format(parsedDate, "EEEE").toLowerCase() // "lunes", "martes", etc.
    const teacherId = authStore.user?.uid

    // 🚨 DEBUG ESPECÍFICO PARA EL PROBLEMA 🚨
    console.error(`🚨 [FECHA DEBUG] Fecha recibida: "${date}"`)
    console.error(`🚨 [FECHA DEBUG] Fecha parseada: ${parsedDate.toDateString()}`)
    console.error(`🚨 [FECHA DEBUG] getDay() convertido a ISO: ${dayOfWeekNumber}`)
    console.error(`🚨 [FECHA DEBUG] Día string: ${dayOfWeekString}`)
    console.error(`🚨 [FECHA DEBUG] Esperado para domingo 6 julio: getDay()=6 (nuevo formato LUNES=0)`)
    console.error(
      `🚨 [FECHA DEBUG] NUEVO MAPEO: Lunes=0, Martes=1, Miércoles=2, Jueves=3, Viernes=4, Sábado=5, Domingo=6`
    )
    
    // 🔍 DIAGNÓSTICO DE DESPLAZAMIENTO
    const newDateTest = new Date(date)
    console.error(`🔍 [DESPLAZAMIENTO] new Date("${date}").getDay() = ${newDateTest.getDay()}`)
    console.error(`🔍 [DESPLAZAMIENTO] parseISO("${date}").getDay() = ${dayOfWeekNumber}`)
    console.error(`🔍 [DESPLAZAMIENTO] Zona horaria offset: ${newDateTest.getTimezoneOffset()} minutos`)
    console.error(`🔍 [DESPLAZAMIENTO] new Date toString: ${newDateTest.toString()}`)
    console.error(`🔍 [DESPLAZAMIENTO] parseISO toString: ${parsedDate.toString()}`)
    
    // Verificar si hay diferencia
    if (newDateTest.getDay() !== dayOfWeekNumber) {
      console.error(`🚨 [DESPLAZAMIENTO] PROBLEMA DETECTADO: new Date vs parseISO dan diferentes días!`)
      console.error(`🚨 [DESPLAZAMIENTO] new Date: ${newDateTest.getDay()}, parseISO: ${dayOfWeekNumber}`)
    }

    if (!teacherId) {
      console.error("[TeacherHome] No hay un usuario logueado con uid")
      classesForDate.value = []
      return
    }

    console.log(
      `[TeacherHome] Buscando clases para el maestro ${teacherId} en la fecha ${date} (${dayOfWeekString}, día ${dayOfWeekNumber})`
    )

    // Obtener todas las clases primero
    await classesStore.fetchClasses()

    const getDayIndex = (dayString: string | number): number => {
      // Si ya es un número, retornarlo
      if (typeof dayString === "number") return dayString

      // 🔄 NUEVO MAPEO: Lunes=0, Domingo=6 (formato corregido) - CONSISTENTE CON dayUtils.ts
      const dayMapping: Record<string, number> = {
        // Formato completo español
        lunes: 0,
        martes: 1,
        miércoles: 2,
        jueves: 3,
        viernes: 4,
        sábado: 5,
        domingo: 6,
        Lunes: 0,
        Martes: 1,
        Miércoles: 2,
        Jueves: 3,
        Viernes: 4,
        Sábado: 5,
        Domingo: 6,
        
        // Formato abreviado
        lun: 0,
        mar: 1,
        mié: 2,
        jue: 3,
        vie: 4,
        sáb: 5,
        dom: 6,
        Lun: 0,
        Mar: 1,
        Mié: 2,
        Jue: 3,
        Vie: 4,
        Sáb: 5,
        Dom: 6,
        
        // Formato sin acentos
        miercoles: 2,
        sabado: 5,
      }

      // Normalizar: quitar espacios y convertir a string
      const normalized = dayString.toString().trim()
      
      // Buscar en el mapeo directo
      if (normalized in dayMapping) {
        return dayMapping[normalized]
      }
      
      // Buscar en minúsculas como fallback
      const lowercased = normalized.toLowerCase()
      return dayMapping[lowercased] ?? -1
    }

    // Función auxiliar para verificar si una clase está programada para el día específico
    const isClassScheduledForDay = (cls: any): boolean => {
      const schedule = cls.schedule as any
      if (!schedule) {
        console.log(`[DEBUG] Clase ${cls.name}: NO tiene schedule`)
        return false
      }

      // Manejar diferentes estructuras de horario
      let slots = []
      if (schedule.slots && Array.isArray(schedule.slots)) {
        slots = schedule.slots
      } else if (schedule.day) {
        // Estructura legacy con day directo
        slots = [schedule]
      }

      console.log(`[DEBUG] Clase ${cls.name}: Verificando ${slots.length} slots para día ${dayOfWeekNumber}`)
      
      const hasMatchingDay = slots.some((slot: any) => {
        const slotDayIndex = getDayIndex(slot.day)
        const matches = slotDayIndex === dayOfWeekNumber
        console.log(`[DEBUG]   Slot "${slot.day}" -> índice ${slotDayIndex}, día buscado ${dayOfWeekNumber}: ${matches ? 'MATCH' : 'no match'}`)
        return matches
      })

      console.log(`[DEBUG] Clase ${cls.name}: Resultado final = ${hasMatchingDay}`)
      
      // 🚨 VERIFICACIÓN ESPECIAL PARA DOMINGO Y ENSAYO GENERAL 🚨
      if (cls.name === "Ensayo General" && dayOfWeekNumber === 6) {
        console.error(`🚨 PROBLEMA DETECTADO: Ensayo General aparece en domingo (día 6)!`)
        console.error(`🚨 Slots encontrados:`, slots)
        console.error(`🚨 hasMatchingDay:`, hasMatchingDay)
        console.error(`🚨 dayOfWeekNumber:`, dayOfWeekNumber)
        slots.forEach((slot: any, index: number) => {
          const slotIndex = getDayIndex(slot.day)
          console.error(`🚨 Slot ${index}: "${slot.day}" -> ${slotIndex}`)
        })
        // FORZAR A FALSO SI ES DOMINGO (DÍA 6 en nuevo formato)
        if (hasMatchingDay) {
          console.error(`🚨 FORZANDO RESULTADO A FALSE PARA DOMINGO (DÍA 6)`)
          return false
        }
      }
      
      return hasMatchingDay
    }

    // 1. Obtener clases programadas donde el maestro es el encargado principal
    console.log(`[DEBUG] === INICIANDO FILTRADO PARA DOMINGO 6 JULIO 2025 ===`)
    console.log(`[DEBUG] Total clases en classesStore: ${classesStore.classes.length}`)
    console.log(`[DEBUG] TeacherId buscado: ${teacherId}`)
    console.log(`[DEBUG] Día de la semana: ${dayOfWeekNumber} (${dayOfWeekString})`)
    
    const scheduledClasses = classesStore.classes.filter((cls: any) => {
      const isTeacher = cls.teacherId === teacherId
      const isScheduled = isClassScheduledForDay(cls)
      console.log(`[DEBUG] Clase "${cls.name}": isTeacher=${isTeacher}, isScheduled=${isScheduled}`)
      return isTeacher && isScheduled
    })
    
    console.log(
      `[TeacherHome] Clases programadas como encargado para ${dayOfWeekString}:`,
      scheduledClasses.length
    )

    // 2. Obtener clases compartidas donde el maestro es colaborador
    const sharedClasses = classesStore.classes.filter((cls: any) => {
      // 🔍 LOG ESPECÍFICO PARA ENSAYO GENERAL
      if (cls.name === "Ensayo General") {
        console.error(`🎯 [SHARED] Evaluando Ensayo General para día ${dayOfWeekNumber} (domingo=${dayOfWeekNumber === 6})`)
      }

      // Verificar si el maestro está en el array de teachers (cualquier rol)
      const isCollaborator = cls.teachers?.some((teacher: any) => {
        if (typeof teacher === "string") {
          return teacher === teacherId
        } else if (typeof teacher === "object" && teacher.teacherId) {
          return teacher.teacherId === teacherId
        }
        return false
      })

      if (!isCollaborator) {
        if (cls.name === "Ensayo General") {
          console.error(`🎯 [SHARED] Ensayo General: NO es colaborador`)
        }
        return false
      }

      // Verificar que NO sea el profesor principal (para evitar duplicados)
      if (cls.teacherId === teacherId) {
        if (cls.name === "Ensayo General") {
          console.error(`🎯 [SHARED] Ensayo General: ES profesor principal, ignorando en compartidas`)
        }
        return false
      }

      // Verificar si la clase está programada para este día
      const isScheduledForToday = isClassScheduledForDay(cls)
      if (cls.name === "Ensayo General") {
        console.error(`🎯 [SHARED] Ensayo General: isScheduledForToday=${isScheduledForToday}`)
      }
      return isScheduledForToday
    })
    console.log(
      `[TeacherHome] Clases compartidas como colaborador para ${dayOfWeekString}:`,
      sharedClasses.length
    )
    sharedClasses.forEach((cls: any) => {
      const myRole =
        cls.teachers?.find((t: any) => typeof t === "object" && t.teacherId === teacherId)?.role ||
        "unknown"
      console.log(`[TeacherHome] - ${cls.name}: rol=${myRole}, teacherId=${cls.teacherId}`)
    })

    // 3. Obtener clases que tienen asistencia registrada para esta fecha específica
    await attendanceStore.fetchAttendanceDocuments()
    const attendanceRecords = attendanceStore.attendanceDocuments.filter(
      (record) => record.fecha === date && record.teacherId === teacherId
    )
    console.log(`[TeacherHome] Registros de asistencia para ${date}:`, attendanceRecords.length)

    // 4. Crear un mapa para evitar duplicados y combinar información
    const classMap = new Map()

    // Procesar clases programadas (encargado principal)
    for (const cls of scheduledClasses) {
      const hasAttendance = attendanceStore.isClassRegistered(date, cls.id)

      classMap.set(cls.id, {
        ...cls,
        teacher: `Profesor ${cls.teacherId?.substring(0, 6) || "N/A"}`,
        teacherId: cls.teacherId,
        hasAttendance,
        classType: "scheduled",
        isScheduledClass: true,
        schedule: cls.schedule,
      })
    }

    // Procesar clases compartidas (colaborador)
    for (const cls of sharedClasses) {
      const hasAttendance = attendanceStore.isClassRegistered(date, cls.id)

      // Obtener información del maestro colaborador
      const myTeacherData = cls.teachers?.find(
        (t: any) => typeof t === "object" && t.teacherId === teacherId
      )
      const canTakeAttendance =
        (myTeacherData &&
          typeof myTeacherData === "object" &&
          myTeacherData.permissions?.canTakeAttendance) !== false
      const myRole =
        (myTeacherData && typeof myTeacherData === "object" && myTeacherData.role) || "colaborador"

      console.log(`[TeacherHome] Procesando clase compartida: ${cls.name}`, {
        myRole,
        canTakeAttendance,
        teacherId: cls.teacherId,
        myTeacherData,
      })

      classMap.set(cls.id, {
        ...cls,
        teacher: `Profesor ${cls.teacherId?.substring(0, 6) || "N/A"}`,
        teacherId: cls.teacherId, // Mantener el ID del profesor principal
        teachers: cls.teachers,
        hasAttendance,
        classType: "shared",
        isScheduledClass: true,
        teacherPermissions: {
          canTakeAttendance,
        },
        userRole: myRole, // Agregar el rol del usuario actual
        isSharedWithMe: true, // Indicar que es una clase compartida conmigo
        schedule: cls.schedule,
      })
    }

    // Procesar clases con asistencia registrada (pueden ser clases extra o de recuperación)
    for (const record of attendanceRecords) {
      const existingClass = classMap.get(record.classId)

      if (existingClass) {
        // Ya existe en las programadas/compartidas, actualizar info
        existingClass.hasAttendance = true
        existingClass.attendanceRecord = record
      } else {
        // Clase no programada pero con asistencia (clase extra/recuperación)
        const classInfo = classesStore.classes.find((c) => c.id === record.classId)

        if (classInfo) {
          classMap.set(record.classId, {
            ...classInfo,
            teacher: `Profesor ${classInfo.teacherId?.substring(0, 6) || "N/A"}`,
            teacherId: classInfo.teacherId,
            hasAttendance: true,
            classType: "recorded",
            isScheduledClass: false,
            attendanceRecord: record,
            schedule: classInfo.schedule || {slots: []},
          })
        } else {
          // Clase no encontrada en el store, crear entrada básica
          classMap.set(record.classId, {
            id: record.classId,
            name: `Clase ${record.classId}`,
            teacher: "",
            teacherId,
            hasAttendance: true,
            classType: "recorded",
            isScheduledClass: false,
            attendanceRecord: record,
            schedule: {slots: []},
            studentIds: [],
          })
        }
      }
    }

    // Convertir el mapa a array
    const allClasses = Array.from(classMap.values())

    // Preparar datos para el modal con el formato esperado
    classesForDate.value = allClasses.map((classItem) => {
      // Obtener horario formateado
      let timeString = ""
      if (classItem.schedule?.slots && classItem.schedule.slots.length > 0) {
        const slot = classItem.schedule.slots.find((s: any) => {
          const slotDay = s.day
            ?.toLowerCase()
            ?.normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
          const currentDay = dayOfWeekString.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          return slotDay === currentDay
        })

        if (slot) {
          timeString = `${slot.startTime} - ${slot.endTime}`
        }
      }

      return {
        id: classItem.id,
        name: classItem.name,
        teacher: classItem.teacher,
        teacherId: classItem.teacherId,
        teachers: classItem.teachers,
        time: timeString,
        students: classItem.studentIds?.length || 0,
        studentIds: classItem.studentIds,
        hasAttendance: classItem.hasAttendance,
        classType: classItem.classType,
        isScheduledClass: classItem.isScheduledClass,
        hasAttendanceRecord: classItem.hasAttendance,
        attendanceRecord: classItem.attendanceRecord,
        teacherPermissions: classItem.teacherPermissions,
        schedule: classItem.schedule,
      }
    })

    console.log(
      `[TeacherHome] Total de clases encontradas para ${teacherId}:`,
      classesForDate.value.length
    )
    console.log(`[TeacherHome] ===== RESUMEN CLASES PARA MODAL =====`)
    console.log(`[TeacherHome] Fecha: ${date} (${dayOfWeekString})`)
    console.log(`[TeacherHome] Usuario: ${teacherId}`)

    const programadas = classesForDate.value.filter((c) => c.classType === "scheduled")
    const compartidas = classesForDate.value.filter((c) => c.classType === "shared")
    const registradas = classesForDate.value.filter((c) => c.classType === "recorded")

    console.log(`[TeacherHome] - Clases programadas (principal): ${programadas.length}`)
    console.log(`[TeacherHome] - Clases compartidas (colaborador): ${compartidas.length}`)
    console.log(`[TeacherHome] - Clases solo registradas: ${registradas.length}`)

    if (compartidas.length > 0) {
      console.log(`[TeacherHome] 📩 Clases compartidas encontradas:`)
      compartidas.forEach((c) => {
        console.log(`[TeacherHome]   - ${c.name} (principal: ${c.teacherId})`)
      })
    }

    classesForDate.value.forEach((c) => {
      console.log(
        `[TeacherHome] 📋 ${c.name}: type=${c.classType}, scheduled=${c.isScheduledClass}, hasAttendance=${c.hasAttendance}`
      )
    })
  } catch (error) {
    console.error("[TeacherHome] Error al obtener las clases:", error)
    classesForDate.value = []
  }
}

function handleClassSelect(classId: string) {
  setClass(classId)
  loadCurrent() // Cargar alumnos y registros de asistencia
  view.value = "attendance-form" // Cambiar la vista SOLO después de cargar los datos
  showClassesModal.value = false // Cerrar el modal si está abierto
}

function handleSaved() {
  toast.success("Asistencia guardada")
  updateClassesWithRecords()
}

// Handle emergency class creation
function handleCreateEmergencyClass(date: string) {
  console.log(`[TeacherHome] Crear clase emergente para la fecha: ${date}`)

  // Cerrar el modal de clases y abrir el modal de clase emergente
  showClassesModal.value = false

  // TODO FASE 3: Implementar showEmergencyClassModal para TeacherHome
  // Por ahora, mostrar toast indicando que la funcionalidad está en desarrollo
  toast.info("Funcionalidad de clases emergentes disponible desde AttendanceView")
}

onMounted(async () => {
  await init()
  await updateClassesWithRecords()
})

// Cuando cambie la fecha, recargamos las clases con registros
watch(selectedDate, updateClassesWithRecords)

// Computed para obtener el mes mostrado en el calendario
const _displayedMonth = ref(new Date()) // Prefixed with _ to avoid lint error

// Computed para calcular el estado de cada fecha usando el getter del store
const getDateStatuses = computed(() => attendanceStore.dateAttendanceStatuses)

// Transform dateStatuses to the format expected by Calendar.vue's markedDates prop
const calendarMarkedDates = computed(() => {
  const statuses = getDateStatuses.value
  if (!statuses) return []
  return Object.entries(statuses).map(([date, statusInfo]) => {
    let color = "#cccccc" // Default for 'none'
    const style: "dot" | "circle" | "highlight" = "dot"
    let tooltip = `Fecha: ${date}`

    // Example: Customize based on statusInfo.type or statusInfo.count
    // This logic needs to be adapted based on the actual structure of statusInfo
    // and how you want to represent different states (e.g., 'attendance', 'partial', 'none')
    if (statusInfo.type === "attendance") {
      if (statusInfo.count > 0) {
        color = "#4ade80" // green for registered
        tooltip = `Asistencia registrada (${statusInfo.count} clases)`
      } else {
        color = "#facc15" // yellow for partial/pending (example)
        tooltip = `Asistencia parcial/pendiente`
      }
    } else if (statusInfo.type === "none") {
      // Keep default or set specific style for 'none'
      color = "#9ca3af" // gray for no records
      tooltip = `Sin registros de asistencia`
    }
    // Add more conditions for other statuses if necessary

    return {
      date,
      style,
      color,
      tooltip,
    }
  })
})

// Computed para mostrar el nombre de la clase seleccionada en el header
const selectedClassName = computed(() => {
  if (!selectedClass.value) return ""
  const found = classesStore.classes.find((c) => c.id === selectedClass.value)
  return found ? found.name : selectedClass.value
})

// Función para volver al calendario desde el header
function handleChangeView(newView: "calendar" | "class-select" | "attendance-form") {
  view.value = newView
}
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Header -->
    <AttendanceHeader
      :selected-date="selectedDate"
      :selected-class="selectedClassName"
      role="maestro"
      l
      log
      e
      :pending-changes-count="Number(pendingChangesCount?.value) || 0"
      @change-view="handleChangeView"
      @analytics="modal.open('analytics')"
      @report="modal.open('report')"
    />

    <!-- Modal que muestra las clases disponibles para la fecha seleccionada -->
    <ClassesModal
      :is-open="showClassesModal"
      :date="modalDate"
      :classes="classesForDate"
      @close="showClassesModal = false"
      @select-class="handleClassSelect"
      @create-emergency-class="handleCreateEmergencyClass"
    />

    <Transition name="fade" mode="out-in">
      <!-- Calendario con puntos de colores -->
      <Calendar
        v-if="view === 'calendar'"
        :model-value="selectedDate"
        :marked-dates="calendarMarkedDates"
        @update:model-value="handleDateChange"
        @day-click="handleDateChange"
        @select="handleDateChange"
        @date-change="handleDateChange"
      />

      <DateClassSelector
        v-else-if="view === 'class-select'"
        v-model="selectedClass"
        :selected-date="selectedDate"
        :classes-with-records="classesWithRecordsFormatted"
        :is-loading="loading"
        @update:model-value="handleClassSelect"
        @continue="view = 'attendance-form'"
        @date-change="handleDateChange"
      />

      <AttendanceList
        v-else-if="view === 'attendance-form'"
        :date="selectedDate"
        :class-id="selectedClass"
        :students="students"
        :attendance-records="attendanceRecords"
        @saved="handleSaved"
        @error="toast.error($event)"
      />
    </Transition>
  </div>
</template>
<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
