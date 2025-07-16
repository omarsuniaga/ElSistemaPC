import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MusicalWork, InstrumentEvaluation, WeeklyEvaluation } from '../types/heatmap';

export interface ReportData {
  id: string
  title: string
  type: 'progress' | 'performance' | 'attendance' | 'comparison' | 'detailed' | 'summary'
  period: string
  works: MusicalWork[]
  evaluations: InstrumentEvaluation[]
  weeklyEvaluations: WeeklyEvaluation[]
  generatedAt: string
  config: ReportConfig
}

export interface ReportConfig {
  includeCharts: boolean
  includeRecommendations: boolean
  includeComparisons: boolean
  formats: string[]
  metrics: string[]
}

class ReportService {
  async generatePDF(reportData: ReportData): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(reportData.title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado: ${format(new Date(reportData.generatedAt), 'dd/MM/yyyy HH:mm', { locale: es })}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Executive Summary
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen Ejecutivo', 20, yPosition);
    yPosition += 10;

    const summary = this.generateExecutiveSummary(reportData);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(summary, pageWidth - 40);
    doc.text(summaryLines, 20, yPosition);
    yPosition += summaryLines.length * 5 + 10;

    // Works Overview Table
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Obras Incluidas', 20, yPosition);
    yPosition += 10;

    const worksTableData = reportData.works.map(work => [
      work.name,
      work.composer,
      work.instruments.length.toString(),
      this.calculateWorkProgress(work, reportData.evaluations) + '%',
    ])

    ;(doc as any).autoTable({
      head: [['Obra', 'Compositor', 'Instrumentos', 'Progreso']],
      body: worksTableData,
      startY: yPosition,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Performance Metrics
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Métricas de Rendimiento', 20, yPosition);
    yPosition += 10;

    const metricsData = this.calculateMetrics(reportData);
    const metricsTableData = Object.entries(metricsData).map(([metric, value]) => [
      this.getMetricLabel(metric),
      typeof value === 'number' ? value.toFixed(2) : value.toString(),
    ])

    ;(doc as any).autoTable({
      head: [['Métrica', 'Valor']],
      body: metricsTableData,
      startY: yPosition,
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 9 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Recommendations
    if (reportData.config.includeRecommendations) {
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Recomendaciones', 20, yPosition);
      yPosition += 10;

      const recommendations = this.generateRecommendations(reportData);
      recommendations.forEach((rec, index) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${rec.title}`, 20, yPosition);
        yPosition += 6;

        doc.setFont('helvetica', 'normal');
        const recLines = doc.splitTextToSize(rec.description, pageWidth - 40);
        doc.text(recLines, 25, yPosition);
        yPosition += recLines.length * 4 + 5;

        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }
      });
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 30, pageHeight - 10, { align: 'right' });
      doc.text('Montaje - Sistema de Gestión Musical', 20, pageHeight - 10);
    }

    return doc.output('blob');
  }

  async generateExcel(reportData: ReportData): Promise<Blob> {
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Reporte', reportData.title],
      ['Tipo', reportData.type],
      ['Período', reportData.period],
      ['Generado', format(new Date(reportData.generatedAt), 'dd/MM/yyyy HH:mm')],
      [''],
      ['Resumen Ejecutivo'],
      [this.generateExecutiveSummary(reportData)],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    // Works Sheet
    const worksData = [
      ['Obra', 'Compositor', 'Tonalidad', 'Tempo', 'Compás', 'Instrumentos', 'Progreso %'],
    ];

    reportData.works.forEach(work => {
      worksData.push([
        work.name,
        work.composer,
        work.key,
        work.tempo || '',
        work.timeSignature || '',
        work.instruments.length,
        this.calculateWorkProgress(work, reportData.evaluations),
      ]);
    });

    const worksSheet = XLSX.utils.aoa_to_sheet(worksData);
    XLSX.utils.book_append_sheet(workbook, worksSheet, 'Obras');

    // Evaluations Sheet
    const evaluationsData = [
      ['Fecha', 'Obra', 'Instrumento', 'Afinación', 'Articulación', 'Ritmo', 'Cohesión', 'Dinámica', 'Memorización', 'Promedio'],
    ];

    reportData.evaluations.forEach(eval => {
      const work = reportData.works.find(w => w.id === eval.workId);
      const instrument = work?.instruments.find(i => i.id === eval.instrumentId);
      const average = (eval.afinacion + eval.articulacion + eval.ritmo + eval.cohesion + eval.dinamica + eval.memorizacion) / 6;

      evaluationsData.push([
        format(new Date(eval.updatedAt), 'dd/MM/yyyy'),
        work?.name || '',
        instrument?.name || '',
        eval.afinacion,
        eval.articulacion,
        eval.ritmo,
        eval.cohesion,
        eval.dinamica,
        eval.memorizacion,
        average.toFixed(2),
      ]);
    });

    const evaluationsSheet = XLSX.utils.aoa_to_sheet(evaluationsData);
    XLSX.utils.book_append_sheet(workbook, evaluationsSheet, 'Evaluaciones');

    // Metrics Sheet
    const metrics = this.calculateMetrics(reportData);
    const metricsData = [
      ['Métrica', 'Valor'],
      ...Object.entries(metrics).map(([key, value]) => [
        this.getMetricLabel(key),
        typeof value === 'number' ? value.toFixed(2) : value,
      ]),
    ];

    const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData);
    XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Métricas');

    // Convert to blob
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  async generateCSV(reportData: ReportData): Promise<Blob> {
    const csvData = [];
    
    // Header
    csvData.push(['Reporte', reportData.title]);
    csvData.push(['Generado', format(new Date(reportData.generatedAt), 'dd/MM/yyyy HH:mm')]);
    csvData.push([]);

    // Evaluations data
    csvData.push(['Fecha', 'Obra', 'Instrumento', 'Afinación', 'Articulación', 'Ritmo', 'Cohesión', 'Dinámica', 'Memorización']);
    
    reportData.evaluations.forEach(eval => {
      const work = reportData.works.find(w => w.id === eval.workId);
      const instrument = work?.instruments.find(i => i.id === eval.instrumentId);
      
      csvData.push([
        format(new Date(eval.updatedAt), 'dd/MM/yyyy'),
        work?.name || '',
        instrument?.name || '',
        eval.afinacion,
        eval.articulacion,
        eval.ritmo,
        eval.cohesion,
        eval.dinamica,
        eval.memorizacion,
      ]);
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  private generateExecutiveSummary(reportData: ReportData): string {
    const totalWorks = reportData.works.length;
    const totalEvaluations = reportData.evaluations.length;
    const avgProgress = reportData.works.reduce((sum, work) => 
      sum + this.calculateWorkProgress(work, reportData.evaluations), 0) / totalWorks;

    return `Este reporte analiza ${totalWorks} obra(s) musical(es) con un total de ${totalEvaluations} evaluaciones. 
    El progreso promedio general es del ${avgProgress.toFixed(1)}%. 
    Se han identificado áreas de mejora en afinación y memorización, 
    mientras que el ritmo y la articulación muestran un rendimiento sólido.`;
  }

  private calculateWorkProgress(work: MusicalWork, evaluations: InstrumentEvaluation[]): number {
    const workEvaluations = evaluations.filter(e => e.workId === work.id);
    if (workEvaluations.length === 0) return 0;

    const totalScore = workEvaluations.reduce((sum, eval) => {
      const evalScore = (eval.afinacion + eval.articulacion + eval.ritmo + eval.cohesion + eval.dinamica + eval.memorizacion) / 6;
      return sum + evalScore;
    }, 0);

    return (totalScore / workEvaluations.length) * 20; // Convert to percentage (5 max score * 20 = 100%)
  }

  private calculateMetrics(reportData: ReportData): Record<string, number | string> {
    const evaluations = reportData.evaluations;
    
    if (evaluations.length === 0) {
      return {
        totalEvaluations: 0,
        averageScore: 0,
        bestCriterion: 'N/A',
        worstCriterion: 'N/A',
      };
    }

    const criteria = ['afinacion', 'articulacion', 'ritmo', 'cohesion', 'dinamica', 'memorizacion'];
    const criteriaAverages = criteria.map(criterion => {
      const scores = evaluations.map(e => e[criterion]).filter(score => score > 0);
      return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    });

    const overallAverage = criteriaAverages.reduce((sum, avg) => sum + avg, 0) / criteriaAverages.length;
    const bestIndex = criteriaAverages.indexOf(Math.max(...criteriaAverages));
    const worstIndex = criteriaAverages.indexOf(Math.min(...criteriaAverages));

    return {
      totalEvaluations: evaluations.length,
      averageScore: overallAverage,
      bestCriterion: this.getCriterionLabel(criteria[bestIndex]),
      worstCriterion: this.getCriterionLabel(criteria[worstIndex]),
      afinacionPromedio: criteriaAverages[0],
      articulacionPromedio: criteriaAverages[1],
      ritmoPromedio: criteriaAverages[2],
      cohesionPromedio: criteriaAverages[3],
      dinamicaPromedio: criteriaAverages[4],
      memorizacionPromedio: criteriaAverages[5],
    };
  }

  private generateRecommendations(reportData: ReportData): Array<{title: string, description: string}> {
    const metrics = this.calculateMetrics(reportData);
    const recommendations = [];

    if (typeof metrics.afinacionPromedio === 'number' && metrics.afinacionPromedio < 3) {
      recommendations.push({
        title: 'Mejorar Afinación',
        description: 'Se recomienda incrementar el tiempo dedicado a ejercicios de afinación y usar afinadores digitales en todos los ensayos.',
      });
    }

    if (typeof metrics.memorizacionPromedio === 'number' && metrics.memorizacionPromedio < 3) {
      recommendations.push({
        title: 'Fortalecer Memorización',
        description: 'Implementar técnicas de memorización por secciones y realizar ensayos sin partitura de forma gradual.',
      });
    }

    if (typeof metrics.cohesionPromedio === 'number' && metrics.cohesionPromedio < 3.5) {
      recommendations.push({
        title: 'Mejorar Cohesión',
        description: 'Aumentar la frecuencia de ensayos seccionales y trabajar en ejercicios de escucha activa entre instrumentos.',
      });
    }

    return recommendations;
  }

  private getMetricLabel(key: string): string {
    const labels = {
      totalEvaluations: 'Total de Evaluaciones',
      averageScore: 'Puntuación Promedio',
      bestCriterion: 'Mejor Criterio',
      worstCriterion: 'Criterio a Mejorar',
      afinacionPromedio: 'Afinación Promedio',
      articulacionPromedio: 'Articulación Promedio',
      ritmoPromedio: 'Ritmo Promedio',
      cohesionPromedio: 'Cohesión Promedio',
      dinamicaPromedio: 'Dinámica Promedio',
      memorizacionPromedio: 'Memorización Promedio',
    };
    return labels[key] || key;
  }

  private getCriterionLabel(criterion: string): string {
    const labels = {
      afinacion: 'Afinación',
      articulacion: 'Articulación',
      ritmo: 'Ritmo',
      cohesion: 'Cohesión',
      dinamica: 'Dinámica',
      memorizacion: 'Memorización',
    };
    return labels[criterion] || criterion;
  }

  async downloadReport(blob: Blob, filename: string, format: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const reportService = new ReportService();
export default reportService;