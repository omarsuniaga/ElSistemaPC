<template>
  <div class="card bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
    <div class="bg-red-50 dark:bg-red-900/30 px-4 py-3">
      <h3 class="font-semibold text-red-700 dark:text-red-300 flex items-center">
        <ExclamationCircleIcon class="h-5 w-5 mr-2" />
        Alerta de Inasistencias
      </h3>
    </div>

    <div v-if="loading" class="p-8 flex justify-center items-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
      <span class="ml-2">Cargando datos...</span>
    </div>

    <div
      v-else-if="
        absenceReport.weeklyAbsences.length === 0 && absenceReport.monthlyAbsences.length === 0
      "
      class="p-8 text-center"
    >
      <ExclamationCircleIcon class="h-12 w-12 mx-auto mb-3 text-gray-400" />
      <p class="text-gray-600 dark:text-gray-400">No hay alumnos con inasistencias críticas</p>
    </div>

    <div v-else class="p-4">
      <div class="mb-2 border-b pb-2">
        <div class="flex justify-between items-center">
          <h4 class="font-medium">
            Alumnos con más de 2 inasistencias por {{ activeFilter === "week" ? "semana" : "mes" }}
          </h4>
          <div class="flex space-x-2">
            <button
              :class="[
                'px-3 py-1 text-mn rounded-full',
                activeFilter === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
              ]"
              @click="activeFilter = 'week'"
            >
              Semana
            </button>
            <button
              :class="[
                'px-3 py-1 text-mn rounded-full',
                activeFilter === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
              ]"
              @click="activeFilter = 'month'"
            >
              Mes
            </button>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Alumno
              </th>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Clase
              </th>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Ausencias
              </th>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Categoría
              </th>
              <th
                class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="student in filteredStudents"
              :key="student.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="flex items-center">
                  <div
                    class="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center"
                  >
                    <UserIcon v-if="!student.photoURL" class="h-4 w-4 text-gray-400" />
                    <img
                      v-else
                      :src="student.photoURL"
                      alt=""
                      class="h-8 w-8 rounded-full object-cover"
                    />
                  </div>
                  <div class="ml-3">
                    <div class="text-xs font-medium text-gray-900 dark:text-gray-200">
                      {{ student.nombre }} {{ student.apellido }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="text-xs text-gray-900 dark:text-gray-200">
                  {{ getClassesNames(student.classes).join(", ") }}
                </div>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <div
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                >
                  {{ student.absences }}
                </div>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    student.hasInstruments
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                  ]"
                >
                  {{ student.hasInstruments ? "Con Instrumento" : "Sin Instrumento" }}
                </span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-right text-xs font-medium">
                <div class="flex justify-end space-x-2">
                  <button
                    class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                    title="Avisar a Director"
                    @click="notifyDirector(student)"
                  >
                    <BellIcon class="h-5 w-5" />
                  </button>
                  <button
                    class="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                    title="Enviar Reporte"
                    @click="sendReport(student)"
                  >
                    <DocumentTextIcon class="h-5 w-5" />
                  </button>
                  <button
                    class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                    title="Amonestar"
                    @click="createWarning(student)"
                  >
                    <ExclamationIcon class="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  ExclamationCircleIcon,
  UserIcon,
  BellIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon as ExclamationIcon,
} from '@heroicons/vue/24/outline';
import { useClassesStore } from '../../modulos/Classes/store/classes';
import { useAttendanceStore } from '../../modulos/Attendance/store/attendance';
import { useStudentsStore } from '../../modulos/Students/store/students';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Tipo para jsPDF con autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

// Definición de tipos para los estudiantes con ausencias
interface Student {
  id: string
  nombre: string
  apellido: string
  absences: number
  classes?: string[]
  hasInstruments?: boolean
  photoURL?: string
}

// Definición de la estructura para el reporte de ausencias
interface AbsenceReport {
  weeklyAbsences: Student[]
  monthlyAbsences: Student[]
}

// Obtener stores necesarios
const classesStore = useClassesStore();
const attendanceStore = useAttendanceStore();
const studentsStore = useStudentsStore();

// Estados reactivos
const loading = ref(true);
const activeFilter = ref('week'); // 'week' o 'month'

// Estructura para almacenar el resultado del análisis
const absenceReport = ref<AbsenceReport>({
  weeklyAbsences: [],
  monthlyAbsences: [],
});

// Función para obtener los datos de ausencias de estudiantes
async function analyzeAbsences(): Promise<AbsenceReport> {
  try {
    // Calcular los estudiantes con más ausencias en la última semana
    const now = new Date();
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 7);

    const lastMonth = new Date(now);
    lastMonth.setMonth(now.getMonth() - 1);

    // Obtener datos de ausencias
    await attendanceStore.fetchAttendance();

    // Obtener estudiantes con ausencias
    const absentStudents = attendanceStore.calculateAbsentStudents(20);

    // Filtrar por período y mapear a la estructura esperada
    const weeklyAbsences: Student[] = [];
    const monthlyAbsences: Student[] = [];

    for (const student of absentStudents) {
      // Buscar información del estudiante
      const studentData = studentsStore.items.find((s) => s.id === student.studentId);
      if (!studentData) continue;

      // Solo incluir estudiantes con más de 2 ausencias
      if (student.absences >= 2) {
        // Crear objeto con la estructura esperada
        const studentInfo: Student = {
          id: student.studentId,
          nombre: studentData.nombre || 'Sin nombre',
          apellido: studentData.apellido || 'Sin apellido',
          absences: student.absences,
          classes: studentData.classIds || [],
          hasInstruments: !!studentData.instrumentId,
          photoURL: studentData.photoURL,
        };

        // Verificar si la última asistencia está dentro del período de una semana
        if (new Date(student.lastAttendance) >= lastWeek) {
          weeklyAbsences.push(studentInfo);
        }

        // Verificar si la última asistencia está dentro del período de un mes
        if (new Date(student.lastAttendance) >= lastMonth) {
          monthlyAbsences.push(studentInfo);
        }
      }
    }

    return {
      weeklyAbsences,
      monthlyAbsences,
    };
  } catch (error) {
    console.error('Error al analizar ausencias:', error);
    // Retornamos un objeto vacío en caso de error
    return {
      weeklyAbsences: [],
      monthlyAbsences: [],
    };
  }
}

// Alumnos filtrados según la selección semanal/mensual
const filteredStudents = computed(() => {
  return activeFilter.value === 'week'
    ? absenceReport.value.weeklyAbsences
    : absenceReport.value.monthlyAbsences;
});

// Función para obtener los nombres de las clases a partir de los IDs
function getClassesNames(classIds?: string[]): string[] {
  if (!classIds || classIds.length === 0) return ['Sin clase asignada'];

  return classIds.map((classId) => {
    const classInfo = classesStore.classes.find((c) => c.id === classId);
    return classInfo?.name || 'Clase desconocida';
  });
}

// Cargar los datos de ausencias al montar el componente
onMounted(async () => {
  try {
    loading.value = true;
    absenceReport.value = await analyzeAbsences();
  } catch (error) {
    console.error('Error al cargar datos de inasistencias:', error);
  } finally {
    loading.value = false;
  }
});

// Función para notificar al director
function notifyDirector(student: Student): void {
  // Aquí iría la lógica para notificar al director
  // Por ejemplo, un servicio que envíe un email o una notificación
  alert(
    `Se ha notificado al director sobre las inasistencias de ${student.nombre} ${student.apellido}`,
  );
  // TODO: Implementar sistema de notificaciones real
}

// Función para enviar un reporte
function sendReport(student: Student): void {
  // Aquí iría la lógica para enviar un reporte
  alert(`Se ha enviado un reporte sobre las inasistencias de ${student.nombre} ${student.apellido}`);
  // TODO: Implementar sistema de envío de reportes
}

// Función para generar una amonestación en PDF
function createWarning(student: Student): void {
  const doc = new jsPDF();
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES');
  const classNames = getClassesNames(student.classes).join(', ');

  // Título
  doc.setFontSize(18);
  doc.text('AMONESTACIÓN POR INASISTENCIAS', 105, 20, { align: 'center' });

  // Fecha
  doc.setFontSize(12);
  doc.text(`Fecha: ${dateStr}`, 20, 30);

  // Datos del estudiante
  doc.setFontSize(12);
  doc.text('DATOS DEL ESTUDIANTE', 20, 40);

  doc.setFontSize(11);
  doc.text(`Nombre completo: ${student.nombre} ${student.apellido}`, 20, 50);
  doc.text(`ID: ${student.id}`, 20, 57);
  doc.text(`Clases: ${classNames}`, 20, 64);
  doc.text(`Tipo: ${student.hasInstruments ? 'Con instrumento' : 'Sin instrumento'}`, 20, 71);
  doc.text(`Total de inasistencias: ${student.absences}`, 20, 78);

  // Motivo
  doc.setFontSize(12);
  doc.text('MOTIVO DE LA AMONESTACIÓN', 20, 90);
  doc.setFontSize(11);
  doc.text(
    'El estudiante ha superado el límite de inasistencias permitidas, lo que afecta',
    20,
    100,
  );
  doc.text('negativamente su aprendizaje y el desarrollo de las clases.', 20, 107);

  // Medidas a tomar
  doc.setFontSize(12);
  doc.text('MEDIDAS A TOMAR', 20, 120);
  doc.setFontSize(11);
  doc.text('1. Contactar inmediatamente con los padres o tutores.', 20, 130);
  doc.text('2. Establecer un compromiso de asistencia para las próximas clases.', 20, 137);
  doc.text('3. Programar sesiones de recuperación si es necesario.', 20, 144);

  // Firmas
  doc.line(20, 170, 80, 170);
  doc.line(120, 170, 180, 170);
  doc.text('Firma del Profesor', 35, 180);
  doc.text('Firma del Director', 135, 180);

  // Guardar PDF
  doc.save(`Amonestacion_${student.apellido}_${student.nombre}.pdf`);
}
</script>
