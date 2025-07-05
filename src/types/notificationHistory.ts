export interface NotificationHistory {
  id: string
  studentId: string
  studentName: string
  sentTo: string
  type: string
  messageContent: string
  timestamp: Date
  weeklyCount?: number
  escalationLevel?: number
}
