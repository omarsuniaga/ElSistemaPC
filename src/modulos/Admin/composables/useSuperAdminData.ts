import {ref, computed} from "vue"
import {useAdminStudentsStore} from "../store/adminStudents"
import {useAdminTeachersStore} from "../store/teachers"
import {useClassesStore} from "../../Classes/store/classes"

/**
 * Composable para manejar todos los datos del Super Administrador
 * de manera unificada y optimizada
 */
export function useSuperAdminData() {
  // Stores
  const studentsStore = useAdminStudentsStore()
  const teachersStore = useAdminTeachersStore()
  const classesStore = useClassesStore()

  // Loading states
  const isLoading = ref(false)
  const lastUpdated = ref<Date | null>(null)

  // KPIs computados en tiempo real
  const kpis = computed(() => {
    const totalStudents = studentsStore.students.length
    const activeStudents = studentsStore.students.filter((s) => s.estado === "Activo").length
    const totalTeachers = teachersStore.teachers.length
    const totalClasses = classesStore.classes.length

    // Calcular ingresos mensuales (simulado, en producción vendría de la base de datos)
    const monthlyRevenue = studentsStore.students
      .filter((s) => s.estado === "Activo")
      .reduce((total, student) => {
        // Asumir una mensualidad promedio
        return total + (student.mensualidad || 1500)
      }, 0)

    // Calcular tasa de asistencia promedio
    const attendanceRate = studentsStore.studentStats.attendanceRate || 0

    return {
      totalStudents,
      activeStudents,
      totalTeachers,
      totalClasses,
      monthlyRevenue: `$${monthlyRevenue.toLocaleString()}`,
      attendanceRate: Math.round(attendanceRate),
    }
  })

  // Estudiantes con datos enriquecidos
  const students = computed(() => {
    return studentsStore.students.map((student) => ({
      ...student,
      // Agregar campos computados útiles
      fullName: `${student.nombre || ""} ${student.apellido || ""}`.trim(),
      ageCalculated: student.fechaNacimiento
        ? Math.floor(
            (Date.now() - new Date(student.fechaNacimiento).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000)
          )
        : student.edad,
      status: student.estado || "Activo",
      lastActivity: student.updatedAt || student.createdAt,
      classCount: student.clases?.length || 0,
    }))
  })

  // Maestros con datos enriquecidos
  const teachers = computed(() => {
    return teachersStore.teachers.map((teacher) => ({
      ...teacher,
      fullName: `${teacher.nombre || ""} ${teacher.apellido || ""}`.trim(),
      activeClasses: teacher.clases?.filter((c) => c.estado === "Activa").length || 0,
      totalStudents: teacher.estudiantes?.length || 0,
      rating: teacher.rating || 0,
      lastActivity: teacher.updatedAt || teacher.createdAt,
    }))
  })

  // Clases con datos enriquecidos
  const classes = computed(() => {
    return classesStore.classes.map((cls) => ({
      ...cls,
      studentsCount: cls.estudiantes?.length || 0,
      teacherName: cls.maestro?.nombre || "Sin asignar",
      nextClass: cls.proximaClase,
      completion: cls.porcentajeCompletado || 0,
    }))
  })

  // Estado del sistema
  const systemStatus = computed(() => {
    const totalUsers = students.value.length + teachers.value.length
    const activeUsers =
      students.value.filter((s) => s.status === "Activo").length +
      teachers.value.filter((t) => t.estado === "Activo").length

    const systemHealth = activeUsers / totalUsers

    let status = "excellent"
    let color = "green"
    let message = "Sistema funcionando perfectamente"

    if (systemHealth < 0.7) {
      status = "warning"
      color = "yellow"
      message = "Sistema requiere atención"
    }

    if (systemHealth < 0.5) {
      status = "critical"
      color = "red"
      message = "Sistema en estado crítico"
    }

    return {
      status,
      color,
      message,
      health: Math.round(systemHealth * 100),
      services: {
        database: "online",
        storage: "online",
        notifications: "online",
        backup: "online",
      },
      uptime: "99.9%",
      lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ayer
    }
  })

  // Actividad reciente
  const recentActivities = computed(() => {
    const activities = []

    // Estudiantes recientes
    const recentStudents = students.value
      .filter((s) => s.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((s) => ({
        id: `student-${s.id}`,
        type: "student_created",
        title: "Nuevo estudiante registrado",
        description: `${s.fullName} se registró en ${s.instrumento}`,
        time: s.createdAt,
        icon: "UserPlusIcon",
        color: "blue",
      }))

    // Clases recientes
    const recentClasses = classes.value
      .filter((c) => c.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .map((c) => ({
        id: `class-${c.id}`,
        type: "class_created",
        title: "Nueva clase creada",
        description: `${c.nombre} - ${c.teacherName}`,
        time: c.createdAt,
        icon: "AcademicCapIcon",
        color: "purple",
      }))

    return [...recentStudents, ...recentClasses]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10)
  })

  // Datos de análisis
  const analyticsData = computed(() => {
    // Tendencias de inscripciones por mes
    const enrollmentTrends = generateEnrollmentTrends()

    // Distribución por instrumentos
    const instrumentDistribution = generateInstrumentDistribution()

    // Análisis de asistencia
    const attendanceAnalysis = generateAttendanceAnalysis()

    // Métricas financieras
    const financialMetrics = generateFinancialMetrics()

    return {
      enrollmentTrends,
      instrumentDistribution,
      attendanceAnalysis,
      financialMetrics,
      summary: {
        totalRevenue: kpis.value.monthlyRevenue,
        averageAttendance: kpis.value.attendanceRate,
        studentGrowth: calculateGrowthRate(),
        retention: calculateRetentionRate(),
      },
    }
  })

  // Métodos auxiliares para generar datos de análisis
  function generateEnrollmentTrends() {
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ]
    const currentMonth = new Date().getMonth()

    return months.slice(0, currentMonth + 1).map((month, index) => ({
      month,
      students: 0, // TODO: Obtener datos reales de estudiantes inscritos
      teachers: 0, // TODO: Obtener datos reales de maestros contratados
      revenue: 0, // TODO: Obtener datos reales de ingresos
    }))
  }

  function generateInstrumentDistribution() {
    const instruments = {}
    students.value.forEach((student) => {
      if (student.instrumento) {
        instruments[student.instrumento] = (instruments[student.instrumento] || 0) + 1
      }
    })

    return Object.entries(instruments)
      .map(([instrument, count]) => ({instrument, count}))
      .sort((a, b) => b.count - a.count)
  }

  function generateAttendanceAnalysis() {
    return {
      overall: kpis.value.attendanceRate,
      byInstrument: generateInstrumentDistribution().map((item) => ({
        ...item,
        attendance: 0, // TODO: Obtener datos reales de asistencia por instrumento
      })),
      trends: Array.from({length: 7}, (_, i) => ({
        day: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString("es-ES", {
          weekday: "short",
        }),
        attendance: 0, // TODO: Obtener datos reales de tendencias de asistencia
      })).reverse(),
    }
  }

  function generateFinancialMetrics() {
    const monthlyRevenue = parseFloat(kpis.value.monthlyRevenue.replace(/[^0-9]/g, ""))

    return {
      monthlyRevenue,
      yearlyProjection: monthlyRevenue * 12,
      averagePerStudent: Math.floor(monthlyRevenue / kpis.value.activeStudents),
      trends: Array.from({length: 6}, (_, i) => ({
        month: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("es-ES", {
          month: "short",
        }),
        revenue: 0, // TODO: Obtener datos reales de tendencias de ingresos
      })).reverse(),
    }
  }

  function calculateGrowthRate() {
    // TODO: Implementar cálculo de tasa de crecimiento basado en datos históricos reales
    return 0 // Valor neutro hasta tener datos reales
  }

  function calculateRetentionRate() {
    // TODO: Implementar cálculo de tasa de retención basado en datos reales
    return 0 // Valor neutro hasta tener datos reales
  }

  // Métodos principales
  const loadAllData = async () => {
    isLoading.value = true
    try {
      await Promise.all([
        studentsStore.loadStudents(),
        teachersStore.loadTeachers(),
        classesStore.fetchClasses(),
      ])
      lastUpdated.value = new Date()
    } catch (error) {
      console.error("Error loading super admin data:", error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const refreshData = async () => {
    return loadAllData()
  }

  // Auto-refresh cada 5 minutos
  const startAutoRefresh = () => {
    return setInterval(refreshData, 5 * 60 * 1000)
  }

  return {
    // State
    isLoading,
    lastUpdated,

    // Computed
    kpis,
    students,
    teachers,
    classes,
    systemStatus,
    recentActivities,
    analyticsData,

    // Methods
    loadAllData,
    refreshData,
    startAutoRefresh,
  }
}
