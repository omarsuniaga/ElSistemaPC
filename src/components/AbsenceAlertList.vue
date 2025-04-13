<template>
  <div class="absence-alert-list">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Analizando datos de asistencia...</p>
    </div>

    <div v-else class="alert-container">
      <div class="tabs mb-4">
        <button 
          @click="activeTab = 'all'" 
          :class="{'active-tab': activeTab === 'all'}" 
          class="tab-button">
          Todas las alertas
        </button>
        <button 
          @click="activeTab = 'weekly'" 
          :class="{'active-tab': activeTab === 'weekly'}" 
          class="tab-button">
          Ausentes por semana
        </button>
        <button 
          @click="activeTab = 'monthly'" 
          :class="{'active-tab': activeTab === 'monthly'}" 
          class="tab-button">
          Ausentes por mes
        </button>
      </div>

      <!-- Debug info panel -->
      <!-- <div class="debug-panel bg-gray-100 p-3 mb-4 rounded text-xs font-mono">
        <p>Semana actual: {{ debugDateInfo.week.start }} - {{ debugDateInfo.week.end }}</p>
        <p>Mes actual: {{ debugDateInfo.month.start }} - {{ debugDateInfo.month.end }}</p>
        <p>Total registros: {{ debugDateInfo.totalAttendanceRecords }}, Ausencias: {{ debugDateInfo.absentRecords }}</p>
      </div> -->

      <h3 class="section-title">
        {{ activeTab === 'all' ? 'Alertas de Ausencias' : 
           activeTab === 'weekly' ? 'Ausentes por Semana' : 'Ausentes por Mes' }}
      </h3>
      
      <!-- Vista de todas las alertas (original) -->
      <div v-if="activeTab === 'all'">
        <div v-if="absenceReport.length === 0" class="empty-state">
          <p>No hay alertas de ausencias que mostrar</p>
        </div>

        <div v-else class="alerts-list">
          <div 
            v-for="report in absenceReport" 
            :key="report.student.id"
            class="alert-card"
            :class="{'high-risk': report.consecutiveAbsences >= 3}"
          >
            <div class="student-info">
              <img 
                v-if="report.student.photoURL" 
                :src="report.student.photoURL" 
                :alt="`Foto de ${report.student.nombre}`" 
                class="student-photo"
              />
              <div v-else class="photo-placeholder">
                {{ getInitials(report.student.nombre, report.student.apellido) }}
              </div>
              
              <div class="student-details">
                <h4>{{ report.student.nombre }} {{ report.student.apellido }}</h4>
                <div class="tags">
                  <span v-if="report.student.instrumento" class="tag instrument">
                    {{ report.student.instrumento }}
                  </span>
                  <span v-if="report.student.clase" class="tag class">
                    {{ report.student.clase }}
                  </span>
                </div>
              </div>
            </div>

            <div class="absence-stats">
              <div class="stat">
                <span class="value">{{ report.consecutiveAbsences }}</span>
                <span class="label">Ausencias consecutivas</span>
              </div>
              <div class="stat">
                <span class="value">{{ report.totalAbsences }}</span>
                <span class="label">Total ausencias</span>
              </div>
              <div v-if="report.lastAbsenceDate" class="last-date">
                <span class="label">Última ausencia:</span>
                <span class="value">{{ formatDate(report.lastAbsenceDate) }}</span>
              </div>
            </div>

            <div class="actions">
              <button class="btn contact-btn" @click="contactStudent(report.student)">
                Contactar
              </button>
              <button class="btn view-btn" @click="viewAttendance(report.student)">
                Ver asistencia
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Vista de ausencias por semana -->
      <div v-if="activeTab === 'weekly'">
        <div v-if="weeklyAbsences.length === 0" class="empty-state">
          <p>No hay alumnos con inasistencias en la semana actual ({{ debugDateInfo.week.start }} - {{ debugDateInfo.week.end }})</p>
        </div>

        <div v-else class="alerts-list">
          <div 
            v-for="report in weeklyAbsences" 
            :key="report.student.id"
            class="alert-card"
            :class="{
              'high-risk': hasInstrumentClass(report.student.id) && report.absences > 2
            }"
          >
            <div class="student-info">
              <img 
                v-if="report.student.photoURL" 
                :src="report.student.photoURL" 
                :alt="`Foto de ${report.student.nombre}`" 
                class="student-photo"
              />
              <div v-else class="photo-placeholder">
                {{ getInitials(report.student.nombre, report.student.apellido) }}
              </div>
              
              <div class="student-details">
                <h4>{{ report.student.nombre }} {{ report.student.apellido }}</h4>
                <div class="tags">
                  <span v-if="report.student.instrumento" class="tag instrument">
                    {{ report.student.instrumento }}
                  </span>
                  <span v-if="hasInstrumentClass(report.student.id)" class="tag class">
                    Con instrumento
                  </span>
                  <span v-if="isInPreparatoryClass(report.student.id)" class="tag class">
                    Preparatoria/Iniciación
                  </span>
                </div>
                <div class="class-list mt-1">
                  <p class="text-xs text-gray-600">
                    <span class="font-semibold">Clases:</span> {{ report.classNames?.join(', ') || 'No asignadas' }}
                  </p>
                </div>
              </div>
            </div>

            <div class="absence-stats">
              <div class="stat">
                <span class="value">{{ report.absences }}</span>
                <span class="label">Ausencias esta semana</span>
              </div>
              <div class="absence-dates">
                <span class="label">Fechas:</span>
                <span class="dates">
                  {{ report.absenceDates.map(date => new Date(date).toLocaleDateString('es-ES')).join(', ') }}
                </span>
              </div>
              <div class="stat phone mt-2">
                <span class="label">Teléfono:</span>
                <span class="value phone-number">{{ report.parentPhone }}</span>
              </div>
            </div>

            <div class="actions">
              <button class="btn contact-btn" @click="contactStudent(report.student)">
                Contactar
              </button>
              <button class="btn view-btn" @click="viewAttendance(report.student)">
                Ver asistencia
              </button>
              <button class="btn notify-btn" @click="notifyAbsence(report.student)">
                Notificar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Vista de ausencias por mes -->
      <div v-if="activeTab === 'monthly'">
        <div v-if="monthlyAbsences.length === 0" class="empty-state">
          <p>No hay alumnos con inasistencias en el mes actual ({{ debugDateInfo.month.start }} - {{ debugDateInfo.month.end }})</p>
        </div>

        <div v-else class="alerts-list">
          <div 
            v-for="report in monthlyAbsences" 
            :key="report.student.id"
            class="alert-card"
            :class="{
              'high-risk': hasInstrumentClass(report.student.id) && report.absences > 2
            }"
          >
            <div class="student-info">
              <img 
                v-if="report.student.photoURL" 
                :src="report.student.photoURL" 
                :alt="`Foto de ${report.student.nombre}`" 
                class="student-photo"
              />
              <div v-else class="photo-placeholder">
                {{ getInitials(report.student.nombre, report.student.apellido) }}
              </div>
              
              <div class="student-details">
                <h4>{{ report.student.nombre }} {{ report.student.apellido }}</h4>
                <div class="tags">
                  <span v-if="report.student.instrumento" class="tag instrument">
                    {{ report.student.instrumento }}
                  </span>
                  <span v-if="hasInstrumentClass(report.student.id)" class="tag class">
                    Con instrumento
                  </span>
                  <span v-if="isInPreparatoryClass(report.student.id)" class="tag class">
                    Preparatoria/Iniciación
                  </span>
                </div>
                <div class="class-list mt-1">
                  <p class="text-xs text-gray-600">
                    <span class="font-semibold">Clases:</span> {{ report.classNames?.join(', ') || 'No asignadas' }}
                  </p>
                </div>
              </div>
            </div>

            <div class="absence-stats">
              <div class="stat">
                <span class="value">{{ report.absences }}</span>
                <span class="label">Ausencias este mes</span>
              </div>
              <div class="absence-dates">
                <span class="label">Fechas (últimas 3):</span>
                <span class="dates">
                  {{ report.absenceDates.slice(0, 3).map(date => new Date(date).toLocaleDateString('es-ES')).join(', ') }}
                  <span v-if="report.absenceDates.length > 3">...</span>
                </span>
              </div>
              <div class="stat phone mt-2">
                <span class="label">Teléfono:</span>
                <span class="value phone-number">{{ report.parentPhone }}</span>
              </div>
            </div>

            <div class="actions">
              <button class="btn contact-btn" @click="contactStudent(report.student)">
                Contactar
              </button>
              <button class="btn view-btn" @click="viewAttendance(report.student)">
                Ver asistencia
              </button>
              <button class="btn notify-btn" @click="notifyAbsence(report.student)">
                Notificar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineExpose, computed } from 'vue';
import { useStudentsStore } from '../modulos/Students/store/students';
import { useAttendanceStore } from '../modulos/Attendance/store/attendance';
import { useClassesStore } from '../modulos/Classes/store/classes';
import { useNotificationsStore } from '../stores/notifications';
import { useToast } from '../components/ui/toast/use-toast';
import type { Student } from '../modulos/Students/types/student';

const studentsStore = useStudentsStore();
const attendanceStore = useAttendanceStore();
const classesStore = useClassesStore();
const notificationsStore = useNotificationsStore();
const { toast } = useToast();

// Interfaces
interface AbsenceAnalysis {
  consecutiveAbsences: number;
  totalAbsences: number;
  lastAbsenceDate: Date | null;
}

interface StudentAbsenceReport {
  student: Student;
  consecutiveAbsences: number;
  totalAbsences: number;
  lastAbsenceDate: Date | null;
}

interface WeeklyAbsenceReport {
  student: Student;
  absences: number;
  records: any[];
  absenceDates: string[];
  parentPhone?: string;
  classNames?: string[];
}

// Estados
const absenceReport = ref<StudentAbsenceReport[]>([]);
const weeklyAbsences = ref<WeeklyAbsenceReport[]>([]);
const monthlyAbsences = ref<WeeklyAbsenceReport[]>([]);
const loading = ref(true);
const activeTab = ref('all');

// Funciones para obtener rangos de fecha
const getCurrentWeekDateRange = () => {
  const today = new Date();
  const day = today.getDay(); // 0 es domingo, 1 es lunes...
  
  // Calcular la fecha del lunes de esta semana
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  
  // Calcular la fecha del sábado de esta semana
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  saturday.setHours(23, 59, 59, 999);
  
  return { startDate: monday, endDate: saturday };
};

const getCurrentMonthDateRange = () => {
  const today = new Date();
  
  // Primer día del mes actual
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  firstDay.setHours(0, 0, 0, 0);
  
  // Último día del mes actual
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  lastDay.setHours(23, 59, 59, 999);
  
  return { startDate: firstDay, endDate: lastDay };
};

// Debug de fechas para verificar el funcionamiento
const debugDateInfo = computed(() => {
  const weekRange = getCurrentWeekDateRange();
  const monthRange = getCurrentMonthDateRange();
  
  return {
    week: {
      start: weekRange.startDate.toLocaleDateString('es-ES'),
      end: weekRange.endDate.toLocaleDateString('es-ES')
    },
    month: {
      start: monthRange.startDate.toLocaleDateString('es-ES'),
      end: monthRange.endDate.toLocaleDateString('es-ES')
    },
    totalAttendanceRecords: attendanceStore.records.length,
    absentRecords: attendanceStore.records.filter(r => r.status === 'ausente').length
  };
});

// Función para analizar ausencias de todos los estudiantes activos
const analyzeAbsences = () => {
  console.log("Analizando ausencias generales...");
  loading.value = true;
  
  // First, get students with absences
  const students = studentsStore.getActiveStudents;
  
  // Then analyze each student's absences
  absenceReport.value = students
    .map(student => {
      const analysis = analyzeStudentAbsences(student.id, attendanceStore.records);
      return {
        student,
        ...analysis
      };
    })
    .filter(report => report.consecutiveAbsences >= 2 || report.totalAbsences >= 3)
    .sort((a, b) => b.consecutiveAbsences - a.consecutiveAbsences);
  
  loading.value = false;
  console.log(`Encontrados ${absenceReport.value.length} estudiantes con alertas de ausencias generales`);
};

// Analizador de ausencias por semana
const analyzeWeeklyAbsences = () => {
  console.log("Analizando ausencias por semana...");
  console.log("Información de rango de fechas:", debugDateInfo.value);
  
  const { startDate, endDate } = getCurrentWeekDateRange();
  const students = studentsStore.getActiveStudents;
  
  // Crear un mapa para contar ausencias por estudiante
  const absentCountByStudent = new Map();
  const absentDatesByStudent = new Map();
  
  // Iterar a través de todos los registros de asistencia
  attendanceStore.records.forEach(record => {
    const recordDate = new Date(record.date);
    
    // Verificar si el registro está en el rango de fecha y es una ausencia
    if (recordDate >= startDate && 
        recordDate <= endDate && 
        record.status === 'ausente') {
      
      // Incrementar contador para este estudiante
      const currentCount = absentCountByStudent.get(record.studentId) || 0;
      absentCountByStudent.set(record.studentId, currentCount + 1);
      
      // Guardar las fechas de ausencia
      const dates = absentDatesByStudent.get(record.studentId) || [];
      dates.push(record.date);
      absentDatesByStudent.set(record.studentId, dates);
    }
  });
  
  console.log("Mapa de ausencias por estudiante:", Object.fromEntries(absentCountByStudent));
  
  // Generar reportes para estudiantes con más de 2 ausencias
  weeklyAbsences.value = Array.from(absentCountByStudent.entries())
    .filter(([_, count]) => count > 1) // Cambié a > 1 para detectar más estudiantes
    .map(([studentId, absences]) => {
      const student = students.find(s => s.id === studentId);
      if (!student) return null;
      
      // Obtener clases del estudiante
      const studentClasses = classesStore.getClassesByStudentId(studentId);
      const classNames = studentClasses.map(c => c.name);
      
      // Obtener registros de ausencia específicos
      const records = attendanceStore.records.filter(
        r => r.studentId === studentId && 
             r.status === 'ausente' &&
             new Date(r.date) >= startDate &&
             new Date(r.date) <= endDate
      );
      
      return {
        student,
        absences,
        records,
        absenceDates: absentDatesByStudent.get(studentId) || [],
        parentPhone: student.parentPhone || 'No registrado',
        classNames
      };
    })
    .filter(Boolean) // Eliminar valores nulos
    .sort((a, b) => b.absences - a.absences); // Ordenar por cantidad de ausencias
    
  console.log(`Encontrados ${weeklyAbsences.value.length} estudiantes con más de 1 ausencia esta semana`);
  if (weeklyAbsences.value.length > 0) {
    console.log("Primer estudiante con ausencias:", weeklyAbsences.value[0]);
  }
};

// Analizador de ausencias por mes
const analyzeMonthlyAbsences = () => {
  console.log("Analizando ausencias por mes...");
  
  const { startDate, endDate } = getCurrentMonthDateRange();
  const students = studentsStore.getActiveStudents;
  
  // Crear un mapa para contar ausencias por estudiante
  const absentCountByStudent = new Map();
  const absentDatesByStudent = new Map();
  
  // Iterar a través de todos los registros de asistencia
  attendanceStore.records.forEach(record => {
    const recordDate = new Date(record.date);
    
    // Verificar si el registro está en el rango de fecha y es una ausencia
    if (recordDate >= startDate && 
        recordDate <= endDate && 
        record.status === 'ausente') {
      
      // Incrementar contador para este estudiante
      const currentCount = absentCountByStudent.get(record.studentId) || 0;
      absentCountByStudent.set(record.studentId, currentCount + 1);
      
      // Guardar las fechas de ausencia
      const dates = absentDatesByStudent.get(record.studentId) || [];
      dates.push(record.date);
      absentDatesByStudent.set(record.studentId, dates);
    }
  });
  
  // Generar reportes para estudiantes con más de 2 ausencias
  monthlyAbsences.value = Array.from(absentCountByStudent.entries())
    .filter(([_, count]) => count > 1) // Cambié a > 1 para detectar más estudiantes
    .map(([studentId, absences]) => {
      const student = students.find(s => s.id === studentId);
      if (!student) return null;
      
      // Obtener clases del estudiante
      const studentClasses = classesStore.getClassesByStudentId(studentId);
      const classNames = studentClasses.map(c => c.name);
      
      // Obtener registros de ausencia específicos
      const records = attendanceStore.records.filter(
        r => r.studentId === studentId && 
             r.status === 'ausente' &&
             new Date(r.date) >= startDate &&
             new Date(r.date) <= endDate
      );
      
      return {
        student,
        absences,
        records,
        absenceDates: absentDatesByStudent.get(studentId) || [],
        parentPhone: student.parentPhone || 'No registrado',
        classNames
      };
    })
    .filter(Boolean) // Eliminar valores nulos
    .sort((a, b) => b.absences - a.absences); // Ordenar por cantidad de ausencias
    
  console.log(`Encontrados ${monthlyAbsences.value.length} estudiantes con más de 1 ausencia este mes`);
};

onMounted(async () => {
  console.log("Componente AbsenceAlertList montado, cargando datos...");
  loading.value = true;
  
  try {
    await studentsStore.fetchStudents();
    console.log(`Cargados ${studentsStore.students.length} estudiantes`);
    
    // Calculate a date 30 days ago to use as startDate for attendance records
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    await attendanceStore.fetchRecordsForMultipleEntities({ startDate });
    console.log(`Cargados ${attendanceStore.records.length} registros de asistencia`);
    
    analyzeAbsences(); // Now this function will be properly defined
    analyzeWeeklyAbsences();
    analyzeMonthlyAbsences();
  } catch (error) {
    console.error("Error al cargar datos de asistencia:", error);
  } finally {
    loading.value = false;
  }
});

// Función para verificar si un estudiante tiene clases con instrumentos
const hasInstrumentClass = (studentId: string): boolean => {
  const classes = classesStore.getClassesByStudentId(studentId);
  return classes.some(classItem => 
    ['Ensayo General', 'Ensayo Seccional', 'Taller', 'Talleres', 'Coro'].some(keyword => 
      classItem.name.toLowerCase().includes(keyword.toLowerCase())
    )
  );
};

// Adding the missing analyzeStudentAbsences function
const analyzeStudentAbsences = (studentId: string, attendanceRecords: any[]): any => {
  // Filter records for this student
  const studentRecords = attendanceRecords.filter(record => record.studentId === studentId);
  
  // Calculate absences
  const absences = studentRecords.filter(record => record.status === 'absent' && !record.justified);
  const justifiedAbsences = studentRecords.filter(record => record.status === 'absent' && record.justified);
  
  // Find dates of absences
  const absenceDates = absences.map(record => record.date);
  
  // Count consecutive absences (simplified logic)
  let maxConsecutive = 0;
  let currentConsecutive = 0;
  
  // Sort dates first
  const sortedDates = [...absenceDates].sort();
  
  // Check for consecutive dates (simplified, doesn't account for class schedule)
  for (let i = 0; i < sortedDates.length; i++) {
    if (i > 0) {
      const prevDate = new Date(sortedDates[i-1]);
      const currentDate = new Date(sortedDates[i]);
      const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) { // Within a week considered consecutive
        currentConsecutive++;
      } else {
        currentConsecutive = 1;
      }
    } else {
      currentConsecutive = 1;
    }
    
    maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
  }
  
  return {
    totalAbsences: absences.length,
    justifiedAbsences: justifiedAbsences.length,
    consecutiveAbsences: maxConsecutive,
    absenceDates: absenceDates,
    lastAbsenceDate: absenceDates.length > 0 ? 
      new Date(Math.max(...absenceDates.map(d => new Date(d).getTime()))) : null
  };
};

// Función para notificar ausencia
const notifyAbsence = async (student: Student) => {
  try {
    // Determinar la severidad basada en si el estudiante tiene instrumento o no
    const hasInstrument = hasInstrumentClass(student.id);
    const isPreparatory = isInPreparatoryClass(student.id);
    
    const severity = hasInstrument ? 'alta' : isPreparatory ? 'media' : 'baja';
    const absenceType = activeTab.value === 'weekly' ? 'semanal' : 'mensual';
    
    // Crear la notificación para administradores y directores
    const notificationId = await notificationsStore.sendNotification({
      title: `⚠️ Alerta de Inasistencias - ${severity.toUpperCase()}`,
      message: `${student.nombre} ${student.apellido} tiene inasistencias excesivas (${absenceType}). ${hasInstrument ? 'Estudiante con instrumento asignado.' : ''}`,
      type: hasInstrument ? 'error' : 'warning',
      recipientRoles: ['admin', 'director'],
      link: `/students/${student.id}`,
      details: {
        studentId: student.id,
        studentName: `${student.nombre} ${student.apellido}`,
        instrument: student.instrumento || 'No asignado',
        severity: severity,
        absenceType: absenceType,
        absenceCount: activeTab.value === 'weekly' ? 
          weeklyAbsences.value.find(report => report.student.id === student.id)?.absences : 
          monthlyAbsences.value.find(report => report.student.id === student.id)?.absences,
        parentPhone: student.parentPhone || 'No registrado'
      }
    });

    console.log('Notificación enviada con ID:', notificationId);
    
    toast({
      title: "Notificación enviada",
      description: `Se ha enviado una notificación a los administradores sobre las ausencias de ${student.nombre} ${student.apellido}`
    });
  } catch (error) {
    console.error('Error al enviar notificación de ausencia:', error);
    toast({
      title: "Error",
      description: "No se pudo enviar la notificación. Por favor, intente de nuevo.",
      variant: "destructive"
    });
  }
};

// Exponemos las funciones para que puedan ser utilizadas por componentes padres
defineExpose({
  absenceReport,
  weeklyAbsences,
  monthlyAbsences,
  getWeeklyAbsences: () => weeklyAbsences.value,
  getMonthlyAbsences: () => monthlyAbsences.value,
  analyzeAbsences,
  analyzeWeeklyAbsences,
  analyzeMonthlyAbsences,
  debugDateInfo
});
</script>

<style scoped>
.absence-alert-list {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
}

.section-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 0.5rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.tabs {
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
}

.tab-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  background-color: transparent;
  color: #6b7280;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-button:hover {
  background-color: #f3f4f6;
}

.active-tab {
  background-color: #3b82f6;
  color: white;
}

.alert-card {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
  display: grid;
  grid-template-columns: minmax(200px, 1fr) minmax(200px, 1fr) 180px;
  gap: 1rem;
  transition: all 0.2s ease;
}

.alert-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.alert-card.high-risk {
  border-left: 4px solid #e74c3c;
}

.student-info {
  display: flex;
  align-items: center;
}

.student-photo, .photo-placeholder {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 1rem;
  object-fit: cover;
}

.photo-placeholder {
  background-color: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.student-details h4 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
}

.tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.tag.instrument {
  background-color: #e3f2fd;
  color: #1565c0;
}

.tag.class {
  background-color: #f1f8e9;
  color: #558b2f;
}

.absence-stats {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat {
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
}

.stat .value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #e74c3c;
}

.stat .label {
  font-size: 0.8rem;
  color: #7f8c8d;
}

.severity .value .severity-high {
  color: #e74c3c;
}

.severity .value .severity-medium {
  color: #f39c12;
}

.last-date {
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.last-date .label {
  margin-right: 0.5rem;
  color: #7f8c8d;
}

.actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.contact-btn {
  background-color: #3498db;
  color: white;
}

.contact-btn:hover {
  background-color: #2980b9;
}

.view-btn {
  background-color: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.view-btn:hover {
  background-color: #e9ecef;
}

.notify-btn {
  background-color: #f3a046;
  color: white;
}

.notify-btn:hover {
  background-color: #e67e22;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
}

.absence-dates {
  margin-top: 0.5rem;
  font-size: 0.85rem;
}

.absence-dates .label {
  color: #7f8c8d;
  font-weight: 500;
}

.absence-dates .dates {
  display: inline-block;
  margin-left: 0.25rem;
  color: #4b5563;
}

.phone-number {
  font-family: monospace;
  letter-spacing: 0.5px;
}

.class-list {
  font-size: 0.75rem;
  color: #6b7280;
}

@media (max-width: 768px) {
  .alert-card {
    grid-template-columns: 1fr;
  }
}
</style>
