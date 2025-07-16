/**
 * Utilidades para cálculos del informe de asistencia
 */

// Calcular porcentaje de asistencia para una clase
export const calculateAttendancePercentage = (classData: any): number => {
  let total = 0;
  let present = 0;

  for (const student of classData.students) {
    for (const date in student.attendance) {
      const status = student.attendance[date];
      total++;
      if (status === 'P' || status === 'J') {
        present++;
      }
    }
  }

  return total > 0 ? Math.round((present / total) * 100) : 0;
};

// Calcular porcentaje de asistencia de un estudiante
export const calculateStudentAttendancePercentage = (
  student: any,
  relevantDates?: string[],
): number => {
  if (!relevantDates || relevantDates.length === 0) return 0;

  let present = 0;
  let total = 0;

  for (const date of relevantDates) {
    const status = student.attendance[date];
    if (status && status !== '-') {
      total++;
      if (status === 'P' || status === 'J') {
        present++;
      }
    }
  }

  return total > 0 ? Math.round((present / total) * 100) : 0;
};

// Contar total de un estado específico en una clase
export const countTotalStatus = (classData: any, status: string): number => {
  let count = 0;

  for (const student of classData.students) {
    for (const date in student.attendance) {
      if (student.attendance[date] === status) {
        count++;
      }
    }
  }

  return count;
};

// Contar estado específico para una fecha específica en una clase
export const countStatusForDate = (classData: any, date: string, status: string): number => {
  let count = 0;

  for (const student of classData.students) {
    if (student.attendance[date] === status) {
      count++;
    }
  }

  return count;
};

// Calcular porcentaje de asistencia de un día específico
export const getDayAttendancePercentage = (classData: any, date: string): number => {
  const present =
    countStatusForDate(classData, date, 'P') + countStatusForDate(classData, date, 'J');
  const total = classData.students.filter(
    (s: any) => s.attendance[date] && s.attendance[date] !== '-',
  ).length;

  return total > 0 ? Math.round((present / total) * 100) : 0;
};

// Calcular estadísticas de una clase
export const calculateClassStatistics = (classData: any) => {
  const stats = {
    totalStudents: classData.students.length,
    totalDays: classData.relevantDates?.length || 0,
    presentes: 0,
    ausentes: 0,
    tarde: 0,
    justificados: 0,
    asistenciaPromedio: 0,
  };

  // Contabilizar cada estado para cada estudiante
  classData.students.forEach((student: any) => {
    Object.values(student.attendance).forEach((status: any) => {
      if (status === 'P') stats.presentes++;
      else if (status === 'A') stats.ausentes++;
      else if (status === 'T') stats.tarde++;
      else if (status === 'J') stats.justificados++;
    });
  });

  // Calcular porcentaje de asistencia
  const totalAsistencias = stats.totalStudents * stats.totalDays;
  if (totalAsistencias > 0) {
    stats.asistenciaPromedio = ((stats.presentes + stats.justificados) / totalAsistencias) * 100;
  }

  return stats;
};
