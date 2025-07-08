export enum DificultadFrase {
  FACIL = 'FACIL',
  MEDIO = 'MEDIO',
  DIFICIL = 'DIFICIL',
  MUY_DIFICIL = 'MUY_DIFICIL'
}

export enum TipoInstrumento {
  // Cuerdas
  VIOLIN_I = 'VIOLIN_I',
  VIOLIN_II = 'VIOLIN_II',
  VIOLA = 'VIOLA',
  CELLO = 'CELLO',
  CONTRABASS = 'CONTRABASS',
  HARP = 'HARP',
  
  // Vientos Madera
  FLUTE = 'FLUTE',
  PICCOLO = 'PICCOLO',
  OBOE = 'OBOE',
  ENGLISH_HORN = 'ENGLISH_HORN',
  CLARINET = 'CLARINET',
  BASS_CLARINET = 'BASS_CLARINET',
  BASSOON = 'BASSOON',
  CONTRABASSOON = 'CONTRABASSOON',
  SAXOPHONE = 'SAXOPHONE',
  
  // Vientos Metal
  TRUMPET = 'TRUMPET',
  FRENCH_HORN = 'FRENCH_HORN',
  TROMBONE = 'TROMBONE',
  BASS_TROMBONE = 'BASS_TROMBONE',
  TUBA = 'TUBA',
  
  // Percusión
  TIMPANI = 'TIMPANI',
  PERCUSSION = 'PERCUSSION',
  PIANO = 'PIANO',
  CELESTA = 'CELESTA',
  
  // Otros
  VOICE = 'VOICE',
  CHOIR = 'CHOIR',
  OTHER = 'OTHER'
}

export enum EstadoCompass {
  SIN_TRABAJAR = 'SIN_TRABAJAR',
  LEIDO = 'LEIDO',
  EN_PROGRESO = 'EN_PROGRESO',
  CON_DIFICULTAD = 'CON_DIFICULTAD',
  LOGRADO = 'LOGRADO',
  DOMINADO = 'DOMINADO',
  COMPLETADO = 'COMPLETADO',
  NO_TRABAJADO = 'NO_TRABAJADO'
}

export interface MontajeProject {
  id: string
  name: string
  description: string
  director: string
  organization: string
  season: string
  startDate: string
  endDate: string
  status: 'planning' | 'active' | 'completed' | 'archived'
  works: string[] // Array of work IDs
  members: ProjectMember[]
  settings: MontajeSettings
  createdAt: string
  updatedAt: string
  ownerId: string
}

export interface ProjectMember {
  id: string
  name: string
  email: string
  role: 'director' | 'assistant' | 'section_leader' | 'musician'
  instruments: string[]
  joinedAt: string
  permissions: MontajePermission[]
}

export interface MontajePermission {
  resource: 'works' | 'evaluations' | 'reports' | 'members' | 'settings'
  actions: ('create' | 'read' | 'update' | 'delete' | 'export')[]
}

export interface MontajeSettings {
  evaluationFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  autoReminders: boolean
  reportGeneration: 'manual' | 'automatic'
  exportFormats: ('pdf' | 'excel' | 'csv')[]
  integrations: {
    calendar: boolean
    email: boolean
    metronome: boolean
    tuner: boolean
  }
}

export interface MontajeSession {
  id: string
  projectId: string
  workId: string
  type: 'general' | 'sectional' | 'individual'
  date: string
  duration: number // minutes
  attendees: string[] // member IDs
  objectives: string[]
  achievements: string[]
  notes: string
  recordings?: SessionRecording[]
  evaluations: SessionEvaluation[]
  createdBy: string
  createdAt: string
}

export interface SessionRecording {
  id: string
  filename: string
  duration: number
  size: number
  uploadedAt: string
  transcription?: string
}

export interface SessionEvaluation {
  memberId: string
  instrumentId: string
  scores: Record<string, number>
  notes: string
  improvements: string[]
  nextGoals: string[]
}

export interface MontajeCalendar {
  id: string
  projectId: string
  events: CalendarEvent[]
}

export interface CalendarEvent {
  id: string
  title: string
  type: 'rehearsal' | 'sectional' | 'performance' | 'evaluation' | 'meeting'
  startDate: string
  endDate: string
  location?: string
  description?: string
  attendees: string[]
  workIds: string[]
  reminders: EventReminder[]
}

export interface EventReminder {
  type: 'email' | 'push' | 'sms'
  timing: number // minutes before event
  enabled: boolean
}