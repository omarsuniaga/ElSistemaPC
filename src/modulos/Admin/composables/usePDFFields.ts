import {computed} from "vue"
import {useClassesStore} from "../../Classes/store/classes"
import {useAdminTeachersStore} from "../store/teachers"
import {useInstrumentsStore} from "../../../stores/instruments"

export function usePDFFields() {
  const classesStore = useClassesStore()
  const teachersStore = useAdminTeachersStore()
  const instrumentsStore = useInstrumentsStore()

  const getFilterSummary = (filters: any, reportType: string) => {
    const summary: string[] = []

    if (filters.classId) {
      const classItem = classesStore.classes.find((c) => c.id === filters.classId)
      if (classItem) {
        summary.push(`Clase: ${classItem.name}`)
      }
    }

    if (filters.teacherId) {
      const teacher = teachersStore.teachers.find((t) => t.id === filters.teacherId)
      if (teacher) {
        summary.push(`Maestro: ${teacher.name}`)
      }
    }

    if (filters.instrumentId) {
      const instrument = instrumentsStore.instruments.find((i) => i.id === filters.instrumentId)
      if (instrument) {
        summary.push(`Instrumento: ${instrument.name}`)
      }
    }

    if (filters.ageRange.min > 0 || filters.ageRange.max < 100) {
      summary.push(`Edad: ${filters.ageRange.min}-${filters.ageRange.max} años`)
    }

    if (filters.enrollmentDate.start || filters.enrollmentDate.end) {
      const start = filters.enrollmentDate.start
        ? new Date(filters.enrollmentDate.start).toLocaleDateString("es-ES")
        : "Inicio"
      const end = filters.enrollmentDate.end
        ? new Date(filters.enrollmentDate.end).toLocaleDateString("es-ES")
        : "Hoy"
      summary.push(`Inscripción: ${start} - ${end}`)
    }

    if (filters.status !== "all") {
      const statusLabels = {
        active: "Activos",
        inactive: "Inactivos",
        pending: "Pendientes",
      }
      summary.push(
        `Estado: ${statusLabels[filters.status as keyof typeof statusLabels] || filters.status}`
      )
    }

    return summary
  }

  const getClassStats = (students: any[]) => {
    const totalStudents = students.length
    const activeStudents = students.filter((s) => s.status === "active").length
    const inactiveStudents = students.filter((s) => s.status === "inactive").length
    const pendingStudents = students.filter((s) => s.status === "pending").length

    // Agrupar por instrumento
    const byInstrument: {[key: string]: number} = {}
    students.forEach((student) => {
      const instrumentId = student.instrumentId
      if (instrumentId) {
        byInstrument[instrumentId] = (byInstrument[instrumentId] || 0) + 1
      }
    })

    // Agrupar por maestro
    const byTeacher: {[key: string]: number} = {}
    students.forEach((student) => {
      const teacherId = student.teacherId
      if (teacherId) {
        byTeacher[teacherId] = (byTeacher[teacherId] || 0) + 1
      }
    })

    // Agrupar por clase
    const byClass: {[key: string]: number} = {}
    students.forEach((student) => {
      const classId = student.classId
      if (classId) {
        byClass[classId] = (byClass[classId] || 0) + 1
      }
    })

    return {
      total: totalStudents,
      active: activeStudents,
      inactive: inactiveStudents,
      pending: pendingStudents,
      byInstrument,
      byTeacher,
      byClass,
    }
  }

  const validateFields = (selectedFields: string[], reportType: string) => {
    const errors: string[] = []

    if (selectedFields.length === 0) {
      errors.push("Debe seleccionar al menos un campo")
    }

    // Validaciones específicas por tipo de reporte
    if (reportType === "students") {
      if (!selectedFields.includes("name")) {
        errors.push('El campo "Nombre" es obligatorio para reportes de estudiantes')
      }
    }

    if (reportType === "classes") {
      if (!selectedFields.includes("name")) {
        errors.push('El campo "Nombre" es obligatorio para reportes de clases')
      }
    }

    if (reportType === "teachers") {
      if (!selectedFields.includes("name")) {
        errors.push('El campo "Nombre" es obligatorio para reportes de maestros')
      }
    }

    return errors
  }

  const getFieldOrder = (field: string) => {
    const orderMap: {[key: string]: number} = {
      name: 1,
      age: 2,
      instrument: 3,
      teacher: 4,
      class: 5,
      schedule: 6,
      enrollmentDate: 7,
      status: 8,
      phone: 9,
      email: 10,
      students: 11,
      capacity: 12,
      classes: 13,
      date: 14,
      observations: 15,
      evaluation: 16,
      score: 17,
      comments: 18,
    }

    return orderMap[field] || 999
  }

  const sortFields = (fields: string[]) => {
    return fields.sort((a, b) => getFieldOrder(a) - getFieldOrder(b))
  }

  return {
    getFilterSummary,
    getClassStats,
    validateFields,
    getFieldOrder,
    sortFields,
  }
}
