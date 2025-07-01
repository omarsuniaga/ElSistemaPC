import Chart from "chart.js/auto"
import {
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  BubbleController,
  DoughnutController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  Decimation,
  Filler,
  Legend,
  Title,
  Tooltip,
  SubTitle,
} from "chart.js"

// Register all the Chart.js components we need
Chart.register(
  // Elements
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  // Controllers
  BarController,
  BubbleController,
  DoughnutController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  // Scales
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  // Plugins
  Decimation,
  Filler,
  Legend,
  Title,
  Tooltip,
  SubTitle
)

export default Chart
