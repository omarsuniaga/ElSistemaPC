// src/modulos/Attendance/services/index.ts
// Exporta todos los servicios del módulo Attendance

import * as attendanceService from './attendance';
import * as calendarService from './CalendarService';
import * as exportService from './exportService';
import * as firebaseService from './firebase';
import * as optimizedQueries from './optimizedQueries';

export {
  attendanceService,
  calendarService,
  exportService,
  firebaseService,
  optimizedQueries
};
