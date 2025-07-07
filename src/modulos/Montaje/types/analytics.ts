export interface MontajeAnalytics {
  projectId: string
  workId?: string
  period: AnalyticsPeriod
  metrics: PerformanceMetrics
  trends: TrendAnalysis
  predictions: PredictiveInsights
  comparisons: ComparisonData
  generatedAt: string
}

export interface AnalyticsReport {
  id: string
  title: string
  type: 'performance' | 'progress' | 'summary' | 'predictive'
  data: any
  generatedAt: string
  workId?: string
  instrumentId?: string
}

export interface AnalyticsPeriod {
  start: string
  end: string
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'
}

export interface PerformanceMetrics {
  overall: OverallMetrics
  byInstrument: Record<string, InstrumentMetrics>
  bySection: Record<string, SectionMetrics>
  byMember: Record<string, MemberMetrics>
}

export interface OverallMetrics {
  averageScore: number
  progressRate: number
  practiceHours: number
  attendanceRate: number
  milestoneCompletion: number
  readinessLevel: number
}

export interface InstrumentMetrics {
  instrumentId: string
  averageScore: number
  progressTrend: number
  practiceEfficiency: number
  commonIssues: string[]
  strengths: string[]
  memberCount: number
}

export interface SectionMetrics {
  sectionName: string
  cohesionScore: number
  balanceScore: number
  timingAccuracy: number
  intonationAccuracy: number
  dynamicRange: number
}

export interface MemberMetrics {
  memberId: string
  individualProgress: number
  practiceConsistency: number
  attendanceRate: number
  contributionScore: number
  improvementAreas: string[]
}

export interface TrendAnalysis {
  progressTrend: TrendData
  practiceHoursTrend: TrendData
  attendanceTrend: TrendData
  qualityTrend: TrendData
}

export interface TrendData {
  direction: 'improving' | 'declining' | 'stable'
  rate: number // percentage change
  confidence: number // 0-1
  dataPoints: DataPoint[]
}

export interface DataPoint {
  date: string
  value: number
}

export interface PredictiveInsights {
  readinessDate: string
  confidenceLevel: number
  riskFactors: RiskFactor[]
  recommendations: Recommendation[]
  milestoneForecasts: MilestoneForecast[]
}

export interface RiskFactor {
  type: 'attendance' | 'progress' | 'quality' | 'time' | 'resources'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  impact: string
  mitigation: string[]
}

export interface Recommendation {
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'practice' | 'scheduling' | 'resources' | 'technique' | 'management'
  title: string
  description: string
  expectedImpact: string
  effort: 'low' | 'medium' | 'high'
  timeline: string
}

export interface MilestoneForecast {
  milestoneId: string
  name: string
  originalDate: string
  forecastedDate: string
  probability: number
  dependencies: string[]
}

export interface ComparisonData {
  historicalComparison: HistoricalComparison
  peerComparison: PeerComparison
  benchmarkComparison: BenchmarkComparison
}

export interface HistoricalComparison {
  previousProjects: ProjectComparison[]
  seasonalTrends: SeasonalTrend[]
}

export interface ProjectComparison {
  projectId: string
  name: string
  similarity: number
  performanceComparison: Record<string, number>
}

export interface SeasonalTrend {
  season: string
  averageMetrics: Record<string, number>
  patterns: string[]
}

export interface PeerComparison {
  similarProjects: PeerProject[]
  industryAverages: Record<string, number>
  ranking: ProjectRanking
}

export interface PeerProject {
  id: string
  name: string
  organization: string
  metrics: Record<string, number>
  anonymized: boolean
}

export interface ProjectRanking {
  overall: number
  byCategory: Record<string, number>
  percentile: number
}

export interface BenchmarkComparison {
  industryStandards: Record<string, number>
  bestPractices: BestPractice[]
  improvementOpportunities: ImprovementOpportunity[]
}

export interface BestPractice {
  category: string
  practice: string
  description: string
  expectedBenefit: string
  implementationGuide: string[]
}

export interface ImprovementOpportunity {
  area: string
  currentScore: number
  benchmarkScore: number
  gap: number
  priority: 'low' | 'medium' | 'high'
  actionItems: string[]
}