// src/services/reports/reportGenerator.ts
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos para el sistema de reportes
export interface ReportData {
  title: string
  subtitle?: string
  dateRange: {
    start: Date
    end: Date
  }
  metadata: {
    generatedBy: string
    generatedAt: Date
    academyName: string
    academyLogo?: string
  }
  sections: ReportSection[]
}

export interface ReportSection {
  title: string
  type: 'table' | 'chart' | 'summary' | 'text' | 'statistics'
  data: any
  options?: {
    columns?: string[]
    headers?: string[]
    chartType?: 'bar' | 'line' | 'pie' | 'donut'
    showTotal?: boolean
    groupBy?: string
  }
}

export interface AttendanceReportData {
  studentId: string
  studentName: string
  className: string
  teacherName: string
  date: Date
  status: 'presente' | 'ausente' | 'tardanza' | 'justificada'
  arrivalTime?: string
  observations?: string
  notificationsSent: number
  escalationLevel: number
}

export interface StudentStatistics {
  studentId: string
  studentName: string
  className: string
  totalClasses: number
  attendedClasses: number
  absentClasses: number
  lateArrivals: number
  justifiedAbsences: number
  attendanceRate: number
  punctualityRate: number
  riskLevel: 'bajo' | 'medio' | 'alto' | 'crítico'
  trend: 'mejorando' | 'estable' | 'empeorando'
}

export interface ClassStatistics {
  classId: string
  className: string
  teacherName: string
  totalStudents: number
  averageAttendance: number
  averagePunctuality: number
  riskStudents: number
  bestPerformers: string[]
  needsAttention: string[]
}

export class ReportGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;
  private primaryColor: string;
  private secondaryColor: string;
  private accentColor: string;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;

    // Colores del sistema (El Sistema Punta Cana)
    this.primaryColor = '#1e40af'; // Azul principal
    this.secondaryColor = '#64748b'; // Gris
    this.accentColor = '#dc2626'; // Rojo para alertas
  }

  /**
   * Genera un reporte completo de asistencia en PDF
   */
  async generateAttendanceReport(
    data: AttendanceReportData[],
    metadata: ReportData['metadata'],
    options: {
      includeCharts?: boolean
      includeStatistics?: boolean
      includeTrends?: boolean
      groupBy?: 'student' | 'class' | 'date'
    } = {},
  ): Promise<Blob> {
    this.initializeDocument();

    // Header del reporte
    await this.addHeader(metadata, 'Reporte de Asistencia Diaria');

    // Resumen ejecutivo
    this.addExecutiveSummary(data);

    // Estadísticas generales
    if (options.includeStatistics) {
      this.addGeneralStatistics(data);
    }

    // Gráficos de tendencias
    if (options.includeCharts) {
      await this.addTrendCharts(data);
    }

    // Datos detallados
    this.addDetailedData(data, options.groupBy || 'student');

    // Análisis y recomendaciones
    if (options.includeTrends) {
      this.addAnalysisAndRecommendations(data);
    }

    // Footer
    this.addFooter();

    return this.doc.output('blob');
  }

  /**
   * Genera reporte de estudiantes en riesgo
   */
  async generateRiskStudentsReport(
    students: StudentStatistics[],
    metadata: ReportData['metadata'],
  ): Promise<Blob> {
    this.initializeDocument();

    // Filtrar estudiantes en riesgo
    const riskStudents = students
      .filter((s) => s.riskLevel === 'alto' || s.riskLevel === 'crítico')
      .sort((a, b) => {
        const riskOrder = { crítico: 4, alto: 3, medio: 2, bajo: 1 };
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      });

    await this.addHeader(metadata, 'Reporte de Estudiantes en Riesgo');

    // Resumen de riesgo
    this.addRiskSummary(riskStudents);

    // Lista detallada de estudiantes en riesgo
    this.addRiskStudentsList(riskStudents);

    // Plan de acción recomendado
    this.addActionPlan(riskStudents);

    this.addFooter();

    return this.doc.output('blob');
  }

  /**
   * Genera reporte de rendimiento por clase
   */
  async generateClassPerformanceReport(
    classes: ClassStatistics[],
    metadata: ReportData['metadata'],
  ): Promise<Blob> {
    this.initializeDocument();

    await this.addHeader(metadata, 'Reporte de Rendimiento por Clase');

    // Ranking de clases
    this.addClassRanking(classes);

    // Análisis detallado por clase
    this.addClassDetailedAnalysis(classes);

    // Comparativas y benchmarks
    this.addClassComparatives(classes);

    this.addFooter();

    return this.doc.output('blob');
  }

  /**
   * Genera reporte de notificaciones y escalaciones
   */
  async generateNotificationReport(
    notifications: any[],
    metadata: ReportData['metadata'],
  ): Promise<Blob> {
    this.initializeDocument();

    await this.addHeader(metadata, 'Reporte de Notificaciones y Escalaciones');

    // Estadísticas de notificaciones
    this.addNotificationStatistics(notifications);

    // Efectividad de las escalaciones
    this.addEscalationEffectiveness(notifications);

    // Análisis de patrones
    this.addNotificationPatterns(notifications);

    this.addFooter();

    return this.doc.output('blob');
  }

  /**
   * Inicializa el documento PDF con configuraciones básicas
   */
  private initializeDocument(): void {
    this.doc = new jsPDF();
    this.currentY = this.margin;

    // Configurar fuentes
    this.doc.setFont('helvetica');
  }

  /**
   * Agrega el header profesional del reporte
   */
  private async addHeader(metadata: ReportData['metadata'], title: string): Promise<void> {
    // Logo y header
    if (metadata.academyLogo) {
      try {
        this.doc.addImage(metadata.academyLogo, 'PNG', this.margin, this.currentY, 30, 30);
      } catch (error) {
        console.warn('No se pudo cargar el logo:', error);
      }
    }

    // Título principal
    this.doc.setFontSize(24);
    this.doc.setTextColor(this.primaryColor);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, metadata.academyLogo ? this.margin + 40 : this.margin, this.currentY + 20);

    // Nombre de la academia
    this.doc.setFontSize(16);
    this.doc.setTextColor(this.secondaryColor);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      metadata.academyName,
      metadata.academyLogo ? this.margin + 40 : this.margin,
      this.currentY + 35,
    );

    // Fecha de generación
    const dateStr = format(metadata.generatedAt, 'dd \'de\' MMMM \'de\' yyyy \'a las\' HH:mm', {
      locale: es,
    });
    this.doc.setFontSize(10);
    this.doc.text(
      `Generado el ${dateStr} por ${metadata.generatedBy}`,
      this.pageWidth - this.margin - 100,
      this.currentY + 15,
    );

    // Línea separadora
    this.doc.setDrawColor(this.primaryColor);
    this.doc.setLineWidth(2);
    this.doc.line(this.margin, this.currentY + 45, this.pageWidth - this.margin, this.currentY + 45);

    this.currentY += 60;
  }

  /**
   * Agrega resumen ejecutivo
   */
  private addExecutiveSummary(data: AttendanceReportData[]): void {
    this.addSectionTitle('📊 Resumen Ejecutivo');

    // Calcular métricas principales
    const totalRecords = data.length;
    const presentCount = data.filter((d) => d.status === 'presente').length;
    const absentCount = data.filter((d) => d.status === 'ausente').length;
    const lateCount = data.filter((d) => d.status === 'tardanza').length;
    const justifiedCount = data.filter((d) => d.status === 'justificada').length;

    const attendanceRate = ((presentCount + lateCount) / totalRecords) * 100;
    const punctualityRate = (presentCount / (presentCount + lateCount)) * 100;

    // Caja de resumen
    this.addSummaryBox([
      { label: 'Total de Registros', value: totalRecords.toString(), color: this.secondaryColor },
      {
        label: 'Tasa de Asistencia',
        value: `${attendanceRate.toFixed(1)}%`,
        color:
          attendanceRate >= 90 ? '#059669' : attendanceRate >= 80 ? '#d97706' : this.accentColor,
      },
      {
        label: 'Tasa de Puntualidad',
        value: `${punctualityRate.toFixed(1)}%`,
        color:
          punctualityRate >= 95 ? '#059669' : punctualityRate >= 85 ? '#d97706' : this.accentColor,
      },
      {
        label: 'Ausencias Sin Justificar',
        value: absentCount.toString(),
        color: absentCount === 0 ? '#059669' : this.accentColor,
      },
    ]);
  }

  /**
   * Agrega estadísticas generales
   */
  private addGeneralStatistics(data: AttendanceReportData[]): void {
    this.addSectionTitle('📈 Estadísticas Generales');

    // Agrupar por estado
    const statusCounts = data.reduce(
      (acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Crear tabla de estadísticas
    const tableData = Object.entries(statusCounts).map(([status, count]) => [
      this.getStatusLabel(status),
      count.toString(),
      `${((count / data.length) * 100).toFixed(1)}%`,
    ]);

    this.addTable(['Estado', 'Cantidad', 'Porcentaje'], tableData, { showTotal: true });
  }

  /**
   * Agrega datos detallados
   */
  private addDetailedData(data: AttendanceReportData[], groupBy: string): void {
    this.addSectionTitle('📋 Datos Detallados');

    let tableData: string[][];
    let headers: string[];

    switch (groupBy) {
    case 'student':
      headers = [
        'Estudiante',
        'Clase',
        'Profesor',
        'Fecha',
        'Estado',
        'Hora Llegada',
        'Notificaciones',
      ];
      tableData = data.map((record) => [
        record.studentName,
        record.className,
        record.teacherName,
        format(record.date, 'dd/MM/yyyy'),
        this.getStatusLabel(record.status),
        record.arrivalTime || '-',
        record.notificationsSent.toString(),
      ]);
      break;

    case 'class':
      // Agrupar por clase
      const groupedByClass = this.groupDataByClass(data);
      headers = [
        'Clase',
        'Profesor',
        'Total Estudiantes',
        'Presentes',
        'Ausentes',
        'Tardanzas',
        '% Asistencia',
      ];
      tableData = Object.entries(groupedByClass).map(([className, records]) => {
        const total = records.length;
        const present = records.filter((r) => r.status === 'presente').length;
        const absent = records.filter((r) => r.status === 'ausente').length;
        const late = records.filter((r) => r.status === 'tardanza').length;
        const attendance = ((present + late) / total) * 100;

        return [
          className,
          records[0].teacherName,
          total.toString(),
          present.toString(),
          absent.toString(),
          late.toString(),
          `${attendance.toFixed(1)}%`,
        ];
      });
      break;

    default:
      headers = ['Estudiante', 'Clase', 'Estado', 'Fecha'];
      tableData = data.map((record) => [
        record.studentName,
        record.className,
        this.getStatusLabel(record.status),
        format(record.date, 'dd/MM/yyyy'),
      ]);
    }

    this.addTable(headers, tableData);
  }

  /**
   * Agrega análisis y recomendaciones
   */
  private addAnalysisAndRecommendations(data: AttendanceReportData[]): void {
    this.addSectionTitle('💡 Análisis y Recomendaciones');

    // Identificar patrones problemáticos
    const patterns = this.identifyPatterns(data);

    this.doc.setFontSize(12);
    this.doc.setTextColor(this.secondaryColor);

    patterns.forEach((pattern) => {
      this.checkPageBreak(20);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`• ${pattern.title}`, this.margin + 5, this.currentY);
      this.currentY += 8;

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(10);
      const lines = this.doc.splitTextToSize(
        pattern.description,
        this.pageWidth - this.margin * 2 - 10,
      );
      this.doc.text(lines, this.margin + 10, this.currentY);
      this.currentY += lines.length * 5 + 5;
    });
  }

  /**
   * Agrega resumen de estudiantes en riesgo
   */
  private addRiskSummary(students: StudentStatistics[]): void {
    this.addSectionTitle('⚠️ Resumen de Riesgo');

    const criticalCount = students.filter((s) => s.riskLevel === 'crítico').length;
    const highCount = students.filter((s) => s.riskLevel === 'alto').length;

    this.addSummaryBox([
      {
        label: 'Estudiantes en Riesgo Crítico',
        value: criticalCount.toString(),
        color: this.accentColor,
      },
      { label: 'Estudiantes en Riesgo Alto', value: highCount.toString(), color: '#d97706' },
      { label: 'Total en Riesgo', value: students.length.toString(), color: this.primaryColor },
      {
        label: 'Requiere Acción Inmediata',
        value: criticalCount.toString(),
        color: this.accentColor,
      },
    ]);
  }

  /**
   * Agrega lista de estudiantes en riesgo
   */
  private addRiskStudentsList(students: StudentStatistics[]): void {
    this.addSectionTitle('👥 Estudiantes que Requieren Atención');

    const tableData = students.map((student) => [
      student.studentName,
      student.className,
      `${student.attendanceRate.toFixed(1)}%`,
      `${student.punctualityRate.toFixed(1)}%`,
      this.getRiskLabel(student.riskLevel),
      this.getTrendIcon(student.trend),
    ]);

    this.addTable(
      ['Estudiante', 'Clase', '% Asistencia', '% Puntualidad', 'Nivel de Riesgo', 'Tendencia'],
      tableData,
    );
  }

  /**
   * Agrega plan de acción
   */
  private addActionPlan(students: StudentStatistics[]): void {
    this.addSectionTitle('🎯 Plan de Acción Recomendado');

    const criticalStudents = students.filter((s) => s.riskLevel === 'crítico');
    const highRiskStudents = students.filter((s) => s.riskLevel === 'alto');

    this.doc.setFontSize(12);
    this.doc.setTextColor(this.secondaryColor);

    const actions = [
      {
        priority: 'CRÍTICO',
        color: this.accentColor,
        actions: [
          `Reunión inmediata con padres de ${criticalStudents.length} estudiantes`,
          'Implementar plan de seguimiento personalizado',
          'Evaluación psicopedagógica si es necesario',
          'Seguimiento semanal de asistencia',
        ],
      },
      {
        priority: 'ALTO',
        color: '#d97706',
        actions: [
          `Contacto telefónico con familias de ${highRiskStudents.length} estudiantes`,
          'Envío de carta de advertencia formal',
          'Establecer metas de asistencia específicas',
          'Seguimiento quincenal',
        ],
      },
    ];

    actions.forEach((actionGroup) => {
      this.checkPageBreak(30);

      // Título de prioridad
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(actionGroup.color);
      this.doc.text(`Prioridad ${actionGroup.priority}`, this.margin, this.currentY);
      this.currentY += 15;

      // Lista de acciones
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(this.secondaryColor);

      actionGroup.actions.forEach((action) => {
        this.doc.text(`• ${action}`, this.margin + 5, this.currentY);
        this.currentY += 8;
      });

      this.currentY += 10;
    });
  }

  /**
   * Utilidades auxiliares
   */
  private addSectionTitle(title: string): void {
    this.checkPageBreak(30);

    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.primaryColor);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 20;
  }

  private addSummaryBox(items: Array<{label: string; value: string; color: string}>): void {
    const boxWidth = (this.pageWidth - this.margin * 2) / items.length;
    const boxHeight = 40;

    items.forEach((item, index) => {
      const x = this.margin + index * boxWidth;

      // Caja
      this.doc.setFillColor(item.color);
      this.doc.rect(x, this.currentY, boxWidth - 5, boxHeight, 'F');

      // Valor
      this.doc.setFontSize(18);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(item.value, x + boxWidth / 2 - 10, this.currentY + 20, { align: 'center' });

      // Label
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(item.label, x + boxWidth / 2 - 10, this.currentY + 32, { align: 'center' });
    });

    this.currentY += boxHeight + 20;
  }

  private addTable(headers: string[], data: string[][], options: any = {}): void {
    this.checkPageBreak(50)

    // Usar autoTable para tablas profesionales
    ;(this.doc as any).autoTable({
      startY: this.currentY,
      head: [headers],
      body: data,
      theme: 'grid',
      headStyles: {
        fillColor: this.primaryColor,
        textColor: 255,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { left: this.margin, right: this.margin },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 20;
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private addFooter(): void {
    const totalPages = this.doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setTextColor(this.secondaryColor);
      this.doc.text(
        `Página ${i} de ${totalPages} - Academia Musical El Sistema Punta Cana`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' },
      );
    }
  }

  // Métodos auxiliares para etiquetas y agrupaciones
  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      presente: 'Presente',
      ausente: 'Ausente',
      tardanza: 'Tardanza',
      justificada: 'Justificada',
    };
    return labels[status] || status;
  }

  private getRiskLabel(level: string): string {
    const labels: Record<string, string> = {
      bajo: 'Bajo',
      medio: 'Medio',
      alto: 'Alto',
      crítico: 'Crítico',
    };
    return labels[level] || level;
  }

  private getTrendIcon(trend: string): string {
    const icons: Record<string, string> = {
      mejorando: '↗️',
      estable: '→',
      empeorando: '↘️',
    };
    return icons[trend] || '?';
  }

  private groupDataByClass(data: AttendanceReportData[]): Record<string, AttendanceReportData[]> {
    return data.reduce(
      (acc, record) => {
        if (!acc[record.className]) {
          acc[record.className] = [];
        }
        acc[record.className].push(record);
        return acc;
      },
      {} as Record<string, AttendanceReportData[]>,
    );
  }

  private identifyPatterns(
    data: AttendanceReportData[],
  ): Array<{title: string; description: string}> {
    const patterns = [];

    // Patrón de ausencias repetidas
    const absentStudents = data.filter((d) => d.status === 'ausente');
    if (absentStudents.length > 0) {
      patterns.push({
        title: 'Ausencias Sin Justificar Detectadas',
        description: `Se identificaron ${absentStudents.length} ausencias sin justificar. Se recomienda contacto inmediato con las familias para entender las causas y establecer un plan de apoyo.`,
      });
    }

    // Patrón de tardanzas
    const lateStudents = data.filter((d) => d.status === 'tardanza');
    if (lateStudents.length > 0) {
      patterns.push({
        title: 'Patrones de Impuntualidad',
        description: `${lateStudents.length} estudiantes llegaron tarde. Considerar revisar horarios de transporte y establecer recordatorios preventivos.`,
      });
    }

    return patterns;
  }

  // Métodos adicionales para otros tipos de reportes
  private addNotificationStatistics(notifications: any[]): void {
    // Implementar estadísticas de notificaciones
  }

  private addEscalationEffectiveness(notifications: any[]): void {
    // Implementar análisis de efectividad de escalaciones
  }

  private addNotificationPatterns(notifications: any[]): void {
    // Implementar análisis de patrones de notificaciones
  }

  private addClassRanking(classes: ClassStatistics[]): void {
    // Implementar ranking de clases
  }

  private addClassDetailedAnalysis(classes: ClassStatistics[]): void {
    // Implementar análisis detallado por clase
  }

  private addClassComparatives(classes: ClassStatistics[]): void {
    // Implementar comparativas entre clases
  }

  private async addTrendCharts(data: AttendanceReportData[]): Promise<void> {
    // TODO: Implementar generación de gráficos usando Chart.js o similar
    this.addSectionTitle('📊 Gráficos de Tendencias');

    this.doc.setFontSize(11);
    this.doc.setTextColor(this.secondaryColor);
    this.doc.text(
      '[Los gráficos de tendencias se implementarán en la siguiente versión]',
      this.margin,
      this.currentY,
    );
    this.currentY += 20;
  }
}

// Instancia singleton para uso global
export const reportGenerator = new ReportGenerator();
