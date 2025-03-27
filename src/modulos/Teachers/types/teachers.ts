export interface Teacher {
    uid: string; // Firebase UID
    id: string;
    name: string;
    email: string;
    phone?: string;
    photo?: string;
    bio?: string;
    hireDate?: Date; // Añadido desde Teachers.ts
    status: TeacherStatus | 'activo' | 'inactivo' | 'pendiente'; // Combinando los posibles estados
    specialties: {}; // instruments/subjects they teach (renombrado y tomado como principal)
    hourlyRate?: number; // Añadido desde Teachers.ts
    createdAt?: Date | any; // Permitiendo Date o el tipo de Firestore
    updatedAt?: Date | any; // Permitiendo Date o el tipo de Firestore
    address?: string;
    experience?: string;
    avatar?: string;
    edad?: string; // Añadido desde Teacher.ts
    clases?: string; // Añadido desde Teacher.ts
    schedule?: string; // Añadido desde Teacher.ts
    statistics?: string; // Añadido desde Teacher.ts
    photoURL?: string; // Añadido desde Teacher.ts
    biography?: string; // Añadido desde Teacher.ts (similar a bio, pero más completo)
    qualifications?: Qualification[]; // Añadido desde Teacher.ts

  }
  
  // Teacher employment status
  export enum TeacherStatus {
    ACTIVE = 'active',
    ON_LEAVE = 'on_leave',
    INACTIVE = 'inactive'
  }
  
  // Educational qualifications
  export interface Qualification {
    title: string; // e.g., "Bachelor of Music"
    institution: string;
    year: number;
  }
  
  // Class detail interface
  export interface ClassDetail {
    id: string;
    name: string;
    schedule: {
      day: string;
      startTime: string;
      endTime: string;
    };
    studentCount: number;
    registeredContent?: number; // Count of registered class content
    deliveredContent?: number; // Count of delivered/completed class content
    studentAttendanceRate?: number; // Percentage of student attendance
  }
  
  // Attendance record for teachers
  export interface AttendanceRecord {
    date: Date;
    status: 'present' | 'absent' | 'late';
    justification?: string;
  }
  
  // Nueva interfaz para horarios semanales
  export interface WeeklySchedule {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    className: string;
    classId: string;
    room?: string;
    studentCount: number;
    students?: {
      id: string;
      name: string;
    };
  }
  
  export interface TeacherScheduleSummary {
    weeklyHours: number;
    totalClasses: number;
    schedule: WeeklySchedule;
    hasConflicts: boolean;
  }
  
  // Types for CRUD operations
  export type TeacherCreate = Omit<Teacher, 'id'>;
  export type TeacherUpdate = Partial<Teacher>;
  
  // Interfaces adicionales del archivo Teacher.ts
  export interface TeacherSchedule {
    id: string;
    teacherId: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    className: string;
    createdAt?: any;
    updatedAt?: string;
  }
  
  export interface TeacherInstrument {
    id: string;
    teacherId: string;
    level: string;
    createdAt?: any;
    updatedAt?: string;
  }
  
  export interface TeacherSpecialty {
    id: string;
    teacherId: string;
    averageAttendance: number;
    averageGrade: number;
    lastUpdated: string;
    totalStudents: number;
    createdAt?: any;
    updatedAt?: string;
  }
  
  // Interfaz TeacherData del archivo Teachers.ts (olvidada anteriormente)
  export interface TeacherData {
    id: string;
    uid?: string;
    name: string;
    email?: string;
    phone?: string;
    photoURL?: string;
    status?: 'activo' | 'inactivo' | 'pendiente';
    biography?: string;
    createdAt?: Date;
    updatedAt?: Date;
    avatar?: string;
    experiencia?: string;
    address?: string;
    specialties?: string[]; // Cambiado a un array de strings para representar múltiples especialidades
  }