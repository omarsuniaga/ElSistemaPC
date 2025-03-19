import { defineStore } from 'pinia'
import { format, parseISO, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { auth } from '../firebase'
import { useAttendanceStore } from './attendance'
import { useStudentsStore } from './students'
import { useClassesStore } from './classes'
import { useTeachersStore } from './teachers'
import { useContentsStore } from './contents'
import { useQualificationStore } from './qualification'
import { useProfileStore } from './profile'

export const useAnalyticsStore = defineStore('analytics', {
  state: () => ({
    loading: false,
    attendanceMetrics: {
      averageRate: 0,
      topAbsentStudents: [],
      bestAttendanceClasses: [],
      attendanceByDayOfWeek: [] as Array<{ day: string; rate: number }>
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
      }
    },
    academicMetrics: {
      lowestPerformanceIndicators: [] as Array<{ name: string; score: number; subject: string }>,
      mostDifficultTopics: [] as Array<{ name: string; failureRate: number; attempts: number }>,
      classProgress: [] as Array<{ className: string; progress: number; totalContents: number; completedContents: number }>
    },
    teacherMetrics: {
      classAttendanceRates: [],
      teachingHours: {},
      evaluationRatings: {}
    },
    profileMetrics: {
      lastLogin: '',
      recentActivities: [],
      achievements: []
    },
    error: null as string | null
  }),

  actions: {
    async fetchAnalytics() {
      this.loading = true;
      try {
        await Promise.all([
          this.fetchAttendanceMetrics(),
          this.fetchStudentMetrics(),
          this.fetchAcademicMetrics(),
          this.fetchTeacherMetrics(),
          this.fetchProfileMetrics()
        ]);
      } catch (error: any) {
        this.error = error.message;
        console.error('Error loading analytics:', error);
      } finally {
        this.loading = false;
      }
    },

    // 🟢 Métricas de Asistencia
    async fetchAttendanceMetrics() {
      try {
        const attendanceStore = useAttendanceStore();
        const studentsStore = useStudentsStore();
        const classesStore = useClassesStore();
        
        // Asegurar que se han cargado los datos de asistencia
        await attendanceStore.updateAnalytics();
        
        // Obtener tasa promedio de asistencia
        if (attendanceStore.analytics) {
          this.attendanceMetrics.averageRate = Math.round(attendanceStore.analytics.averageAttendance);
        }
        
        // Obtener estudiantes con más ausencias
        const absentStudents = attendanceStore.calculateAbsentStudents(5);
        this.attendanceMetrics.topAbsentStudents = await Promise.all(
          absentStudents.map(async (student) => {
            const studentData = studentsStore.students.find(s => s.id === student.studentId);
            return {
              id: student.studentId,
              name: studentData ? `${studentData.nombre} ${studentData.apellido}` : 'Estudiante',
              absences: student.absences,
              attendanceRate: Math.round(student.attendanceRate)
            };
          })
        );
        
        // Obtener clases con mejor asistencia
        if (attendanceStore.analytics?.byClass) {
          this.attendanceMetrics.bestAttendanceClasses = Object.entries(attendanceStore.analytics.byClass)
            .map(([classId, stats]) => {
              const classData = classesStore.classes.find(c => c.id.toString() === classId);
              const attendanceRate = stats.total > 0 
                ? Math.round(((stats.present + stats.justified) / stats.total) * 100) 
                : 0;
              
              return {
                id: classId,
                name: classData?.name || `Clase ${classId}`,
                attendanceRate,
                total: stats.total
              };
            })
            .filter(c => c.total > 0)
            .sort((a, b) => b.attendanceRate - a.attendanceRate)
            .slice(0, 5);
        }
        
        // Simular datos de asistencia por día de semana
        // En una implementación real, estos datos vendrían procesados de attendanceStore
        this.attendanceMetrics.attendanceByDayOfWeek = [
          { day: 'Lunes', rate: 92 },
          { day: 'Martes', rate: 88 },
          { day: 'Miércoles', rate: 85 },
          { day: 'Jueves', rate: 90 },
          { day: 'Viernes', rate: 86 },
          { day: 'Sábado', rate: 91 },
          { day: 'Domingo', rate: 82 }
        ];
        
        return this.attendanceMetrics;
      } catch (error) {
        console.error('Error cargando métricas de asistencia:', error);
        throw error;
      }
    },

    // 🔵 Métricas Académicas de Estudiantes
    async fetchStudentMetrics() {
      try {
        const studentsStore = useStudentsStore();
        const qualificationStore = useQualificationStore();
        
        // Datos simulados para rendimiento académico
        // En una implementación real, obtendríamos estos datos de qualificationStore
        const studentEvaluations = studentsStore.students.map(student => {
          // Generar una calificación aleatoria entre 60 y 98
          const performance = Math.floor(Math.random() * 38) + 60;
          
          return {
            id: student.id,
            name: `${student.nombre} ${student.apellido}`,
            performance,
            instrument: student.instrumento || 'No especificado'
          };
        });
        
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
        
        return this.studentMetrics;
      } catch (error) {
        console.error('Error cargando métricas de estudiantes:', error);
        throw error;
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
        
        // Obtener profesores
        const teachers = teachersStore.teachers;
        
        // Simulación de tasas de asistencia en clases de cada profesor
        this.teacherMetrics.classAttendanceRates = teachers.map(teacher => {
          const attendanceRate = teachersStore.getTeacherAttendanceRate 
            ? teachersStore.getTeacherAttendanceRate(teacher.id)
            : Math.floor(Math.random() * 15) + 80; // 80-95% (fallback)
          
          const classesTaught = teachersStore.getTeacherClassesCount
            ? teachersStore.getTeacherClassesCount(teacher.id)
            : Math.floor(Math.random() * 10) + 5; // 5-15 (fallback)
            
          return {
            id: teacher.id,
            name: `${teacher.nombre} ${teacher.apellido}`,
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
        
        return this.teacherMetrics;
      } catch (error) {
        console.error('Error cargando métricas de profesores:', error);
        throw error;
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
    }
  }
});