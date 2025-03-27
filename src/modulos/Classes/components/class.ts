export interface Class {
  id: string;
  name: string;
  teacherId: string;
  studentIds: string[];
  level: string;
  instrument?: string;
  schedule: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  description?: string;
  createdAt?: string;   // Propiedad opcional
  updatedAt?: string;   // Propiedad opcional
  status?: string;      // Propiedad opcional
  teacherName?: string; // Propiedad opcional
  teacherEmail?: string;// Propiedad opcional
  contentIds?: string[]; // Propiedad opcional
}