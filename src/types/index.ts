// Existing types...

// Student interface
export interface Student {
  id: string;
  nombre: string;
  apellido: string;
  edad: string;
  nac: string;
  sexo: string;
  instrumento: string;
  tlf: string;
  email: string;
  madre: string;
  padre: string;
  tlf_madre: string;
  tlf_padre: string;
  colegio_trabajo: string;
  horario_colegio_trabajo: string;
  grupo: string[];
  clase: string;
  fecInscripcion: string;
  avatar: string;
  isTeacher?: boolean;
  documentos: {
    [key: string]: {
      url: string
      fecha: string
    }
  }
  createdAt?: any;
  updatedAt?: any;
}

export interface ContentIndicator {
  id: number
  name: string
  description: string
  weight: number
}

export interface ContentTheme {
  id: number
  title: string
  description: string
  weight: number
  indicators: ContentIndicator[]
}

export interface Content {
  id: number
  title: string
  description: string
  level: string
  class: string
  objectives: string[]
  prerequisites: string[]
  duration: string
  themes: ContentTheme[]  // Add this property
  indicators: ContentIndicator[]
  materials: {
    type: 'document' | 'video' | 'audio'
    url: string
    title: string
    description?: string
  }[]
  evaluationCriteria: string[]
  createdAt: string
  updatedAt?: string
}

export interface GradeRecord {
  studentId: number
  indicatorId: number
  grade: number
  comment?: string
  createdAt: string
  updatedAt?: string
}

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  classId: string;
  Fecha: string;  // Changed from 'date' to 'Fecha' to match usage
  status: AttendanceStatus;
  justification?: {
    reason?: string;
    documentUrl?: string;
    timestamp?: Date;
  };
  createdAt?: string;
  updatedAt?: string;
}

export type AttendanceStatus = 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado'

export interface AttendanceAnalytics {
  totalClasses: number
  totalStudents: number
  averageAttendance: number
  absentStudents: {
    studentId: string
    absences: number
    lastAttendance: string
    attendanceRate: number
  }[]
  byClass: Record<string, {
    present: number
    absent: number
    delayed: number
    justified: number
    total: number
  }>
}

// Repertoire types
export interface Measure {
  id: number
  number: number
  progress: number
  difficulty: 'easy' | 'medium' | 'hard'
  notes: string
  lastPracticed?: string
}

export interface Instrument {
  id: number
  name: string
  measures: Measure[]
}

export interface MusicalWork {
  id: number
  title: string
  composer: string
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  instruments: Instrument[]
  score?: string
  audio?: string
  progress: number
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
}

export interface Teacher {
  id: string
  uid: string
  name: string
  edad: string
  email: string
  phone: string
  specialties: string[]
  clases: string[]
  schedule: string[]
  statistics: string[]
  avatar?: string
  photoURL?: string
  address?: string
  experiencia?: string
  biography?: string
  status: 'activo' | 'inactivo' | 'pendiente'
  createdAt?: any
  updatedAt?: any
}

export interface TeacherSchedule {
  id: string
  teacherId: string
  dayOfWeek: string
  startTime: string
  endTime: string
  className: string
  createdAt: string
  updatedAt?: string
}

export interface TeacherInstrument {
  id: string
  teacherId: string
  level: string
  createdAt: string
  updatedAt?: string
}

export interface TeacherSpecialty { 
  id: string
  teacherId: string
  averageAttendance: number
  averageGrade: number
  lastUpdated: string
  totalStudents: number
  createdAt: string
  updatedAt?: string
}

export interface WorkspaceElement {
  id: number
  type: 'student' | 'theme' | 'indicator'
  title: string
  description?: string
  weight: number
  progress: number
  color: string
}

export interface Class {
  id: number
  name: string
  teacherId: number
  studentIds: number[]
  level: string
  instrument: string
  schedule: string | {
    days: string[]
    startTime?: string
    endTime?: string
  }
  description?: string
  contentIds: number[]
}