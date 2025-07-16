// Tipos para el sistema de performance académico

export interface AttendanceMetrics {
  totalClasses: number
  attendedClasses: number
  punctuality: number // % de llegadas puntuales
  attendanceRate: number // % de asistencia
  consistencyScore: number // Puntuación de consistencia
}

export interface RepertoireMetrics {
  totalMontajes: number
  completedMontajes: number
  averageScore: number // Promedio de puntuaciones en montajes
  technicalProficiency: number // Nivel técnico
  musicalExpression: number // Expresión musical
  stagePresence: number // Presencia escénica
}

export interface WorkMetrics {
  individualWork: {
    practiceHours: number
    selfAssessment: number
    improvementRate: number
    consistentPractice: boolean
  }
  collectiveWork: {
    teamworkScore: number
    collaborationRating: number
    leadershipQualities: number
    ensembleSkills: number
  }
}

export interface TeacherObservations {
  positiveComments: PositiveComment[]
  behaviorRatings: BehaviorRating[]
  skillDevelopment: SkillProgress[]
  monthlyProgress: MonthlyObservation[]
}

export interface PositiveComment {
  id: string
  teacherId: string
  teacherName: string
  classId: string
  className: string
  date: string
  category: 'técnica' | 'expresión' | 'comportamiento' | 'progreso' | 'liderazgo' | 'creatividad'
  comment: string
  impact: 'bajo' | 'medio' | 'alto'
  tags: string[]
}

export interface BehaviorRating {
  date: string
  teacherId: string
  classId: string
  attitude: number // 1-10
  participation: number // 1-10
  respect: number // 1-10
  responsibility: number // 1-10
}

export interface SkillProgress {
  skillName: string
  category: 'técnica' | 'teoría' | 'interpretación' | 'composición'
  currentLevel: number // 1-100
  previousLevel: number
  improvementRate: number
  lastUpdated: string
}

export interface MonthlyObservation {
  month: string
  year: number
  overallProgress: number // 1-10
  strengths: string[]
  areasForImprovement: string[]
  goals: string[]
  achievements: string[]
}

export interface StudentPerformance {
  studentId: string
  studentName: string
  calculatedAt: string

  // Métricas calculadas
  attendance: AttendanceMetrics
  repertoire: RepertoireMetrics
  work: WorkMetrics
  observations: TeacherObservations

  // Puntuaciones finales
  scores: {
    attendanceScore: number // 0-100
    repertoireScore: number // 0-100
    workScore: number // 0-100
    behaviorScore: number // 0-100
    progressScore: number // 0-100
    overallScore: number // 0-100
  }

  // Clasificación y rankings
  classification: 'excepcional' | 'sobresaliente' | 'bueno' | 'regular' | 'necesita_mejora'
  rank: number // Posición en la clase/academia
  percentile: number // Percentil en el que se encuentra

  // Tendencias
  trends: {
    direction: 'mejorando' | 'estable' | 'decayendo'
    changeRate: number // % de cambio en el último mes
    consistency: number // Qué tan consistente ha sido el rendimiento
  }
}

export interface ClassPerformanceAnalytics {
  classId: string
  className: string
  teacherId: string
  students: StudentPerformance[]
  classAverages: {
    attendance: number
    repertoire: number
    behavior: number
    overall: number
  }
  topPerformers: StudentPerformance[]
  improvementOpportunities: StudentPerformance[]
}

export interface TeacherPerformanceInsights {
  teacherId: string
  teacherName: string
  classes: ClassPerformanceAnalytics[]
  studentCount: number
  averageClassPerformance: number
  positiveImpactMetrics: {
    totalPositiveComments: number
    studentImprovementRate: number
    classRetentionRate: number
  }
}

export interface AcademyPerformanceOverview {
  totalStudents: number
  overallAverageScore: number
  performanceDistribution: {
    excepcional: number
    sobresaliente: number
    bueno: number
    regular: number
    necesita_mejora: number
  }
  topPerformingClasses: ClassPerformanceAnalytics[]
  monthlyTrends: MonthlyTrend[]
  keyInsights: Insight[]
}

export interface MonthlyTrend {
  month: string
  year: number
  averageScore: number
  studentCount: number
  improvementRate: number
}

export interface Insight {
  type: 'positive' | 'concern' | 'opportunity'
  category: 'attendance' | 'repertoire' | 'behavior' | 'progress'
  title: string
  description: string
  affectedStudents: number
  recommendedActions: string[]
}

// Configuración de ponderaciones
export interface PerformanceWeights {
  attendance: number // 25%
  repertoire: number // 30%
  individualWork: number // 15%
  collectiveWork: number // 15%
  teacherObservations: number // 15%
}

// Configuración por defecto
export const DEFAULT_WEIGHTS: PerformanceWeights = {
  attendance: 0.25,
  repertoire: 0.3,
  individualWork: 0.15,
  collectiveWork: 0.15,
  teacherObservations: 0.15,
};

// Umbrales para clasificación
export const PERFORMANCE_THRESHOLDS = {
  excepcional: 90,
  sobresaliente: 80,
  bueno: 70,
  regular: 60,
  necesita_mejora: 0,
};

export const POSITIVE_COMMENT_CATEGORIES = [
  { value: 'técnica', label: 'Técnica Musical', weight: 1.2 },
  { value: 'expresión', label: 'Expresión Artística', weight: 1.1 },
  { value: 'comportamiento', label: 'Comportamiento Ejemplar', weight: 1.0 },
  { value: 'progreso', label: 'Progreso Notable', weight: 1.3 },
  { value: 'liderazgo', label: 'Liderazgo', weight: 1.2 },
  { value: 'creatividad', label: 'Creatividad', weight: 1.1 },
] as const;
