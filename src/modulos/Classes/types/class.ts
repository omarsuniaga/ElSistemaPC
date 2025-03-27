import { AttendanceRecord } from '../../Attendance/types/attendance'
import type { WorkspaceElement } from '../../Workspace/types/workspace'

export interface ClassData {
  id: string;
  name: string;
  description?: string;
  level?: string;
  instrument?: string;
  teacherId?: string;
  studentIds?: string[];
  schedule?: string | { days: string[], startTime: string, endTime: string };
  classroom?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface GradeRecord {
  studentId: number
  indicatorId: number
  grade: number
  comment?: string
  createdAt: string
  updatedAt?: string
}

export interface Class {
  id: string
  name: string
  teacherId: string
  studentIds: string[]
  level: string
  instrument: string
  schedule: {
    days: boolean
    startTime: string
    endTime: string
    slots: {
      day: string
      startTime: string
      endTime: string
    }[]
  }
  description?: string
  contentIds: string[]
  createdAt: string
  updatedAt?: {
    seconds: number
    nanoseconds: number
  }
  status?: string
  classroom?: string
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