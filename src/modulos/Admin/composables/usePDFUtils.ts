import {computed} from "vue"
import {useClassesStore} from "../../Classes/store/classes"
import {useAdminTeachersStore} from "../store/teachers"
import {useInstrumentoStore} from "../../Instruments/store/instrumento"

export function usePDFUtils() {
  const classesStore = useClassesStore()
  const teachersStore = useAdminTeachersStore()
  const instrumentsStore = useInstrumentoStore()

  const getClassInstrument = (classId: string): string => {
    const classItem = classesStore.classes.find((c) => c.id === classId)
    if (!classItem?.instrumentId) return "Sin instrumento"

    const instrument = instrumentsStore.instruments.find((i) => i.id === classItem.instrumentId)
    return instrument?.name || "Sin instrumento"
  }

  const getTeacherName = (teacherId: string): string => {
    const teacher = teachersStore.teachers.find((t) => t.id === teacherId)
    return teacher?.name || "Sin maestro"
  }

  const getClassName = (classId: string): string => {
    const classItem = classesStore.classes.find((c) => c.id === classId)
    return classItem?.name || "Sin clase"
  }

  const getInstrumentName = (instrumentId: string): string => {
    const instrument = instrumentsStore.instruments.find((i) => i.id === instrumentId)
    return instrument?.name || "Sin instrumento"
  }

  const formatDate = (date: string | Date): string => {
    if (!date) return "Sin fecha"

    const dateObj = typeof date === "string" ? new Date(date) : date
    return dateObj.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (time: string): string => {
    if (!time) return "Sin horario"
    return time
  }

  const getAge = (birthDate: string): number => {
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

  const groupStudentsByClass = (students: any[]) => {
    const grouped: {[key: string]: any[]} = {}

    students.forEach((student) => {
      const classId = student.classId || "sin-clase"
      if (!grouped[classId]) {
        grouped[classId] = []
      }
      grouped[classId].push(student)
    })

    return grouped
  }

  const groupStudentsByTeacher = (students: any[]) => {
    const grouped: {[key: string]: any[]} = {}

    students.forEach((student) => {
      const teacherId = student.teacherId || "sin-maestro"
      if (!grouped[teacherId]) {
        grouped[teacherId] = []
      }
      grouped[teacherId].push(student)
    })

    return grouped
  }

  const groupStudentsByInstrument = (students: any[]) => {
    const grouped: {[key: string]: any[]} = {}

    students.forEach((student) => {
      const instrumentId = student.instrumentId || "sin-instrumento"
      if (!grouped[instrumentId]) {
        grouped[instrumentId] = []
      }
      grouped[instrumentId].push(student)
    })

    return grouped
  }

  const sortStudents = (students: any[], sortBy: string, sortOrder: "asc" | "desc" = "asc") => {
    return [...students].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case "name":
          aValue = a.name?.toLowerCase() || ""
          bValue = b.name?.toLowerCase() || ""
          break
        case "age":
          aValue = getAge(a.birthDate)
          bValue = getAge(b.birthDate)
          break
        case "instrument":
          aValue = getInstrumentName(a.instrumentId).toLowerCase()
          bValue = getInstrumentName(b.instrumentId).toLowerCase()
          break
        case "teacher":
          aValue = getTeacherName(a.teacherId).toLowerCase()
          bValue = getTeacherName(b.teacherId).toLowerCase()
          break
        case "class":
          aValue = getClassName(a.classId).toLowerCase()
          bValue = getClassName(b.classId).toLowerCase()
          break
        case "enrollmentDate":
          aValue = new Date(a.enrollmentDate || 0)
          bValue = new Date(b.enrollmentDate || 0)
          break
        default:
          aValue = a[sortBy] || ""
          bValue = b[sortBy] || ""
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active":
        return "#10B981" // green-500
      case "inactive":
        return "#EF4444" // red-500
      case "pending":
        return "#F59E0B" // amber-500
      default:
        return "#6B7280" // gray-500
    }
  }

  const getStatusText = (status: string): string => {
    switch (status) {
      case "active":
        return "Activo"
      case "inactive":
        return "Inactivo"
      case "pending":
        return "Pendiente"
      default:
        return "Desconocido"
    }
  }

  return {
    getClassInstrument,
    getTeacherName,
    getClassName,
    getInstrumentName,
    formatDate,
    formatTime,
    getAge,
    groupStudentsByClass,
    groupStudentsByTeacher,
    groupStudentsByInstrument,
    sortStudents,
    convertImageToBase64,
    getStatusColor,
    getStatusText,
  }
}
