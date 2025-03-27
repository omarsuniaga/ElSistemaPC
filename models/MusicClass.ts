import { Schedule } from './Schedule';

export interface MusicClass {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  schedules: Schedule[];
  studentIds: string[];
  instrument: string;
  level: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum Level {
  BEGINNER = 'Principiante',
  INTERMEDIATE = 'Intermedio',
  ADVANCED = 'Avanzado'
}
