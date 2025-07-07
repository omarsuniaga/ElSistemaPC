// Re-export existing heatmap types with Montaje namespace
export interface GridCell {
  id: string
  level: number
  row: number
  col: number
  selected?: boolean
  measureNumber?: number
  notes?: string
  lastUpdated?: string
  updatedBy?: string
}

export interface LevelConfig {
  id: number
  name: string
  color: string
  description?: string
  icon?: string
  targetCriteria?: string[]
}

export interface Instrument {
  id: string
  name: string
  family: string
  quantity?: number
  difficulty?: number
  priority?: number
  assignedMembers?: string[]
  requirements?: string[]
}

export interface InstrumentEvaluation {
  instrumentId: string
  workId: string
  evaluatorId: string
  measureId?: string
  afinacion: number
  articulacion: number
  ritmo: number
  cohesion: number
  dinamica: number
  memorizacion: number
  comentarios: string
  tiempoDedicado: number
  detailedComments: DetailedComments
  detailedInfo: DetailedInfo
  audioRecording?: string
  videoRecording?: string
  createdAt: string
  updatedAt: string
}

export interface DetailedComments {
  general: string
  strengths: string
  improvements: string
  specific: string
  technicalNotes: string
  musicalNotes: string
}

export interface DetailedInfo {
  hoursPerWeek: number
  difficulty: number
  expectedProgress: number
  nextEvaluation: string
  practiceGoals: string[]
  resources: string[]
}

export interface WeeklyEvaluation {
  id: string
  workId: string
  projectId: string
  evaluatorId: string
  week: string
  ensayoGeneral: EvaluationScores
  ensayoSeccional: EvaluationScores
  ensayoPorFila: EvaluationScores
  comentarios: string
  objectives: string[]
  achievements: string[]
  challenges: string[]
  nextWeekGoals: string[]
  attendanceRate: number
  overallMood: number
  energyLevel: number
  focusLevel: number
  createdAt: string
  updatedAt: string
}

export interface EvaluationScores {
  afinacion: number
  articulacion: number
  ritmo: number
  cohesion: number
  dinamica: number
  memorizacion: number
}

export interface MusicalWork {
  id: string
  projectId: string
  name: string
  composer: string
  arranger?: string
  publisher?: string
  description?: string
  genre: string
  difficulty: number
  duration: number // minutes
  rows: number
  cols: number
  totalMeasures: number
  key: string
  tempo?: string
  timeSignature?: string
  requirements: string
  techniques: string
  startDate: string
  endDate?: string
  targetPerformanceDate?: string
  instruments: Instrument[]
  levels: LevelConfig[]
  movements?: Movement[]
  sections: WorkSection[]
  resources: WorkResource[]
  milestones: WorkMilestone[]
  status: 'planning' | 'learning' | 'polishing' | 'performance_ready' | 'performed'
  priority: number
  tags: string[]
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface Movement {
  id: string
  name: string
  tempo: string
  timeSignature: string
  key: string
  startMeasure: number
  endMeasure: number
  difficulty: number
  characteristics: string[]
}

export interface WorkSection {
  id: string
  name: string
  description: string
  startMeasure: number
  endMeasure: number
  difficulty: number
  focusAreas: string[]
  practiceNotes: string
}

export interface WorkResource {
  id: string
  type: 'score' | 'audio' | 'video' | 'reference' | 'exercise'
  name: string
  url?: string
  file?: string
  description: string
  tags: string[]
  uploadedBy: string
  uploadedAt: string
}

export interface WorkMilestone {
  id: string
  name: string
  description: string
  targetDate: string
  criteria: MilestoneCriteria[]
  completed: boolean
  completedDate?: string
  completedBy?: string
  notes?: string
}

export interface MilestoneCriteria {
  type: 'score' | 'attendance' | 'completion' | 'performance'
  description: string
  target: number
  current: number
  unit: string
}

// Evaluation criteria with enhanced structure
export const EVALUATION_CRITERIA = {
  afinacion: {
    name: 'Afinación',
    description: 'Precisión en la entonación y afinación',
    weight: 1.2,
    scales: {
      1: 'Muy desafinado - Errores constantes de entonación',
      2: 'Desafinado - Errores frecuentes, necesita corrección',
      3: 'Aceptable - Generalmente afinado con errores ocasionales',
      4: 'Bien afinado - Afinación consistente con errores mínimos',
      5: 'Perfecta afinación - Entonación impecable y consistente'
    },
    tips: [
      'Usar afinador antes de cada ensayo',
      'Practicar escalas y arpegios lentamente',
      'Escuchar referencias de afinación'
    ]
  },
  articulacion: {
    name: 'Articulación',
    description: 'Claridad y precisión en la articulación de notas',
    weight: 1.0,
    scales: {
      1: 'Muy imprecisa - Articulación confusa e inconsistente',
      2: 'Irregular - Articulación variable, falta claridad',
      3: 'Aceptable - Articulación básica correcta',
      4: 'Clara - Articulación precisa y consistente',
      5: 'Extremadamente nítida - Articulación perfecta y expresiva'
    },
    tips: [
      'Practicar ejercicios de staccato y legato',
      'Trabajar con metrónomo',
      'Estudiar diferentes tipos de articulación'
    ]
  },
  ritmo: {
    name: 'Ritmo',
    description: 'Precisión rítmica y mantenimiento del tempo',
    weight: 1.3,
    scales: {
      1: 'Inestable - Tempo inconsistente, errores rítmicos frecuentes',
      2: 'Desfasado - Dificultades para mantener el tempo',
      3: 'A tempo - Ritmo básico correcto',
      4: 'Preciso - Ritmo consistente y preciso',
      5: 'Muy preciso - Ritmo impecable con subdivisiones exactas'
    },
    tips: [
      'Usar metrónomo en todas las prácticas',
      'Practicar subdivisiones rítmicas',
      'Trabajar con diferentes tempos'
    ]
  },
  cohesion: {
    name: 'Cohesión',
    description: 'Unidad y coordinación con otros instrumentos',
    weight: 1.1,
    scales: {
      1: 'Sección dispersa - Sin coordinación ni unidad',
      2: 'Poca unidad - Coordinación inconsistente',
      3: 'Unidad básica - Coordinación aceptable',
      4: 'Buena cohesión - Sección bien coordinada',
      5: 'Unísono total - Perfecta coordinación y unidad'
    },
    tips: [
      'Escuchar activamente a otros instrumentos',
      'Practicar en grupos pequeños',
      'Trabajar entradas y cortes juntos'
    ]
  },
  dinamica: {
    name: 'Dinámica',
    description: 'Control y variedad en las dinámicas musicales',
    weight: 0.9,
    scales: {
      1: 'Sin contraste - Dinámicas planas, sin variación',
      2: 'Poco dinámico - Variaciones mínimas e inconsistentes',
      3: 'Dinámico - Contraste básico de dinámicas',
      4: 'Muy dinámico - Buen control y variedad dinámica',
      5: 'Excelente control - Dinámicas expresivas y precisas'
    },
    tips: [
      'Practicar crescendos y diminuendos',
      'Estudiar las indicaciones dinámicas',
      'Trabajar contrastes extremos'
    ]
  },
  memorizacion: {
    name: 'Memorización',
    description: 'Nivel de memorización de la obra',
    weight: 0.8,
    scales: {
      1: 'No memorizado - Dependencia total de la partitura',
      2: 'Referencia constante - Memorización muy parcial',
      3: 'Parcial - Algunas secciones memorizadas',
      4: 'Bien memorizado - Mayor parte memorizada',
      5: 'Totalmente memorizado - Obra completamente memorizada'
    },
    tips: [
      'Memorizar por secciones pequeñas',
      'Practicar sin partitura gradualmente',
      'Usar análisis armónico como ayuda'
    ]
  }
} as const

// Enhanced instrument families with more detail
export const INSTRUMENT_FAMILIES = [
  'Cuerda frotada',
  'Cuerda pulsada',
  'Viento-madera',
  'Viento-metal',
  'Percusión melódica',
  'Percusión rítmica',
  'Teclado',
  'Voz',
  'Electrónico',
  'Tradicional',
  'Otro'
] as const

// Enhanced common keys with more options
export const COMMON_KEYS = [
  // Mayores
  'Do Mayor', 'Sol Mayor', 'Re Mayor', 'La Mayor', 'Mi Mayor', 'Si Mayor', 'Fa# Mayor', 'Do# Mayor',
  'Fa Mayor', 'Sib Mayor', 'Mib Mayor', 'Lab Mayor', 'Reb Mayor', 'Solb Mayor', 'Dob Mayor',
  // Menores
  'La menor', 'Mi menor', 'Si menor', 'Fa# menor', 'Do# menor', 'Sol# menor', 'Re# menor', 'La# menor',
  'Re menor', 'Sol menor', 'Do menor', 'Fa menor', 'Sib menor', 'Mib menor', 'Lab menor'
] as const

// Enhanced tempo markings
export const COMMON_TEMPOS = [
  'Larghissimo (< 20)', 'Grave (20-40)', 'Largo (40-60)', 'Larghetto (60-66)', 
  'Adagio (66-76)', 'Andante (76-108)', 'Moderato (108-120)', 'Allegretto (120-168)',
  'Allegro (120-168)', 'Vivace (168-176)', 'Presto (168-200)', 'Prestissimo (> 200)'
] as const

// Enhanced time signatures
export const COMMON_TIME_SIGNATURES = [
  '4/4', '3/4', '2/4', '6/8', '9/8', '12/8', '2/2', '3/8', '5/4', '7/8', '5/8', '6/4', '9/4'
] as const