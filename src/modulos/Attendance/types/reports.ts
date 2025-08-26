/**
 * 📊 TIPOS PARA SISTEMA DE REPORTES SEMANALES
 * Interfaces para la gestión profesional de reportes de asistencia
 */

export interface WeeklyReportData {
  weekStartDate: string; // YYYY-MM-DD formato
  weekEndDate: string;
  weekNumber: number;
  year: number;
  dailyStats: DailyAttendanceStats[];
  totalExpected: number;
  totalActual: number;
  overallAttendanceRate: number;
  absencesByStudent: StudentAbsenceInfo[];
}

export interface DailyAttendanceStats {
  date: string; // YYYY-MM-DD
  dayName: string; // Lunes, Martes, etc.
  expectedStudents: number;
  actualAttendance: number;
  absentStudents: number;
  attendanceRate: number;
  classesByDay: ClassDayInfo[];
  absenceDetails: AbsenceDetail[];
}

export interface ClassDayInfo {
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  expectedStudents: number;
  actualAttendance: number;
  studentIds: string[];
  timeSlot: string;
  instrument: string;
  level: string;
}

export interface AbsenceDetail {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  parentContact: string;
  previousAbsences: number; // Ausencias en la semana
  totalAbsences: number; // Ausencias en el período completo
  lastAbsenceDate: string;
  isJustified: boolean;
  justificationReason?: string;
  justificationDate?: string;
  requiresNotification: boolean;
}

export interface StudentAbsenceInfo {
  studentId: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  weeklyAbsences: number;
  totalAbsences: number; // Del período completo (mes/lapso)
  consecutiveAbsences: number;
  lastAttendanceDate: string;
  absencesByClass: {
    classId: string;
    className: string;
    absences: number;
  }[];
  justifiedAbsences: number;
  unjustifiedAbsences: number;
  requiresUrgentNotification: boolean;
  notificationsSent: NotificationRecord[];
}

export interface NotificationRecord {
  id: string;
  type: 'whatsapp' | 'sms' | 'email';
  sentAt: Date;
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  weekReference: string;
  absenceCount: number;
}

export interface JustificationRequest {
  id?: string;
  studentId: string;
  absenceDates: string[]; // Array de fechas YYYY-MM-DD
  reason: string;
  explanation: string;
  documentUrls: string[];
  requestedBy: string; // Parent/Guardian ID
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'partial';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewComments?: string;
  autoApproved?: boolean;
}

export interface WhatsAppNotificationTemplate {
  type: 'weekly_absence' | 'urgent_absence' | 'consecutive_absence' | 'monthly_summary';
  template: string;
  variables: string[]; // Variables que se reemplazarán: {studentName}, {absenceCount}, etc.
}

export interface ReportFilters {
  weekStartDate: string;
  classIds?: string[];
  instrumentFilter?: string;
  levelFilter?: string;
  teacherFilter?: string;
  absenceThreshold?: number; // Mínimo de ausencias para mostrar
  justificationStatus?: 'all' | 'justified' | 'unjustified' | 'pending';
  notificationStatus?: 'all' | 'sent' | 'pending' | 'failed';
}

export interface ReportExportConfig {
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
  includeAbsenceDetails: boolean;
  includeNotificationHistory: boolean;
  dateRange: {
    start: string;
    end: string;
  };
}

// Utilidades para cálculos
export interface AttendanceCalculation {
  getExpectedStudentsForWeek(weekStartDate: string): Promise<WeeklyReportData>;
  calculateDailyStats(date: string): Promise<DailyAttendanceStats>;
  getStudentAbsenceInfo(studentId: string, periodStart: string, periodEnd: string): Promise<StudentAbsenceInfo>;
  generateNotificationMessage(template: WhatsAppNotificationTemplate, student: StudentAbsenceInfo): string;
}