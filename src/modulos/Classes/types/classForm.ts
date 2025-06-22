import type { ClassData } from './class';
import type { Teacher } from '../../Teachers/types/teacher';
import type { Student } from '../../Students/types/student';

export interface ClassScheduleSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  duration: string;
}

export type ClassStatus = 'active' | 'inactive' | 'completed' | 'cancelled';

export interface ClassFormData {
  id: string;
  name: string;
  description: string;
  level: string;
  instrument: string;
  teacherId: string;
  studentIds: string[];
  schedule: ClassScheduleSlot[];
  status: ClassStatus;
  maxStudents: number;
  room: string;
  requirements: string[];
  materials: string[];
  objectives: string[];
  color: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ClassFormProps {
  isOpen: boolean;
  classData?: Partial<ClassData> | null;
  mode: 'create' | 'edit';
}

export interface ClassFormEmits {
  (e: 'update:isOpen', value: boolean): void;
  (e: 'save', classData: ClassFormData): void;
}

export interface TeacherOption {
  id: string;
  name: string;
  email: string;
  isAvailable: boolean;
}

export interface StudentOption {
  id: string;
  name: string;
  email: string;
  instrument?: string;
  level?: string;
  isSelected: boolean;
}
