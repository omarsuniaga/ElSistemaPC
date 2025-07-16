// This file defines shared types used across the teacher module components.

import type { FunctionalComponent, SVGAttributes } from 'vue';

export interface ClassScheduleSlot {
  day: string
  startTime: string
  endTime: string
}

export interface ClassData {
  id: string
  name: string
  description?: string
  level?: string
  teacherId?: string
  studentIds?: string[]
  schedule?: {
    slots: ClassScheduleSlot[]
  }
  classroom?: string
  instrument?: string
  createdAt?: Date | any // Allow Firestore Timestamp
  updatedAt?: Date | any // Allow Firestore Timestamp
  status?: string
}

export interface DashboardMetric {
  title: string
  value: number | string
  icon: FunctionalComponent<SVGAttributes>
  color: string
}

export interface Notification {
  id: number | string
  title: string
  message: string
  date: Date | string | number // Allow various date representations
  read: boolean
  type: 'info' | 'reminder' | 'warning' | 'error'
}

// Interface for AbsenceAlertList component methods
export interface AbsenceReport {
  student: {
    id: string
    nombre: string
    apellido: string
    instrumento?: string
    parentPhone?: string
  }
  absences: number
  absenceDates?: (Date | any)[] // Allow Firestore Timestamps
}

export interface AbsenceAlertListExposed {
  analyzeWeeklyAbsences: () => void
  analyzeMonthlyAbsences: () => void
  getWeeklyAbsences: () => AbsenceReport[]
  getMonthlyAbsences: () => AbsenceReport[]
  debugDateInfo?: Record<string, unknown>
}
