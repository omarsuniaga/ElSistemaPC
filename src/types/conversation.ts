export interface Conversation {
  id: string
  studentId: string
  studentName: string
  from: string
  message: string
  timestamp: Date
  direction: 'incoming' | 'outgoing'
  processed: boolean
}
