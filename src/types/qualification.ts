export interface QualificationCard {
  id: string
  classId: string
  date: string
  contentTitle: string
  contentSubtitle: string
  group: string[]
  indicators: QualificationIndicator[]
  comments?: string
  locked: boolean
  hideProgress: boolean
}
export interface QualificationIndicator {
  uniqueId: string
  label: string
  score: number
}

export interface QualificationIndicatorCard {
  id: string
  name: string
  value: number
  maxValue: number
}

export interface QualificationCardForm {
  id: string
  classId: string
  title: string
  description?: string
  locked: boolean
  hideProgress: boolean
  indicators: QualificationIndicatorCard[]
  comments?: string
  createdAt?: Date
  updatedAt?: Date
}

// Interface for qualification data
export interface QualificationData {
  id?: string // Firestore ID
  classId: string // Class ID
  date?: string // Date of qualification
  contentTitle: string // Title of the qualification
  contentSubtitle?: string // Subtitle of the qualification
  group: string[] // Array of student IDs
  indicators: {
    // Array of indicators
    uniqueId: string // Unique ID
    label: string // Indicator label
    score: number // Indicator score
  }[]
  comments?: string // Comments
  locked: boolean // Whether the qualification is locked
  hideProgress?: boolean // Whether to hide progress
  createdAt?: string // Created timestamp
  updatedAt?: string // Updated timestamp
}
