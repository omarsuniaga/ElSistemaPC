import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  getDoc,
  addDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../../firebase/config';
import * as XLSX from 'xlsx';
import type { Student } from '../../Students/types/student';

// Interfaces for Advanced Features
export interface ImportResult {
  success: boolean
  imported: number
  failed: number
  errors: string[]
  duplicates: number
  data: {
    successfulImports: Student[]
    failedImports: {row: number; data: any; error: string}[]
    duplicateEmails: string[]
  }
}

export interface EmailMessage {
  subject: string
  body: string
  attachments?: File[]
  templateId?: string
}

export interface WhatsAppMessage {
  message: string
  templateId?: string
  variables?: Record<string, string>
}

export interface ProgressReport {
  studentId: string
  studentName: string
  overallProgress: number
  academicPerformance: {
    averageGrade: number
    completedLessons: number
    missedLessons: number
    improvementAreas: string[]
  }
  attendanceAnalysis: {
    attendanceRate: number
    consecutiveAbsences: number
    attendancePattern: string
    riskLevel: 'low' | 'medium' | 'high'
  }
  parentEngagement: {
    communicationFrequency: number
    eventAttendance: number
    feedbackScore: number
  }
  recommendations: string[]
  generatedAt: Date
}

export interface DropoutRisk {
  studentId: string
  studentName: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  factors: {
    attendanceRate: number
    paymentDelays: number
    performanceScore: number
    parentEngagement: number
  }
  recommendations: string[]
  actionItems: string[]
}

export interface StudentMetrics {
  totalStudents: number
  activeStudents: number
  newThisMonth: number
  retentionRate: number
  averageAttendance: number
  riskStudents: number
  topPerformers: number
  revenueImpact: number
}

export interface AttendancePattern {
  studentId: string
  patterns: {
    weekdayPreference: string[]
    timePreference: string
    seasonalTrends: {month: string; rate: number}[]
    consecutiveAbsences: number
    averageGapBetweenAbsences: number
  }
  predictions: {
    nextAbsenceRisk: number
    optimalSchedule: string[]
    interventionRecommendations: string[]
  }
}

export interface FinancialReport {
  studentId: string
  studentName: string
  totalDue: number
  totalPaid: number
  outstandingBalance: number
  paymentHistory: PaymentRecord[]
  nextPaymentDue: Date
  paymentPattern: 'on-time' | 'late' | 'irregular'
  riskLevel: 'low' | 'medium' | 'high'
}

export interface PaymentRecord {
  date: Date
  amount: number
  method: string
  status: 'paid' | 'pending' | 'overdue'
  invoiceId: string
}

export class AdvancedStudentsService {
  private studentsCollection = collection(db, 'students');
  private attendanceCollection = collection(db, 'attendance');
  private paymentsCollection = collection(db, 'payments');

  // ==================== IMPORT/EXPORT FUNCTIONS ====================

  /**
   * Import students from CSV/Excel file with advanced validation
   */
  async importStudentsFromFile(file: File): Promise<ImportResult> {
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const result: ImportResult = {
        success: true,
        imported: 0,
        failed: 0,
        errors: [],
        duplicates: 0,
        data: {
          successfulImports: [],
          failedImports: [],
          duplicateEmails: [],
        },
      };

      // Get existing students to check for duplicates
      const existingStudents = await getDocs(this.studentsCollection);
      const existingEmails = new Set(existingStudents.docs.map((doc) => doc.data().email));

      const batch = writeBatch(db);
      let batchCount = 0;

      for (let i = 0; i < data.length; i++) {
        const row = data[i] as any;

        try {
          // Validate required fields
          if (!row.email || !row.nombre || !row.apellido) {
            result.failed++;
            result.data.failedImports.push({
              row: i + 1,
              data: row,
              error: 'Missing required fields (email, nombre, apellido)',
            });
            continue;
          }

          // Check for duplicates
          if (existingEmails.has(row.email)) {
            result.duplicates++;
            result.data.duplicateEmails.push(row.email);
            continue;
          }

          // Transform data to Student format
          const studentData: Partial<Student> = {
            nombre: row.nombre,
            apellido: row.apellido,
            email: row.email,
            phone: row.phone || row.telefono || '',
            instrumento: row.instrumento || '',
            activo: row.activo !== undefined ? Boolean(row.activo) : true,
            fechaNacimiento: row.fechaNacimiento ? new Date(row.fechaNacimiento) : undefined,
            direccion: row.direccion || '',
            ciudad: row.ciudad || '',
            madre: row.madre || '',
            padre: row.padre || '',
            tlf_madre: row.tlf_madre || '',
            tlf_padre: row.tlf_padre || '',
            observaciones: row.observaciones || '',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Add to batch
          const newDocRef = doc(this.studentsCollection);
          batch.set(newDocRef, studentData);
          batchCount++;

          result.imported++;
          result.data.successfulImports.push({
            ...studentData,
            id: newDocRef.id,
          } as Student);

          // Commit batch every 500 operations
          if (batchCount >= 500) {
            await batch.commit();
            batchCount = 0;
          }
        } catch (error) {
          result.failed++;
          result.data.failedImports.push({
            row: i + 1,
            data: row,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Commit remaining operations
      if (batchCount > 0) {
        await batch.commit();
      }

      return result;
    } catch (error) {
      console.error('Error importing students:', error);
      return {
        success: false,
        imported: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duplicates: 0,
        data: {
          successfulImports: [],
          failedImports: [],
          duplicateEmails: [],
        },
      };
    }
  }

  /**
   * Export students to Excel with advanced filtering
   */
  async exportStudentsToExcel(filters?: {
    active?: boolean
    instrument?: string
    class?: string
    dateRange?: {start: Date; end: Date}
  }): Promise<Blob> {
    try {
      let q = query(this.studentsCollection);

      // Apply filters
      if (filters?.active !== undefined) {
        q = query(q, where('activo', '==', filters.active));
      }
      if (filters?.instrument) {
        q = query(q, where('instrumento', '==', filters.instrument));
      }
      if (filters?.class) {
        q = query(q, where('classId', '==', filters.class));
      }

      const querySnapshot = await getDocs(q);
      const students: any[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();

        // Get additional data
        const attendanceRate = await this.calculateAttendanceRate(doc.id, 30);
        const paymentStatus = await this.getPaymentStatus(doc.id);

        students.push({
          ID: doc.id,
          Nombre: data.nombre,
          Apellido: data.apellido,
          Email: data.email,
          Teléfono: data.phone,
          Instrumento: data.instrumento,
          Activo: data.activo ? 'Sí' : 'No',
          'Fecha Nacimiento': data.fechaNacimiento
            ? new Date(data.fechaNacimiento.seconds * 1000).toLocaleDateString()
            : '',
          Dirección: data.direccion,
          Ciudad: data.ciudad,
          Madre: data.madre,
          Padre: data.padre,
          'Tel. Madre': data.tlf_madre,
          'Tel. Padre': data.tlf_padre,
          'Asistencia (30d)': `${Math.round(attendanceRate * 100)}%`,
          'Estado Pago': paymentStatus,
          'Fecha Inscripción': data.createdAt
            ? new Date(data.createdAt.seconds * 1000).toLocaleDateString()
            : '',
          Observaciones: data.observaciones,
        });
      }

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(students);

      // Auto-size columns
      const maxWidth = students.reduce(
        (acc, row) => {
          Object.keys(row).forEach((key) => {
            const length = String(row[key]).length;
            acc[key] = Math.max(acc[key] || 0, length);
          });
          return acc;
        },
        {} as Record<string, number>,
      );

      ws['!cols'] = Object.keys(maxWidth).map((key) => ({ wch: Math.min(maxWidth[key] + 2, 50) }));

      XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes');

      // Convert to blob
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      return new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    } catch (error) {
      console.error('Error exporting students:', error);
      throw error;
    }
  }

  // ==================== COMMUNICATION FUNCTIONS ====================

  /**
   * Send bulk email to selected students
   */ async sendBulkEmail(studentIds: string[], message: EmailMessage): Promise<void> {
    try {
      const students = await Promise.all(
        studentIds.map((id) => getDoc(doc(this.studentsCollection, id))),
      );

      const validStudents = students
        .filter((doc) => doc.exists())
        .map((doc) => ({ id: doc.id, ...doc.data() }) as Student);

      // In a real implementation, integrate with email service (SendGrid, etc.)
      const emailPromises = validStudents.map(async (student) => {
        const personalizedMessage = message.body.replace(/\{nombre\}/g, student.nombre);

        // Create email record
        await addDoc(collection(db, 'email_logs'), {
          studentId: student.id,
          studentEmail: student.email,
          subject: message.subject,
          body: personalizedMessage,
          status: 'sent',
          sentAt: new Date(),
          type: 'bulk',
        });

        // Here you would integrate with your email service
        console.log(`Email sent to ${student.email}: ${message.subject}`);
      });

      await Promise.all(emailPromises);
    } catch (error) {
      console.error('Error sending bulk email:', error);
      throw error;
    }
  }

  /**
   * Send bulk WhatsApp messages to selected students
   */
  async sendBulkWhatsApp(studentIds: string[], message: WhatsAppMessage): Promise<void> {
    try {
      const students = await Promise.all(
        studentIds.map((id) => getDoc(doc(this.studentsCollection, id))),
      );

      const validStudents = students
        .filter((doc) => doc.exists())
        .map((doc) => ({ id: doc.id, ...doc.data() }) as Student);

      const whatsappPromises = validStudents.map(async (student) => {
        const phone = student.phone || student.tlf_madre || student.tlf_padre;

        if (!phone) {
          console.warn(`No phone number for student ${student.nombre} ${student.apellido}`);
          return;
        }

        const personalizedMessage = message.message.replace(/\{nombre\}/g, student.nombre);

        // Create WhatsApp log
        await addDoc(collection(db, 'whatsapp_logs'), {
          studentId: student.id,
          phone,
          message: personalizedMessage,
          status: 'sent',
          sentAt: new Date(),
          type: 'bulk',
        });

        // Here you would integrate with WhatsApp Business API
        console.log(`WhatsApp sent to ${phone}: ${personalizedMessage}`);
      });

      await Promise.all(whatsappPromises);
    } catch (error) {
      console.error('Error sending bulk WhatsApp:', error);
      throw error;
    }
  }

  // ==================== ANALYTICS FUNCTIONS ====================

  /**
   * Get comprehensive student metrics
   */ async getStudentMetrics(): Promise<StudentMetrics> {
    try {
      const studentsSnapshot = await getDocs(this.studentsCollection);
      const students = studentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Student);

      const totalStudents = students.length;
      const activeStudents = students.filter((s) => s.activo).length; // Calculate new students this month
      const currentMonth = new Date();
      currentMonth.setDate(1);

      const newThisMonth = students.filter((s) => {
        if (!s.createdAt) return false;
        const createdAt =
          s.createdAt instanceof Timestamp ? s.createdAt.toDate() : new Date(s.createdAt);
        return createdAt >= currentMonth;
      }).length;

      // Calculate retention rate (students active > 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const oldStudents = students.filter((s) => {
        if (!s.createdAt) return false;
        const createdAt =
          s.createdAt instanceof Timestamp ? s.createdAt.toDate() : new Date(s.createdAt);
        return createdAt <= sixMonthsAgo;
      });
      const retentionRate =
        oldStudents.length > 0
          ? (oldStudents.filter((s) => s.activo).length / oldStudents.length) * 100
          : 0;

      // Calculate average attendance (last 30 days)
      const attendanceRates = await Promise.all(
        students.filter((s) => s.activo).map((s) => this.calculateAttendanceRate(s.id, 30)),
      );
      const averageAttendance =
        (attendanceRates.reduce((sum, rate) => sum + rate, 0) / attendanceRates.length) * 100;

      // Calculate risk students
      const dropoutRisks = await this.getDropoutRiskAnalysis();
      const riskStudents = dropoutRisks.filter(
        (r) => r.riskLevel === 'high' || r.riskLevel === 'critical',
      ).length;

      // Calculate top performers
      const topPerformers = attendanceRates.filter((rate) => rate > 0.9).length;

      // Calculate revenue impact (estimated)
      const averageMonthlyFee = 150; // TODO: Obtener de la configuración del sistema o de las tarifas de clases reales // This should come from actual class fees
      const revenueImpact = activeStudents * averageMonthlyFee;

      return {
        totalStudents,
        activeStudents,
        newThisMonth,
        retentionRate,
        averageAttendance,
        riskStudents,
        topPerformers,
        revenueImpact,
      };
    } catch (error) {
      console.error('Error calculating student metrics:', error);
      throw error;
    }
  }

  /**
   * Advanced dropout risk analysis using multiple factors
   */
  async getDropoutRiskAnalysis(): Promise<DropoutRisk[]> {
    try {
      const studentsSnapshot = await getDocs(
        query(this.studentsCollection, where('activo', '==', true)),
      );

      const riskAnalysis: DropoutRisk[] = [];

      for (const studentDoc of studentsSnapshot.docs) {
        const studentData = studentDoc.data();
        const studentId = studentDoc.id;

        // Calculate risk factors
        const attendanceRate = await this.calculateAttendanceRate(studentId, 60); // Last 60 days
        const paymentDelays = await this.getPaymentDelayCount(studentId, 90); // Last 90 days
        const performanceScore = await this.getPerformanceScore(studentId);
        const parentEngagement = await this.getParentEngagementScore(studentId);

        // Risk scoring algorithm
        let riskScore = 0;

        // Attendance factor (0-40 points)
        if (attendanceRate < 0.5) riskScore += 40;
        else if (attendanceRate < 0.7) riskScore += 25;
        else if (attendanceRate < 0.85) riskScore += 10;

        // Payment factor (0-30 points)
        if (paymentDelays > 3) riskScore += 30;
        else if (paymentDelays > 1) riskScore += 15;
        else if (paymentDelays > 0) riskScore += 5;

        // Performance factor (0-20 points)
        if (performanceScore < 0.4) riskScore += 20;
        else if (performanceScore < 0.6) riskScore += 10;

        // Parent engagement factor (0-10 points)
        if (parentEngagement < 0.3) riskScore += 10;
        else if (parentEngagement < 0.6) riskScore += 5;

        // Determine risk level
        let riskLevel: 'low' | 'medium' | 'high' | 'critical';
        if (riskScore >= 80) riskLevel = 'critical';
        else if (riskScore >= 60) riskLevel = 'high';
        else if (riskScore >= 30) riskLevel = 'medium';
        else riskLevel = 'low';

        // Only include medium+ risk students
        if (riskLevel !== 'low') {
          riskAnalysis.push({
            studentId,
            studentName: `${studentData.nombre} ${studentData.apellido}`,
            riskScore,
            riskLevel,
            factors: {
              attendanceRate,
              paymentDelays,
              performanceScore,
              parentEngagement,
            },
            recommendations: this.generateRiskRecommendations(riskScore, {
              attendanceRate,
              paymentDelays,
              performanceScore,
              parentEngagement,
            }),
            actionItems: this.generateActionItems(riskLevel, {
              attendanceRate,
              paymentDelays,
              performanceScore,
              parentEngagement,
            }),
          });
        }
      }

      return riskAnalysis.sort((a, b) => b.riskScore - a.riskScore);
    } catch (error) {
      console.error('Error in dropout risk analysis:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive progress report for a student
   */
  async generateProgressReport(studentId: string): Promise<ProgressReport> {
    try {
      const studentDoc = await getDoc(doc(this.studentsCollection, studentId));
      if (!studentDoc.exists()) {
        throw new Error('Student not found');
      }

      const studentData = studentDoc.data();
      const studentName = `${studentData.nombre} ${studentData.apellido}`;

      // Get academic performance data
      const attendanceRate = await this.calculateAttendanceRate(studentId, 90);
      const performanceScore = await this.getPerformanceScore(studentId);
      const attendanceHistory = await this.getAttendanceHistory(studentId, 90);

      // Calculate attendance analysis
      const consecutiveAbsences = this.calculateConsecutiveAbsences(attendanceHistory);
      const attendancePattern = this.analyzeAttendancePattern(attendanceHistory);
      const riskLevel = attendanceRate < 0.6 ? 'high' : attendanceRate < 0.8 ? 'medium' : 'low';

      // Get parent engagement metrics
      const parentEngagement = await this.getParentEngagementScore(studentId);

      // Calculate overall progress
      const overallProgress = Math.round(
        (attendanceRate * 0.4 + performanceScore * 0.4 + parentEngagement * 0.2) * 100,
      );

      // Generate recommendations
      const recommendations = this.generateProgressRecommendations(
        attendanceRate,
        performanceScore,
        parentEngagement,
        consecutiveAbsences,
      );

      return {
        studentId,
        studentName,
        overallProgress,
        academicPerformance: {
          averageGrade: Math.round(performanceScore * 100),
          completedLessons: attendanceHistory.filter((a) => a.present).length,
          missedLessons: attendanceHistory.filter((a) => !a.present).length,
          improvementAreas: this.identifyImprovementAreas(performanceScore, attendanceRate),
        },
        attendanceAnalysis: {
          attendanceRate: Math.round(attendanceRate * 100),
          consecutiveAbsences,
          attendancePattern,
          riskLevel,
        },
        parentEngagement: {
          communicationFrequency: Math.round(parentEngagement * 10),
          eventAttendance: Math.round(parentEngagement * 100),
          feedbackScore: Math.round(parentEngagement * 5),
        },
        recommendations,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating progress report:', error);
      throw error;
    }
  }

  // ==================== HELPER FUNCTIONS ====================

  private async calculateAttendanceRate(studentId: string, days: number): Promise<number> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const attendanceQuery = query(
        this.attendanceCollection,
        where('studentId', '==', studentId),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
      );

      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceRecords = attendanceSnapshot.docs.map((doc) => doc.data());

      if (attendanceRecords.length === 0) return 0;

      const presentCount = attendanceRecords.filter((record) => record.present).length;
      return presentCount / attendanceRecords.length;
    } catch (error) {
      console.error('Error calculating attendance rate:', error);
      return 0;
    }
  }

  private async getPaymentStatus(studentId: string): Promise<string> {
    try {
      const paymentsQuery = query(
        this.paymentsCollection,
        where('studentId', '==', studentId),
        orderBy('dueDate', 'desc'),
        limit(1),
      );

      const paymentSnapshot = await getDocs(paymentsQuery);
      if (paymentSnapshot.empty) return 'No hay pagos';

      const latestPayment = paymentSnapshot.docs[0].data();
      return latestPayment.status === 'paid' ? 'Al día' : 'Pendiente';
    } catch (error) {
      console.error('Error getting payment status:', error);
      return 'Desconocido';
    }
  }
  private async getPaymentDelayCount(studentId: string, days: number): Promise<number> {
    try {
      // Query payments collection for this student in the last X days
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const paymentsQuery = query(
        this.paymentsCollection,
        where('studentId', '==', studentId),
        where('dueDate', '>=', Timestamp.fromDate(startDate)),
        where('dueDate', '<=', Timestamp.fromDate(endDate)),
      );

      const paymentsSnapshot = await getDocs(paymentsQuery);
      const delayedPayments = paymentsSnapshot.docs.filter((doc) => {
        const payment = doc.data();
        const dueDate = payment.dueDate.toDate();
        const paidDate = payment.paidDate?.toDate();

        // Count as delayed if paid after due date or still unpaid
        return !paidDate || paidDate > dueDate;
      });

      return delayedPayments.length;
    } catch (error) {
      console.error('Error getting payment delays:', error);
      return 0;
    }
  }
  private async getPerformanceScore(studentId: string): Promise<number> {
    try {
      // Query qualifications or performance evaluations for this student
      const qualificationsQuery = query(
        collection(db, 'qualifications'),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc'),
        limit(10), // Last 10 evaluations
      );

      const qualificationsSnapshot = await getDocs(qualificationsQuery);

      if (qualificationsSnapshot.empty) {
        return 0.6; // Default neutral score if no evaluations
      }

      const scores = qualificationsSnapshot.docs.map((doc) => {
        const data = doc.data();
        // Normalize different scoring systems to 0-1 range
        if (data.score) return Math.min(data.score / 100, 1);
        if (data.grade) {
          const gradeMap: Record<string, number> = {
            A: 0.9,
            B: 0.8,
            C: 0.7,
            D: 0.6,
            F: 0.3,
          };
          return gradeMap[data.grade] || 0.6;
        }
        return 0.6;
      });

      return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    } catch (error) {
      console.error('Error getting performance score:', error);
      return 0.6; // Default neutral score on error
    }
  }
  private async getParentEngagementScore(studentId: string): Promise<number> {
    try {
      // Calculate parent engagement based on communication logs and involvement
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Check email/WhatsApp communication logs
      const communicationQuery = query(
        collection(db, 'communication_logs'),
        where('studentId', '==', studentId),
        where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      );

      const communicationSnapshot = await getDocs(communicationQuery);
      const communicationCount = communicationSnapshot.size;

      // Check parent meeting attendance
      const meetingsQuery = query(
        collection(db, 'parent_meetings'),
        where('studentId', '==', studentId),
        where('date', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      );

      const meetingsSnapshot = await getDocs(meetingsQuery);
      const attendedMeetings = meetingsSnapshot.docs.filter((doc) => doc.data().attended).length;
      const totalMeetings = meetingsSnapshot.size;

      // Calculate engagement score (0-1)
      const communicationScore = Math.min(communicationCount / 10, 1) * 0.6; // Max 10 communications
      const meetingScore = totalMeetings > 0 ? (attendedMeetings / totalMeetings) * 0.4 : 0.2;

      return Math.max(communicationScore + meetingScore, 0.2); // Minimum score of 0.2
    } catch (error) {
      console.error('Error getting parent engagement score:', error);
      return 0.5; // Default neutral score on error
    }
  }
  private async getAttendanceHistory(studentId: string, days: number): Promise<any[]> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      // Query attendance records for this student
      const attendanceQuery = query(
        this.attendanceCollection,
        where('alumnos', 'array-contains', studentId),
        where('fecha', '>=', startDate.toISOString().split('T')[0]),
        where('fecha', '<=', endDate.toISOString().split('T')[0]),
        orderBy('fecha', 'desc'),
      );

      const attendanceSnapshot = await getDocs(attendanceQuery);

      return attendanceSnapshot.docs.map((doc) => {
        const data = doc.data();
        const studentAttendance = data.attendanceRecords?.[studentId];

        return {
          date: new Date(data.fecha),
          present:
            studentAttendance?.status === 'present' || studentAttendance?.status === 'delayed',
          status: studentAttendance?.status || 'absent',
          classId: data.classId,
          observations: studentAttendance?.observations || '',
        };
      });
    } catch (error) {
      console.error('Error getting attendance history:', error);
      return [];
    }
  }

  private calculateConsecutiveAbsences(attendanceHistory: any[]): number {
    let consecutive = 0;
    for (const record of attendanceHistory) {
      if (!record.present) {
        consecutive++;
      } else {
        break;
      }
    }
    return consecutive;
  }

  private analyzeAttendancePattern(attendanceHistory: any[]): string {
    const attendanceRate =
      attendanceHistory.filter((a) => a.present).length / attendanceHistory.length;

    if (attendanceRate > 0.9) return 'Excelente';
    if (attendanceRate > 0.8) return 'Bueno';
    if (attendanceRate > 0.6) return 'Regular';
    return 'Preocupante';
  }
  private generateRiskRecommendations(riskScore: number, factors: any): string[] {
    const recommendations = [];

    // Use riskScore to determine urgency level
    const isUrgent = riskScore > 80;
    const isHigh = riskScore > 60;

    if (factors.attendanceRate < 0.7) {
      recommendations.push(
        isUrgent
          ? 'URGENTE: Contactar inmediatamente para discutir las ausencias'
          : 'Contactar para discutir las ausencias',
      );
      recommendations.push('Ofrecer horarios alternativos o clases de recuperación');
    }

    if (factors.paymentDelays > 1) {
      recommendations.push(
        isHigh
          ? 'Revisar urgentemente opciones de pago flexibles'
          : 'Revisar opciones de pago flexibles',
      );
      recommendations.push('Considerar descuentos por pronto pago');
    }

    if (factors.performanceScore < 0.6) {
      recommendations.push('Evaluar si el nivel de la clase es apropiado');
      recommendations.push('Considerar clases de apoyo adicionales');
    }

    if (factors.parentEngagement < 0.5) {
      recommendations.push('Incrementar comunicación con los padres');
      recommendations.push('Invitar a eventos y recitales');
    }

    return recommendations;
  }
  private generateActionItems(riskLevel: string, factors: any): string[] {
    const actions = [];

    if (riskLevel === 'critical') {
      actions.push('Llamada urgente en las próximas 24 horas');
      actions.push('Reunión presencial con padres');
      actions.push('Plan de retención personalizado');
    } else if (riskLevel === 'high') {
      actions.push('Contactar en los próximos 3 días');
      actions.push('Ofrecer clase de prueba gratuita');

      // Add specific actions based on factors
      if (factors.attendanceRate < 0.6) {
        actions.push('Revisar horarios disponibles');
      }
      if (factors.paymentDelays > 2) {
        actions.push('Negociar plan de pagos');
      }
    } else if (riskLevel === 'medium') {
      actions.push('Seguimiento en la próxima semana');
      actions.push('Enviar recordatorio amigable');
    }

    return actions;
  }

  private generateProgressRecommendations(
    attendanceRate: number,
    performanceScore: number,
    parentEngagement: number,
    consecutiveAbsences: number,
  ): string[] {
    const recommendations = [];

    if (attendanceRate < 0.8) {
      recommendations.push('Mejorar consistencia en la asistencia');
    }
    if (performanceScore < 0.7) {
      recommendations.push('Reforzar conceptos fundamentales');
    }
    if (parentEngagement < 0.6) {
      recommendations.push('Incrementar comunicación con los padres');
    }
    if (consecutiveAbsences > 2) {
      recommendations.push('Clase de recuperación urgente');
    }

    return recommendations;
  }

  private identifyImprovementAreas(performanceScore: number, attendanceRate: number): string[] {
    const areas = [];

    if (performanceScore < 0.6) {
      areas.push('Técnica instrumental');
      areas.push('Teoría musical');
    }
    if (attendanceRate < 0.8) {
      areas.push('Compromiso y disciplina');
    }

    return areas;
  }
}

export const advancedStudentsService = new AdvancedStudentsService();
