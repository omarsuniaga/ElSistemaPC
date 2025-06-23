import { ref, computed } from 'vue'
import { useAdminStudentsStore } from '../store/adminStudents'
import { useAdminTeachersStore } from '../store/teachers'
import { useClassesStore } from '../../Classes/store/classes'

/**
 * Composable para manejo de filtros y búsquedas avanzadas
 * en el dashboard del Super Administrador
 */
export function useSuperAdminFilters() {
  // Referencias reactivas para filtros
  const searchQuery = ref('')
  const selectedStatus = ref('all')
  const selectedInstrument = ref('all')
  const selectedTeacher = ref('all')
  const selectedDateRange = ref('all')
  const sortBy = ref('name')
  const sortOrder = ref<'asc' | 'desc'>('asc')
  
  // Filtros avanzados
  const advancedFilters = ref({
    ageRange: { min: 0, max: 100 },
    attendanceRange: { min: 0, max: 100 },
    paymentStatus: 'all',
    registrationDate: { start: null, end: null },
    showInactive: false
  })

  // Stores
  const studentsStore = useAdminStudentsStore()
  const teachersStore = useAdminTeachersStore()
  const classesStore = useClassesStore()

  // Opciones para los filtros
  const statusOptions = computed(() => [
    { value: 'all', label: 'Todos los estados', count: studentsStore.students.length },
    { value: 'Activo', label: 'Activos', count: studentsStore.students.filter(s => s.estado === 'Activo').length },
    { value: 'Inactivo', label: 'Inactivos', count: studentsStore.students.filter(s => s.estado === 'Inactivo').length },
    { value: 'Suspendido', label: 'Suspendidos', count: studentsStore.students.filter(s => s.estado === 'Suspendido').length }
  ])

  const instrumentOptions = computed(() => {
    const instruments = new Set(studentsStore.students.map(s => s.instrumento).filter(Boolean))
    return [
      { value: 'all', label: 'Todos los instrumentos', count: studentsStore.students.length },
      ...Array.from(instruments).map(instrument => ({
        value: instrument,
        label: instrument,
        count: studentsStore.students.filter(s => s.instrumento === instrument).length
      }))
    ]
  })

  const teacherOptions = computed(() => {
    return [
      { value: 'all', label: 'Todos los maestros', count: studentsStore.students.length },
      ...teachersStore.teachers.map(teacher => ({
        value: teacher.id,
        label: `${teacher.nombre} ${teacher.apellido}`,
        count: studentsStore.students.filter(s => s.maestroId === teacher.id).length
      }))
    ]
  })

  const dateRangeOptions = [
    { value: 'all', label: 'Todo el tiempo' },
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'quarter', label: 'Este trimestre' },
    { value: 'year', label: 'Este año' },
    { value: 'custom', label: 'Rango personalizado' }
  ]

  const sortOptions = [
    { value: 'name', label: 'Nombre' },
    { value: 'fecha', label: 'Fecha de registro' },
    { value: 'edad', label: 'Edad' },
    { value: 'instrumento', label: 'Instrumento' },
    { value: 'asistencia', label: 'Asistencia' },
    { value: 'estado', label: 'Estado' }
  ]

  // Estudiantes filtrados
  const filteredStudents = computed(() => {
    let students = [...studentsStore.students]

    // Filtro por búsqueda
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim()
      students = students.filter(student => 
        `${student.nombre} ${student.apellido}`.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        student.telefono?.includes(query) ||
        student.instrumento?.toLowerCase().includes(query)
      )
    }

    // Filtro por estado
    if (selectedStatus.value !== 'all') {
      students = students.filter(student => student.estado === selectedStatus.value)
    }

    // Filtro por instrumento
    if (selectedInstrument.value !== 'all') {
      students = students.filter(student => student.instrumento === selectedInstrument.value)
    }

    // Filtro por maestro
    if (selectedTeacher.value !== 'all') {
      students = students.filter(student => student.maestroId === selectedTeacher.value)
    }

    // Filtro por rango de fechas
    if (selectedDateRange.value !== 'all') {
      students = filterByDateRange(students, selectedDateRange.value)
    }

    // Filtros avanzados
    if (advancedFilters.value.ageRange.min > 0 || advancedFilters.value.ageRange.max < 100) {
      students = students.filter(student => {
        const age = student.edad || 0
        return age >= advancedFilters.value.ageRange.min && age <= advancedFilters.value.ageRange.max
      })
    }

    if (advancedFilters.value.paymentStatus !== 'all') {
      students = students.filter(student => student.estadoPago === advancedFilters.value.paymentStatus)
    }

    if (!advancedFilters.value.showInactive) {
      students = students.filter(student => student.estado !== 'Inactivo')
    }

    // Ordenamiento
    students.sort((a, b) => {
      let aValue, bValue

      switch (sortBy.value) {
        case 'name':
          aValue = `${a.nombre} ${a.apellido}`.toLowerCase()
          bValue = `${b.nombre} ${b.apellido}`.toLowerCase()
          break
        case 'fecha':
          aValue = new Date(a.createdAt || 0).getTime()
          bValue = new Date(b.createdAt || 0).getTime()
          break
        case 'edad':
          aValue = a.edad || 0
          bValue = b.edad || 0
          break
        case 'instrumento':
          aValue = a.instrumento?.toLowerCase() || ''
          bValue = b.instrumento?.toLowerCase() || ''
          break
        case 'asistencia':
          aValue = a.porcentajeAsistencia || 0
          bValue = b.porcentajeAsistencia || 0
          break
        case 'estado':
          aValue = a.estado?.toLowerCase() || ''
          bValue = b.estado?.toLowerCase() || ''
          break
        default:
          aValue = a[sortBy.value]
          bValue = b[sortBy.value]
      }

      if (sortOrder.value === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return students
  })

  // Maestros filtrados
  const filteredTeachers = computed(() => {
    let teachers = [...teachersStore.teachers]

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim()
      teachers = teachers.filter(teacher => 
        `${teacher.nombre} ${teacher.apellido}`.toLowerCase().includes(query) ||
        teacher.email?.toLowerCase().includes(query) ||
        teacher.especialidad?.toLowerCase().includes(query)
      )
    }

    if (selectedStatus.value !== 'all') {
      teachers = teachers.filter(teacher => teacher.estado === selectedStatus.value)
    }

    return teachers
  })

  // Clases filtradas
  const filteredClasses = computed(() => {
    let classes = [...classesStore.classes]

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim()
      classes = classes.filter(cls => 
        cls.nombre?.toLowerCase().includes(query) ||
        cls.descripcion?.toLowerCase().includes(query) ||
        cls.maestro?.nombre?.toLowerCase().includes(query)
      )
    }

    if (selectedInstrument.value !== 'all') {
      classes = classes.filter(cls => cls.instrumento === selectedInstrument.value)
    }

    if (selectedTeacher.value !== 'all') {
      classes = classes.filter(cls => cls.maestroId === selectedTeacher.value)
    }

    return classes
  })

  // Función auxiliar para filtrar por rango de fechas
  function filterByDateRange(students: any[], range: string) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (range) {
      case 'today':
        return students.filter(s => {
          const date = new Date(s.createdAt)
          return date >= today
        })
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - 7)
        return students.filter(s => {
          const date = new Date(s.createdAt)
          return date >= weekStart
        })
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        return students.filter(s => {
          const date = new Date(s.createdAt)
          return date >= monthStart
        })
      case 'quarter':
        const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
        return students.filter(s => {
          const date = new Date(s.createdAt)
          return date >= quarterStart
        })
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1)
        return students.filter(s => {
          const date = new Date(s.createdAt)
          return date >= yearStart
        })
      default:
        return students
    }
  }

  // Estadísticas de filtros
  const filterStats = computed(() => ({
    total: studentsStore.students.length,
    filtered: filteredStudents.value.length,
    percentage: studentsStore.students.length > 0 
      ? Math.round((filteredStudents.value.length / studentsStore.students.length) * 100)
      : 0
  }))

  // Métodos de control
  const clearAllFilters = () => {
    searchQuery.value = ''
    selectedStatus.value = 'all'
    selectedInstrument.value = 'all'
    selectedTeacher.value = 'all'
    selectedDateRange.value = 'all'
    sortBy.value = 'name'
    sortOrder.value = 'asc'
    advancedFilters.value = {
      ageRange: { min: 0, max: 100 },
      attendanceRange: { min: 0, max: 100 },
      paymentStatus: 'all',
      registrationDate: { start: null, end: null },
      showInactive: false
    }
  }

  const toggleSortOrder = () => {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  }

  const applyQuickFilter = (type: string, value: string) => {
    switch (type) {
      case 'status':
        selectedStatus.value = value
        break
      case 'instrument':
        selectedInstrument.value = value
        break
      case 'teacher':
        selectedTeacher.value = value
        break
      case 'date':
        selectedDateRange.value = value
        break
    }
  }

  // Filtros predefinidos populares
  const quickFilters = computed(() => [
    {
      name: 'Estudiantes activos',
      icon: 'UserIcon',
      color: 'green',
      action: () => applyQuickFilter('status', 'Activo'),
      count: statusOptions.value.find(o => o.value === 'Activo')?.count || 0
    },
    {
      name: 'Nuevos este mes',
      icon: 'PlusIcon',
      color: 'blue',
      action: () => applyQuickFilter('date', 'month'),
      count: filterByDateRange(studentsStore.students, 'month').length
    },
    {
      name: 'Piano',
      icon: 'MusicalNoteIcon',
      color: 'purple',
      action: () => applyQuickFilter('instrument', 'Piano'),
      count: instrumentOptions.value.find(o => o.value === 'Piano')?.count || 0
    },
    {
      name: 'Guitarra',
      icon: 'MusicalNoteIcon',
      color: 'orange',
      action: () => applyQuickFilter('instrument', 'Guitarra'),
      count: instrumentOptions.value.find(o => o.value === 'Guitarra')?.count || 0
    }
  ])

  return {
    // State
    searchQuery,
    selectedStatus,
    selectedInstrument,
    selectedTeacher,
    selectedDateRange,
    sortBy,
    sortOrder,
    advancedFilters,

    // Options
    statusOptions,
    instrumentOptions,
    teacherOptions,
    dateRangeOptions,
    sortOptions,

    // Computed
    filteredStudents,
    filteredTeachers,
    filteredClasses,
    filterStats,
    quickFilters,

    // Methods
    clearAllFilters,
    toggleSortOrder,
    applyQuickFilter
  }
}
