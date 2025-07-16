export interface KpiData {
  title: string
  value: string | number
  trend: number
  icon: any
  metricType?: 'currency' | 'percentage' | 'default'
}

export interface ReportConfig {
  reportType: 'pdf' | 'xls' | 'html'
  metrics: string[]
  dateRange: {
    start: Date
    end: Date
  }
  filters?: Record<string, any>
}

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor: string[]
  borderColor: string[]
  borderWidth: number
}

export interface AnalyticsState {
  dashboardMetrics: Record<string, any>
  generatedReports: ReportConfig[]
  chartData: {
    labels: string[]
    datasets: ChartDataset[]
  }
}
