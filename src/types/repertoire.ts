export interface Measure {
  id: number
  number: number
  progress: number
  difficulty: 'easy' | 'medium' | 'hard'
  notes: string
  lastPracticed?: string
  studentProgress?: Record<string, number> // Map de student.id -> progress
}

export interface Instrument {
  id: number
  name: string
  measures: Measure[]
  section: 'strings' | 'woodwinds' | 'brass' | 'percussion' | 'other'
  studentProgress?: Record<string, number> // Progreso general del estudiante en este instrumento
}

export interface InstrumentSection {
  name: 'strings' | 'woodwinds' | 'brass' | 'percussion' | 'other'
  displayName: string
  instruments: string[]
  progress: number
}

export interface MusicalWork {
  id: number
  title: string
  composer: string
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  instruments: Instrument[]
  score?: string // URL to score file
  audio?: string // URL to audio file
  progress: number
  sectionProgress?: Record<string, number> // Progreso por sección
  studentProgress?: Record<string, number> // Progreso general por estudiante
  createdAt: string
  updatedAt: string
}

export interface Repertoire {
  id: number
  name: string
  description: string
  tags: string[]
  category: string
  works: MusicalWork[]
  progress: number
  createdAt: string
  updatedAt: string
}

export interface PracticeNote {
  id: number
  workId: number
  measureId: number
  instrumentId: number
  studentId: string
  note: string
  date: string
}

export interface PracticeReminder {
  id: number
  workId: number
  title: string
  description: string
  date: string
  completed: boolean
  studentId?: string
  instrumentId?: number
}

export const INSTRUMENT_SECTIONS: InstrumentSection[] = [
  {
    name: 'strings',
    displayName: 'Cuerdas',
    instruments: ['Violín', 'Viola', 'Violonchelo', 'Contrabajo'],
    progress: 0,
  },
  {
    name: 'woodwinds',
    displayName: 'Vientos Madera',
    instruments: ['Flauta', 'Clarinete', 'Oboe', 'Fagot'],
    progress: 0,
  },
  {
    name: 'brass',
    displayName: 'Vientos Metal',
    instruments: ['Trompeta', 'Trombón', 'Trompa', 'Tuba'],
    progress: 0,
  },
  {
    name: 'percussion',
    displayName: 'Percusión',
    instruments: ['Percusión', 'Timbales', 'Platillos'],
    progress: 0,
  },
  {
    name: 'other',
    displayName: 'Otros',
    instruments: ['Piano', 'Guitarra', 'Arpa'],
    progress: 0,
  },
];
