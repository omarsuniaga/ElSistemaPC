// Tipos compartidos entre módulos
export interface SharedUser {
  id: string
  name: string
  email: string
  role: string
  permissions: string[]
  preferences?: Record<string, any>
}

export interface SharedProject {
  id: string
  name: string
  description: string
  type: string
  status: string
  members: string[]
  createdAt: string
}

export interface ModuleEvent {
  type: string
  source: string
  target?: string
  data: any
  timestamp: string
}

export interface GlobalConfig {
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  features: Record<string, boolean>
}