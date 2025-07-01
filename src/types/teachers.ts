export interface Teacher {
  id: string
  name: string
  photoURL?: string
  specialties?: string[]
  experiencia?: any
  phone?: string
  email?: string
}

export interface Schedule {
  totalClasses: number
  weeklyHours: number
  hasConflicts?: boolean
  schedule: ScheduleItem[]
}

export interface ScheduleItem {
  dayOfWeek: string
  className: string
  startTime: string
  endTime: string
  classId?: string
  room?: string
  studentCount?: number
  students?: StudentReference[]
}

export interface ScheduleSlot {
  day: string
  startTime: string
  endTime: string
}

export interface ClassItem {
  id: string
  name: string
  instrument: string
  students: StudentReference[]
}

export interface StudentReference {
  id: string
  name: string
}
