import {ref, computed, onMounted, watch, nextTick} from "vue"
import {debounce} from "lodash-es"
import {
  DocumentTextIcon,
  XMarkIcon,
  CogIcon,
  FunnelIcon,
  ClipboardDocumentListIcon,
  DocumentIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  UsersIcon,
  TableCellsIcon,
} from "@heroicons/vue/24/outline"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import {useAdminStudentsStore} from "../store/adminStudents"
import {useClassesStore} from "../../Classes/store/classes"
import {useAdminTeachersStore} from "../store/teachers"
import {useInstitutionalConfigStore} from "../store/institutionalConfig"
import type {Student} from "../../Students/types/student"

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export function usePDFGenerator() {
  // Stores
  const studentsStore = useAdminStudentsStore()
  const classesStore = useClassesStore()
  const teachersStore = useAdminTeachersStore()
  const institutionalConfigStore = useInstitutionalConfigStore()

  // State
  const selectedReportType = ref("")
  const selectedClass = ref("")
  const selectedTeacher = ref("")
  const selectedDay = ref("")
  const selectedStatus = ref("")
  const ageRange = ref<{min: number | null; max: number | null}>({min: null, max: null})
  const selectedFields = ref<string[]>([
    "contador",
    "nombre",
    "apellido",
    "edad",
    "telefono",
    "clase",
  ])
  const isGenerating = ref(false)
  const isLoading = ref(false)
  const showSuccessToast = ref(false)
  const showErrorToast = ref(false)
  const errorMessage = ref("")

  const pdfOptions = ref({
    orientation: "portrait" as "portrait" | "landscape",
    pageSize: "letter" as "letter" | "a4" | "legal" | "tabloid",
    includeHeader: true,
    includeDate: true,
    includePhotos: false,
    groupByClass: false,
    includeStatistics: false,
    includeLogo: true,
    sortBy: "name" as "name" | "age" | "class" | "instrument" | "enrollment",
  })

  // Computed values from institutional config
  const institutionalTitle = computed(() => institutionalConfigStore.institutionalTitle)
  const institutionalLogoUrl = computed(() => institutionalConfigStore.institutionalLogoUrl)
  const hasInstitutionalLogo = computed(() => institutionalConfigStore.hasLogo)

  // Computed Properties
  const availableClasses = computed(() => classesStore.classes || [])
  const availableTeachers = computed(() => teachersStore.teachers || [])

  const showClassFilter = computed(() =>
    ["by_class", "all_students", "schedule_by_class"].includes(selectedReportType.value)
  )

  const showTeacherFilter = computed(() =>
    ["by_teacher", "all_students", "schedule_by_teacher"].includes(selectedReportType.value)
  )

  const showDayFilter = computed(() =>
    ["by_day", "schedule_matrix", "schedule_by_day"].includes(selectedReportType.value)
  )

  // Helper function to get icon colors
  const getIconColor = (color: string) => {
    const colorMap = {
      blue: "bg-gradient-to-r from-blue-500 to-blue-600",
      green: "bg-gradient-to-r from-green-500 to-green-600",
      purple: "bg-gradient-to-r from-purple-500 to-purple-600",
      orange: "bg-gradient-to-r from-orange-500 to-orange-600",
      red: "bg-gradient-to-r from-red-500 to-red-600",
      indigo: "bg-gradient-to-r from-indigo-500 to-indigo-600",
      pink: "bg-gradient-to-r from-pink-500 to-pink-600",
      emerald: "bg-gradient-to-r from-emerald-500 to-emerald-600",
      amber: "bg-gradient-to-r from-amber-500 to-amber-600",
    }
    return colorMap[color as keyof typeof colorMap] || "bg-gradient-to-r from-gray-500 to-gray-600"
  }

  // Show toast messages
  const showToast = (type: "success" | "error", message = "") => {
    if (type === "success") {
      showSuccessToast.value = true
      setTimeout(() => (showSuccessToast.value = false), 3000)
    } else {
      errorMessage.value = message
      showErrorToast.value = true
      setTimeout(() => (showErrorToast.value = false), 5000)
    }
  }

  // Helper functions
  const calculateAge = (birthDate: any): number => {
    if (!birthDate) return 0
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const getClassName = (classId?: string): string => {
    if (!classId) return "Sin clase"
    const cls = availableClasses.value.find((c) => c.id === classId)
    return cls ? cls.name : "Sin clase"
  }

  const getTeacherName = (classId?: string): string => {
    if (!classId) return "Sin maestro"
    const cls = availableClasses.value.find((c) => c.id === classId)
    if (!cls) return "Sin maestro"
    const teacher = availableTeachers.value.find((t) => t.id === cls.teacherId)
    return teacher ? teacher.name : "Sin maestro"
  }

  const getClassInstrument = (classId?: string): string => {
    if (!classId) return "Sin instrumento"
    const cls = availableClasses.value.find((c) => c.id === classId)
    return cls?.instrument ?? "Sin instrumento"
  }

  const getClassSchedule = (classId?: string): string => {
    if (!classId) return "Sin horario"
    const cls = availableClasses.value.find((c) => c.id === classId)
    if (!cls || !cls.schedule) return "Sin horario"

    // Handle different schedule formats
    if (cls.schedule.slots && Array.isArray(cls.schedule.slots)) {
      // Format: { slots: [{day, startTime, endTime}] }
      return cls.schedule.slots
        .map(
          (slot: any) => `${getDayName(slot.day)}: ${slot.startTime || ""} - ${slot.endTime || ""}`
        )
        .join(", ")
    } else if ((cls.schedule as any).day || (cls.schedule as any).startTime) {
      // Format: {day, startTime, endTime}
      const schedule = cls.schedule as any
      return `${getDayName(schedule.day)}: ${schedule.startTime || ""} - ${schedule.endTime || ""}`
    } else if (Array.isArray(cls.schedule)) {
      // Format: [{day, startTime, endTime}]
      return cls.schedule
        .map(
          (scheduleItem: any) =>
            `${getDayName(scheduleItem.day)}: ${scheduleItem.startTime || ""} - ${scheduleItem.endTime || ""}`
        )
        .join(", ")
    }

    return "Sin horario"
  }

  const formatDate = (date: any): string => {
    if (!date) return "-"
    try {
      return new Date(date).toLocaleDateString("es-ES")
    } catch {
      return "-"
    }
  }

  const groupBy = (array: any[], key: string) => {
    return array.reduce((groups, item) => {
      const group = item[key] || "Sin especificar"
      groups[group] = groups[group] || []
      groups[group].push(item)
      return groups
    }, {})
  }

  const generateFileName = (): string => {
    const reportType = getReportTypes().find((r) => r.id === selectedReportType.value)
    const date = new Date().toISOString().split("T")[0]

    let baseFileName = "reporte"

    if (selectedReportType.value.startsWith("schedule_")) {
      baseFileName = "horarios"
    } else {
      baseFileName = "listado_estudiantes"
    }

    const sanitizedTitle =
      reportType?.title
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "") || "reporte"

    return `${baseFileName}_${sanitizedTitle}_${date}.pdf`
  }

  const sortStudents = (students: any[], sortBy: string) => {
    return students.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.nombre || "").localeCompare(b.nombre || "")
        case "age":
          return (a.edad || 0) - (b.edad || 0)
        case "class":
          return (a.clase || "").localeCompare(b.clase || "")
        case "instrument":
          return (a.instrumento || "").localeCompare(b.instrumento || "")
        case "enrollment":
          return (
            new Date(a.fecInscripcion || 0).getTime() - new Date(b.fecInscripcion || 0).getTime()
          )
        default:
          return 0
      }
    })
  }

  // Schedule-specific helper functions
  const getDayName = (day: string | number): string => {
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    const dayNamesShort = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

    if (typeof day === "number") {
      return dayNames[day] || "Día inválido"
    }

    const dayLower = day.toLowerCase()
    const dayIndex =
      dayNamesShort.findIndex((d) => d.toLowerCase() === dayLower) ||
      dayNames.findIndex((d) => d.toLowerCase() === dayLower)

    return dayIndex !== -1 ? dayNames[dayIndex] : day
  }

  const getDayIndex = (day: string | number): number => {
    const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
    const dayNamesShort = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]

    if (typeof day === "number") {
      return day >= 0 && day <= 6 ? day : 0
    }

    const dayLower = day.toLowerCase().trim()
    let dayIndex = dayNames.findIndex((d) => d === dayLower)

    if (dayIndex === -1) {
      dayIndex = dayNamesShort.findIndex((d) => d === dayLower)
    }

    if (dayIndex === -1) {
      const englishDays = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ]
      dayIndex = englishDays.findIndex((d) => d === dayLower)
    }

    return dayIndex !== -1 ? dayIndex : 1
  }

  const formatTimeRange = (startTime: string, endTime: string): string => {
    return `${startTime} - ${endTime}`
  }

  const calculateClassDuration = (startTime: string, endTime: string): number => {
    const start = new Date(`1970-01-01 ${startTime}`)
    const end = new Date(`1970-01-01 ${endTime}`)
    return (end.getTime() - start.getTime()) / (1000 * 60)
  }

  const removeAccents = (text: string): string => {
    if (!text) return ""

    const normalized = text.normalize("NFD")

    const specialChars: {[key: string]: string} = {
      á: "a",
      à: "a",
      ä: "a",
      â: "a",
      ā: "a",
      ã: "a",
      å: "a",
      é: "e",
      è: "e",
      ë: "e",
      ê: "e",
      ē: "e",
      ę: "e",
      ė: "e",
      í: "i",
      ì: "i",
      ï: "i",
      î: "i",
      ī: "i",
      į: "i",
      ı: "i",
      ó: "o",
      ò: "o",
      ö: "o",
      ô: "o",
      ō: "o",
      õ: "o",
      ø: "o",
      ú: "u",
      ù: "u",
      ü: "u",
      û: "u",
      ū: "u",
      ų: "u",
      ů: "u",
      ñ: "n",
      ń: "n",
      ç: "c",
      ć: "c",
      č: "c",
      ß: "ss",
      æ: "ae",
      œ: "oe",
      Á: "A",
      À: "A",
      Ä: "A",
      Â: "A",
      Ā: "A",
      Ã: "A",
      Å: "A",
      É: "E",
      È: "E",
      Ë: "E",
      Ê: "E",
      Ē: "E",
      Ę: "E",
      Ė: "E",
      Í: "I",
      Ì: "I",
      Ï: "I",
      Î: "I",
      Ī: "I",
      Į: "I",
      İ: "I",
      Ó: "O",
      Ò: "O",
      Ö: "O",
      Ô: "O",
      Ō: "O",
      Õ: "O",
      Ø: "O",
      Ú: "U",
      Ù: "U",
      Ü: "U",
      Û: "U",
      Ū: "U",
      Ų: "U",
      Ů: "U",
      Ñ: "N",
      Ń: "N",
      Ç: "C",
      Ć: "C",
      Č: "C",
      Æ: "AE",
      Œ: "OE",
    }

    let result = normalized
    for (const [accented, plain] of Object.entries(specialChars)) {
      result = result.replace(new RegExp(accented, "g"), plain)
    }

    result = result.replace(/[\u0300-\u036f]/g, "")

    return result
  }
  const sanitizeTextForPDF = (text: string): string => {
    if (!text) return ""

    let cleanText = removeAccents(text)

    cleanText = cleanText
      .replace(/[{}()<>]/g, "")
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
      .replace(/[^\x20-\x7E\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()

    if (!cleanText || cleanText.length < 1) {
      return "Sin nombre"
    }

    return cleanText
  }
  const getScheduleData = async () => {
    await Promise.all([
      classesStore.fetchClasses(),
      teachersStore.loadTeachers(),
      studentsStore.loadStudents(),
    ])

    const scheduleData: any[] = []

    console.log("🔍 Total clases encontradas:", classesStore.classes.length)

    for (const classItem of classesStore.classes) {
      console.log("📅 Procesando clase:", classItem.name, "Schedule:", classItem.schedule)

      // Verificar diferentes formatos de schedule
      if (!classItem.schedule) continue

      const teacher = teachersStore.teachers.find((t) => t.id === classItem.teacherId)
      const studentsInClass = studentsStore.students.filter((s) =>
        classItem.studentIds?.includes(s.id)
      )

      // Manejar el formato slots
      if (classItem.schedule.slots && Array.isArray(classItem.schedule.slots)) {
        for (const slot of classItem.schedule.slots) {
          console.log("📌 Slot encontrado:", slot)
          scheduleData.push({
            ...slot, // should contain day, startTime, endTime
            className: classItem.name,
            teacherName: teacher?.name || "Sin maestro",
            aula: (classItem as any).classroom || (classItem as any).aula || "N/A",
            studentCount: studentsInClass.length,
            classId: classItem.id,
            teacherId: classItem.teacherId,
            students: studentsInClass,
          })
        }
      }
      // Manejar el formato legacy (string o directo)
      else if ((classItem.schedule as any).day || (classItem.schedule as any).startTime) {
        console.log("📌 Schedule directo encontrado:", classItem.schedule)
        scheduleData.push({
          day: (classItem.schedule as any).day,
          startTime: (classItem.schedule as any).startTime,
          endTime: (classItem.schedule as any).endTime,
          className: classItem.name,
          teacherName: teacher?.name || "Sin maestro",
          aula: (classItem as any).classroom || (classItem as any).aula || "N/A",
          studentCount: studentsInClass.length,
          classId: classItem.id,
          teacherId: classItem.teacherId,
          students: studentsInClass,
        })
      }
      // Manejar arrays de schedules
      else if (Array.isArray(classItem.schedule)) {
        for (const scheduleItem of classItem.schedule) {
          console.log("📌 Schedule array item encontrado:", scheduleItem)
          scheduleData.push({
            day: scheduleItem.day,
            startTime: scheduleItem.startTime,
            endTime: scheduleItem.endTime,
            className: classItem.name,
            teacherName: teacher?.name || "Sin maestro",
            aula: (classItem as any).classroom || (classItem as any).aula || "N/A",
            studentCount: studentsInClass.length,
            classId: classItem.id,
            teacherId: classItem.teacherId,
            students: studentsInClass,
          })
        }
      }
    }

    console.log("📊 Schedule data total:", scheduleData.length, scheduleData)

    // Si no hay datos reales, devolver un array vacío
    if (scheduleData.length === 0) {
      console.log("⚠️ No se encontraron datos reales de horario.")
      return []
    }

    return scheduleData
  }

  const getClassesStatistics = () => {
    const classesMap = new Map<string, number>()

    // Esta función puede ser útil para estadísticas futuras
    // pero ya no depende de previewData

    return {
      totalClasses: classesMap.size,
      mostPopular: null,
      classDistribution: [],
    }
  }

  const getFilterSummary = (): string => {
    const filters = []

    if (selectedClass.value) {
      filters.push(`Clase: ${selectedClass.value}`)
    }

    if (selectedTeacher.value) {
      filters.push(`Maestro: ${selectedTeacher.value}`)
    }

    if (selectedStatus.value) {
      filters.push(`Estado: ${selectedStatus.value}`)
    }

    if (ageRange.value.min !== null || ageRange.value.max !== null) {
      const min = ageRange.value.min || 0
      const max = ageRange.value.max || 100
      filters.push(`Edad: ${min}-${max} años`)
    }

    return filters.length > 0 ? `Filtros aplicados: ${filters.join(", ")}` : ""
  }

  // Convert image to base64 for PDF
  const loadImageAsBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject("Could not get canvas context")
          return
        }

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        resolve(canvas.toDataURL("image/jpeg", 0.8))
      }
      img.onerror = () => reject("Failed to load image")
      img.crossOrigin = "anonymous"
      img.src = url
    })
  }

  // PDF Generation methods
  const addHeader = async (doc: jsPDF, yPosition: number, reportTitle: string): Promise<number> => {
    const pageWidth = doc.internal.pageSize.width

    // Main title - use institutional title
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(33, 37, 41) // Dark color
    const mainTitle = `Horario de "${institutionalTitle.value || "ACADEMIA DE MÚSICA"}"`
    doc.text(mainTitle, pageWidth / 2, yPosition, {align: "center"})

    yPosition += 8

    // Report title
    doc.setFontSize(16)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(108, 117, 125) // Gray color
    doc.text(reportTitle, pageWidth / 2, yPosition, {align: "center"})

    yPosition += 10

    // Date and additional info if enabled
    if (pdfOptions.value.includeDate) {
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(108, 117, 125)

      const currentDate = new Date()
      const formattedDate = currentDate.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      const formattedTime = currentDate.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })

      doc.text(`Generado el: ${formattedDate} a las ${formattedTime}`, pageWidth / 2, yPosition, {
        align: "center",
      })
      yPosition += 6
    }

    // Decorative line separator
    doc.setLineWidth(0.5)
    doc.setDrawColor(41, 128, 185) // Blue color
    doc.line(20, yPosition, pageWidth - 20, yPosition)

    // Reset text color
    doc.setTextColor(0, 0, 0)
    return yPosition + 10
  }

  const generateScheduleByTeacherPDF = async (doc: jsPDF) => {
    const scheduleData = await getScheduleData()
    console.log("🎯 Schedule data para PDF:", scheduleData)

    if (scheduleData.length === 0) {
      // Si no hay datos, crear una página informativa
      let yPos = 20
      yPos = await addHeader(doc, yPos, "Horario para Maestros")

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("No se encontraron horarios programados", doc.internal.pageSize.width / 2, yPos, {
        align: "center",
      })
      yPos += 10

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(
        "Verifique que las clases tengan maestros asignados y horarios configurados.",
        doc.internal.pageSize.width / 2,
        yPos,
        {align: "center"}
      )

      return
    }

    const teachersWithSchedules = groupBy(scheduleData, "teacherName")
    const teacherNames = Object.keys(teachersWithSchedules).filter(
      (name) => name !== "Sin maestro" && name !== "Sin especificar"
    )

    console.log("👨‍🏫 Maestros con horarios:", teacherNames)

    if (teacherNames.length === 0) {
      // Si no hay maestros con horarios válidos
      let yPos = 20
      yPos = await addHeader(doc, yPos, "Horario para Maestros")

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text(
        "No se encontraron maestros con horarios asignados",
        doc.internal.pageSize.width / 2,
        yPos,
        {align: "center"}
      )
      yPos += 10

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(
        "Asigne maestros a las clases y configure sus horarios.",
        doc.internal.pageSize.width / 2,
        yPos,
        {align: "center"}
      )

      return
    }

    for (let i = 0; i < teacherNames.length; i++) {
      const teacherName = teacherNames[i]
      if (i > 0) doc.addPage()

      let yPos = 20
      yPos = await addHeader(doc, yPos, "Horarios por Maestro")

      const teacherSchedule = teachersWithSchedules[teacherName]
      console.log(`📋 Horario para ${teacherName}:`, teacherSchedule)
      // --- Teacher Info Block (matches desired output) ---
      const classesTaught = [...new Set(teacherSchedule.map((s: any) => s.className))]
      const totalStudents = new Set(
        teacherSchedule.flatMap((s: any) => s.students?.map((st: any) => st.id) || [])
      ).size
      const weeklyMinutes = teacherSchedule.reduce((sum: number, s: any) => {
        if (s.startTime && s.endTime) {
          return sum + calculateClassDuration(s.startTime, s.endTime)
        }
        return sum
      }, 0)
      const weeklyHours = (weeklyMinutes / 60).toFixed(1)

      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(`Maestro: ${teacherName}`, 20, yPos)
      yPos += 7

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")

      const classesText = `Clases: ${classesTaught.join(", ")}`
      const splitClasses = doc.splitTextToSize(classesText, doc.internal.pageSize.width - 40)
      doc.text(splitClasses, 20, yPos)
      yPos += splitClasses.length * 4 + 2

      doc.text(
        `Horas por semana: ${weeklyHours} horas | Cantidad de alumnos: ${totalStudents}`,
        20,
        yPos
      )
      yPos += 10

      // --- Tables per Day (matches desired output) ---
      const scheduleByDay = groupBy(teacherSchedule, "day")
      const sortedDays = Object.keys(scheduleByDay).sort((a, b) => getDayIndex(a) - getDayIndex(b))

      console.log(`📅 Días programados para ${teacherName}:`, sortedDays)

      if (sortedDays.length === 0) {
        doc.setFontSize(10)
        doc.setFont("helvetica", "italic")
        doc.text("No hay días programados para este maestro", 20, yPos)
        continue
      }
      for (const day of sortedDays) {
        const daySchedule = scheduleByDay[day].sort((a: any, b: any) =>
          (a.startTime || "").localeCompare(b.startTime || "")
        )

        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.text(getDayName(day), 20, yPos)
        yPos += 7

        const tableBody = daySchedule.map((slot: any) => [
          slot.startTime && slot.endTime
            ? formatTimeRange(slot.startTime, slot.endTime)
            : "Sin horario",
          slot.className || "Sin nombre",
          slot.aula || "N/A",
          `${slot.studentCount || 0} Alumnos`,
        ])

        console.log(`📊 Tabla para ${day}:`, tableBody)

        autoTable(doc, {
          startY: yPos,
          head: [["Horario", "Clase", "Aula", "Alumnos"]],
          body: tableBody,
          theme: "grid",
          headStyles: {fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold"},
          styles: {cellPadding: 2, fontSize: 9},
          columnStyles: {3: {halign: "right"}},
        })

        yPos = (doc as any).lastAutoTable.finalY + 8
      }
    }
  }

  const generateScheduleByStudentPDF = async (doc: jsPDF) => {
    const scheduleData = await getScheduleData()
    console.log("🎯 Schedule data para PDF por estudiante:", scheduleData)

    if (scheduleData.length === 0) {
      let yPos = 20
      yPos = await addHeader(doc, yPos, "Horarios por Alumno")

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("No se encontraron horarios programados", doc.internal.pageSize.width / 2, yPos, {
        align: "center",
      })
      return
    }

    // Agrupar por estudiante
    const studentSchedules = new Map()

    scheduleData.forEach((slot) => {
      if (slot.students && slot.students.length > 0) {
        slot.students.forEach((student: any) => {
          if (!studentSchedules.has(student.id)) {
            studentSchedules.set(student.id, {
              studentName:
                student.name || `${student.nombre} ${student.apellido}` || "Estudiante sin nombre",
              classes: [],
            })
          }

          studentSchedules.get(student.id).classes.push({
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            className: slot.className,
            teacherName: slot.teacherName,
            aula: slot.aula,
          })
        })
      }
    })

    const studentsWithSchedules = Array.from(studentSchedules.entries()).filter(
      ([_, data]) => data.classes.length > 0
    )

    if (studentsWithSchedules.length === 0) {
      let yPos = 20
      yPos = await addHeader(doc, yPos, "Horarios por Alumno")

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text(
        "No se encontraron estudiantes con horarios asignados",
        doc.internal.pageSize.width / 2,
        yPos,
        {align: "center"}
      )
      return
    }

    for (let i = 0; i < studentsWithSchedules.length; i++) {
      const [studentId, studentData] = studentsWithSchedules[i]
      if (i > 0) doc.addPage()

      let yPos = 20
      yPos = await addHeader(doc, yPos, "Horarios por Alumno")

      // Información del estudiante
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(`Alumno: ${studentData.studentName}`, 20, yPos)
      yPos += 7

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")

      const totalClasses = studentData.classes.length
      const weeklyHours =
        studentData.classes.reduce((sum: number, cls: any) => {
          if (cls.startTime && cls.endTime) {
            return sum + calculateClassDuration(cls.startTime, cls.endTime)
          }
          return sum
        }, 0) / 60

      doc.text(
        `Total de clases: ${totalClasses} | Horas por semana: ${weeklyHours.toFixed(1)} horas`,
        20,
        yPos
      )
      yPos += 10

      // Agrupar por día
      const classesByDay = groupBy(studentData.classes, "day")
      const sortedDays = Object.keys(classesByDay).sort((a, b) => getDayIndex(a) - getDayIndex(b))

      for (const day of sortedDays) {
        const dayClasses = classesByDay[day].sort((a: any, b: any) =>
          (a.startTime || "").localeCompare(b.startTime || "")
        )

        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.text(getDayName(day), 20, yPos)
        yPos += 7

        const tableBody = dayClasses.map((cls: any) => [
          cls.startTime && cls.endTime
            ? formatTimeRange(cls.startTime, cls.endTime)
            : "Sin horario",
          cls.className || "Sin nombre",
          cls.teacherName || "Sin maestro",
          cls.aula || "N/A",
        ])

        autoTable(doc, {
          startY: yPos,
          head: [["Horario", "Clase", "Maestro", "Aula"]],
          body: tableBody,
          theme: "grid",
          headStyles: {fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold"},
          styles: {cellPadding: 2, fontSize: 9},
        })

        yPos = (doc as any).lastAutoTable.finalY + 8
      }
    }
  }

  const generateScheduleByDayPDF = async (doc: jsPDF) => {
    const scheduleData = await getScheduleData()
    console.log("🎯 Schedule data para PDF por día:", scheduleData)

    if (scheduleData.length === 0) {
      let yPos = 20
      yPos = await addHeader(doc, yPos, "Horarios por Día")

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("No se encontraron horarios programados", doc.internal.pageSize.width / 2, yPos, {
        align: "center",
      })
      return
    }

    // Agrupar por día
    const scheduleByDay = groupBy(scheduleData, "day")
    const sortedDays = Object.keys(scheduleByDay).sort((a, b) => getDayIndex(a) - getDayIndex(b))

    if (sortedDays.length === 0) {
      let yPos = 20
      yPos = await addHeader(doc, yPos, "Horarios por Día")

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text(
        "No se encontraron días con horarios asignados",
        doc.internal.pageSize.width / 2,
        yPos,
        {align: "center"}
      )
      return
    }

    for (let i = 0; i < sortedDays.length; i++) {
      const day = sortedDays[i]
      if (i > 0) doc.addPage()

      let yPos = 20
      yPos = await addHeader(doc, yPos, "Horarios por Día")

      const daySchedule = scheduleByDay[day].sort((a: any, b: any) =>
        (a.startTime || "").localeCompare(b.startTime || "")
      )

      // Información del día
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(`Día: ${getDayName(day)}`, 20, yPos)
      yPos += 7

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")

      const totalClasses = daySchedule.length
      const totalStudents = daySchedule.reduce(
        (sum: number, slot: any) => sum + (slot.studentCount || 0),
        0
      )
      const uniqueTeachers = [...new Set(daySchedule.map((slot: any) => slot.teacherName))].filter(
        (name) => name !== "Sin maestro"
      ).length

      doc.text(
        `Total de clases: ${totalClasses} | Total de alumnos: ${totalStudents} | Maestros activos: ${uniqueTeachers}`,
        20,
        yPos
      )
      yPos += 10

      // Tabla con todas las clases del día
      const tableBody = daySchedule.map((slot: any) => [
        slot.startTime && slot.endTime
          ? formatTimeRange(slot.startTime, slot.endTime)
          : "Sin horario",
        slot.className || "Sin nombre",
        slot.teacherName || "Sin maestro",
        slot.aula || "N/A",
        `${slot.studentCount || 0} Alumnos`,
      ])

      autoTable(doc, {
        startY: yPos,
        head: [["Horario", "Clase", "Maestro", "Aula", "Alumnos"]],
        body: tableBody,
        theme: "grid",
        headStyles: {fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold"},
        styles: {cellPadding: 2, fontSize: 9},
        columnStyles: {4: {halign: "right"}},
      })
    }
  }

  const generateScheduleByClassPDF = async (doc: jsPDF) => {
    const scheduleData = await getScheduleData()
    console.log("🎯 Schedule data para PDF por clase:", scheduleData)

    if (scheduleData.length === 0) {
      let yPos = 20
      yPos = await addHeader(doc, yPos, "Horarios por Clase")

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("No se encontraron horarios programados", doc.internal.pageSize.width / 2, yPos, {
        align: "center",
      })
      return
    }

    // Agrupar por clase
    const scheduleByClass = groupBy(scheduleData, "className")
    const classNames = Object.keys(scheduleByClass).filter((name) => name !== "Sin nombre")

    if (classNames.length === 0) {
      let yPos = 20
      yPos = await addHeader(doc, yPos, "Horarios por Clase")

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text(
        "No se encontraron clases con horarios asignados",
        doc.internal.pageSize.width / 2,
        yPos,
        {align: "center"}
      )
      return
    }

    for (let i = 0; i < classNames.length; i++) {
      const className = classNames[i]
      if (i > 0) doc.addPage()

      let yPos = 20
      yPos = await addHeader(doc, yPos, "Horarios por Clase")

      const classSchedule = scheduleByClass[className]

      // Información de la clase
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(`Clase: ${className}`, 20, yPos)
      yPos += 7

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")

      const uniqueTeachers = [...new Set(classSchedule.map((slot: any) => slot.teacherName))]
      const totalStudents = new Set(
        classSchedule.flatMap((slot: any) => slot.students?.map((st: any) => st.id) || [])
      ).size
      const weeklyMinutes = classSchedule.reduce((sum: number, slot: any) => {
        if (slot.startTime && slot.endTime) {
          return sum + calculateClassDuration(slot.startTime, slot.endTime)
        }
        return sum
      }, 0)
      const weeklyHours = (weeklyMinutes / 60).toFixed(1)

      const teachersText = `Maestros: ${uniqueTeachers.join(", ")}`
      const splitTeachers = doc.splitTextToSize(teachersText, doc.internal.pageSize.width - 40)
      doc.text(splitTeachers, 20, yPos)
      yPos += splitTeachers.length * 4 + 2

      doc.text(
        `Horas por semana: ${weeklyHours} horas | Total de alumnos: ${totalStudents}`,
        20,
        yPos
      )
      yPos += 10

      // Agrupar por día
      const classByDay = groupBy(classSchedule, "day")
      const sortedDays = Object.keys(classByDay).sort((a, b) => getDayIndex(a) - getDayIndex(b))

      for (const day of sortedDays) {
        const dayClasses = classByDay[day].sort((a: any, b: any) =>
          (a.startTime || "").localeCompare(b.startTime || "")
        )

        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.text(getDayName(day), 20, yPos)
        yPos += 7

        const tableBody = dayClasses.map((slot: any) => [
          slot.startTime && slot.endTime
            ? formatTimeRange(slot.startTime, slot.endTime)
            : "Sin horario",
          slot.teacherName || "Sin maestro",
          slot.aula || "N/A",
          `${slot.studentCount || 0} Alumnos`,
        ])

        autoTable(doc, {
          startY: yPos,
          head: [["Horario", "Maestro", "Aula", "Alumnos"]],
          body: tableBody,
          theme: "grid",
          headStyles: {fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold"},
          styles: {cellPadding: 2, fontSize: 9},
          columnStyles: {3: {halign: "right"}},
        })

        yPos = (doc as any).lastAutoTable.finalY + 8
      }
    }
  }
  const generateStudentListPDF = async (doc: jsPDF) => {
    const reportType = getReportTypes().find((r) => r.id === selectedReportType.value)
    const reportTitle = reportType?.title || "Listado de Estudiantes"
    let yPos = 20
    yPos = await addHeader(doc, yPos, reportTitle)

    // Cargar datos de estudiantes
    await studentsStore.loadStudents()
    let filteredStudents = [...studentsStore.students]

    // Aplicar filtros
    if (selectedClass.value) {
      filteredStudents = filteredStudents.filter((s) => s.classId === selectedClass.value)
    }

    if (selectedTeacher.value) {
      const teacherClasses = availableClasses.value.filter(
        (c) => c.teacherId === selectedTeacher.value
      )
      const classIds = teacherClasses.map((c) => c.id)
      filteredStudents = filteredStudents.filter((s) => classIds.includes(s.classId || ""))
    }

    if (selectedStatus.value) {
      filteredStudents = filteredStudents.filter((s) =>
        selectedStatus.value === "active" ? s.activo : !s.activo
      )
    }
    if (ageRange.value.min !== null || ageRange.value.max !== null) {
      filteredStudents = filteredStudents.filter((s) => {
        const age = typeof s.edad === "number" ? s.edad : parseInt(s.edad as string) || 0
        const min = ageRange.value.min || 0
        const max = ageRange.value.max || 100
        return age >= min && age <= max
      })
    } // Mapear campos de encabezado
    const fieldLabels: {[key: string]: string} = {
      contador: "N°",
      nombre: "Nombre",
      apellido: "Apellido",
      nombreCompleto: "Nombre Completo",
      edad: "Edad",
      fechaNacimiento: "Fecha de Nacimiento",
      telefono: "Teléfono",
      email: "Email",
      direccion: "Dirección",
      madre: "Madre",
      padre: "Padre",
      clase: "Clase",
      maestro: "Maestro",
      instrumento: "Instrumento",
      horario: "Horario",
      fechaInscripcion: "Fecha de Inscripción",
    }

    const head = [selectedFields.value.map((field) => fieldLabels[field] || field)]
    const body = filteredStudents.map((student, index) => {
      return selectedFields.value.map((field) => {
        switch (field) {
          case "contador":
            return (index + 1).toString()
          case "nombreCompleto":
            return `${student.nombre || ""} ${student.apellido || ""}`.trim()
          case "nombre":
            return student.nombre || ""
          case "apellido":
            return student.apellido || ""
          case "edad":
            return (
              typeof student.edad === "number"
                ? student.edad
                : parseInt(student.edad as string) || 0
            ).toString()
          case "fechaNacimiento":
            return formatDate((student as any).nac)
          case "telefono":
            return (student as any).tlf || ""
          case "email":
            return student.email || ""
          case "direccion":
            return student.direccion || ""
          case "madre":
            return student.madre || ""
          case "padre":
            return student.padre || ""
          case "clase":
            return getClassName(student.classId)
          case "maestro":
            return getTeacherName(student.classId)
          case "instrumento":
            return (
              (student as any).instrumentos ||
              student.instrumento ||
              getClassInstrument(student.classId)
            )
          case "horario":
            return getClassSchedule(student.classId)
          case "fechaInscripcion":
            return formatDate((student as any).updatedAt)
          default:
            return (student as any)[field]?.toString() || ""
        }
      })
    })

    autoTable(doc, {
      startY: yPos,
      head,
      body,
      theme: "grid",
      headStyles: {fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold"},
      styles: {cellPadding: 2, fontSize: 9},
    })
  }
  const generatePDF = async () => {
    if (!selectedReportType.value) {
      showToast("error", "Por favor selecciona un tipo de reporte.")
      return
    }

    isGenerating.value = true

    try {
      const doc = new jsPDF({
        orientation: pdfOptions.value.orientation,
        unit: "mm",
        format: pdfOptions.value.pageSize,
      })
      switch (selectedReportType.value) {
        case "schedule_by_teacher":
          await generateScheduleByTeacherPDF(doc)
          break
        case "schedule_by_student":
          await generateScheduleByStudentPDF(doc)
          break
        case "schedule_by_day":
          await generateScheduleByDayPDF(doc)
          break
        case "schedule_by_class":
          await generateScheduleByClassPDF(doc)
          break
        default:
          await generateStudentListPDF(doc)
          break
      }

      const fileName = generateFileName()
      doc.save(fileName)
      showToast("success", "PDF generado exitosamente")
    } catch (error: any) {
      console.error("Error generating PDF:", error)
      showToast("error", `Error al generar el PDF: ${error.message}`)
    } finally {
      isGenerating.value = false
    }
  }
  // Watchers
  watch(selectedReportType, () => {
    selectedClass.value = ""
    selectedTeacher.value = ""
    selectedDay.value = ""
  })

  // Lifecycle
  onMounted(async () => {
    try {
      await Promise.all([
        classesStore.fetchClasses(),
        teachersStore.loadTeachers(),
        institutionalConfigStore.loadConfig(),
      ])
    } catch (error) {
      console.error("Error loading initial data:", error)
    }
  })

  // Helper function to get report types
  const getReportTypes = () => {
    return [
      {
        id: "by_class",
        title: "Por Clase",
        description: "Estudiantes agrupados por clase",
        icon: AcademicCapIcon,
        color: "blue",
      },
      {
        id: "by_teacher",
        title: "Por Maestro",
        description: "Estudiantes agrupados por maestro",
        icon: UserGroupIcon,
        color: "green",
      },
      {
        id: "by_day",
        title: "Por Día",
        description: "Estudiantes que tienen clases en un día específico",
        icon: CalendarDaysIcon,
        color: "purple",
      },
      {
        id: "all_students",
        title: "Todos los Alumnos",
        description: "Lista completa de estudiantes inscritos",
        icon: UsersIcon,
        color: "orange",
      },
      {
        id: "schedule_matrix",
        title: "Matriz de Horarios",
        description: "Horarios de todos los estudiantes en formato matriz",
        icon: TableCellsIcon,
        color: "red",
      },
      {
        id: "schedule_by_teacher",
        title: "Horarios por Maestro",
        description: "Horario de clases organizadas por maestro",
        icon: UserGroupIcon,
        color: "indigo",
      },
      {
        id: "schedule_by_student",
        title: "Horarios por Alumno",
        description: "Horario personal de cada estudiante",
        icon: UsersIcon,
        color: "pink",
      },
      {
        id: "schedule_by_day",
        title: "Horarios por Día",
        description: "Programación diaria con todas las clases",
        icon: CalendarDaysIcon,
        color: "emerald",
      },
      {
        id: "schedule_by_class",
        title: "Horarios por Clase",
        description: "Información completa de horarios por clase",
        icon: AcademicCapIcon,
        color: "amber",
      },
    ]
  }
  return {
    // State
    selectedReportType,
    selectedClass,
    selectedTeacher,
    selectedDay,
    selectedStatus,
    ageRange,
    selectedFields,
    isGenerating,
    isLoading,
    showSuccessToast,
    showErrorToast,
    errorMessage,
    pdfOptions,

    // Computed
    availableClasses,
    availableTeachers,
    showClassFilter,
    showTeacherFilter,
    showDayFilter,
    institutionalTitle,
    institutionalLogoUrl,
    hasInstitutionalLogo,

    // Methods
    generatePDF,
    getIconColor,
    showToast,
    // Helper functions
    calculateAge,
    getClassName,
    getTeacherName,
    getClassInstrument,
    getClassSchedule,
    formatDate,
    groupBy,
    generateFileName,
    sortStudents,
    getScheduleData,
    generateSampleScheduleData,
    getClassesStatistics,
    getFilterSummary,
    loadImageAsBase64,
    getReportTypes,
  }
}
