import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { useAttendanceStore } from '../modulos/Attendance/store/attendance';
import { useClassesStore } from '../modulos/Classes/store/classes';
import { useStudentsStore } from '../modulos/Students/store/students';
import type { AttendanceDocument, AttendanceRecord } from '../modulos/Attendance/types/attendance';

// Interfaces para los resultados
interface StudentAbsences {
  id: string;
  nombre: string;
  apellido: string;
  absences: number;
  hasInstruments: boolean;
  classes: string[];
}

interface AbsenceReport {
  weeklyAbsences: StudentAbsences[];
  monthlyAbsences: StudentAbsences[];
}

/**
 * Determina si un estudiante tiene instrumentos basándose en las clases a las que pertenece
 * @param classIds - Array con los IDs de las clases a las que pertenece el estudiante
 * @param classesStore - Store de clases para obtener información detallada
 * @returns true si el estudiante pertenece a clases con instrumentos
 */
function checkIfStudentHasInstruments(classIds: string[], classesStore: any): boolean {
  // Clases que indican que el alumno tiene instrumentos
  const instrumentClasses = ["Ensayo General", "Ensayo Seccional", "Taller", "Coro"];
  // Clases que indican que el alumno no tiene instrumentos
  const noInstrumentClasses = ["Preparatoria", "Iniciacion", "Iniciación"];
  
  // Verificar que tenemos información de clases
  if (!classIds || classIds.length === 0) return false;
  
  // Obtener nombres de las clases
  const classNames = classIds.map(classId => {
    const classInfo = classesStore.classes.find(c => c.id === classId);
    return classInfo?.name || '';
  });
  
  // Verificar si alguna de las clases del estudiante es de tipo instrumento
  for (const className of classNames) {
    // Si el nombre de la clase contiene o coincide con alguna clase de instrumento
    if (instrumentClasses.some(instrClass => 
        className.includes(instrClass) || 
        className.toLowerCase() === instrClass.toLowerCase())) {
      return true;
    }
  }
  
  // Verificar si todas las clases son de no instrumentos
  const onlyNoInstrumentClasses = classNames.every(className => 
    noInstrumentClasses.some(noInstrClass => 
      className.includes(noInstrClass) || 
      className.toLowerCase() === noInstrClass.toLowerCase())
  );
  
  // Si todas sus clases son de "no instrumento", devuelve false
  if (onlyNoInstrumentClasses && classNames.length > 0) {
    return false;
  }
  
  // Por defecto, asumir que no tiene instrumentos
  return false;
}

/**
 * Analiza las inasistencias por semana y mes
 */
export async function analyzeAbsences(): Promise<AbsenceReport> {
  // Inicializar stores
  const attendanceStore = useAttendanceStore();
  const classesStore = useClassesStore();
  const studentsStore = useStudentsStore();
  
  // Asegurar que tenemos los datos de asistencia
  if (attendanceStore.attendanceDocuments.length === 0) {
    await attendanceStore.fetchAttendanceDocuments();
  }
  
  // Asegurar que tenemos los datos de clases
  if (classesStore.classes.length === 0) {
    await classesStore.fetchClasses();
  }
  
  // Asegurar que tenemos los datos de estudiantes
  if (studentsStore.students.length === 0) {
    await studentsStore.fetchStudents();
  }
  
  // Fecha actual
  const today = new Date();
  
  // Definir inicio y fin de la semana actual
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  
  // Definir inicio y fin del mes actual
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
  
  // Mapa para contar inasistencias por estudiante en la semana actual
  const weeklyAbsences = new Map<string, number>();
  // Mapa para contar inasistencias por estudiante en el mes actual
  const monthlyAbsences = new Map<string, number>();
  
  // Procesar cada documento de asistencia
  for (const doc of attendanceStore.attendanceDocuments) {
    // Verificar que el documento tenga toda la información necesaria
    if (!doc || !doc.fecha || !doc.classId || !doc.data) continue;
    
    // Verificar si la fecha del documento está en la semana actual
    const isCurrentWeek = doc.fecha >= weekStart && doc.fecha <= weekEnd;
    
    // Verificar si la fecha del documento está en el mes actual
    const isCurrentMonth = doc.fecha >= monthStart && doc.fecha <= monthEnd;
    
    if (isCurrentWeek || isCurrentMonth) {
      // Procesar estudiantes ausentes
      doc.data.ausentes?.forEach(studentId => {
        if (!studentId) return; // Ignorar IDs inválidos
        
        // Incrementar contador para la semana
        if (isCurrentWeek) {
          weeklyAbsences.set(studentId, (weeklyAbsences.get(studentId) || 0) + 1);
        }
        
        // Incrementar contador para el mes
        if (isCurrentMonth) {
          monthlyAbsences.set(studentId, (monthlyAbsences.get(studentId) || 0) + 1);
        }
      });
    }
  }
  
  // Filtrar estudiantes con más de 2 inasistencias por semana
  const studentsWithManyWeeklyAbsences = Array.from(weeklyAbsences.entries())
    .filter(([, count]) => count > 2)
    .map(([studentId, absences]) => {
      const student = studentsStore.students.find(s => s.id === studentId);
      const studentClassIds = student?.classes || [];
      const hasInstruments = checkIfStudentHasInstruments(studentClassIds, classesStore);
      
      return {
        id: studentId,
        nombre: student?.nombre || 'Desconocido',
        apellido: student?.apellido || '',
        absences,
        hasInstruments,
        classes: studentClassIds
      };
    });
  
  // Filtrar estudiantes con más de 2 inasistencias por mes
  const studentsWithManyMonthlyAbsences = Array.from(monthlyAbsences.entries())
    .filter(([, count]) => count > 2)
    .map(([studentId, absences]) => {
      const student = studentsStore.students.find(s => s.id === studentId);
      const studentClassIds = student?.classes || [];
      const hasInstruments = checkIfStudentHasInstruments(studentClassIds, classesStore);
      
      return {
        id: studentId,
        nombre: student?.nombre || 'Desconocido',
        apellido: student?.apellido || '',
        absences,
        hasInstruments,
        classes: studentClassIds
      };
    });
  
  return {
    weeklyAbsences: studentsWithManyWeeklyAbsences,
    monthlyAbsences: studentsWithManyMonthlyAbsences
  };
}

/**
 * Muestra por consola el análisis de inasistencias
 */
export async function printAbsenceAnalysis(): Promise<void> {
  console.log('📊 Analizando inasistencias de alumnos...');
  
  try {
    const report = await analyzeAbsences();
    
    // Mostrar análisis semanal
    console.log('\n🗓️ ALUMNOS CON MÁS DE 2 INASISTENCIAS POR SEMANA:');
    console.log('==================================================');
    
    if (report.weeklyAbsences.length === 0) {
      console.log('No se encontraron alumnos con más de 2 inasistencias esta semana.');
    } else {
      // Agrupar por si tienen o no instrumentos
      const withInstruments = report.weeklyAbsences.filter(s => s.hasInstruments);
      const withoutInstruments = report.weeklyAbsences.filter(s => !s.hasInstruments);
      
      console.log(`\n🎵 CON INSTRUMENTO (${withInstruments.length}):`);
      withInstruments.forEach(student => {
        console.log(`- ${student.nombre} ${student.apellido}: ${student.absences} inasistencias`);
      });
      
      console.log(`\n📚 SIN INSTRUMENTO (${withoutInstruments.length}):`);
      withoutInstruments.forEach(student => {
        console.log(`- ${student.nombre} ${student.apellido}: ${student.absences} inasistencias`);
      });
    }
    
    // Mostrar análisis mensual
    console.log('\n\n📅 ALUMNOS CON MÁS DE 2 INASISTENCIAS POR MES:');
    console.log('=================================================');
    
    if (report.monthlyAbsences.length === 0) {
      console.log('No se encontraron alumnos con más de 2 inasistencias este mes.');
    } else {
      // Agrupar por si tienen o no instrumentos
      const withInstruments = report.monthlyAbsences.filter(s => s.hasInstruments);
      const withoutInstruments = report.monthlyAbsences.filter(s => !s.hasInstruments);
      
      console.log(`\n🎵 CON INSTRUMENTO (${withInstruments.length}):`);
      withInstruments.forEach(student => {
        console.log(`- ${student.nombre} ${student.apellido}: ${student.absences} inasistencias`);
      });
      
      console.log(`\n📚 SIN INSTRUMENTO (${withoutInstruments.length}):`);
      withoutInstruments.forEach(student => {
        console.log(`- ${student.nombre} ${student.apellido}: ${student.absences} inasistencias`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error al analizar inasistencias:', error);
  }
}
