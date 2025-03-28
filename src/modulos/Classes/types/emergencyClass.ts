export type EmergencyClassStatus = 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Ignorada';

export interface EmergencyClass {
  id?: string;
  classId: string;
  className?: string;
  teacherId: string;
  teacherName?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  students?: string[];
  status: EmergencyClassStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}
