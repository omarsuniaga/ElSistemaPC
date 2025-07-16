/**
 * 📊 SERVICIO DE ANALYTICS AVANZADO
 * Sistema completo de análisis de datos y métricas inteligentes
 */

import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import {
  attendancePredictionModel,
  AttendancePrediction,
} from '@/analytics/ml/attendancePredictionModel';

export interface AnalyticsMetrics {
  overview: OverviewMetrics
  attendance: AttendanceMetrics
  performance: PerformanceMetrics
  predictions: PredictionMetrics
  trends: TrendMetrics
  alerts: AlertMetrics
}

export interface OverviewMetrics {
  totalStudents: number
  activeClasses: number
  averageAttendance: number
  attendanceTrend: number
  topPerformingClasses: ClassPerformance[]
  lowPerformingClasses: ClassPerformance[]
}

export interface AttendanceMetrics {
  dailyAttendance: DailyAttendanceData[]
  weeklyTrends: WeeklyTrendData[]
  monthlyComparison: MonthlyComparisonData[]
  absenteeismRate: number
  punctualityRate: number
  consistencyScore: number
}

export interface PerformanceMetrics {
  classRankings: ClassRanking[]
  teacherPerformance: TeacherPerformance[]
  studentProgress: StudentProgress[]
  instrumentPopularity: InstrumentData[]
}

export interface PredictionMetrics {
  riskStudents: RiskStudent[]
  attendanceForecast: AttendanceForecast[]
  optimalScheduling: ScheduleRecommendation[]
  capacityPredictions: CapacityPrediction[]
}

export interface TrendMetrics {
  seasonalPatterns: SeasonalPattern[]
  dayOfWeekPatterns: DayPattern[]
  timeSlotEfficiency: TimeSlotData[]
  enrollmentTrends: EnrollmentTrend[]
}

export interface AlertMetrics {
  criticalAlerts: Alert[]
  recommendations: Recommendation[]
  anomalies: Anomaly[]
  opportunities: Opportunity[]
}

export interface ClassPerformance {
  classId: string
  className: string
  teacher: string
  attendanceRate: number
  studentCount: number
  trend: number
}

export interface DailyAttendanceData {
  date: string
  present: number
  absent: number
  rate: number
  expected: number
}

export interface WeeklyTrendData {
  week: string
  attendance: number[]
  average: number
  trend: 'up' | 'down' | 'stable'
}

export interface RiskStudent {
  studentId: string
  studentName: string
  riskLevel: 'high' | 'medium' | 'low'
  probability: number
  lastAttendance: string
  factors: string[]
  recommendations: string[]
}

export interface Alert {
  id: string
  type: 'attendance' | 'performance' | 'capacity' | 'system'
  severity: 'critical' | 'warning' | 'info'
  message: string
  affectedItems: string[]
  recommendedActions: string[]
  timestamp: Date
}

export interface Recommendation {
  id: string
  category: 'scheduling' | 'engagement' | 'capacity' | 'communication'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  estimatedImprovement: number
}

export class AdvancedAnalyticsService {
  private cache: Map<string, {data: any; timestamp: number}> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * 📊 Obtiene métricas completas del sistema
   */
  async getComprehensiveMetrics(dateRange: DateRange): Promise<AnalyticsMetrics> {
    console.log('📊 Obteniendo métricas comprehensivas...');

    const cacheKey = `metrics-${dateRange.start}-${dateRange.end}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const [overview, attendance, performance, predictions, trends, alerts] = await Promise.all([
      this.getOverviewMetrics(dateRange),
      this.getAttendanceMetrics(dateRange),
      this.getPerformanceMetrics(dateRange),
      this.getPredictionMetrics(dateRange),
      this.getTrendMetrics(dateRange),
      this.getAlertMetrics(dateRange),
    ]);

    const metrics: AnalyticsMetrics = {
      overview,
      attendance,
      performance,
      predictions,
      trends,
      alerts,
    };

    this.setCache(cacheKey, metrics);
    return metrics;
  }

  /**
   * 🎯 Métricas de overview general
   */
  async getOverviewMetrics(dateRange: DateRange): Promise<OverviewMetrics> {
    const [totalStudents, activeClasses, attendanceData, classPerformances] = await Promise.all([
      this.getTotalStudentsCount(),
      this.getActiveClassesCount(),
      this.getAttendanceDataForRange(dateRange),
      this.getClassPerformances(dateRange),
    ]);

    const averageAttendance = this.calculateAverageAttendance(attendanceData);
    const attendanceTrend = this.calculateAttendanceTrend(attendanceData);

    const sortedClasses = classPerformances.sort((a, b) => b.attendanceRate - a.attendanceRate);
    const topPerformingClasses = sortedClasses.slice(0, 5);
    const lowPerformingClasses = sortedClasses.slice(-5).reverse();

    return {
      totalStudents,
      activeClasses,
      averageAttendance,
      attendanceTrend,
      topPerformingClasses,
      lowPerformingClasses,
    };
  }

  /**
   * 📈 Métricas de asistencia detalladas
   */
  async getAttendanceMetrics(dateRange: DateRange): Promise<AttendanceMetrics> {
    const attendanceData = await this.getDetailedAttendanceData(dateRange);

    const dailyAttendance = this.processDailyAttendance(attendanceData);
    const weeklyTrends = this.processWeeklyTrends(attendanceData);
    const monthlyComparison = this.processMonthlyComparison(attendanceData);

    const absenteeismRate = this.calculateAbsenteeismRate(attendanceData);
    const punctualityRate = this.calculatePunctualityRate(attendanceData);
    const consistencyScore = this.calculateConsistencyScore(attendanceData);

    return {
      dailyAttendance,
      weeklyTrends,
      monthlyComparison,
      absenteeismRate,
      punctualityRate,
      consistencyScore,
    };
  }

  /**
   * 🎯 Métricas de rendimiento
   */
  async getPerformanceMetrics(dateRange: DateRange): Promise<PerformanceMetrics> {
    const [classRankings, teacherPerformance, studentProgress, instrumentPopularity] =
      await Promise.all([
        this.getClassRankings(dateRange),
        this.getTeacherPerformance(dateRange),
        this.getStudentProgress(dateRange),
        this.getInstrumentPopularity(dateRange),
      ]);

    return {
      classRankings,
      teacherPerformance,
      studentProgress,
      instrumentPopularity,
    };
  }

  /**
   * 🔮 Métricas predictivas
   */
  async getPredictionMetrics(dateRange: DateRange): Promise<PredictionMetrics> {
    console.log('🔮 Generando predicciones...');

    // Entrenar modelo con datos históricos
    const historicalData = await this.getHistoricalAttendanceData();
    await attendancePredictionModel.trainModel(historicalData);

    const [riskStudents, attendanceForecast, optimalScheduling, capacityPredictions] =
      await Promise.all([
        this.identifyRiskStudents(),
        this.generateAttendanceForecast(),
        this.generateScheduleRecommendations(),
        this.predictCapacityNeeds(),
      ]);

    return {
      riskStudents,
      attendanceForecast,
      optimalScheduling,
      capacityPredictions,
    };
  }

  /**
   * 📊 Métricas de tendencias
   */
  async getTrendMetrics(dateRange: DateRange): Promise<TrendMetrics> {
    const attendanceData = await this.getDetailedAttendanceData(dateRange);

    const seasonalPatterns = this.analyzeSeasonalPatterns(attendanceData);
    const dayOfWeekPatterns = this.analyzeDayOfWeekPatterns(attendanceData);
    const timeSlotEfficiency = this.analyzeTimeSlotEfficiency(attendanceData);
    const enrollmentTrends = await this.getEnrollmentTrends(dateRange);

    return {
      seasonalPatterns,
      dayOfWeekPatterns,
      timeSlotEfficiency,
      enrollmentTrends,
    };
  }

  /**
   * 🚨 Métricas de alertas y recomendaciones
   */
  async getAlertMetrics(dateRange: DateRange): Promise<AlertMetrics> {
    const [criticalAlerts, recommendations, anomalies, opportunities] = await Promise.all([
      this.generateCriticalAlerts(),
      this.generateRecommendations(),
      this.detectAnomalies(dateRange),
      this.identifyOpportunities(dateRange),
    ]);

    return {
      criticalAlerts,
      recommendations,
      anomalies,
      opportunities,
    };
  }

  /**
   * 🎯 Identifica estudiantes en riesgo
   */
  async identifyRiskStudents(): Promise<RiskStudent[]> {
    const students = await this.getAllActiveStudents();
    const riskStudents: RiskStudent[] = [];

    for (const student of students) {
      const attendanceRate = await this.getStudentAttendanceRate(student.id);
      const recentAttendance = await this.getRecentAttendance(student.id, 7); // Last 7 classes

      let riskLevel: 'high' | 'medium' | 'low' = 'low';
      let probability = 0;

      if (attendanceRate < 0.5 || recentAttendance.filter((a) => a.isPresent).length === 0) {
        riskLevel = 'high';
        probability = 0.8;
      } else if (attendanceRate < 0.7 || recentAttendance.filter((a) => a.isPresent).length <= 2) {
        riskLevel = 'medium';
        probability = 0.6;
      }

      if (riskLevel !== 'low') {
        const factors = this.identifyRiskFactors(student, recentAttendance);
        const recommendations = this.generateStudentRecommendations(riskLevel, factors);

        riskStudents.push({
          studentId: student.id,
          studentName: student.name,
          riskLevel,
          probability,
          lastAttendance: recentAttendance[0]?.date || 'No data',
          factors,
          recommendations,
        });
      }
    }

    return riskStudents.sort((a, b) => b.probability - a.probability);
  }

  /**
   * 📈 Genera pronóstico de asistencia
   */
  async generateAttendanceForecast(): Promise<AttendanceForecast[]> {
    const forecasts: AttendanceForecast[] = [];
    const classes = await this.getAllActiveClasses();

    // Próximos 30 días
    const dates = this.getNext30Days();

    for (const classInfo of classes) {
      for (const date of dates) {
        const students = await this.getClassStudents(classInfo.id);
        const predictions = await attendancePredictionModel.predictBulkAttendance(
          students,
          classInfo.id,
          [date],
        );

        const expectedAttendance = predictions.filter((p) => p.attendanceProbability > 0.5).length;
        const confidence =
          predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

        forecasts.push({
          classId: classInfo.id,
          className: classInfo.name,
          date: date.toISOString().split('T')[0],
          expectedAttendance,
          totalStudents: students.length,
          confidence,
          riskFactors: this.extractRiskFactors(predictions),
        });
      }
    }

    return forecasts;
  }

  /**
   * 🚨 Genera alertas críticas
   */
  async generateCriticalAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Alerta: Clases con baja asistencia crítica
    const lowAttendanceClasses = await this.getClassesWithLowAttendance(0.3);
    if (lowAttendanceClasses.length > 0) {
      alerts.push({
        id: `low-attendance-${Date.now()}`,
        type: 'attendance',
        severity: 'critical',
        message: `${lowAttendanceClasses.length} clases con asistencia crítica (<30%)`,
        affectedItems: lowAttendanceClasses.map((c) => c.name),
        recommendedActions: [
          'Contactar estudiantes ausentes',
          'Revisar horarios de clase',
          'Evaluar metodología de enseñanza',
        ],
        timestamp: new Date(),
      });
    }

    // Alerta: Estudiantes con ausencias prolongadas
    const longAbsentStudents = await this.getStudentsWithLongAbsences(7);
    if (longAbsentStudents.length > 0) {
      alerts.push({
        id: `long-absent-${Date.now()}`,
        type: 'attendance',
        severity: 'critical',
        message: `${longAbsentStudents.length} estudiantes con más de 7 días de ausencia`,
        affectedItems: longAbsentStudents.map((s) => s.name),
        recommendedActions: [
          'Contacto inmediato con estudiantes',
          'Reunión con padres/tutores',
          'Plan de recuperación personalizado',
        ],
        timestamp: new Date(),
      });
    }

    return alerts;
  }

  /**
   * 💡 Genera recomendaciones inteligentes
   */
  async generateRecommendations(): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Recomendación: Optimización de horarios
    const scheduleAnalysis = await this.analyzeScheduleEfficiency();
    if (scheduleAnalysis.improvementPotential > 0.15) {
      recommendations.push({
        id: `schedule-opt-${Date.now()}`,
        category: 'scheduling',
        title: 'Optimizar horarios de clase',
        description:
          'Algunos horarios muestran baja asistencia consistente. Considerar reubicación.',
        impact: 'high',
        effort: 'medium',
        estimatedImprovement: scheduleAnalysis.improvementPotential,
      });
    }

    // Recomendación: Comunicación proactiva
    const communicationGaps = await this.identifyCommunicationGaps();
    if (communicationGaps.length > 0) {
      recommendations.push({
        id: `communication-${Date.now()}`,
        category: 'communication',
        title: 'Implementar comunicación proactiva',
        description: 'Estudiantes en riesgo se beneficiarían de recordatorios automáticos.',
        impact: 'medium',
        effort: 'low',
        estimatedImprovement: 0.2,
      });
    }

    return recommendations;
  }

  // === MÉTODOS AUXILIARES ===

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private async getTotalStudentsCount(): Promise<number> {
    const studentsSnapshot = await getDocs(collection(db, 'students'));
    return studentsSnapshot.size;
  }

  private async getActiveClassesCount(): Promise<number> {
    const classesSnapshot = await getDocs(
      query(collection(db, 'classes'), where('active', '==', true)),
    );
    return classesSnapshot.size;
  }

  private async getAttendanceDataForRange(dateRange: DateRange): Promise<any[]> {
    const attendanceSnapshot = await getDocs(
      query(
        collection(db, 'attendance'),
        where('date', '>=', Timestamp.fromDate(new Date(dateRange.start))),
        where('date', '<=', Timestamp.fromDate(new Date(dateRange.end))),
        orderBy('date', 'desc'),
      ),
    );

    return attendanceSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  private calculateAverageAttendance(attendanceData: any[]): number {
    if (attendanceData.length === 0) return 0;
    const totalPresent = attendanceData.reduce(
      (sum, record) => sum + (record.presentStudents?.length || 0),
      0,
    );
    const totalExpected = attendanceData.reduce(
      (sum, record) => sum + (record.totalStudents || 0),
      0,
    );
    return totalExpected > 0 ? totalPresent / totalExpected : 0;
  }

  private calculateAttendanceTrend(attendanceData: any[]): number {
    if (attendanceData.length < 2) return 0;

    // Calcular tendencia usando regresión lineal simple
    const recentData = attendanceData.slice(0, 10); // Last 10 records
    const rates = recentData.map((record) => {
      const present = record.presentStudents?.length || 0;
      const total = record.totalStudents || 1;
      return present / total;
    });

    // Simplified trend calculation
    const firstHalf = rates.slice(0, Math.floor(rates.length / 2));
    const secondHalf = rates.slice(Math.floor(rates.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    return secondAvg - firstAvg;
  }

  private getNext30Days(): Date[] {
    const dates: Date[] = [];
    const today = new Date();

    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }

    return dates;
  }

  // Placeholder methods - implementar según necesidades específicas
  private async getClassPerformances(dateRange: DateRange): Promise<ClassPerformance[]> {
    return [];
  }
  private async getDetailedAttendanceData(dateRange: DateRange): Promise<any[]> {
    return [];
  }
  private processDailyAttendance(data: any[]): DailyAttendanceData[] {
    return [];
  }
  private processWeeklyTrends(data: any[]): WeeklyTrendData[] {
    return [];
  }
  private processMonthlyComparison(data: any[]): MonthlyComparisonData[] {
    return [];
  }
  private calculateAbsenteeismRate(data: any[]): number {
    return 0;
  }
  private calculatePunctualityRate(data: any[]): number {
    return 0;
  }
  private calculateConsistencyScore(data: any[]): number {
    return 0;
  }
  private async getClassRankings(dateRange: DateRange): Promise<ClassRanking[]> {
    return [];
  }
  private async getTeacherPerformance(dateRange: DateRange): Promise<TeacherPerformance[]> {
    return [];
  }
  private async getStudentProgress(dateRange: DateRange): Promise<StudentProgress[]> {
    return [];
  }
  private async getInstrumentPopularity(dateRange: DateRange): Promise<InstrumentData[]> {
    return [];
  }
  private async getHistoricalAttendanceData(): Promise<any[]> {
    return [];
  }
  private async getAllActiveStudents(): Promise<any[]> {
    return [];
  }
  private async getAllActiveClasses(): Promise<any[]> {
    return [];
  }
  private async getClassStudents(classId: string): Promise<any[]> {
    return [];
  }
  private analyzeSeasonalPatterns(data: any[]): SeasonalPattern[] {
    return [];
  }
  private analyzeDayOfWeekPatterns(data: any[]): DayPattern[] {
    return [];
  }
  private analyzeTimeSlotEfficiency(data: any[]): TimeSlotData[] {
    return [];
  }
  private async getEnrollmentTrends(dateRange: DateRange): Promise<EnrollmentTrend[]> {
    return [];
  }
  private async detectAnomalies(dateRange: DateRange): Promise<Anomaly[]> {
    return [];
  }
  private async identifyOpportunities(dateRange: DateRange): Promise<Opportunity[]> {
    return [];
  }
  private async getStudentAttendanceRate(studentId: string): Promise<number> {
    return 0.75;
  }
  private async getRecentAttendance(studentId: string, days: number): Promise<any[]> {
    return [];
  }
  private identifyRiskFactors(student: any, attendance: any[]): string[] {
    return [];
  }
  private generateStudentRecommendations(risk: string, factors: string[]): string[] {
    return [];
  }
  private extractRiskFactors(predictions: AttendancePrediction[]): string[] {
    return [];
  }
  private async getClassesWithLowAttendance(threshold: number): Promise<any[]> {
    return [];
  }
  private async getStudentsWithLongAbsences(days: number): Promise<any[]> {
    return [];
  }
  private async analyzeScheduleEfficiency(): Promise<{improvementPotential: number}> {
    return { improvementPotential: 0 };
  }
  private async identifyCommunicationGaps(): Promise<any[]> {
    return [];
  }
}

export interface DateRange {
  start: string
  end: string
}

// Interfaces adicionales
export interface AttendanceForecast {
  classId: string
  className: string
  date: string
  expectedAttendance: number
  totalStudents: number
  confidence: number
  riskFactors: string[]
}

export interface ClassRanking {
  classId: string
  className: string
  rank: number
  score: number
  metrics: Record<string, number>
}

export interface TeacherPerformance {
  teacherId: string
  teacherName: string
  averageAttendance: number
  studentSatisfaction: number
  classesCount: number
  trend: number
}

export interface StudentProgress {
  studentId: string
  studentName: string
  progressScore: number
  attendanceRate: number
  improvement: number
}

export interface InstrumentData {
  instrument: string
  studentCount: number
  averageAttendance: number
  popularity: number
}

export interface ScheduleRecommendation {
  currentSlot: string
  recommendedSlot: string
  expectedImprovement: number
  reason: string
}

export interface CapacityPrediction {
  date: string
  expectedDemand: number
  currentCapacity: number
  utilization: number
  recommendation: string
}

export interface SeasonalPattern {
  season: string
  averageAttendance: number
  trend: 'increasing' | 'decreasing' | 'stable'
  confidence: number
}

export interface DayPattern {
  day: string
  averageAttendance: number
  rank: number
  recommendation: string
}

export interface TimeSlotData {
  timeSlot: string
  efficiency: number
  utilization: number
  recommendation: string
}

export interface EnrollmentTrend {
  month: string
  enrollments: number
  dropouts: number
  netGrowth: number
  trend: 'up' | 'down' | 'stable'
}

export interface MonthlyComparisonData {
  month: string
  currentYear: number
  previousYear: number
  change: number
}

export interface Anomaly {
  id: string
  type: 'attendance' | 'performance' | 'enrollment'
  description: string
  severity: 'high' | 'medium' | 'low'
  detectedAt: Date
  affectedItems: string[]
}

export interface Opportunity {
  id: string
  category: 'growth' | 'efficiency' | 'retention' | 'revenue'
  title: string
  description: string
  potentialImpact: number
  requiredActions: string[]
}

// Export singleton
export const advancedAnalyticsService = new AdvancedAnalyticsService();
