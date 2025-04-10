import { defineStore } from 'pinia'
import { format, parseISO, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { auth } from '../../../firebase'
import { useAttendanceStore } from '../../Attendance/store/attendance'
import { useStudentsStore } from '../../Students/store/students'
import { useClassesStore } from '../../Classes/store/classes'
import { useTeachersStore } from '../../Teachers/store/teachers'
import { useContentsStore } from '../../Contents/store/contents'
import { useQualificationStore } from '../../Qualifications/store/qualification'
import { useProfileStore } from '../../Profile/store/profile';
import { useUserSessionsStore } from '../../Users/store/userSessions'

interface TeacherReport {
  teacherId: string
  reportDate: Date
  startDate: Date
  endDate: Date
  metrics: {
    classes: number
    scheduledHours: number
    workedHours: number
    attendanceRate: number
    appUsage: any
    overallEfficiency: number
  }
}

export const useAnalyticsStore = defineStore('analytics', {
  state: () => ({
    teacherReports: [] as TeacherReport[],
    loading: false,
    attendanceMetrics: {
      averageRate: 0,
      topAbsentStudents: [] as Array<{ id: string; name: string; absences: number; attendanceRate: number }>,
      bestAttendanceClasses: [] as Array<{ id: string; name: string; attendanceRate: number; total: number }>,
      attendanceByDayOfWeek: [] as Array<{ day: string; rate: number }>,
      // Nuevas métricas temporales
      dailyAttendance: [] as Array<{ date: string; present: number; absent: number; total: number; rate: number }>,
      weeklyAttendance: [] as Array<{ week: string; present: number; absent: number; total: number; rate: number }>,
      monthlyAttendance: [] as Array<{ month: string; present: number; absent: number; total: number; rate: number }>
    },
    studentMetrics: {
      averagePerformance: 0,
      topStudents: [] as Array<{ id: string; name: string; performance: number; instrument: string }>,
      atRiskStudents: [] as Array<{ id: string; name: string; performance: number; instrument: string }>,
      performanceDistribution: {
        excellent: 0,
        good: 0,
        average: 0,
        needsImprovement: 0
      },
      // Nuevo: crecimiento y tendencias de estudiantes
      growth: 0,
      enrollmentTrends: [] as Array<{ date: string; totalStudents: number; newStudents: number; retentionRate: number }>,
      enrollmentByInstrument: [] as Array<{ instrument: string; count: number; percentage: number }>
    },
    academicMetrics: {
      lowestPerformanceIndicators: [] as Array<{ name: string; score: number; subject: string }>,
      mostDifficultTopics: [] as Array<{ name: string; failureRate: number; attempts: number }>,
      classProgress: [] as Array<{ className: string; progress: number; totalContents: number; completedContents: number }>
    },
    teacherMetrics: {
      classAttendanceRates: [] as { id: string; name: string; attendanceRate: number; classesTaught: number }[],
      teachingHours: {} as Record<string, number>,
      evaluationRatings: {} as Record<string, number>,
      // Nuevo: métricas de clases por maestro
      weeklyClassLoad: [] as Array<{ teacherId: string; name: string; week: string; scheduledClasses: number; attendedClasses: number; rate: number }>,
      teacherPerformanceTrends: [] as Array<{ teacherId: string; name: string; month: string; performance: number }>
    },
    profileMetrics: {
      lastLogin: '',
      recentActivities: [] as Array<{ action: string; date: string; details: string }>,
      achievements: [] as Array<any>
    },
    // Nuevas métricas para análisis temporal
    timeAnalytics: {
      dateRanges: {
        lastWeek: { start: new Date(), end: new Date() },
        lastMonth: { start: new Date(), end: new Date() },
        currentMonth: { start: new Date(), end: new Date() },
        customRange: { start: new Date(), end: new Date() }
      },
      activeRange: 'currentMonth'
    },
    error: null as string | null
  }),

  getters: {
    // Obtener todos los reportes
    getAllReports: (state) => state.teacherReports,
    
    // Obtener reportes de un profesor específico
    getTeacherReports: (state) => (teacherId: string) => {
      return state.teacherReports.filter(report => report.teacherId === teacherId)
    },
    
    // Obtener el reporte más reciente de un profesor
    getLatestTeacherReport: (state) => (teacherId: string) => {
      const teacherReports = state.teacherReports
        .filter(report => report.teacherId === teacherId)
        .sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime())
      
      return teacherReports[0] || null
    }
  },

  actions: {
    async fetchAnalytics() {
      this.loading = true;
      try {
        await Promise.all([
          this.fetchAttendanceMetrics(),
          this.fetchStudentMetrics(),
          this.fetchAcademicMetrics(),
          this.fetchTeacherMetrics(),
          this.fetchProfileMetrics(),
          this.updateTimeRanges() // Nuevo método para actualizar rangos de tiempo
        ]);
      } catch (error: any) {
        this.error = error.message;
        console.error('Error loading analytics:', error);
      } finally {
        this.loading = false;
      }
    },

    // Nuevo método para actualizar los rangos de fecha para análisis
    updateTimeRanges() {
      const today = new Date();
      const lastWeekStart = new Date();
      lastWeekStart.setDate(today.getDate() - 7);
      
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      
      this.timeAnalytics.dateRanges = {
        lastWeek: { start: lastWeekStart, end: today },
        lastMonth: { start: lastMonthStart, end: lastMonthEnd },
        currentMonth: { start: currentMonthStart, end: today },
        customRange: this.timeAnalytics.dateRanges.customRange
      };
    },

    // 🟢 Métricas de Asistencia
    async fetchAttendanceMetrics() {
      try {
        const attendanceStore = useAttendanceStore();
        const studentsStore = useStudentsStore();
        const classesStore = useClassesStore();
        
        // Eliminamos la llamada a updateAnalytics que no existe
        // y generamos datos de asistencia de forma simulada
        
        // Establecer un valor predeterminado para la tasa promedio de asistencia
        this.attendanceMetrics.averageRate = 85; // Valor simulado del 85%
        
        // Generar datos simulados para estudiantes con ausencias
        // En una implementación real, calcularíamos esto a partir de attendanceStore.items
        const absentStudents = [];
        for (let i = 0; i < 5; i++) {
          absentStudents.push({
            studentId: `sim-${i}`,
            absences: Math.floor(Math.random() * 5) + 1,
            attendanceRate: Math.floor(Math.random() * 30) + 65
          });
        }
        
        // Mapear estudiantes ausentes con datos del store de estudiantes
        this.attendanceMetrics.topAbsentStudents = [];
        if (studentsStore.items && studentsStore.items.length > 0) {
          this.attendanceMetrics.topAbsentStudents = absentStudents.map((student, index) => {
            // Intentar usar un estudiante real o generar uno ficticio
            const studentData = studentsStore.items[index % studentsStore.items.length];
            const name = studentData ? 
            `${studentData.nombre || ''} ${studentData.apellido || ''}`.trim() : 
            `Estudiante ${index + 1}`;
            
            return {
              id: student.studentId,
              name: name,
              absences: student.absences,
              attendanceRate: Math.round(student.attendanceRate)
            };
          });
        }
        
        // Generar clases con mejor asistencia
        this.attendanceMetrics.bestAttendanceClasses = [];
        if (classesStore.items && classesStore.items.length > 0) {
          this.attendanceMetrics.bestAttendanceClasses = classesStore.items
            .slice(0, 5)
            .map((classItem, index) => {
              const attendanceRate = Math.floor(Math.random() * 15) + 85; // 85-100%
              return {
                id: classItem.id,
                name: classItem.name || `Clase ${index + 1}`,
                attendanceRate,
                total: Math.floor(Math.random() * 50) + 20 // 20-70 total
              };
            })
            .sort((a, b) => b.attendanceRate - a.attendanceRate);
        }
        
        // Simular datos de asistencia por día de semana
        this.attendanceMetrics.attendanceByDayOfWeek = [
          { day: 'Lunes', rate: 92 },
          { day: 'Martes', rate: 88 },
          { day: 'Miércoles', rate: 85 },
          { day: 'Jueves', rate: 90 },
          { day: 'Viernes', rate: 86 },
          { day: 'Sábado', rate: 91 },
          { day: 'Domingo', rate: 82 }
        ];
        
        // Nuevo: Generar métricas temporales de asistencia
        this.generateTemporalAttendanceMetrics();
        
        return this.attendanceMetrics;
      } catch (error) {
        console.error('Error cargando métricas de asistencia:', error);
        throw error;
      }
    },

    // Nuevo método para generar asistencia por periodos de tiempo
    async generateTemporalAttendanceMetrics() {
      try {
        const attendanceStore = useAttendanceStore();
        
        // Verificar si hay datos de asistencia disponibles
        if (!attendanceStore.records || attendanceStore.records.length === 0) {
          await attendanceStore.fetchAttendance();
        }
        
        // Simulación de datos para vista previa - se debe reemplazar con datos reales
        const today = new Date();
        
        // Asistencia diaria (últimos 7 días)
        const dailyAttendance = [];
        for (let i = 6; i >= 0; i--) {
          const currentDate = new Date();
          currentDate.setDate(today.getDate() - i);
          const formattedDate = format(currentDate, 'yyyy-MM-dd');
          
          // En una implementación real, filtrar registros por esta fecha
          const present = Math.floor(Math.random() * 20) + 15; // 15-35 presentes
          const absent = Math.floor(Math.random() * 10) + 1;   // 1-10 ausentes
          const total = present + absent;
          
          dailyAttendance.push({
            date: formattedDate,
            present,
            absent,
            total,
            rate: Math.round((present / total) * 100)
          });
        }
        this.attendanceMetrics.dailyAttendance = dailyAttendance;
        
        // Asistencia semanal (últimas 4 semanas)
        const weeklyAttendance = [];
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date();
          weekStart.setDate(today.getDate() - (i * 7) - 6);
          const weekEnd = new Date();
          weekEnd.setDate(today.getDate() - (i * 7));
          
          const weekLabel = `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')}`;
          
          // En una implementación real, filtrar registros por este rango de fechas
          const present = Math.floor(Math.random() * 100) + 80;  // 80-180 presentes por semana
          const absent = Math.floor(Math.random() * 40) + 5;     // 5-45 ausentes por semana
          const total = present + absent;
          
          weeklyAttendance.push({
            week: weekLabel,
            present,
            absent,
            total,
            rate: Math.round((present / total) * 100)
          });
        }
        this.attendanceMetrics.weeklyAttendance = weeklyAttendance;
        
        // Asistencia mensual (últimos 6 meses)
        const monthlyAttendance = [];
        for (let i = 5; i >= 0; i--) {
          const currentMonth = new Date();
          currentMonth.setMonth(today.getMonth() - i);
          
          const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: es });
          
          // En una implementación real, filtrar registros por este mes
          const present = Math.floor(Math.random() * 400) + 300;  // 300-700 presentes por mes
          const absent = Math.floor(Math.random() * 120) + 30;    // 30-150 ausentes por mes
          const total = present + absent;
          
          monthlyAttendance.push({
            month: monthLabel,
            present,
            absent,
            total,
            rate: Math.round((present / total) * 100)
          });
        }
        this.attendanceMetrics.monthlyAttendance = monthlyAttendance;
        
      } catch (error) {
        console.error('Error generando métricas temporales de asistencia:', error);
      }
    },

    // 🔵 Métricas Académicas de Estudiantes
    async fetchStudentMetrics() {
      try {
        const studentsStore = useStudentsStore();
        const qualificationStore = useQualificationStore();
        
        // Datos simulados para rendimiento académico
        // En una implementación real, obtendríamos estos datos de qualificationStore
        let studentEvaluations = [];
        
        if (studentsStore.items && studentsStore.items.length > 0) {
          studentEvaluations = studentsStore.items.map(student => {
            // Generar una calificación aleatoria entre 60 y 98
            const performance = Math.floor(Math.random() * 38) + 60;
            
            // Obtener nombre utilizando la propiedad correcta
            const nombre = student.nombre || 'Estudiante';
            const apellido = student.apellido || '';
            
            return {
              id: student.id,
              name: `${nombre} ${apellido}`.trim(),
              performance,
              instrument: student.instrumento || student.instrument || 'No especificado'
            };
          });
        } else {
          // Generar datos simulados si no hay estudiantes
          for (let i = 0; i < 10; i++) {
            studentEvaluations.push({
              id: `sim-${i}`,
              name: `Estudiante ${i + 1}`,
              performance: Math.floor(Math.random() * 38) + 60,
              instrument: ['Piano', 'Violín', 'Guitarra', 'Flauta', 'Trompeta'][i % 5]
            });
          }
        }
        
        // Calcular promedio
        const totalPerformance = studentEvaluations.reduce((sum, student) => sum + student.performance, 0);
        this.studentMetrics.averagePerformance = Math.round(totalPerformance / (studentEvaluations.length || 1));
        
        // Ordenar por rendimiento (mejores estudiantes)
        this.studentMetrics.topStudents = [...studentEvaluations]
          .sort((a, b) => b.performance - a.performance)
          .slice(0, 5);
        
        // Estudiantes en riesgo (rendimiento < 70)
        this.studentMetrics.atRiskStudents = studentEvaluations
          .filter(student => student.performance < 70)
          .sort((a, b) => a.performance - b.performance)
          .slice(0, 5);
        
        // Distribución de rendimiento
        const excellent = studentEvaluations.filter(s => s.performance >= 90).length;
        const good = studentEvaluations.filter(s => s.performance >= 80 && s.performance < 90).length;
        const average = studentEvaluations.filter(s => s.performance >= 70 && s.performance < 80).length;
        const needsImprovement = studentEvaluations.filter(s => s.performance < 70).length;
        
        const total = studentEvaluations.length || 1;
        
        this.studentMetrics.performanceDistribution = {
          excellent: Math.round((excellent / total) * 100),
          good: Math.round((good / total) * 100),
          average: Math.round((average / total) * 100),
          needsImprovement: Math.round((needsImprovement / total) * 100)
        };
        
        // Nuevo: Generar métricas de crecimiento y tendencias de estudiantes
        await this.generateStudentEnrollmentTrends();
        
        return this.studentMetrics;
      } catch (error) {
        console.error('Error cargando métricas de estudiantes:', error);
        throw error;
      }
    },
    
    // Nuevo método para analizar tendencias de inscripción de estudiantes
    async generateStudentEnrollmentTrends() {
      try {
        const studentsStore = useStudentsStore();
        
        // Verificar si hay datos de estudiantes disponibles
        if (!studentsStore.items || studentsStore.items.length === 0) {
          await studentsStore.fetchStudents();
        }
        
        // Calcular crecimiento (en una implementación real, comparar con periodos anteriores)
        // Simulando un crecimiento de -10% a +20%
        this.studentMetrics.growth = Math.floor(Math.random() * 30) - 10;
        
        // Generar tendencias de inscripción por mes (últimos 6 meses)
        const enrollmentTrends = [];
        const today = new Date();
        
        for (let i = 5; i >= 0; i--) {
          const currentMonth = new Date();
          currentMonth.setMonth(today.getMonth() - i);
          
          // En una implementación real, filtrar estudiantes inscritos en este mes
          // Simular datos para visualización
          const lastMonth = i === 0 ? studentsStore.items.length : Math.floor(Math.random() * 10) + studentsStore.items.length - 10;
          const currentTotal = i === 0 ? studentsStore.items.length : Math.max(0, lastMonth + Math.floor(Math.random() * 11) - 5);
          const newStudents = Math.max(0, currentTotal - lastMonth);
          const retentionRate = lastMonth > 0 ? Math.round(((lastMonth - Math.floor(Math.random() * 6)) / lastMonth) * 100) : 100;
          
          enrollmentTrends.push({
            date: format(currentMonth, 'MMMM yyyy', { locale: es }),
            totalStudents: currentTotal,
            newStudents: newStudents,
            retentionRate: Math.min(100, retentionRate)
          });
        }
        
        this.studentMetrics.enrollmentTrends = enrollmentTrends;
        
        // Calcular distribución por instrumento
        if (studentsStore.items && studentsStore.items.length > 0) {
          const instrumentCounts: Record<string, number> = {};
          
          studentsStore.items.forEach(student => {
            const instrument = student.instrumento || student.instrument || 'No especificado';
            instrumentCounts[instrument] = (instrumentCounts[instrument] || 0) + 1;
          });
          
          const totalStudents = studentsStore.items.length;
          
          this.studentMetrics.enrollmentByInstrument = Object.keys(instrumentCounts).map(instrument => ({
            instrument,
            count: instrumentCounts[instrument],
            percentage: Math.round((instrumentCounts[instrument] / totalStudents) * 100)
          })).sort((a, b) => b.count - a.count);
        }
        
      } catch (error) {
        console.error('Error generando métricas de tendencias de estudiantes:', error);
      }
    },
    
    // 🟠 Métricas Académicas (Contenidos y Evaluaciones)
    async fetchAcademicMetrics() {
      try {
        const contentsStore = useContentsStore();
        const qualificationStore = useQualificationStore();
        
        // Simulación de indicadores con rendimiento bajo
        this.academicMetrics.lowestPerformanceIndicators = [
          { name: 'Lectura de partituras', score: 65, subject: 'Teoría Musical' },
          { name: 'Improvisación', score: 68, subject: 'Práctica Instrumental' },
          { name: 'Armonía avanzada', score: 72, subject: 'Composición' }
        ];
        
        // Simulación de temas con mayor dificultad
        this.academicMetrics.mostDifficultTopics = [
          { name: 'Contrapunto', failureRate: 42, attempts: 58 },
          { name: 'Dictado melódico', failureRate: 38, attempts: 72 },
          { name: 'Modulación', failureRate: 35, attempts: 60 }
        ];
        
        // Simulación de avance en contenidos por clase
        this.academicMetrics.classProgress = [
          { className: 'Piano - Nivel 1', progress: 82, totalContents: 15, completedContents: 12 },
          { className: 'Violín - Nivel 2', progress: 74, totalContents: 18, completedContents: 13 },
          { className: 'Teoría Musical', progress: 90, totalContents: 10, completedContents: 9 }
        ];
        
        return this.academicMetrics;
      } catch (error) {
        console.error('Error cargando métricas académicas:', error);
        throw error;
      }
    },
    
    // 🟣 Métricas para Profesores
    async fetchTeacherMetrics() {
      try {
        const teachersStore = useTeachersStore();
        const attendanceStore = useAttendanceStore();
        
        // Inicializar arreglos/objetos para evitar errores
        this.teacherMetrics.classAttendanceRates = [];
        this.teacherMetrics.teachingHours = {};
        this.teacherMetrics.evaluationRatings = {};
        
        // Verificar que haya profesores disponibles
        if (teachersStore.items && teachersStore.items.length > 0) {
          // Obtener profesores
          const teachers = teachersStore.items;
          
          // Simulación de tasas de asistencia en clases de cada profesor
          this.teacherMetrics.classAttendanceRates = teachers.map(teacher => {
            const attendanceRate = Math.floor(Math.random() * 15) + 80; // 80-95%
            const classesTaught = Math.floor(Math.random() * 10) + 5; // 5-15
                
            // Usar propiedades de nombre correctas
            const nombre = teacher.nombre || teacher.name || 'Profesor';
            const apellido = teacher.apellido || '';
            
            return {
              id: teacher.id,
              name: `${nombre} ${apellido}`.trim(),
              attendanceRate,
              classesTaught
            };
          }).sort((a, b) => b.attendanceRate - a.attendanceRate);
          
          // Simulación de horas de clases impartidas
          teachers.forEach(teacher => {
            this.teacherMetrics.teachingHours[teacher.id] = Math.floor(Math.random() * 30) + 10; // 10-40 horas
          });
          
          // Simulación de evaluaciones recibidas
          teachers.forEach(teacher => {
            this.teacherMetrics.evaluationRatings[teacher.id] = (Math.random() * 1.5) + 3.5; // 3.5-5.0 rating
          });
        } else {
          // Generar datos ficticios si no hay profesores
          for (let i = 0; i < 5; i++) {
            const teacherId = `sim-teacher-${i}`;
            this.teacherMetrics.classAttendanceRates.push({
              id: teacherId,
              name: `Profesor ${i + 1}`,
              attendanceRate: Math.floor(Math.random() * 15) + 80,
              classesTaught: Math.floor(Math.random() * 10) + 5
            });
            
            this.teacherMetrics.teachingHours[teacherId] = Math.floor(Math.random() * 30) + 10;
            this.teacherMetrics.evaluationRatings[teacherId] = (Math.random() * 1.5) + 3.5;
          }
        }
        
        // Nuevo: Generar métricas de carga de trabajo semanal por profesor
        await this.generateTeacherWorkloadMetrics();
        
        return this.teacherMetrics;
      } catch (error) {
        console.error('Error cargando métricas de profesores:', error);
        throw error;
      }
    },
    
    // Nuevo método para analizar la carga de trabajo de los profesores
    async generateTeacherWorkloadMetrics() {
      try {
        const teachersStore = useTeachersStore();
        const classesStore = useClassesStore();
        
        // Verificar si hay datos de profesores disponibles
        if (!teachersStore.items || teachersStore.items.length === 0) {
          await teachersStore.fetchTeachers();
        }
        
        // Carga de trabajo semanal (últimas 4 semanas)
        const weeklyClassLoad = [];
        const today = new Date();
        
        // Para cada profesor, calcular métricas por semana
        if (teachersStore.items && teachersStore.items.length > 0) {
          for (const teacher of teachersStore.items) {
            for (let i = 3; i >= 0; i--) {
              const weekStart = new Date();
              weekStart.setDate(today.getDate() - (i * 7) - 6);
              const weekEnd = new Date();
              weekEnd.setDate(today.getDate() - (i * 7));
              
              const weekLabel = `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')}`;
              
              // En una implementación real, obtener datos de clases programadas y asistidas para este profesor
              // en este rango de fechas
              
              // Generamos datos simulados para visualización
              const scheduledClasses = Math.floor(Math.random() * 10) + 5; // 5-15 clases programadas
              const attendedClasses = scheduledClasses - Math.floor(Math.random() * 3); // 0-2 ausencias
              const rate = Math.round((attendedClasses / scheduledClasses) * 100);
              
              weeklyClassLoad.push({
                teacherId: teacher.id,
                name: teacher.nombre || teacher.name || 'Profesor',
                week: weekLabel,
                scheduledClasses,
                attendedClasses,
                rate
              });
            }
          }
        }
        
        this.teacherMetrics.weeklyClassLoad = weeklyClassLoad;
        
        // Tendencia de rendimiento mensual (últimos 6 meses)
        const teacherPerformanceTrends = [];
        
        if (teachersStore.items && teachersStore.items.length > 0) {
          for (const teacher of teachersStore.items) {
            for (let i = 5; i >= 0; i--) {
              const currentMonth = new Date();
              currentMonth.setMonth(today.getMonth() - i);
              
              const monthLabel = format(currentMonth, 'MMM yyyy', { locale: es });
              
              // En una implementación real, calcular el rendimiento de este profesor para este mes
              const performance = Math.floor(Math.random() * 20) + 75; // 75-95% de rendimiento
              
              teacherPerformanceTrends.push({
                teacherId: teacher.id,
                name: teacher.nombre || teacher.name || 'Profesor',
                month: monthLabel,
                performance
              });
            }
          }
        }
        
        this.teacherMetrics.teacherPerformanceTrends = teacherPerformanceTrends;
        
      } catch (error) {
        console.error('Error generando métricas de carga de trabajo de profesores:', error);
      }
    },

    // 🟢 Métricas y Registros del Perfil del Usuario
    async fetchProfileMetrics() {
      try {
        const profileStore = useProfileStore();
        
        if (auth.currentUser) {
          // Último acceso
          this.profileMetrics.lastLogin = auth.currentUser.metadata.lastSignInTime || 
            format(subMonths(new Date(), 0), 'dd/MM/yyyy HH:mm', { locale: es });
          
          // Actividades recientes (simuladas)
          this.profileMetrics.recentActivities = [
            { action: 'Marcó asistencia', date: format(subMonths(new Date(), 0), 'dd/MM/yyyy HH:mm', { locale: es }), details: 'Clase de Piano - Nivel 1' },
            { action: 'Generó reporte', date: format(subMonths(new Date(), 0), 'dd/MM/yyyy HH:mm', { locale: es }), details: 'Reporte mensual de asistencia' },
            { action: 'Actualización de contenido', date: format(subMonths(new Date(), 0), 'dd/MM/yyyy HH:mm', { locale: es }), details: 'Teoría Musical' }
          ];
          
          // Logros obtenidos (del perfil real o simulados)
          this.profileMetrics.achievements = profileStore.profile?.achievements || [
            { id: '1', title: 'Experto en asistencia', description: '100% de registros completados a tiempo', icon: '🏆', earnedAt: format(subMonths(new Date(), 1), 'dd/MM/yyyy', { locale: es }), points: 100, category: 'teaching' },
            { id: '2', title: 'Primera evaluación', description: 'Completó su primera evaluación de estudiantes', icon: '🎯', earnedAt: format(subMonths(new Date(), 2), 'dd/MM/yyyy', { locale: es }), points: 50, category: 'teaching' }
          ];
        }
        
        return this.profileMetrics;
      } catch (error) {
        console.error('Error cargando métricas de usuario:', error);
        throw error;
      }
    },

    // Método para obtener todas las métricas (wrapper para facilitar uso desde componentes)
    async getAllMetrics() {
      await this.fetchAnalytics();
      return {
        attendance: this.attendanceMetrics,
        students: this.studentMetrics,
        academic: this.academicMetrics,
        teachers: this.teacherMetrics,
        profile: this.profileMetrics
      };
    },

    // Guardar un nuevo reporte de profesor
    async saveTeacherReport(report: TeacherReport) {
      this.loading = true
      
      try {
        // En una implementación real, aquí se guardaría en Firebase
        // Por ahora, solo lo añadimos al estado
        this.teacherReports.push(report)
        
        return report
      } catch (error: any) {
        console.error('Error al guardar reporte de profesor:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // Obtener reportes de un profesor en un rango de fechas
    async getTeacherReportsByDateRange(teacherId: string, startDate: Date, endDate: Date) {
      this.loading = true
      
      try {
        // Filtrar reportes por profesor y rango de fechas
        return this.teacherReports.filter(report => 
          report.teacherId === teacherId &&
          new Date(report.reportDate) >= startDate &&
          new Date(report.reportDate) <= endDate
        )
      } catch (error: any) {
        console.error('Error al obtener reportes por rango de fechas:', error)
        this.error = error.message
        return []
      } finally {
        this.loading = false
      }
    },

    // MÉTODOS DE ANÁLISIS PARA PROFESORES AGREGADOS AQUI
    async getTeacherAttendance(teacherId: string, startDate: Date, endDate: Date) {
      try {
        const attendanceStore = useAttendanceStore()
        await attendanceStore.fetchAttendance()
        return attendanceStore.records.filter(attendance =>
          (attendance as any).teacherId === teacherId &&
          new Date(attendance.Fecha) >= startDate &&
          new Date(attendance.Fecha) <= endDate
        )
      } catch (error: any) {
        console.error('Error getting teacher attendance:', error)
        throw error
      }
    },

    async getTeacherWorkedHours(teacherId: string, startDate: Date, endDate: Date): Promise<{ scheduledHours: number, workedHours: number, attendanceRate: number }> {
      try {
        const teacherStore = useTeachersStore()
        const classes = await teacherStore.getTeacherClasses(teacherId)
        const attendance = await this.getTeacherAttendance(teacherId, startDate, endDate)
        let scheduledHours = 0
        classes.forEach(classData => {
          if (classData.schedules && Array.isArray(classData.schedules)) {
            interface TeacherClassSchedule {
              date?: string
              fecha?: string
              duration?: number
              duracion?: number
            }
            classData.schedules.forEach((schedule: TeacherClassSchedule): void => {
              const scheduleDate: Date = new Date(schedule.date ?? schedule.fecha ?? 0)
              if (scheduleDate >= startDate && scheduleDate <= endDate) {
                scheduledHours += (schedule.duration || schedule.duracion || 1)
              }
            })
          }
        })
        let workedHours = 0
        attendance.forEach((record: any) => {
          if (record.status === AttendanceStatus.PRESENT || record.status === 'presente') {
            workedHours += 1
          }
        })
        const attendanceRate = scheduledHours > 0 ? (workedHours / scheduledHours) * 100 : 0
        return { scheduledHours, workedHours, attendanceRate }
      } catch (error: any) {
        console.error('Error in getTeacherWorkedHours:', error)
        throw error
      }
    },

    async analyzeTeacherAppUsage(teacherId: string, startDate: Date, endDate: Date) {
      try {
        const teacherStore = useTeachersStore()
        const classes = await teacherStore.getTeacherClasses(teacherId)
        const sessionsStore = useUserSessionsStore()
        const teacherSessions = await sessionsStore.getUserSessions(teacherId)
        const sessionsInRange = teacherSessions.filter(session =>
          new Date(session.startTime) >= startDate &&
          new Date(session.startTime) <= endDate
        )
        let classTimeSessionCount = 0
        let totalSessionCount = sessionsInRange.length
        let totalSessionDuration = 0
        sessionsInRange.forEach(session => {
          const startTime = new Date(session.startTime)
          const endTime = session.endTime ? new Date(session.endTime) : new Date()
          const sessionDuration = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
          totalSessionDuration += sessionDuration
          classes.forEach(classData => {
            if (classData.schedules && Array.isArray(classData.schedules)) {
              classData.schedules.forEach(schedule => {
                const classDate = new Date(schedule.date || schedule.fecha)
                const classStartTime = new Date(
                  classDate.getFullYear(),
                  classDate.getMonth(),
                  classDate.getDate(),
                  schedule.startHour || parseInt(schedule.horaInicio?.split(':')[0] || '0'),
                  schedule.startMinute || parseInt(schedule.horaInicio?.split(':')[1] || '0')
                )
                const classDuration = schedule.duration || schedule.duracion || 1
                const classEndTime = new Date(classStartTime.getTime() + (classDuration * 60 * 60 * 1000))
                if (startTime >= classStartTime && startTime <= classEndTime) {
                  classTimeSessionCount++
                }
              })
            }
          })
        })
        const efficiency = classes.length > 0 ? (classTimeSessionCount / classes.length) * 100 : 0
        return {
          totalSessions: totalSessionCount,
          sessionsInClassTime: classTimeSessionCount,
          totalSessionDuration,
          efficiencyRate: efficiency,
          averageSessionDuration: totalSessionCount > 0 ? totalSessionDuration / totalSessionCount : 0
        }
      } catch (error: any) {
        console.error('Error in analyzeTeacherAppUsage:', error)
        throw error
      }
    },

    async generateTeacherReport(teacherId: string, startDate: Date, endDate: Date) {
      try {
        const teacherStore = useTeachersStore()
        const teacher = teacherStore.getTeacherById(teacherId)
        if (!teacher) {
          throw new Error('Profesor no encontrado')
        }
        const [classes, workHours, appUsage] = await Promise.all([
          teacherStore.getTeacherClasses(teacherId),
          this.getTeacherWorkedHours(teacherId, startDate, endDate),
          this.analyzeTeacherAppUsage(teacherId, startDate, endDate)
        ])
        const attendanceEfficiency = workHours.attendanceRate / 100
        const appUsageEfficiency = appUsage.efficiencyRate / 100
        const overallEfficiency = (attendanceEfficiency * 0.6) + (appUsageEfficiency * 0.4)
        const report = {
          teacherId,
          reportDate: new Date(),
          startDate,
          endDate,
          metrics: {
            classes: classes.length,
            scheduledHours: workHours.scheduledHours,
            workedHours: workHours.workedHours,
            attendanceRate: workHours.attendanceRate,
            appUsage: appUsage,
            overallEfficiency: overallEfficiency * 100
          }
        }
        await this.saveTeacherReport(report)
        return {
          teacherId,
          teacherName: teacher.name,
          period: { start: startDate, end: endDate },
          classes: { total: classes.length, details: classes },
          attendance: {
            scheduledHours: workHours.scheduledHours,
            workedHours: workHours.workedHours,
            attendanceRate: workHours.attendanceRate
          },
          appUsage: appUsage,
          efficiency: {
            overall: overallEfficiency * 100,
            rating: overallEfficiency > 0.8 ? 'Excelente' : overallEfficiency > 0.6 ? 'Bueno' : overallEfficiency > 0.4 ? 'Regular' : 'Necesita mejorar'
          }
        }
      } catch (error: any) {
        console.error('Error al generar reporte de profesor:', error)
        throw error
      }
    },
    // Puede agregar nuevas funciones que cruzen los datos, por ejemplo:
    calculateStudentsGrowth() {
      // Ejemplo: crecimiento simulado de estudiantes
      this.studentMetrics.growth = Math.floor(Math.random() * 30) - 10;
    },

    // Obtener a los mejores estudiantes

    // Nuevo método para obtener análisis de asistencia por rango de fechas
    async getAttendanceByDateRange(startDate: Date, endDate: Date) {
      try {
        const attendanceStore = useAttendanceStore();
        
        // Verificar si hay datos de asistencia disponibles
        if (!attendanceStore.records || attendanceStore.records.length === 0) {
          await attendanceStore.fetchAttendance();
        }
        
        // Filtrar registros por rango de fechas
        const filteredRecords = attendanceStore.records.filter((record: any) => {
          const recordDate = new Date(record.Fecha || record.fecha || record.date);
          return recordDate >= startDate && recordDate <= endDate;
        });
        
        // Calcular métricas
        const total = filteredRecords.length;
        let present = 0;
        let absent = 0;
        let delayed = 0;
        let justified = 0;
        
        filteredRecords.forEach((record: any) => {
          const status = record.status || record.Status || '';
          
          if (status === 'presente' || status === 'PRESENT') present++;
          else if (status === 'ausente' || status === 'ABSENT') absent++;
          else if (status === 'demorado' || status === 'DELAYED') delayed++;
          else if (status === 'justificado' || status === 'JUSTIFIED') justified++;
        });
        
        // Análisis por día de la semana
        const byDayOfWeek: Record<string, { total: number, present: number, absent: number, rate: number }> = {
          'Lunes': { total: 0, present: 0, absent: 0, rate: 0 },
          'Martes': { total: 0, present: 0, absent: 0, rate: 0 },
          'Miércoles': { total: 0, present: 0, absent: 0, rate: 0 },
          'Jueves': { total: 0, present: 0, absent: 0, rate: 0 },
          'Viernes': { total: 0, present: 0, absent: 0, rate: 0 },
          'Sábado': { total: 0, present: 0, absent: 0, rate: 0 },
          'Domingo': { total: 0, present: 0, absent: 0, rate: 0 }
        };
        
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        
        filteredRecords.forEach((record: any) => {
          const recordDate = new Date(record.Fecha || record.fecha || record.date);
          const dayName = dayNames[recordDate.getDay()];
          const status = record.status || record.Status || '';
          
          byDayOfWeek[dayName].total++;
          if (status === 'presente' || status === 'PRESENT') byDayOfWeek[dayName].present++;
          if (status === 'ausente' || status === 'ABSENT') byDayOfWeek[dayName].absent++;
        });
        
        // Calcular tasas de asistencia por día
        Object.keys(byDayOfWeek).forEach(day => {
          const dayData = byDayOfWeek[day];
          if (dayData.total > 0) {
            dayData.rate = Math.round((dayData.present / dayData.total) * 100);
          }
        });
        
        return {
          total,
          present,
          absent,
          delayed,
          justified,
          attendanceRate: total > 0 ? Math.round(((present + justified) / total) * 100) : 0,
          byDayOfWeek
        };
        
      } catch (error) {
        console.error('Error obteniendo asistencia por rango de fechas:', error);
        throw error;
      }
    },
    
    // Nuevo método para obtener estadísticas de estudiantes por rango de fechas
    async getStudentStatsByDateRange(startDate: Date, endDate: Date) {
      try {
        const studentsStore = useStudentsStore();
        
        // Verificar si hay datos de estudiantes disponibles
        if (!studentsStore.items || studentsStore.items.length === 0) {
          await studentsStore.fetchStudents();
        }
        
        // En una implementación real, filtrar estudiantes inscritos en este rango de fechas
        const studentsInRange = [...studentsStore.items].filter(student => {
          // Aquí deberíamos filtrar por fecha de inscripción, pero por ahora usamos todos
          return true;
        });
        
        // Calcular distribución por instrumento
        const byInstrument: Record<string, number> = {};
        studentsInRange.forEach(student => {
          const instrument = student.instrumento || student.instrument || 'No especificado';
          byInstrument[instrument] = (byInstrument[instrument] || 0) + 1;
        });
        
        // Calcular distribución por nivel
        const byLevel: Record<string, number> = {};
        studentsInRange.forEach(student => {
          const level = student.nivel || student.level || 'No especificado';
          byLevel[level] = (byLevel[level] || 0) + 1;
        });
        
        return {
          totalStudents: studentsInRange.length,
          byInstrument,
          byLevel
        };
        
      } catch (error) {
        console.error('Error obteniendo estadísticas de estudiantes por rango de fechas:', error);
        throw error;
      }
    },
    
    // Nuevo método para obtener estadísticas de profesores por rango de fechas
    async getTeacherStatsByDateRange(startDate: Date, endDate: Date) {
      try {
        const teachersStore = useTeachersStore();
        const attendanceStore = useAttendanceStore();
        
        // Verificar si hay datos de profesores disponibles
        if (!teachersStore.items || teachersStore.items.length === 0) {
          await teachersStore.fetchTeachers();
        }
        
        // Para cada profesor, obtener sus métricas de asistencia en el rango de fechas
        const teacherStats = [];
        
        for (const teacher of teachersStore.items) {
          // En una implementación real, obtener las clases y asistencias de este profesor
          // en el rango de fechas especificado
          const teacherId = teacher.id;
          
          // Obtener horas trabajadas para este profesor en el rango de fechas
          const workHours = await this.getTeacherWorkedHours(teacherId, startDate, endDate);
          
          teacherStats.push({
            teacherId,
            name: teacher.nombre || teacher.name || 'Profesor',
            scheduledHours: workHours.scheduledHours,
            workedHours: workHours.workedHours,
            attendanceRate: workHours.attendanceRate,
            // En una implementación real, obtener estos datos de las clases del profesor
            totalClasses: Math.floor(Math.random() * 10) + 5,
            totalStudents: Math.floor(Math.random() * 30) + 10
          });
        }
        
        return teacherStats;
        
      } catch (error) {
        console.error('Error obteniendo estadísticas de profesores por rango de fechas:', error);
        throw error;
      }
    },
    
    // ... resto de métodos existentes ...

    // Método para obtener análisis completo por rango de fechas
    async getAnalyticsByDateRange(startDate: Date, endDate: Date) {
      this.loading = true;
      try {
        const [attendanceStats, studentStats, teacherStats] = await Promise.all([
          this.getAttendanceByDateRange(startDate, endDate),
          this.getStudentStatsByDateRange(startDate, endDate),
          this.getTeacherStatsByDateRange(startDate, endDate)
        ]);
        
        return {
          attendance: attendanceStats,
          students: studentStats,
          teachers: teacherStats,
          dateRange: { start: startDate, end: endDate }
        };
      } catch (error) {
        console.error('Error obteniendo análisis por rango de fechas:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
})