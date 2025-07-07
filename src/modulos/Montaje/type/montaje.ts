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
}

export interface ProjectMember {
  id: string
  userId: string
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