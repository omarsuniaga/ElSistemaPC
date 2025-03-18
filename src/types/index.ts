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
  documentUrl?: string;
  timestamp?: string;  // Changed from 'date' to 'timestamp' to match usage
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
  id: string
  name: string
  teacherId: string
  studentIds: string[]
  level: string
  instrument: string
  schedule: string | {
    days: string[]
    startTime?: string
    endTime?: string
  }
  description?: string
  contentIds: string[]
  createdAt: string
  updatedAt?: string
  status?: string
}

export interface ClassRecord {
  classId: string
  studentId: string
  attendance: AttendanceRecord[]
  grades: GradeRecord[]
  createdAt: string
  updatedAt?: string
}

export interface ClassTheme {
  id: string
  classId: string
  themeId: string
  createdAt: string
  updatedAt?: string
} 

export interface ClassIndicator {
  id: string
  classId: string
  indicatorId: string
  createdAt: string
  updatedAt?: string
}

export interface ClassContent {
  id: string
  classId: string
  contentId: string
  createdAt: string
  updatedAt?: string
}

export interface ClassWorkspace {
  classId: string
  elements: WorkspaceElement[]
  createdAt: string
  updatedAt?: string
}

export interface ClassAttendance {
  classId: string
  studentId: string
  attendance: AttendanceRecord[]
  createdAt: string
  updatedAt?: string
}

export interface UserProfile {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  photoURL: string;
  address: string;
  role: 'student' | 'teacher';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt?: string;
  preferences?: UserSettings;
  achievements?: Achievement[];
  stats?: {
    totalClasses: number;
    averageRating: number;
    [key: string]: any;
  };
  lastLogin?: string;
  displayName?: string;
}

export interface UserSettings {
  id: string
  userId: string
  darkMode: boolean
  notifications: boolean
  createdAt: string
  updatedAt?: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  points: number
  criteria: string
  createdAt: string
  updatedAt?: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'alert' | 'reminder'
  status: 'read' | 'unread'
  createdAt: string
  updatedAt?: string
}

export interface ActivityLog {
  type: string;
  description: string;
  metadata?: any;
  userId: string;
  createdAt: string;
}