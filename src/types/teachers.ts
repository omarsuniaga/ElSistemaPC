// Basic Teacher interface
export interface Teacher {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    photo?: string;
    bio?: string;
    hireDate: Date;
    status: TeacherStatus;
    specializations: string[]; // instruments/subjects they teach
    qualifications?: Qualification[];
    hourlyRate: number;
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

// Types for CRUD operations
export type TeacherCreate = Omit<Teacher, 'id'>;
export type TeacherUpdate = Partial<Teacher>;

export interface TeacherData {
    id: string;
    uid?: string;
    name: string;
    edad?: string;
    email?: string;
    phone?: string;
    specialties?: string[];
    clases?: string[];
    schedule?: string[];
    statistics?: string[];
    avatar?: string;
    photoURL?: string;
    address?: string;
    experiencia?: string;
    biography?: string;
    status?: 'activo' | 'inactivo' | 'pendiente';
    createdAt?: any;
    updatedAt?: any;
  }