// src/modulos/Attendance/utils/attendanceAnalytics.ts
import { format, parseISO, isValid, eachDayOfInterval } from 'date-fns';
import type { 
  AttendanceRecord, 
  AttendanceStatus, 
  AttendanceAnalytics,
  AttendanceDocument,
  ClassObservation
} from '../types/attendance';

// Tipo para el mapeo de días
type DayMap = Record<string, number>;
const DAY_MAP: DayMap = { 
  'lunes': 1, 
  'martes': 2, 
  'miércoles': 3, 
  'jueves': 4, 
  'viernes': 5, 
  'sábado': 6, 
  'domingo': 0 
};

/**
 * Normaliza una fecha en formato string a un objeto Date
 * Maneja diferentes formatos de fecha (DD/MM/YYYY, YYYY/MM/DD, etc)
 */
export function normalizeDate(dateStr: string | Date | number): Date {
  if (!dateStr) return new Date(0); // Fecha inválida si no hay string
  
  // Si es un timestamp (número) o ya es un objeto Date, convertir directamente
  if (typeof dateStr === 'number' || dateStr instanceof Date) {
    return new Date(dateStr);
  }
  
  // Si es un string, intentar detectar el formato
  if (typeof dateStr === 'string') {
    // Verificar si el formato es DD/MM/YYYY
    const ddmmyyyyPattern = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/;
    const ddmmyyyyMatch = dateStr.match(ddmmyyyyPattern);
    
    if (ddmmyyyyMatch) {
      // Si es DD/MM/YYYY, convertir a un objeto Date
      const [_, day, month, year] = ddmmyyyyMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Si no es DD/MM/YYYY, intentar parsear normalmente (YYYY/MM/DD, ISO, etc.)
    return parseISO(dateStr);
  }
  
  return new Date(0); // Fallback para valores no procesables
}

/**
 * Valida si una fecha es válida para registro de asistencia (no futura)
 */
export function validateAttendanceDate(date: string): boolean {
  if (!date || typeof date !== 'string') {
    console.error('Formato de fecha inválido:', date);
    return false;
  }
  
  // Convertir la fecha a un objeto Date
  const parsedDate = parseISO(date);
  
  // Verificar si la fecha es válida usando isValid from date-fns
  if (!isValid(parsedDate)) {
    return false;
  }
  
  // Comparar con la fecha actual
  const today = format(new Date(), 'yyyy-MM-dd');
  const dateIsValid = date <= today;
  
  if (!dateIsValid) {
    console.warn(`La fecha ${date} es posterior a hoy (${today})`);
  }
  
  return dateIsValid;
}

/**
 * Calcula los días programados para una clase entre dos fechas
 */
export function getScheduledDatesForClass(
  scheduledDays: string[], 
  startDate: string, 
  endDate: string
): Date[] {
  const dayNumbers = scheduledDays.map(day => DAY_MAP[day.toLowerCase() as keyof typeof DAY_MAP] || -1);
  
  // Filtramos días inválidos (-1)
  if (dayNumbers.some(d => d === -1)) {
    console.warn('Algunos días del horario no son válidos:', scheduledDays);
  }
  
  const validDayNumbers = dayNumbers.filter(d => d !== -1);
  
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  // Validación de fechas
  if (!isValid(start) || !isValid(end)) {
    console.error('Fechas de rango inválidas:', { startDate, endDate });
    return [];
  }

  const dateRange = eachDayOfInterval({ start, end });
  return dateRange.filter(date => validDayNumbers.includes(date.getDay()));
}

/**
 * Calcula el próximo día de clase para un horario específico
 */
export function getNextClassDate(day: number | undefined, time: string | undefined): Date {
  if (day === undefined) {
    return new Date(); // Fecha por defecto
  }
  
  const today = new Date();
  const currentDay = today.getDay(); // 0 (Dom) a 6 (Sáb)
  const daysUntilClass = (7 + day - currentDay) % 7;
  
  const classDate = new Date(today);
  classDate.setDate(today.getDate() + daysUntilClass);
  
  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    classDate.setHours(hours, minutes, 0, 0);
  }
  
  // Si la clase es hoy pero ya pasó, añadir 7 días
  if (daysUntilClass === 0 && classDate < today) {
    classDate.setDate(classDate.getDate() + 7);
  }
  
  return classDate;
}

/**
 * Calcula los estudiantes con más ausencias
 */
export function calculateAbsentStudents(attendanceDocuments: AttendanceDocument[], limit: number = 10) {
  const absencesMap: Record<string, { 
    absences: number, 
    lastAttendance: string, 
    attendanceRate: number, 
    totalAttendance: number 
  }> = {};
  
  // Filtrar documentos inválidos antes de procesar
  const validDocuments = attendanceDocuments.filter(doc => {
    return doc && doc.classId && doc.fecha && doc.data &&
           (Array.isArray(doc.data.presentes) || 
            Array.isArray(doc.data.ausentes) || 
            Array.isArray(doc.data.tarde));
  });
  
  // Primero analizar los documentos nuevos
  validDocuments.forEach(doc => {
    // Verificar que el documento tenga la estructura de datos esperada
    if (!doc || !doc.data) {
      return; // Skip this document
    }
    
    // Asegurarnos de que todas las propiedades necesarias existan
    const ausentes = doc.data.ausentes || [];
    const presentes = doc.data.presentes || [];
    const tarde = doc.data.tarde || [];
    
    // Procesar ausentes
    ausentes.forEach(studentId => {
      if (!studentId) return; // Ignorar IDs inválidos
      
      if (!absencesMap[studentId]) {
        absencesMap[studentId] = {
          absences: 0,
          lastAttendance: doc.fecha,
          attendanceRate: 0,
          totalAttendance: 0
        };
      }
      
      absencesMap[studentId].absences++;
      absencesMap[studentId].totalAttendance++;
      
      // Actualizar última fecha solo si es más reciente
      if (doc.fecha > absencesMap[studentId].lastAttendance) {
        absencesMap[studentId].lastAttendance = doc.fecha;
      }
    });
    
    // Procesar presentes y tarde para contabilidad total
    [...presentes, ...tarde].forEach(studentId => {
      if (!studentId) return; // Ignorar IDs inválidos
      
      if (!absencesMap[studentId]) {
        absencesMap[studentId] = {
          absences: 0,
          lastAttendance: doc.fecha,
          attendanceRate: 0,
          totalAttendance: 0
        };
      }
      
      absencesMap[studentId].totalAttendance++;
      
      // Actualizar última fecha solo si es más reciente
      if (doc.fecha > absencesMap[studentId].lastAttendance) {
        absencesMap[studentId].lastAttendance = doc.fecha;
      }
    });
  });
  
  // Calcular tasas de asistencia
  Object.entries(absencesMap).forEach(([studentId, data]) => {
    if (data.totalAttendance > 0) {
      data.attendanceRate = ((data.totalAttendance - data.absences) / data.totalAttendance) * 100;
    }
  });
  
  // Ordenar por cantidad de ausencias y limitar
  return Object.entries(absencesMap)
    .sort(([, a], [, b]) => b.absences - a.absences)
    .slice(0, limit)
    .map(([studentId, data]) => ({
      studentId,
      absences: data.absences,
      lastAttendance: data.lastAttendance,
      attendanceRate: data.attendanceRate
    }));
}

/**
 * Genera un reporte de asistencia basado en documentos de asistencia
 */
export function generateAttendanceReport(
  attendanceDocuments: AttendanceDocument[],
  classNameMap: Map<string, string>,
  params: { 
    classId?: string; 
    studentId?: string; 
    startDate: string; 
    endDate: string 
  }
) {
  const { classId, studentId, startDate, endDate } = params;
  
  // Convertir fechas a objetos Date para comparación
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (!isValid(start) || !isValid(end)) {
    throw new Error('Invalid start or end date provided for the report.');
  }

  const filteredDocs = attendanceDocuments.filter(doc => {
    const docDate = parseISO(doc.fecha);
    if (!isValid(docDate)) return false; // Skip invalid document dates
    
    const isWithinDateRange = docDate >= start && docDate <= end;
    const matchesClass = !classId || doc.classId === classId;
    
    return isWithinDateRange && matchesClass;
  });

  // Procesar documentos filtrados para construir el reporte
  const reportDetails: Array<{ 
    date: string; 
    studentId: string; 
    studentName?: string; // Placeholder
    classId: string; 
    className?: string; 
    status: AttendanceStatus; 
    justification?: string 
  }> = [];
  
  let presentCount = 0;
  let absentCount = 0;
  let tardyCount = 0; // Non-justified tardiness
  let justifiedCount = 0; // Justified tardiness counts as attended but tracked separately
  const uniqueClassDays = new Set<string>(); // Track unique class instances within the scope

  filteredDocs.forEach(doc => {
    uniqueClassDays.add(`${doc.fecha}-${doc.classId}`); // Count each class held on a specific day
    const className = classNameMap.get(doc.classId) || doc.classId;

    // Helper to process each student status within the document
    const processStudent = (sId: string, status: AttendanceStatus, justification?: { reason?: string }) => {
      // Filter by studentId if provided
      if (!studentId || sId === studentId) {
        // Placeholder name until student store is integrated
        const studentName = `Student (${sId.substring(0, 5)}...)`; 

        reportDetails.push({
          date: doc.fecha,
          studentId: sId,
          studentName: studentName, 
          classId: doc.classId,
          className: className,
          status: status,
          justification: justification?.reason
        });

        // Increment summary counts
        switch (status) {
          case 'Presente': presentCount++; break;
          case 'Ausente': absentCount++; break;
          case 'Tardanza': tardyCount++; break; // Non-justified
          case 'Justificado': justifiedCount++; break; // Justified
        }
      }
    };

    // Iterate through student lists in the document data
    doc.data.presentes?.forEach(sId => processStudent(sId, 'Presente'));
    doc.data.ausentes?.forEach(sId => processStudent(sId, 'Ausente'));
    doc.data.tarde?.forEach(sId => {
      const just = doc.data.justificacion?.find(j => j.id === sId);
      if (just) {
        processStudent(sId, 'Justificado', just); // Process as Justified
      } else {
        processStudent(sId, 'Tardanza'); // Process as Tardy (non-justified)
      }
    });
  });

  // Calcular estadísticas resumidas
  const totalRecordsProcessed = reportDetails.length;
  // La tasa de asistencia considera Presente + Justificado como asistencia
  const attendedCount = presentCount + justifiedCount; 
  // Evitar división por cero si no hay registros relevantes
  const attendanceRate = totalRecordsProcessed > 0 ? (attendedCount / totalRecordsProcessed) * 100 : 0;

  // Estructurar el objeto de reporte final
  return {
    parameters: { 
      startDate, 
      endDate, 
      classId: classId || 'All', 
      className: classId ? (classNameMap.get(classId) || classId) : 'All Classes',
      studentId: studentId || 'All',
    },
    summary: {
      totalClassInstancesInScope: uniqueClassDays.size,
      totalAttendanceRecords: totalRecordsProcessed,
      presentCount: presentCount,
      absentCount: absentCount,
      tardyCount: tardyCount,
      justifiedTardyCount: justifiedCount,
      overallAttendanceRate: parseFloat(attendanceRate.toFixed(2)),
    },
    // Ordenar detalles para legibilidad
    details: reportDetails.sort((a, b) => { 
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.className !== b.className) return (a.className || '').localeCompare(b.className || '');
      return (a.studentName || '').localeCompare(b.studentName || '');
    }),
  };
}

/**
 * Limpia un objeto de datos eliminando propiedades vacías
 */
export function cleanData(obj: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value === null || value === undefined) return;
    if (typeof value === 'string' && value.trim() === '') return;
    if (Array.isArray(value) && value.length === 0) return;
    if (typeof value === 'object' && !Array.isArray(value)) {
      const cleanedValue = cleanData(value);
      if (Object.keys(cleanedValue).length > 0) {
        cleaned[key] = cleanedValue;
      }
      return;
    }
    cleaned[key] = value;
  });
  return cleaned;
}

/**
 * Analiza ausencias por semana para detectar estudiantes con problemas de asistencia
 */
export function analyzeWeeklyAbsences(
  attendanceRecords: AttendanceRecord[], 
  startDate: Date, 
  endDate: Date
) {
  // Crear un mapa para contar ausencias por estudiante
  const absentCountByStudent = new Map<string, number>();
  const absentDatesByStudent = new Map<string, string[]>();
  const absentClassesByStudent = new Map<string, Set<string>>();
  
  // Iterar a través de todos los registros de asistencia
  attendanceRecords.forEach(record => {
    // Normalizar fecha del registro para manejar diferentes formatos
    const recordDate = normalizeDate(record.date);
    
    // Verificar si el registro está en el rango de fecha y es una ausencia
    if (recordDate >= startDate && 
        recordDate <= endDate && 
        record.status === 'ausentes') {
      
      // Incrementar contador para este estudiante
      const currentCount = absentCountByStudent.get(record.studentId) || 0;
      absentCountByStudent.set(record.studentId, currentCount + 1);
      
      // Guardar las fechas de ausencia
      const dates = absentDatesByStudent.get(record.studentId) || [];
      dates.push(record.date);
      absentDatesByStudent.set(record.studentId, dates);
      
      // Guardar las clases a las que faltó (usando Set para evitar duplicados)
      if (record.classId) {
        const classesSet = absentClassesByStudent.get(record.studentId) || new Set();
        classesSet.add(record.classId);
        absentClassesByStudent.set(record.studentId, classesSet);
      }
    }
  });

  return {
    absentCountByStudent,
    absentDatesByStudent,
    absentClassesByStudent
  };
}

/**
 * Convierte documentos de asistencia al formato de registros
 */
export function convertDocumentsToRecords(attendanceDocuments: AttendanceDocument[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];

  attendanceDocuments.forEach(doc => {
    if (!doc || !doc.data) return;

    // Process present students
    doc.data.presentes?.forEach(studentId => {
      records.push({
        studentId,
        classId: doc.classId,
        Fecha: doc.fecha,
        status: 'Presente',
      });
    });

    // Process absent students
    doc.data.ausentes?.forEach(studentId => {
      records.push({
        studentId,
        classId: doc.classId,
        Fecha: doc.fecha,
        status: 'Ausente',
      });
    });

    // Process tardy students
    doc.data.tarde?.forEach(studentId => {
      const justification = doc.data.justificacion?.find(j => j.id === studentId);
      
      records.push({
        studentId,
        classId: doc.classId,
        Fecha: doc.fecha,
        status: justification ? 'Justificado' : 'Tardanza',
        justification: justification ? justification.reason : undefined,
        documentUrl: justification ? justification.documentURL : undefined,
      });
    });
  }); // Closing forEach for attendanceDocuments

  return records;
}
