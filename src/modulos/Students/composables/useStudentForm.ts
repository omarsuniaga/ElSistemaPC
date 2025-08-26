import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStudentsStore } from '../store/students'
import type { Student } from '../types/student'

export const useStudentForm = () => {
  const router = useRouter()
  const studentsStore = useStudentsStore()

  // Estado del formulario
  const newStudent = ref<Omit<Student, 'id'> & { id?: string }>({
    nombre: '',
    apellido: '',
    instrumento: '',
    edad: '',
    tlf: '',
    email: '',
    direccion: '',
    observaciones: '',
    grupo: [],
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // Estado de edición
  const isEditingExistingStudent = ref(false)
  const matchedStudent = ref<Student | null>(null)

  // Estado de carga y errores
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Sistema de notificaciones
  const notification = ref({
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'warning',
  })

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    notification.value = { show: true, message, type }
    setTimeout(() => {
      notification.value.show = false
    }, 7000)
  }

  // Función para normalizar texto
  const normalizeText = (text: string = '') => {
    if (!text) return ''
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  // Verificar si el estudiante existe
  const verifyStudentExists = async () => {
    if (!newStudent.value.nombre || !newStudent.value.apellido) return

    try {
      if (studentsStore.students.length === 0) {
        await studentsStore.fetchStudents()
      }

      const students = studentsStore.students
      const normalizedNombre = normalizeText(newStudent.value.nombre)
      const normalizedApellido = normalizeText(newStudent.value.apellido)

      const matchingStudents = students.filter((student) => {
        if (!student.nombre || !student.apellido) return false
        const studentNombreNorm = normalizeText(student.nombre)
        const studentApellidoNorm = normalizeText(student.apellido)
        return studentNombreNorm === normalizedNombre && studentApellidoNorm === normalizedApellido
      })

      if (matchingStudents.length > 0) {
        matchedStudent.value = matchingStudents[0]
        showNotification(
          `¡ATENCIÓN! Alumno ya registrado: ${matchedStudent.value.nombre} ${matchedStudent.value.apellido}`,
          'warning'
        )
        populateFormWithStudentData(matchedStudent.value)
        isEditingExistingStudent.value = true
      } else {
        if (isEditingExistingStudent.value) {
          clearFormExceptNameAndSurname()
          isEditingExistingStudent.value = false
          matchedStudent.value = null
        }
      }
    } catch (err) {
      console.error('Error verificando estudiante:', err)
    }
  }

  // Poblar formulario con datos existentes
  const populateFormWithStudentData = (student: Student) => {
    const currentNombre = newStudent.value.nombre
    const currentApellido = newStudent.value.apellido

    let normalizedGrupo = []
    if (student.grupo) {
      if (Array.isArray(student.grupo)) {
        normalizedGrupo = [...student.grupo]
      } else if (typeof student.grupo === 'string') {
        if (student.grupo.startsWith('[') && student.grupo.endsWith(']')) {
          try {
            const parsed = JSON.parse(student.grupo)
            normalizedGrupo = Array.isArray(parsed) ? parsed : [student.grupo]
          } catch {
            normalizedGrupo = [student.grupo]
          }
        } else {
          normalizedGrupo = [student.grupo]
        }
      }
    }

    newStudent.value = {
      ...student,
      createdAt: new Date(student.createdAt),
      updatedAt: new Date(),
      grupo: normalizedGrupo,
    }

    if (student.nombre !== currentNombre) {
      newStudent.value.nombre = currentNombre
    }
    if (student.apellido !== currentApellido) {
      newStudent.value.apellido = currentApellido
    }
  }

  // Limpiar formulario excepto nombre y apellido
  const clearFormExceptNameAndSurname = () => {
    const nombre = newStudent.value.nombre
    const apellido = newStudent.value.apellido

    newStudent.value = {
      nombre,
      apellido,
      instrumento: '',
      edad: '',
      tlf: '',
      email: '',
      direccion: '',
      observaciones: '',
      grupo: [],
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  // Limpiar formulario completo
  const clearForm = () => {
    newStudent.value = {
      nombre: '',
      apellido: '',
      instrumento: '',
      edad: '',
      tlf: '',
      email: '',
      direccion: '',
      observaciones: '',
      grupo: [],
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    localStorage.removeItem('newStudentData')
  }

  // Manejar envío del formulario
  const handleSubmit = async () => {
    try {
      if (!newStudent.value.nombre || !newStudent.value.apellido) {
        error.value = 'Nombre y apellido son obligatorios'
        showNotification(error.value, 'error')
        return
      }

      isLoading.value = true
      error.value = null

      // Actualizar estudiante existente
      if (isEditingExistingStudent.value && matchedStudent.value) {
        newStudent.value.id = matchedStudent.value.id

        if (!Array.isArray(newStudent.value.grupo)) {
          newStudent.value.grupo = newStudent.value.grupo ? [newStudent.value.grupo] : []
        }

        const { id, ...studentData } = newStudent.value
        await studentsStore.updateStudent(matchedStudent.value.id, studentData)
        showNotification(
          `Alumno ${newStudent.value.nombre} ${newStudent.value.apellido} actualizado con éxito`
        )
        clearForm()
        isEditingExistingStudent.value = false
        matchedStudent.value = null
        return
      }

      // Verificar duplicados
      if (studentsStore.students.length === 0) {
        await studentsStore.fetchStudents()
      }

      const students = studentsStore.students
      const normalizedNombre = newStudent.value.nombre.toLowerCase().trim()
      const normalizedApellido = newStudent.value.apellido.toLowerCase().trim()
      const normalizedEdad = newStudent.value.edad?.toString().trim() || ''
      const normalizedInstrumento = newStudent.value.instrumento?.toLowerCase().trim() || ''

      const existingStudent = students.find((student) => {
        const studentNombre = (student.nombre || '').toLowerCase().trim()
        const studentApellido = (student.apellido || '').toLowerCase().trim()
        const studentEdad = (student.edad || '').toString().trim()
        const studentInstrumento = (student.instrumento || '').toLowerCase().trim()

        const nameMatches = studentNombre === normalizedNombre && studentApellido === normalizedApellido
        const edadMatches = !normalizedEdad || !studentEdad || normalizedEdad === studentEdad
        const instrumentoMatches = !normalizedInstrumento || !studentInstrumento || normalizedInstrumento === studentInstrumento

        return nameMatches && edadMatches && instrumentoMatches
      })

      if (existingStudent) {
        error.value = `Ya existe un alumno con el nombre ${existingStudent.nombre} ${existingStudent.apellido}`
        showNotification(error.value, 'error')
        isLoading.value = false
        return
      }

      // Crear nuevo estudiante
      if (!Array.isArray(newStudent.value.grupo)) {
        newStudent.value.grupo = newStudent.value.grupo ? [newStudent.value.grupo] : []
      }

      await studentsStore.addStudent(newStudent.value)
      showNotification(
        `Alumno ${newStudent.value.nombre} ${newStudent.value.apellido} guardado con éxito`
      )
      clearForm()
      isEditingExistingStudent.value = false
      matchedStudent.value = null

    } catch (err: any) {
      console.error('Error en handleSubmit:', err)
      error.value = err.message || 'Error al procesar el alumno'
      showNotification(error.value, 'error')
    } finally {
      isLoading.value = false
    }
  }

  return {
    newStudent,
    isEditingExistingStudent,
    matchedStudent,
    isLoading,
    error,
    notification,
    showNotification,
    verifyStudentExists,
    handleSubmit,
    clearForm,
    clearFormExceptNameAndSurname,
    populateFormWithStudentData
  }
}
