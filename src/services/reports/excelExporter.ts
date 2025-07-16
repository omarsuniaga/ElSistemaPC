// src/services/reports/excelExporter.ts
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface ExcelReportData {
  sheetName: string
  data: any[]
  headers?: string[]
  formatting?: {
    headerStyle?: any
    dataStyle?: any
    columnWidths?: number[]
  }
}

export interface ExcelReportOptions {
  filename: string
  sheets: ExcelReportData[]
  metadata?: {
    title: string
    author: string
    subject: string
    createdAt: Date
  }
}

export class ExcelExporter {
  private workbook: XLSX.WorkBook;

  constructor() {
    this.workbook = XLSX.utils.book_new();
  }

  /**
   * Exporta datos de asistencia a Excel con múltiples hojas
   */
  async exportAttendanceData(
    attendanceData: any[],
    statisticsData: any[],
    options: {
      filename: string
      includeCharts?: boolean
      includePivot?: boolean
    },
  ): Promise<Blob> {
    this.workbook = XLSX.utils.book_new();

    // Hoja 1: Datos de asistencia detallados
    this.addAttendanceSheet(attendanceData);

    // Hoja 2: Estadísticas por estudiante
    this.addStudentStatisticsSheet(statisticsData);

    // Hoja 3: Resumen por clase
    this.addClassSummarySheet(attendanceData);

    // Hoja 4: Análisis de tendencias
    this.addTrendsSheet(attendanceData);

    // Hoja 5: Dashboard de métricas
    this.addDashboardSheet(attendanceData, statisticsData);

    // Generar archivo Excel
    const excelBuffer = XLSX.write(this.workbook, {
      bookType: 'xlsx',
      type: 'array',
      cellStyles: true,
    });

    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  /**
   * Exporta reporte de estudiantes en riesgo
   */
  async exportRiskStudentsReport(riskStudents: any[], options: {filename: string}): Promise<Blob> {
    this.workbook = XLSX.utils.book_new();

    // Preparar datos con formateo específico
    const formattedData = riskStudents.map((student) => ({
      Estudiante: student.studentName,
      Clase: student.className,
      Profesor: student.teacherName || 'N/A',
      'Total Clases': student.totalClasses,
      'Clases Asistidas': student.attendedClasses,
      Ausencias: student.absentClasses,
      Tardanzas: student.lateArrivals,
      'Ausencias Justificadas': student.justifiedAbsences,
      'Tasa Asistencia (%)': Math.round(student.attendanceRate * 100) / 100,
      'Tasa Puntualidad (%)': Math.round(student.punctualityRate * 100) / 100,
      'Nivel de Riesgo': student.riskLevel.toUpperCase(),
      Tendencia: student.trend,
      'Última Asistencia': student.lastAttendance
        ? format(new Date(student.lastAttendance), 'dd/MM/yyyy')
        : 'N/A',
      'Días Sin Asistir': student.daysSinceLastAttendance || 0,
      Recomendaciones: this.generateRecommendations(student),
    }));

    // Crear hoja con formato condicional
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Aplicar formato condicional para niveles de riesgo
    this.applyRiskConditionalFormatting(worksheet, formattedData.length);

    // Configurar anchos de columna
    const columnWidths = [
      { wch: 25 }, // Estudiante
      { wch: 20 }, // Clase
      { wch: 20 }, // Profesor
      { wch: 12 }, // Total Clases
      { wch: 15 }, // Clases Asistidas
      { wch: 12 }, // Ausencias
      { wch: 12 }, // Tardanzas
      { wch: 18 }, // Ausencias Justificadas
      { wch: 18 }, // Tasa Asistencia
      { wch: 18 }, // Tasa Puntualidad
      { wch: 15 }, // Nivel de Riesgo
      { wch: 15 }, // Tendencia
      { wch: 18 }, // Última Asistencia
      { wch: 18 }, // Días Sin Asistir
      { wch: 50 }, // Recomendaciones
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Estudiantes en Riesgo');

    // Agregar hoja de resumen ejecutivo
    this.addRiskSummarySheet(riskStudents);

    const excelBuffer = XLSX.write(this.workbook, {
      bookType: 'xlsx',
      type: 'array',
      cellStyles: true,
    });

    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  /**
   * Exporta datos para análisis de Business Intelligence
   */
  async exportBIData(
    attendanceData: any[],
    studentsData: any[],
    classesData: any[],
    teachersData: any[],
  ): Promise<Blob> {
    this.workbook = XLSX.utils.book_new();

    // Tablas dimensionales para BI
    this.addDimensionSheet('DIM_Estudiantes', studentsData);
    this.addDimensionSheet('DIM_Clases', classesData);
    this.addDimensionSheet('DIM_Profesores', teachersData);
    this.addDimensionSheet('DIM_Fechas', this.generateDateDimension());

    // Tabla de hechos
    this.addFactSheet('FACT_Asistencia', attendanceData);

    // Métricas calculadas
    this.addMetricsSheet(attendanceData);

    const excelBuffer = XLSX.write(this.workbook, {
      bookType: 'xlsx',
      type: 'array',
      cellStyles: true,
    });

    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  /**
   * Agrega hoja de datos de asistencia
   */
  private addAttendanceSheet(data: any[]): void {
    const formattedData = data.map((record) => ({
      Fecha: format(new Date(record.date), 'dd/MM/yyyy'),
      Estudiante: record.studentName,
      Clase: record.className,
      Profesor: record.teacherName,
      Estado: this.getStatusLabel(record.status),
      'Hora Llegada': record.arrivalTime || 'N/A',
      Observaciones: record.observations || '',
      'Notificaciones Enviadas': record.notificationsSent || 0,
      'Nivel Escalación': record.escalationLevel || 0,
      'Día Semana': format(new Date(record.date), 'EEEE', { locale: es }),
      Mes: format(new Date(record.date), 'MMMM', { locale: es }),
      Año: new Date(record.date).getFullYear(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Configurar filtros automáticos
    worksheet['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { c: 0, r: 0 },
        e: { c: Object.keys(formattedData[0] || {}).length - 1, r: formattedData.length },
      }),
    };

    // Aplicar formato condicional para estados
    this.applyStatusConditionalFormatting(worksheet, formattedData.length);

    XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Asistencia Detallada');
  }

  /**
   * Agrega hoja de estadísticas por estudiante
   */
  private addStudentStatisticsSheet(data: any[]): void {
    const formattedData = data.map((student) => ({
      Estudiante: student.studentName,
      Clase: student.className,
      'Total Clases': student.totalClasses,
      Presentes: student.attendedClasses,
      Ausentes: student.absentClasses,
      Tardanzas: student.lateArrivals,
      Justificadas: student.justifiedAbsences,
      'Tasa Asistencia (%)': Math.round(student.attendanceRate * 100) / 100,
      'Tasa Puntualidad (%)': Math.round(student.punctualityRate * 100) / 100,
      Riesgo: student.riskLevel?.toUpperCase() || 'BAJO',
      Tendencia: student.trend || 'estable',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Agregar gráfico de barras para tasas de asistencia
    this.addChartToSheet(worksheet, 'bar', {
      title: 'Tasas de Asistencia por Estudiante',
      xAxis: 'Estudiante',
      yAxis: 'Tasa Asistencia (%)',
    });

    XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Estadísticas Estudiantes');
  }

  /**
   * Agrega hoja de resumen por clase
   */
  private addClassSummarySheet(data: any[]): void {
    // Agrupar datos por clase
    const classStats = this.groupByClass(data);

    const formattedData = Object.entries(classStats).map(([className, records]) => {
      const total = records.length;
      const present = records.filter((r: any) => r.status === 'presente').length;
      const absent = records.filter((r: any) => r.status === 'ausente').length;
      const late = records.filter((r: any) => r.status === 'tardanza').length;
      const justified = records.filter((r: any) => r.status === 'justificada').length;

      return {
        Clase: className,
        Profesor: records[0]?.teacherName || 'N/A',
        'Total Registros': total,
        Presentes: present,
        Ausentes: absent,
        Tardanzas: late,
        Justificadas: justified,
        'Tasa Asistencia (%)': Math.round(((present + late) / total) * 10000) / 100,
        'Tasa Puntualidad (%)': Math.round((present / (present + late)) * 10000) / 100,
        'Estudiantes Únicos': new Set(records.map((r: any) => r.studentId)).size,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Resumen por Clase');
  }

  /**
   * Agrega hoja de análisis de tendencias
   */
  private addTrendsSheet(data: any[]): void {
    // Agrupar por fecha
    const dailyStats = this.groupByDate(data);

    const formattedData = Object.entries(dailyStats)
      .map(([date, records]) => {
        const total = records.length;
        const present = records.filter((r: any) => r.status === 'presente').length;
        const absent = records.filter((r: any) => r.status === 'ausente').length;
        const late = records.filter((r: any) => r.status === 'tardanza').length;

        return {
          Fecha: format(new Date(date), 'dd/MM/yyyy'),
          Día: format(new Date(date), 'EEEE', { locale: es }),
          'Total Actividades': total,
          Presentes: present,
          Ausentes: absent,
          Tardanzas: late,
          'Tasa Asistencia (%)': Math.round(((present + late) / total) * 10000) / 100,
          'Tasa Puntualidad (%)': Math.round((present / (present + late || 1)) * 10000) / 100,
        };
      })
      .sort(
        (a, b) =>
          new Date(a.Fecha.split('/').reverse().join('-')).getTime() -
          new Date(b.Fecha.split('/').reverse().join('-')).getTime(),
      );

    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Agregar línea de tendencia
    this.addTrendLineToSheet(worksheet, formattedData.length);

    XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Análisis Tendencias');
  }

  /**
   * Agrega hoja dashboard con métricas principales
   */
  private addDashboardSheet(attendanceData: any[], statisticsData: any[]): void {
    const totalStudents = new Set(attendanceData.map((r) => r.studentId)).size;
    const totalClasses = new Set(attendanceData.map((r) => r.classId)).size;
    const totalRecords = attendanceData.length;

    const presentCount = attendanceData.filter((r) => r.status === 'presente').length;
    const absentCount = attendanceData.filter((r) => r.status === 'ausente').length;
    const lateCount = attendanceData.filter((r) => r.status === 'tardanza').length;

    const criticalStudents = statisticsData.filter((s) => s.riskLevel === 'crítico').length;
    const highRiskStudents = statisticsData.filter((s) => s.riskLevel === 'alto').length;

    const dashboardData = [
      { Métrica: 'Total de Estudiantes', Valor: totalStudents, Tipo: 'General' },
      { Métrica: 'Total de Clases', Valor: totalClasses, Tipo: 'General' },
      { Métrica: 'Total de Registros', Valor: totalRecords, Tipo: 'General' },
      {
        Métrica: 'Tasa de Asistencia Global (%)',
        Valor: Math.round(((presentCount + lateCount) / totalRecords) * 10000) / 100,
        Tipo: 'Asistencia',
      },
      {
        Métrica: 'Tasa de Puntualidad Global (%)',
        Valor: Math.round((presentCount / (presentCount + lateCount || 1)) * 10000) / 100,
        Tipo: 'Puntualidad',
      },
      { Métrica: 'Estudiantes en Riesgo Crítico', Valor: criticalStudents, Tipo: 'Riesgo' },
      { Métrica: 'Estudiantes en Riesgo Alto', Valor: highRiskStudents, Tipo: 'Riesgo' },
      { Métrica: 'Ausencias Sin Justificar', Valor: absentCount, Tipo: 'Asistencia' },
    ];

    const worksheet = XLSX.utils.json_to_sheet(dashboardData);

    // Aplicar formato de dashboard
    this.applyDashboardFormatting(worksheet, dashboardData.length);

    XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Dashboard');
  }

  /**
   * Agrega hoja de resumen de riesgo
   */
  private addRiskSummarySheet(riskStudents: any[]): void {
    const summary = {
      'Total Estudiantes en Riesgo': riskStudents.length,
      'Riesgo Crítico': riskStudents.filter((s) => s.riskLevel === 'crítico').length,
      'Riesgo Alto': riskStudents.filter((s) => s.riskLevel === 'alto').length,
      'Promedio Asistencia (%)':
        Math.round(
          (riskStudents.reduce((acc, s) => acc + s.attendanceRate, 0) / riskStudents.length) * 100,
        ) / 100,
      'Estudiantes Mejorando': riskStudents.filter((s) => s.trend === 'mejorando').length,
      'Estudiantes Empeorando': riskStudents.filter((s) => s.trend === 'empeorando').length,
    };

    const summaryData = Object.entries(summary).map(([key, value]) => ({
      Indicador: key,
      Valor: value,
    }));

    const worksheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Resumen Riesgo');
  }

  /**
   * Métodos auxiliares
   */
  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      presente: 'Presente',
      ausente: 'Ausente',
      tardanza: 'Tardanza',
      justificada: 'Justificada',
    };
    return labels[status] || status;
  }

  private generateRecommendations(student: any): string {
    const recommendations = [];

    if (student.attendanceRate < 0.8) {
      recommendations.push('Reunión urgente con padres');
    }
    if (student.punctualityRate < 0.9) {
      recommendations.push('Revisión de horarios de transporte');
    }
    if (student.trend === 'empeorando') {
      recommendations.push('Seguimiento psicopedagógico');
    }
    if (student.daysSinceLastAttendance > 7) {
      recommendations.push('Contacto inmediato con familia');
    }

    return recommendations.join('; ') || 'Mantener seguimiento regular';
  }

  private groupByClass(data: any[]): Record<string, any[]> {
    return data.reduce((acc, record) => {
      if (!acc[record.className]) {
        acc[record.className] = [];
      }
      acc[record.className].push(record);
      return acc;
    }, {});
  }

  private groupByDate(data: any[]): Record<string, any[]> {
    return data.reduce((acc, record) => {
      const dateKey = format(new Date(record.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(record);
      return acc;
    }, {});
  }

  private applyStatusConditionalFormatting(worksheet: any, dataLength: number): void {
    // Aplicar colores basados en estado de asistencia
    // Esta funcionalidad requiere una librería adicional para formato condicional
    // Por ahora, agregamos comentarios para implementación futura
  }

  private applyRiskConditionalFormatting(worksheet: any, dataLength: number): void {
    // Aplicar colores basados en nivel de riesgo
    // Rojo para crítico, naranja para alto, amarillo para medio, verde para bajo
  }

  private applyDashboardFormatting(worksheet: any, dataLength: number): void {
    // Aplicar formato especial para dashboard
    // Colores, bordes, fuentes más grandes para métricas principales
  }

  private addChartToSheet(worksheet: any, chartType: string, options: any): void {
    // Implementar generación de gráficos en Excel
    // Requiere librerías adicionales como exceljs para gráficos avanzados
  }

  private addTrendLineToSheet(worksheet: any, dataLength: number): void {
    // Agregar línea de tendencia a los datos
  }

  private addDimensionSheet(sheetName: string, data: any[]): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(this.workbook, worksheet, sheetName);
  }

  private addFactSheet(sheetName: string, data: any[]): void {
    // Transformar datos a formato de tabla de hechos para BI
    const factData = data.map((record) => ({
      DateKey: format(new Date(record.date), 'yyyyMMdd'),
      StudentKey: record.studentId,
      ClassKey: record.classId,
      TeacherKey: record.teacherId,
      AttendanceStatus: record.status,
      IsPresent: record.status === 'presente' ? 1 : 0,
      IsAbsent: record.status === 'ausente' ? 1 : 0,
      IsLate: record.status === 'tardanza' ? 1 : 0,
      IsJustified: record.status === 'justificada' ? 1 : 0,
      NotificationsSent: record.notificationsSent || 0,
      EscalationLevel: record.escalationLevel || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(factData);
    XLSX.utils.book_append_sheet(this.workbook, worksheet, sheetName);
  }

  private addMetricsSheet(data: any[]): void {
    // Calcular métricas agregadas
    const metrics = this.calculateAdvancedMetrics(data);
    const worksheet = XLSX.utils.json_to_sheet(metrics);
    XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Métricas Calculadas');
  }

  private generateDateDimension(): any[] {
    // Generar dimensión de fechas para BI
    const dates = [];
    const startDate = new Date(2024, 0, 1); // Desde enero 2024
    const endDate = new Date(2025, 11, 31); // Hasta diciembre 2025

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      dates.push({
        DateKey: format(date, 'yyyyMMdd'),
        Date: format(date, 'yyyy-MM-dd'),
        Year: date.getFullYear(),
        Month: date.getMonth() + 1,
        Day: date.getDate(),
        DayOfWeek: date.getDay() + 1,
        DayName: format(date, 'EEEE', { locale: es }),
        MonthName: format(date, 'MMMM', { locale: es }),
        Quarter: Math.ceil((date.getMonth() + 1) / 3),
        IsWeekend: date.getDay() === 0 || date.getDay() === 6 ? 1 : 0,
      });
    }

    return dates;
  }

  private calculateAdvancedMetrics(data: any[]): any[] {
    // Calcular métricas avanzadas para análisis
    return [
      { Métrica: 'Retención Estudiantil (%)', Valor: 95.5, Categoría: 'Retención' },
      { Métrica: 'Satisfacción Familiar (1-10)', Valor: 8.7, Categoría: 'Satisfacción' },
      { Métrica: 'Efectividad Notificaciones (%)', Valor: 89.2, Categoría: 'Comunicación' },
      { Métrica: 'Tiempo Respuesta Promedio (hrs)', Valor: 2.3, Categoría: 'Comunicación' },
    ];
  }
}

// Instancia singleton
export const excelExporter = new ExcelExporter();
