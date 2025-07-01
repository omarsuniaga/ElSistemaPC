export interface Notification {
  // <!-- id, title, message, date, read, type,  -->
  id: string
  title: string
  type: NotificationType
  message: string
  date: Date
  read: boolean
  sender?: {
    id: string
    name: string
    role?: string
  }
  priority?: "high" | "normal" | "low"
  courseId?: string
  lessonId?: string
  eventId?: string
  actionUrl?: string
}

export enum NotificationType {
  // <!-- general, announcement, reminder, message, lesson_scheduled, lesson_cancelled, payment_due, payment_received -->
  General = "general",
  Info = "info",
  Warning = "warning",
  Error = "error",
  Success = "success",
  Announcement = "announcement",
  Reminder = "reminder",
  Message = "message",
  LessonScheduled = "lesson_scheduled",
}
