/**
 * Composable para gestionar fechas y clases en el sistema de asistencia
 * Extrae la lógica de selección de fechas y clases del AttendanceView.vue
 */
import {computed} from "vue"
import {parseISO, format} from "date-fns"
import {es} from "date-fns/locale"
import {useRouter} from "vue-router"
import {useAuthStore} from "@/stores/auth"
import {useAttendanceStore} from "@/modulos/Attendance/store/attendance"
import {useClassesStore} from "@/modulos/Classes/store/classes"
import {TeacherRole} from "@/modulos/Classes/types/class"
import type {useAttendanceState} from "./useAttendanceState"

export function useAttendanceDateClass(state: ReturnType<typeof useAttendanceState>) {
  const router = useRouter()
  const authStore = useAuthStore()
  const attendanceStore = useAttendanceStore()
  const classesStore = useClassesStore()

  // ============= COMPUTED PROPERTIES =============
  const markedDates = computed(() => {
    const teacherId = authStore.user?.uid
    if (!teacherId) return []

    // 🎯 Filtrar solo las fechas donde ESTE maestro específico ha registrado asistencia
    const teacherDates = attendanceStore.attendanceDocuments
      .filter((doc) => doc.teacherId === teacherId && doc.fecha)
      .map((doc) => doc.fecha)

    // 📅 Eliminar duplicados y formatear para el calendario
    const uniqueDates = [...new Set(teacherDates)]

    console.log("📅 [DateClass] Fechas marcadas para maestro", teacherId, ":", uniqueDates)

    return uniqueDates.map((date) => ({
      date,
      style: "dot" as const,
      color: "#3b82f6",
      tooltip: "Asistencia registrada",
    }))
  })

  const selectedClassName = computed(() => {
    if (state.isLoadingEmergencyClass.value) return "Cargando..."

    // If it's an emergency class and we have the data
    if (state.emergencyClassInfo.value) {
      return state.emergencyClassInfo.value.nombreMateria || "Clase de Emergencia"
    }

    if (!state.selectedClass.value) return ""

    // Look for regular classes
    const regularClass = classesStore.classes.find(
      (c) => c.id === state.selectedClass.value || c.name === state.selectedClass.value
    )
    if (regularClass) {
      return regularClass.name
    }

    // If not found in regular classes, it might be an emergency class ID
    return `Clase ID: ${state.selectedClass.value}`
  })

  const classesWithRecordsForSelectedDate = computed(() => {
    const classIds = attendanceStore.getRegisteredClassesForDate(state.selectedDate.value)
    return classIds.map((classId) => ({
      classId,
      date: state.selectedDate.value,
    }))
  })

  const simpleMarkedDates = computed(() => {
    return attendanceStore.datesWithRecords
  })

  const availableClassDates = computed(() => {
    if (!state.selectedClass.value) return []

    const currentTeacherId = authStore.user?.uid
    const classInfo = classesStore.getClassById(state.selectedClass.value)

    let scheduledDays: (string | number)[] = []
    if (classInfo?.schedule?.slots) {
      const days = classInfo.schedule.slots.map((slot) => slot.day)
      scheduledDays = [...new Set(days)]
    }

    if (!currentTeacherId || scheduledDays.length === 0) return []

    return scheduledDays.filter((day) => {
      const classesForDay = classesStore.getClassesByDayAndTeacherId(day, currentTeacherId)
      return classesForDay && classesForDay.length > 0
    })
  })

  // ============= DATE SELECTION =============
  const selectDate = async (date: string | {date: string} | {date: string; [key: string]: any}) => {
    console.log("Selecting date:", date)
    try {
      if (state.isUpdating.value) return
      state.isUpdating.value = true

      let dateStr: string

      if (typeof date === "string") {
        dateStr = date
      } else if (date && typeof date === "object" && "date" in date) {
        dateStr = date.date
      } else {
        console.error("Invalid date format:", date)
        state.showToast("Formato de fecha inválido", "error")
        return
      }

      state.selectedDate.value = dateStr
      state.modalDate.value = dateStr

      console.log(`[DateClass] Fecha seleccionada: ${dateStr}`)

      // Update selected date info
      await updateSelectedDateInfo(dateStr)

      // Fetch classes for the selected date
      await fetchClassesForDate(dateStr)

      console.log(
        `[DateClass] Clases encontradas para ${dateStr}:`,
        state.classesForDate.value.length
      )

      // Show modal with available classes
      state.showClassesModal.value = true
    } catch (err) {
      console.error("Error selecting date:", err)
      state.showToast("Error al seleccionar fecha", "error")
    } finally {
      state.isUpdating.value = false
    }
  }

  // ============= CLASS FETCHING =============
  const fetchClassesForDate = async (dateStr: string) => {
    try {
      const date = parseISO(dateStr)
      const dayOfWeek = format(date, "EEEE", {locale: es})

      const teacherId = authStore.user?.uid
      if (!teacherId) {
        console.error("No teacher ID available")
        return
      }

      console.log(`[DateClass] Buscando clases para ${dayOfWeek} (${dateStr})`)
      console.log(`[DateClass] Total de clases en el store:`, classesStore.classes.length)

      // 1. Get scheduled classes where teacher is primary
      const scheduledClasses = classesStore.getClassesByDayAndTeacherId(dayOfWeek, teacherId) || []
      console.log(`[DateClass] Clases programadas (encargado):`, scheduledClasses.length)

      // 2. Get shared classes where teacher is assistant
      const sharedClasses = classesStore.classes.filter((cls) => {
        const hasSlotForDay = cls.schedule?.slots?.some((slot) => {
          // Validar que slot.day sea un número válido
          if (typeof slot.day !== "number" || slot.day < 0 || slot.day > 6) {
            console.warn(`[DateClass] Invalid slot.day value:`, slot.day)
            return false
          }
          try {
            // Mapeo directo de números a nombres de días
            const dayNames = [
              "domingo",
              "lunes",
              "martes",
              "miércoles",
              "jueves",
              "viernes",
              "sábado",
            ]
            const slotDayName = dayNames[slot.day]
            return slotDayName === dayOfWeek.toLowerCase()
          } catch (error) {
            console.error(`[DateClass] Error mapping slot.day:`, slot.day, error)
            return false
          }
        })

        const isAssistantTeacher = cls.teachers?.some(
          (teacher) => teacher.teacherId === teacherId && teacher.role === TeacherRole.ASSISTANT
        )

        return hasSlotForDay && isAssistantTeacher
      })
      console.log(`[DateClass] Clases compartidas (asistente):`, sharedClasses.length)

      // 3. Get classes with attendance records for this specific date
      const attendanceRecords = attendanceStore.attendanceDocuments.filter(
        (record) => record.fecha === dateStr && record.teacherId === teacherId
      )
      console.log(`[DateClass] Registros de asistencia existentes:`, attendanceRecords.length)

      // 4. Get emergency classes for this date
      const emergencyClasses = await attendanceStore.getEmergencyClassesForDate(dateStr, teacherId)
      console.log(`[DateClass] Clases emergentes:`, emergencyClasses.length)

      // 5. Create a map to avoid duplicates and combine information
      const classMap = new Map()

      // Process scheduled classes (primary teacher)
      for (const cls of scheduledClasses) {
        const hasAttendance = attendanceStore.isClassRegistered(dateStr, cls.id)
        classMap.set(cls.id, {
          id: cls.id,
          name: cls.name,
          type: "scheduled",
          status: hasAttendance ? "Registrada" : "Pendiente",
          isSharedClass: false,
          teacherPermissions: null,
          schedule: cls.schedule,
          students: cls.students || [],
        })
      }

      // Process shared classes (assistant teacher)
      for (const cls of sharedClasses) {
        const hasAttendance = attendanceStore.isClassRegistered(dateStr, cls.id)
        const myTeacherData = cls.teachers?.find((t) => t.teacherId === teacherId)
        const canTakeAttendance = myTeacherData?.permissions?.canTakeAttendance || false

        classMap.set(cls.id, {
          id: cls.id,
          name: cls.name,
          type: "shared",
          status: hasAttendance ? "Registrada" : "Compartida",
          isSharedClass: true,
          teacherPermissions: myTeacherData?.permissions || null,
          canTakeAttendance,
          schedule: cls.schedule,
          students: cls.students || [],
        })
      }

      // Process classes with attendance records (may be extra or makeup classes)
      for (const record of attendanceRecords) {
        const existingClass = classMap.get(record.classId)
        if (existingClass) {
          existingClass.attendanceRecord = record
        } else {
          // This is a class with attendance but not in regular schedule
          classMap.set(record.classId, {
            id: record.classId,
            name: record.className || `Clase ID: ${record.classId}`,
            type: "recorded",
            status: "Extra/Recuperación",
            isSharedClass: false,
            teacherPermissions: null,
            attendanceRecord: record,
            schedule: null,
            students: [],
          })
        }
      }

      // Process emergency classes
      for (const emergencyClass of emergencyClasses) {
        if (!classMap.has(emergencyClass.id)) {
          classMap.set(emergencyClass.id, {
            id: emergencyClass.id,
            name: emergencyClass.nombreMateria || "Clase de Emergencia",
            type: "emergency",
            status: "Emergente",
            isSharedClass: false,
            teacherPermissions: null,
            emergencyData: emergencyClass,
            schedule: null,
            students: emergencyClass.selectedStudents || [],
          })
        }
      }

      // Convert map to array and add additional information
      const allClasses = Array.from(classMap.values())

      const classesWithStatus = await Promise.all(
        allClasses.map(async (cls) => {
          const formatSchedule = (start: string, end: string): string => {
            return `${start} - ${end}`
          }

          return {
            ...cls,
            schedule: cls.schedule?.slots?.[0]
              ? formatSchedule(cls.schedule.slots[0].startTime, cls.schedule.slots[0].endTime)
              : "Sin horario definido",
          }
        })
      )

      // Sort classes: scheduled first, then shared, then emergency, then recorded
      classesWithStatus.sort((a, b) => {
        const typeOrder = {scheduled: 1, shared: 2, emergency: 3, recorded: 4}
        const orderA = typeOrder[a.type as keyof typeof typeOrder] || 5
        const orderB = typeOrder[b.type as keyof typeof typeOrder] || 5

        if (orderA !== orderB) return orderA - orderB

        // Within same type, sort by name
        return (a.name || "").localeCompare(b.name || "")
      })

      console.log(`[DateClass] Total de clases encontradas: ${classesWithStatus.length}`)
      console.log(
        `[DateClass] - Programadas: ${classesWithStatus.filter((c) => c.type === "scheduled").length}`
      )
      console.log(
        `[DateClass] - Compartidas: ${classesWithStatus.filter((c) => c.type === "shared").length}`
      )
      console.log(
        `[DateClass] - Emergentes: ${classesWithStatus.filter((c) => c.type === "emergency").length}`
      )
      console.log(
        `[DateClass] - Con asistencia extra: ${classesWithStatus.filter((c) => c.type === "recorded").length}`
      )

      state.classesForDate.value = classesWithStatus
    } catch (error) {
      console.error("[DateClass] Error al obtener las clases:", error)
      state.classesForDate.value = []
    }
  }

  // ============= CLASS SELECTION =============
  const handleClassSelect = (classId: string) => {
    state.showClassesModal.value = false
    attendanceStore.selectedClass = classId

    // Navigate to correct route based on user role
    const userRole = authStore.user?.role?.toLowerCase() || ""
    console.log(`[DateClass] handleClassSelect: Rol del usuario: '${userRole}'`)

    // Format date consistently for all users (YYYYMMDD format)
    const dateFormatted = state.selectedDate.value.replace(/-/g, "")
    let routePath = ""

    if (userRole === "maestro" || userRole === "teacher") {
      routePath = `/teacher/attendance/${dateFormatted}/${classId}`
      console.log(`[DateClass] Rol maestro detectado, navegando a: ${routePath}`)
    } else {
      // For admin/director use the same YYYYMMDD format
      routePath = `/attendance/${dateFormatted}/${classId}`
      console.log(`[DateClass] Rol admin/director, navegando a: ${routePath}`)
    }

    console.log(
      `[DateClass] Navegando a la clase ${classId} en la fecha ${state.selectedDate.value} (formateada: ${dateFormatted})`
    )
    router.push(routePath)

    // Update view state
    state.selectedClass.value = classId
    state.updateView("attendance-form")
  }

  // ============= DATE INFO MANAGEMENT =============
  const updateSelectedDateInfo = async (date: string) => {
    try {
      const teacherId = authStore.user?.uid || ""
      if (!teacherId) {
        console.warn("No teacher ID available")
        return
      }

      const dateInfo = attendanceStore.getDateClassInfo(date, teacherId)

      state.selectedDateInfo.value = {
        hasRegistrations: dateInfo.hasRegistrations,
        registeredClasses: dateInfo.registeredClasses.map((rc) => rc.classId),
        unregisteredClasses: dateInfo.unregisteredClasses.map((uc) => uc.classId),
      }
    } catch (err) {
      console.error("Error updating date info:", err)
    }
  }

  // ============= UTILITY FUNCTIONS =============
  const isDateInClassSchedule = (date: string, classId: string): boolean => {
    try {
      const scheduledDays = attendanceStore.getClassScheduleDays(classId)
      if (!scheduledDays?.length) return false

      const dayName = format(parseISO(date), "EEEE", {locale: es}).toLowerCase()
      return scheduledDays.includes(dayName)
    } catch (err) {
      console.error("Error checking class schedule:", err)
      return false
    }
  }

  // ============= EMERGENCY CLASS HANDLERS =============
  const handleCreateEmergencyClass = (date: string) => {
    console.log(`[DateClass] Crear clase emergente para la fecha: ${date}`)

    state.showClassesModal.value = false
    state.modalDate.value = date
    state.selectedDate.value = date
    state.showEmergencyClassModal.value = true
  }

  return {
    // Computed properties
    markedDates,
    selectedClassName,
    classesWithRecordsForSelectedDate,
    simpleMarkedDates,
    availableClassDates,

    // Date selection
    selectDate,
    updateSelectedDateInfo,

    // Class management
    fetchClassesForDate,
    handleClassSelect,
    handleCreateEmergencyClass,

    // Utilities
    isDateInClassSchedule,
  }
}
