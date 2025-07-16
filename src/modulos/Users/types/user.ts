export interface UserProfile {
  id: string
  uid: string
  name: string
  email: string
  phone: string
  photoURL: string
  address: string
  role: 'student' | 'teacher'
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
  updatedAt?: string
  preferences?: UserSettings
  achievements?: Achievement[]
  stats?: {
    totalClasses: number
    averageRating: number
    [key: string]: any
  }
  lastLogin?: string
  displayName?: string
}

export interface UserSession {
  id: string
  userId: string
  startTime: Date | string
  endTime?: Date | string
  device?: string
  ipAddress?: string
  actions?: string[]
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
  type: string
  description: string
  metadata?: any
  userId: string
  createdAt: string
}
