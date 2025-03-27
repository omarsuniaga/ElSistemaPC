export interface Schedule {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  classId: string;
}

export enum WeekDay {
  MONDAY = 'Lunes',
  TUESDAY = 'Martes',
  WEDNESDAY = 'Miércoles',
  THURSDAY = 'Jueves',
  FRIDAY = 'Viernes',
  SATURDAY = 'Sábado',
  SUNDAY = 'Domingo'
}
