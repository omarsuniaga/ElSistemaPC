export interface Teacher {
  id: string;
  name: string;
  email: string;
  specialties?: string[];
  photoURL?: string;
  status?: string;
}

export interface ScheduleItem {
  className: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  studentCount: number;
  students: {
    id: string;
    name: string;
  }[];
}

export interface TeacherScheduleSummary {
  totalClasses: number;
  weeklyHours: number;
  schedule: ScheduleItem[];
}