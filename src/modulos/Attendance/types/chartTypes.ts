// Shared types for attendance charts

export interface ChartDataset {
  label: string
  data: number[]
  borderColor: string
  backgroundColor: string
}

export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface TrendDataPoint {
  date: string
  value: number
}

export interface TrendData {
  present: TrendDataPoint[]
  absent: TrendDataPoint[]
  late: TrendDataPoint[]
  justified: TrendDataPoint[]
}
