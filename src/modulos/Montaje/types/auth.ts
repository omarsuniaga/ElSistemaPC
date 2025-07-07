export interface MontajeUser {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'director' | 'assistant' | 'musician'
  instruments: string[]
  experience: 'beginner' | 'intermediate' | 'advanced' | 'professional'
  projects: string[] // Project IDs
  preferences: UserPreferences
  createdAt: string
  lastLogin?: string
}

export interface UserPreferences {
  language: 'es' | 'en' | 'fr' | 'de'
  timezone: string
  notifications: NotificationPreferences
  display: DisplayPreferences
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  evaluationReminders: boolean
  sessionReminders: boolean
  progressAlerts: boolean
  milestoneNotifications: boolean
}

export interface DisplayPreferences {
  theme: 'light' | 'dark' | 'auto'
  compactMode: boolean
  defaultView: 'grid' | 'list'
  showAdvancedMetrics: boolean
}

export interface AuthSession {
  user: MontajeUser | null
  token: string | null
  isAuthenticated: boolean
  permissions: string[]
  currentProject: string | null
}