// src/modulos/Admin/services/advancedStudents.ts
import { db } from '@/firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import type { Student } from '../../Students/types/student';

// Types
export interface ImportResult {
  success: boolean
  imported: number
  failed: number
  errors: string[]
  duplicates: number
}

export interface EmailMessage {
  subject: string
  body: string
  attachments?: File[]
}

export interface ProgressReport {
  studentId: string
  studentName: string
  overallProgress: number
  classProgress: ClassProgress[]
  recommendations: string[]
  generatedAt: Date
}

export interface ClassProgress {
  classId: string
  className: string
  attendance: number
  performance: number
  lastEvaluation: Date
}

export interface SatisfactionMetrics {
  averageRating: number
  responseRate: number
  categories: {
    teaching: number
    facilities: number
    communication: number
    value: number
  }
}

export interface ChurnPrediction {
  riskLevel: 'low' | 'medium' | 'high'
  probability: number
  factors: string[]
  recommendations: string[]
}

export interface Document {
  id: string
  studentId: string
  type: 'contract' | 'certificate' | 'report' | 'other'
  name: string
  url: string
  uploadedAt: Date
}

// Advanced Students Service
export class AdvancedStudentsService {
  private static instance: AdvancedStudentsService;

  static getInstance(): AdvancedStudentsService {
    if (!this.instance) {
      this.instance = new AdvancedStudentsService();
    }
    return this.instance;
  }

  // IMPORTACIÓN DE DATOS
  async importStudentsFromCSV(file: File): Promise<ImportResult> {
    try {
      const result: ImportResult = {
        success: false,
        imported: 0,
        failed: 0,
        errors: [],
        duplicates: 0,
      };

      return new Promise((resolve) => {
        Papa.parse(file, {
          header: true,
          complete: async (results) => {
            const data = results.data as any[];

            for (const row of data) {
              try {
                // Validar datos requeridos
                if (!row.nombre || !row.apellido || !row.email) {
                  result.errors.push(`Fila ${data.indexOf(row) + 1}: Datos requeridos faltantes`);
                  result.failed++;
                  continue;
                }

                // Verificar si el estudiante ya existe
                const existingStudents = await this.findStudentByEmail(row.email);
                if (existingStudents.length > 0) {
                  result.duplicates++;
                  continue;
                }

                // Crear estudiante
                const studentData = this.mapCSVToStudent(row);
                await this.createStudentFromImport(studentData);
                result.imported++;
              } catch (error: any) {
                result.errors.push(`Fila ${data.indexOf(row) + 1}: ${error.message}`);
                result.failed++;
              }
            }

            result.success = result.imported > 0;
            resolve(result);
          },
          error: (error) => {
            result.errors.push(`Error al procesar CSV: ${error.message}`);
            resolve(result);
          },
        });
      });
    } catch (error: any) {
      throw new Error(`Error importando CSV: ${error.message}`);
    }
  }

  async importStudentsFromExcel(file: File): Promise<ImportResult> {
    try {
      const result: ImportResult = {
        success: false,
        imported: 0,
        failed: 0,
        errors: [],
        duplicates: 0,
      };

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      for (const row of data as any[]) {
        try {
          // Validar datos requeridos
          if (!row.nombre || !row.apellido || !row.email) {
            result.errors.push(`Fila ${data.indexOf(row) + 1}: Datos requeridos faltantes`);
            result.failed++;
            continue;
          }

          // Verificar duplicados
          const existingStudents = await this.findStudentByEmail(row.email);
          if (existingStudents.length > 0) {
            result.duplicates++;
            continue;
          }

          // Crear estudiante
          const studentData = this.mapExcelToStudent(row);
          await this.createStudentFromImport(studentData);
          result.imported++;
        } catch (error: any) {
          result.errors.push(`Fila ${data.indexOf(row) + 1}: ${error.message}`);
          result.failed++;
        }
      }

      result.success = result.imported > 0;
      return result;
    } catch (error: any) {
      throw new Error(`Error importando Excel: ${error.message}`);
    }
  }

  // COMUNICACIÓN
  async sendBulkEmailToStudents(studentIds: string[], message: EmailMessage): Promise<void> {
    try {
      // Simular envío de email (integrar con servicio real de email)
      console.log('🚀 Enviando emails masivos:', {
        recipients: studentIds.length,
        subject: message.subject,
        hasAttachments: (message.attachments?.length || 0) > 0,
      });

      // Aquí integrarías con un servicio como SendGrid, Mailgun, etc.
      for (const studentId of studentIds) {
        await this.sendEmailToStudent(studentId, message);
      }

      // Registrar actividad
      await this.logBulkActivity('bulk_email', studentIds, message.subject);
    } catch (error: any) {
      throw new Error(`Error enviando emails masivos: ${error.message}`);
    }
  }

  async sendWhatsAppToParents(studentIds: string[], message: string): Promise<void> {
    try {
      console.log('📱 Enviando WhatsApp a padres:', {
        recipients: studentIds.length,
        messageLength: message.length,
      });

      // Integrar con API de WhatsApp Business
      for (const studentId of studentIds) {
        await this.sendWhatsAppToParent(studentId, message);
      }

      // Registrar actividad
      await this.logBulkActivity('bulk_whatsapp', studentIds, 'WhatsApp masivo');
    } catch (error: any) {
      throw new Error(`Error enviando WhatsApp: ${error.message}`);
    }
  }

  // REPORTES AVANZADOS
  async generateStudentProgressReport(studentId: string): Promise<ProgressReport> {
    try {
      const student = await this.getStudentById(studentId);
      if (!student) {
        throw new Error('Estudiante no encontrado');
      }

      // Obtener progreso de clases
      const classProgress = await this.getStudentClassProgress(studentId);

      // Calcular progreso general
      const overallProgress = this.calculateOverallProgress(classProgress);

      // Generar recomendaciones
      const recommendations = this.generateRecommendations(classProgress);

      return {
        studentId,
        studentName: `${student.nombre} ${student.apellido}`,
        overallProgress,
        classProgress,
        recommendations,
        generatedAt: new Date(),
      };
    } catch (error: any) {
      throw new Error(`Error generando reporte de progreso: ${error.message}`);
    }
  }

  async generateClassRosterPDF(classId: string): Promise<Blob> {
    try {
      // Obtener estudiantes de la clase
      const students = await this.getStudentsByClass(classId);
      const classInfo = await this.getClassInfo(classId);

      // Crear PDF
      const pdf = new jsPDF();

      // Header
      pdf.setFontSize(20);
      pdf.text('Lista de Clase', 20, 30);

      pdf.setFontSize(14);
      pdf.text(`Clase: ${classInfo.name}`, 20, 50);
      pdf.text(`Maestro: ${classInfo.teacherName}`, 20, 65);
      pdf.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 80);

      // Lista de estudiantes
      pdf.setFontSize(12);
      let yPosition = 100;

      students.forEach((student, index) => {
        const text = `${index + 1}. ${student.nombre} ${student.apellido} - ${student.email}`;
        pdf.text(text, 20, yPosition);
        yPosition += 15;

        // Nueva página si es necesario
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }
      });

      return new Blob([pdf.output('blob')], { type: 'application/pdf' });
    } catch (error: any) {
      throw new Error(`Error generando PDF de lista: ${error.message}`);
    }
  }

  async generateAttendanceCertificate(studentId: string): Promise<Blob> {
    try {
      const student = await this.getStudentById(studentId);
      const attendanceStats = await this.getStudentAttendanceStats(studentId);

      const pdf = new jsPDF();

      // Certificado de asistencia
      pdf.setFontSize(24);
      pdf.text('CERTIFICADO DE ASISTENCIA', 20, 50);

      pdf.setFontSize(16);
      pdf.text(`Se certifica que ${student.nombre} ${student.apellido}`, 20, 80);
      pdf.text(`ha mantenido una asistencia del ${attendanceStats.percentage}%`, 20, 100);
      pdf.text('durante el período académico.', 20, 120);

      pdf.setFontSize(12);
      pdf.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 20, 160);

      return new Blob([pdf.output('blob')], { type: 'application/pdf' });
    } catch (error: any) {
      throw new Error(`Error generando certificado: ${error.message}`);
    }
  }

  // ANÁLISIS Y MÉTRICAS
  async getStudentRetentionRate(period: {start: Date; end: Date}): Promise<number> {
    try {
      const startStudents = await this.getActiveStudentsAtDate(period.start);
      const endStudents = await this.getActiveStudentsAtDate(period.end);

      const retainedStudents = startStudents.filter((student) =>
        endStudents.some((endStudent) => endStudent.id === student.id),
      );

      return startStudents.length > 0 ? (retainedStudents.length / startStudents.length) * 100 : 0;
    } catch (error: any) {
      throw new Error(`Error calculando tasa de retención: ${error.message}`);
    }
  }

  async getStudentSatisfactionMetrics(): Promise<SatisfactionMetrics> {
    try {
      // Simular métricas de satisfacción (integrar con sistema de encuestas real)
      return {
        averageRating: 4.3,
        responseRate: 78,
        categories: {
          teaching: 4.5,
          facilities: 4.1,
          communication: 4.2,
          value: 4.0,
        },
      };
    } catch (error: any) {
      throw new Error(`Error obteniendo métricas de satisfacción: ${error.message}`);
    }
  }

  async predictStudentChurn(studentId: string): Promise<ChurnPrediction> {
    try {
      const student = await this.getStudentById(studentId);
      const attendanceHistory = await this.getStudentAttendanceHistory(studentId);
      const paymentHistory = await this.getStudentPaymentHistory(studentId);

      // Análisis simple de factores de riesgo
      const factors: string[] = [];
      let riskScore = 0;

      // Factor: Asistencia baja
      if (attendanceHistory.averageAttendance < 70) {
        factors.push('Asistencia baja (< 70%)');
        riskScore += 30;
      }

      // Factor: Pagos atrasados
      if (paymentHistory.latePayments > 2) {
        factors.push('Pagos frecuentemente atrasados');
        riskScore += 25;
      }

      // Factor: Sin actividad reciente
      const lastActivity = new Date(student.updatedAt || student.createdAt);
      const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActivity > 30) {
        factors.push('Sin actividad en más de 30 días');
        riskScore += 20;
      }

      // Determinar nivel de riesgo
      let riskLevel: 'low' | 'medium' | 'high';
      if (riskScore >= 50) riskLevel = 'high';
      else if (riskScore >= 25) riskLevel = 'medium';
      else riskLevel = 'low';

      // Generar recomendaciones
      const recommendations = this.generateChurnRecommendations(factors, riskLevel);

      return {
        riskLevel,
        probability: Math.min(riskScore, 100),
        factors,
        recommendations,
      };
    } catch (error: any) {
      throw new Error(`Error prediciendo deserción: ${error.message}`);
    }
  }

  // GESTIÓN DE DOCUMENTOS
  async uploadStudentDocument(studentId: string, document: File): Promise<Document> {
    try {
      // Simular subida de documento (integrar con Firebase Storage)
      const documentUrl = `https://storage.example.com/students/${studentId}/${document.name}`;

      const documentRecord: Document = {
        id: this.generateId(),
        studentId,
        type: this.detectDocumentType(document.name),
        name: document.name,
        url: documentUrl,
        uploadedAt: new Date(),
      };

      // Guardar en Firestore
      await addDoc(collection(db, 'student_documents'), documentRecord);

      return documentRecord;
    } catch (error: any) {
      throw new Error(`Error subiendo documento: ${error.message}`);
    }
  }

  async getStudentDocuments(studentId: string): Promise<Document[]> {
    try {
      const q = query(
        collection(db, 'student_documents'),
        where('studentId', '==', studentId),
        orderBy('uploadedAt', 'desc'),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Document);
    } catch (error: any) {
      throw new Error(`Error obteniendo documentos: ${error.message}`);
    }
  }

  // MÉTODOS AUXILIARES PRIVADOS
  private async findStudentByEmail(email: string): Promise<Student[]> {
    const q = query(collection(db, 'ALUMNOS'), where('email', '==', email));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Student);
  }

  private mapCSVToStudent(row: any): Partial<Student> {
    return {
      nombre: row.nombre?.trim(),
      apellido: row.apellido?.trim(),
      email: row.email?.trim().toLowerCase(),
      telefono: row.telefono?.trim(),
      instrumento: row.instrumento?.trim(),
      nivel: row.nivel?.trim() || 'Principiante',
      activo: true,
      fechaInscripcion: new Date(),
      observaciones: row.observaciones?.trim() || '',
    };
  }

  private mapExcelToStudent(row: any): Partial<Student> {
    return this.mapCSVToStudent(row); // Mismo mapeo para Excel
  }

  private async createStudentFromImport(studentData: Partial<Student>): Promise<void> {
    await addDoc(collection(db, 'ALUMNOS'), {
      ...studentData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  private async sendEmailToStudent(studentId: string, message: EmailMessage): Promise<void> {
    // Implementar envío real de email
    console.log(`📧 Email enviado a estudiante ${studentId}:`, message.subject);
  }

  private async sendWhatsAppToParent(studentId: string, message: string): Promise<void> {
    // Implementar envío real de WhatsApp
    console.log(`📱 WhatsApp enviado al padre del estudiante ${studentId}`);
  }

  private async logBulkActivity(
    type: string,
    studentIds: string[],
    description: string,
  ): Promise<void> {
    await addDoc(collection(db, 'activity_logs'), {
      type,
      targetType: 'students',
      targetIds: studentIds,
      description,
      performedBy: 'admin', // Obtener del contexto de usuario
      timestamp: new Date(),
    });
  }

  private async getStudentById(studentId: string): Promise<Student> {
    // Implementar obtención de estudiante por ID
    throw new Error('Not implemented');
  }

  private async getStudentsByClass(classId: string): Promise<Student[]> {
    // Implementar obtención de estudiantes por clase
    throw new Error('Not implemented');
  }

  private async getClassInfo(classId: string): Promise<any> {
    // Implementar obtención de información de clase
    throw new Error('Not implemented');
  }

  private async getStudentClassProgress(studentId: string): Promise<ClassProgress[]> {
    // Implementar obtención de progreso por clase
    return [];
  }

  private calculateOverallProgress(classProgress: ClassProgress[]): number {
    if (classProgress.length === 0) return 0;
    const total = classProgress.reduce((sum, cp) => sum + cp.performance, 0);
    return Math.round(total / classProgress.length);
  }

  private generateRecommendations(classProgress: ClassProgress[]): string[] {
    const recommendations: string[] = [];

    const lowPerformance = classProgress.filter((cp) => cp.performance < 70);
    if (lowPerformance.length > 0) {
      recommendations.push('Considerar refuerzo en clases con bajo rendimiento');
    }

    const lowAttendance = classProgress.filter((cp) => cp.attendance < 80);
    if (lowAttendance.length > 0) {
      recommendations.push('Mejorar asistencia regular a clases');
    }

    return recommendations;
  }

  private async getActiveStudentsAtDate(date: Date): Promise<Student[]> {
    // Implementar obtención de estudiantes activos en fecha específica
    return [];
  }

  private async getStudentAttendanceStats(studentId: string): Promise<{percentage: number}> {
    // Implementar obtención de estadísticas de asistencia
    return { percentage: 85 };
  }

  private async getStudentAttendanceHistory(
    studentId: string,
  ): Promise<{averageAttendance: number}> {
    // Implementar obtención de historial de asistencia
    return { averageAttendance: 82 };
  }

  private async getStudentPaymentHistory(studentId: string): Promise<{latePayments: number}> {
    // Implementar obtención de historial de pagos
    return { latePayments: 1 };
  }

  private generateChurnRecommendations(factors: string[], riskLevel: string): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'high') {
      recommendations.push('Contactar inmediatamente al estudiante');
      recommendations.push('Ofrecer sesión de recuperación personalizada');
    }

    if (factors.some((f) => f.includes('Asistencia'))) {
      recommendations.push('Implementar plan de seguimiento de asistencia');
    }

    if (factors.some((f) => f.includes('Pagos'))) {
      recommendations.push('Revisar opciones de pago flexible');
    }

    return recommendations;
  }

  private detectDocumentType(filename: string): Document['type'] {
    const lower = filename.toLowerCase();
    if (lower.includes('contract') || lower.includes('contrato')) return 'contract';
    if (lower.includes('certificate') || lower.includes('certificado')) return 'certificate';
    if (lower.includes('report') || lower.includes('reporte')) return 'report';
    return 'other';
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const advancedStudentsService = AdvancedStudentsService.getInstance();
