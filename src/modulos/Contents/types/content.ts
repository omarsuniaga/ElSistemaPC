export interface Content {
  id: string
  title: string
  description?: string
  category?: string
  content?: string
  thumbnail?: string
  createdAt?: any // FirebaseTimestamp or Date
  updatedAt?: any // FirebaseTimestamp or Date
  authorId?: string
  authorName?: string
  tags?: string[]
  level?: "básico" | "intermedio" | "avanzado" | string
  contentType?: "texto" | "video" | "audio" | "documento" | "partitura" | string
  status?: "publicado" | "borrador" | "archivado" | string
  mediaUrl?: string
  attachments?: Array<{
    name: string
    url: string
    type: string
    size?: number
  }>
  order?: number
  viewCount?: number
  downloadCount?: number
  recommendedFor?: string[]
  instrument?: string
  duration?: number // in minutes
}

export interface ContentState {
  contents: Content[]
  loading: boolean
  error: string | null
  lastSync: Date | null
}

export interface ContentIndicator {
  id: number
  name: string
  description: string
  weight: number
}

export interface ContentTheme {
  id: number
  title: string
  description: string
  weight: number
  indicators: ContentIndicator[]
}

export interface GradeRecord {
  studentId: number
  indicatorId: number
  grade: number
  comment?: string
  createdAt: string
  updatedAt?: string
}
