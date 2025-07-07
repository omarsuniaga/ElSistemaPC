export interface MontajeNotification {
  id: string
  userId: string
  projectId: string
  type: NotificationType
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: NotificationCategory
  data: NotificationData
  read: boolean
  actionUrl?: string
  actionLabel?: string
  expiresAt?: string
  createdAt: string
}

export type NotificationType = 
  | 'evaluation_due'
  | 'session_reminder'
  | 'milestone_reached'
  | 'performance_alert'
  | 'member_joined'
  | 'work_updated'
  | 'report_ready'
  | 'system_update'
  | 'deadline_approaching'
  | 'achievement_unlocked'

export type NotificationCategory = 
  | 'evaluation'
  | 'session'
  | 'progress'
  | 'social'
  | 'system'
  | 'achievement'

export interface NotificationData {
  workId?: string
  sessionId?: string
  memberId?: string
  evaluationId?: string
  reportId?: string
  milestoneId?: string
  metadata?: Record<string, any>
}

export interface NotificationRule {
  id: string
  projectId: string
  name: string
  description: string
  trigger: NotificationTrigger
  conditions: NotificationCondition[]
  actions: NotificationAction[]
  enabled: boolean
  createdBy: string
  createdAt: string
}

export interface NotificationTrigger {
  type: 'schedule' | 'event' | 'threshold' | 'manual'
  schedule?: CronExpression
  event?: EventTrigger
  threshold?: ThresholdTrigger
}

export interface CronExpression {
  minute: string
  hour: string
  dayOfMonth: string
  month: string
  dayOfWeek: string
}

export interface EventTrigger {
  eventType: string
  source: string
  filters: Record<string, any>
}

export interface ThresholdTrigger {
  metric: string
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  value: number
  duration?: number // minutes
}

export interface NotificationCondition {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'in'
  value: any
}

export interface NotificationAction {
  type: 'email' | 'push' | 'sms' | 'webhook' | 'internal'
  template: string
  recipients: NotificationRecipient[]
  settings: Record<string, any>
}

export interface NotificationRecipient {
  type: 'user' | 'role' | 'group' | 'email'
  identifier: string
}

export interface NotificationTemplate {
  id: string
  name: string
  type: NotificationType
  subject: string
  body: string
  variables: TemplateVariable[]
  createdAt: string
}

export interface TemplateVariable {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  description: string
  required: boolean
  defaultValue?: any
}