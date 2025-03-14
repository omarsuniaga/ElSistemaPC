export type AlertType = 
  | 'consecutive_absences' 
  | 'low_attendance_rate' 
  | 'improvement' 
  | 'first_absence' 
  | 'late_pattern'
  | 'perfect_attendance'

export type AlertPriority = 'high' | 'medium' | 'low'

export type AlertStatus = 'pending' | 'sent' | 'read' | 'dismissed'

export interface AttendanceAlert {
  id: string
  studentId: number
  type: AlertType
  priority: AlertPriority
  message: string
  status: AlertStatus
  createdAt: string
  updatedAt: string
  metadata: {
    threshold?: number
    count?: number
    rate?: number
    period?: {
      start: string
      end: string
    }
  }
}

export interface AlertRule {
  type: AlertType
  threshold: number
  enabled: boolean
  priority: AlertPriority
  message: string
  notifyParents: boolean
  notifyTeachers: boolean
}
