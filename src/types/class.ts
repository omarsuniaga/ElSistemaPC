export interface Class {
  id: string;
  name: string;
  teacherId: string;
  studentIds: string[];
  level: string;
  instrument: string;
  schedule: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  description: string;
}
