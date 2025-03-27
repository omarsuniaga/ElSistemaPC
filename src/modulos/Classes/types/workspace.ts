export interface WorkspaceElement {
  id: number
  type: 'student' | 'theme' | 'indicator'
  title: string
  description?: string
  weight: number
  progress: number
  color: string
}

export interface Workspace {
  id: string
  name: string
  description?: string
  elements: WorkspaceElement[]
  createdBy: string
  createdAt: string
  updatedAt?: string
  classId?: string
  studentIds?: string[]
}

export interface WorkspaceCard {
  id: string
  title: string
  description: string
  progress: number
  students: {
    id: string
    name: string
  }[]
  color: string
  type: string
}