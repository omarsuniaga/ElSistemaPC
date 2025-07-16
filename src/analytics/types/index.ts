// Registro de tipos y interfaces para el módulo de Analytics
// Este archivo asegura que TypeScript reconozca todos los tipos

export interface KeyInsight {
  id: string
  title: string
  description: string
  category: 'attendance' | 'performance' | 'engagement' | 'efficiency'
  metric: number
  trend: 'up' | 'down' | 'stable'
  actionable: boolean
}

export interface SmartRecommendation {
  id: string
  type: 'optimization' | 'alert' | 'opportunity'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  priority: number
  automated: boolean
  estimatedImprovement: number
}

export interface RiskStudent {
  id: string
  name: string
  riskLevel: 'high' | 'medium' | 'low'
  lastAttendance: Date
  attendanceRate: number
  subjects: string[]
  reasons: string[]
  recommendedActions: string[]
}

export interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  actionRequired: boolean
  resolved: boolean
  relatedStudent?: string
  relatedClass?: string
}

export interface AttendancePrediction {
  date: string
  predicted: number
  confidence: number
  factors: string[]
  riskLevel: 'low' | 'medium' | 'high'
}

export interface AnalyticsMetrics {
  totalStudents: number
  averageAttendance: number
  activeClasses: number
  healthScore: number
  riskStudentsCount: number
  improvementTrend: number
}

// Tipos para componentes de charts
export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

export interface TrendDataPoint {
  date: string
  value: number
  prediction?: number
}

// Tipos para configuración de analytics
export interface AnalyticsConfig {
  refreshInterval: number
  enableRealTimeUpdates: boolean
  predictionDays: number
  riskThresholds: {
    high: number
    medium: number
    low: number
  }
}

// Estado del composable de analytics
export interface AnalyticsState {
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  metrics: AnalyticsMetrics | null
  insights: KeyInsight[]
  recommendations: SmartRecommendation[]
  riskStudents: RiskStudent[]
  alerts: Alert[]
  predictions: AttendancePrediction[]
}

// Parámetros para filtros y configuración
export interface AnalyticsFilters {
  dateRange: {
    start: Date
    end: Date
  }
  instruments?: string[]
  teachers?: string[]
  classes?: string[]
  riskLevels?: ('high' | 'medium' | 'low')[]
}

export interface AnalyticsOptions {
  enableML: boolean
  enablePredictions: boolean
  enableRealTimeAlerts: boolean
  autoRefresh: boolean
  refreshInterval: number
}
