<template>
  <div class="p-4 space-y-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow">
    <h2 class="text-xl font-bold mb-4 text-primary-600 dark:text-primary-400">Informe de Asistencia</h2>
    
    <!-- Admin/Director indicator when viewing other teacher's data -->
    <div v-if="isViewingOtherTeacher" class="bg-blue-50 border-l-4 border-blue-500 p-4 dark:bg-blue-900/20 dark:border-blue-600 mb-4">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <InformationCircleIcon class="h-5 w-5 text-blue-500" aria-hidden="true" />
        </div>
        <div class="ml-3">
          <p class="text-sm text-blue-700 dark:text-blue-300">
            Estás viendo el informe de asistencia de <strong>{{ teacherName }}</strong>
          </p>
        </div>
      </div>
    </div>
    
    <!-- Debug Info Panel (visible only in development) - FIXED: Use computed property instead of direct import.meta -->
    <div v-if="isDevelopmentMode" class="bg-yellow-50 border-l-4 border-yellow-500 p-4 dark:bg-yellow-900/20 dark:border-yellow-600 mb-4">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <InformationCircleIcon class="h-5 w-5 text-yellow-500" aria-hidden="true" />
        </div>
        <div class="ml-3">
          <p class="text-sm text-yellow-700 dark:text-yellow-300 font-bold">
            DEBUG INFO
          </p>
          <p class="text-xs text-yellow-600 dark:text-yellow-400">
            Teacher ID: {{ currentTeacherId }} <br>
            Classes: {{ teacherClasses.length }} <br>
            Date Range: {{ from }} to {{ to }} <br>
            Attendance Docs: {{ attendanceStore.attendanceDocuments.length }} <br>
            Generated Reports: {{ classReports.length }}
          </p>
        </div>
      </div>
    </div>
    
    <!-- Controles de fecha -->
    <div class="flex flex-wrap gap-2 items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div class="flex items-center">
        <span class="mr-2 text-sm">Desde:</span>
        <input 
          type="date" 
          v-model="from" 
          class="border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                 border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500" 
        />
      </div>
      <div class="flex items-center">
        <span class="mx-2 text-sm">Hasta:</span>
        <input 
          type="date" 
          v-model="to" 
          class="border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                 border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500" 
        />
      </div>
      <div class="flex gap-2 ml-auto">
        <button 
          @click="setRange('yesterday')" 
          class="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 
                 dark:hover:bg-gray-500 dark:text-gray-200"
        >
          Ayer
        </button>
        <button 
          @click="setRange('week')" 
          class="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 
                 dark:hover:bg-gray-500 dark:text-gray-200"
        >
          Últ. semana
        </button>
        <button 
          @click="setRange('month')" 
          class="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 
                 dark:hover:bg-gray-500 dark:text-gray-200"
        >
          Últ. mes
        </button>
        <button 
          @click="syncAttendanceData" 
          class="px-3 py-1 text-xs font-medium rounded bg-blue-600 hover:bg-blue-700 text-white 
                 dark:bg-blue-500 dark:hover:bg-blue-600"
          title="Sincronizar asistencias para el rango de fechas"
        >
          Sincronizar
        </button>
        <button 
          @click="fetchReport" 
          class="px-3 py-1 text-xs font-medium rounded bg-primary-600 hover:bg-primary-700 text-white 
                 dark:bg-primary-500 dark:hover:bg-primary-600"
        >
          Generar
        </button>
      </div>
    </div>
    
    <!-- Descargas -->
    <div class="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <span class="self-center mr-2 text-sm font-medium">Exportar:</span>
      <button 
        @click="downloadPDF" 
        class="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200 
               dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/40"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12l-5-5 1.41-1.41L10 9.17l3.59-3.58L15 7l-5 5z"></path>
        </svg>
        PDF
      </button>
      <button 
        @click="exportCSV" 
        class="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-green-100 text-green-700 hover:bg-green-200 
               dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-800/40"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12l-5-5 1.41-1.41L10 9.17l3.59-3.58L15 7l-5 5z"></path>
        </svg>
        CSV
      </button>
      <button 
        @click="exportXls" 
        class="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-blue-100 text-blue-700 hover:bg-blue-200 
               dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/40"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12l-5-5 1.41-1.41L10 9.17l3.59-3.58L15 7l-5 5z"></path>
        </svg>
        Excel
      </button>
    </div>
    
    <!-- Indicador de carga -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <svg class="animate-spin h-10 w-10 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="ml-3">Generando informe...</span>
    </div>
    
    <div v-else-if="error" class="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
      {{ error }}
    </div>

    <div v-else>
      <!-- Encabezado del informe -->
      <div id="printable-report" class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 class="text-2xl font-bold">El Sistema Punta Cana</h2>
              <p class="text-gray-600 dark:text-gray-400">Informe de Asistencia</p>
            </div>
            <div class="text-left md:text-right mt-4 md:mt-0">
              <p><strong>Maestro:</strong> {{ teacherName }}</p>
              <p><strong>Periodo:</strong> {{ formatDate(from) }} al {{ formatDate(to) }}</p>
              <p><strong>Total clases:</strong> {{ teacherClasses.length }}</p>
            </div>
          </div>
        </div>
        
        <!-- Resumen general -->
        <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 class="text-lg font-semibold mb-3">Resumen General</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-3 rounded-lg text-center">
              <p class="text-lg font-bold">{{ totalPresentes }}</p>
              <p class="text-sm">Presentes</p>
            </div>
            <div class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg text-center">
              <p class="text-lg font-bold">{{ totalAusentes }}</p>
              <p class="text-sm">Ausentes</p>
            </div>
            <div class="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 p-3 rounded-lg text-center">
              <p class="text-lg font-bold">{{ totalTardes }}</p>
              <p class="text-sm">Tardanzas</p>
            </div>
            <div class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 p-3 rounded-lg text-center">
              <p class="text-lg font-bold">{{ totalJustificados }}</p>
              <p class="text-sm">Justificados</p>
            </div>
          </div>
          <div class="mt-3">
            <p><strong>Día con mayor asistencia:</strong> {{ bestAttendanceDay }}</p>
            <p><strong>Porcentaje promedio de asistencia:</strong> {{ averageAttendancePercentage }}%</p>
          </div>
        </div>
        
        <!-- Por cada clase, mostrar una tabla de asistencias -->
        <div v-for="(classData, index) in classReports" :key="index" class="mb-10">
          <h3 class="text-xl font-bold mb-3 text-primary-600 dark:text-primary-400">{{ classData.className }}</h3>

            <!-- Tabla de alumnos y asistencias -->
          <div class="overflow-x-auto">
            <table class="w-full table-auto border-collapse">
              <thead class="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th class="p-2 border border-gray-300 dark:border-gray-600 text-left sticky left-0 bg-gray-100 dark:bg-gray-700 z-10">
                    Nombre
                  </th>
                  <!-- Mostrar solo las fechas relevantes para esta clase específica -->
                  <th v-for="date in classData.relevantDates" :key="date" class="p-2 border border-gray-300 dark:border-gray-600 text-center min-w-[60px]">
                    {{ formatDateShort(date) }}
                  </th>
                  <!-- Eliminamos columna Observaciones, usaremos sección de justificaciones debajo de la tabla -->
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in classData.students" :key="student.id" 
                    class="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td class="p-2 border border-gray-300 dark:border-gray-600 sticky left-0 bg-white dark:bg-gray-800 z-10">
                    {{ student.name }}
                  </td>
                  <!-- Mostrar solo los estados de asistencia para las fechas relevantes -->
                  <td v-for="date in classData.relevantDates" :key="`${student.id}-${date}`" 
                      class="p-2 border border-gray-300 dark:border-gray-600 text-center">
                    <span :class="getStatusClass(student.attendance[date])">
                      {{ getStatusSymbol(student.attendance[date]) }}
                    </span>
                  </td>
                    <td class="p-2 border border-gray-300 dark:border-gray-600">
                    <!-- Mostrar observación o razón de justificación -->
                    <template v-if="student.observations">{{ student.observations }}</template>
                    <template v-else>
                      <!-- Buscar si hay alguna justificación en las fechas -->
                      <template v-for="date in classData.relevantDates" :key="date">
                        <template v-if="student.attendance[date] === 'J' && getStudentJustification(classData.classId, date, student.id)">
                          <div class="text-blue-600 dark:text-blue-400 font-bold mb-1">
                            <span class="font-semibold underline">{{ formatDateShort(date) }}</span>:
                            <span class="whitespace-pre-line">{{ formatObservationText(getStudentJustification(classData.classId, date, student.id)) }}</span>
                          </div>
                        </template>
                      </template>
                    </template>
                  </td>
                </tr>
                  <tr v-if="classData.students.length === 0">
                  <td colspan="100%" class="p-4 text-center text-gray-500 dark:text-gray-400">
                    No hay estudiantes registrados en esta clase.
                  </td>
                </tr>
                
                <!-- Fila de totales por día -->
                <tr class="bg-gray-100 dark:bg-gray-700 font-medium">
                  <td class="p-2 border border-gray-300 dark:border-gray-600 sticky left-0 bg-gray-100 dark:bg-gray-700 z-10">
                    <strong>TOTALES POR DÍA</strong>
                  </td>
                  <!-- Mostrar totales por cada fecha -->
                  <td v-for="date in classData.relevantDates" :key="`total-${date}`" 
                      class="p-2 border border-gray-300 dark:border-gray-600 text-center">
                    <span class="text-green-600 dark:text-green-400 font-bold">{{ countStatusForDate(classData, date, 'P') }}</span> / 
                    <span class="text-red-600 dark:text-red-400 font-bold">{{ countStatusForDate(classData, date, 'A') }}</span> / 
                    <span class="text-yellow-600 dark:text-yellow-400 font-bold">{{ countStatusForDate(classData, date, 'T') }}</span> / 
                    <span class="text-blue-600 dark:text-blue-400 font-bold">{{ countStatusForDate(classData, date, 'J') }}</span>
                  </td>
                 
                </tr>
              </tbody>
            </table>
          </div>
            <!-- Observaciones generales de la clase por día -->
<!-- Observaciones de la clase por día -->
<div class="mt-4">
  <h4 class="font-medium mb-2 text-primary-600 dark:text-primary-400">
    Observaciones registradas:
  </h4>
  
  <div v-if="classData.observations && classData.observations.length > 0" 
       class="space-y-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
    <div v-for="obs in sortedObservations(classData.observations)" :key="obs.date" 
         class="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div class="flex items-center gap-2 mb-1">
        <CalendarIcon class="h-4 w-4 text-primary-500" />
        <span class="font-medium text-sm text-gray-600 dark:text-gray-300">
          {{ formatDate(obs.date) }}
        </span>
      </div>
      <p class="text-gray-700 dark:text-gray-200 text-sm pl-6 hitespace-pre-line">
        {{ formatObservationText(obs.text) }}
      </p>
    </div>
  </div>
  
  <div v-else class="p-4 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <InformationCircleIcon class="h-6 w-6 mx-auto mb-2 text-gray-400" />
    <p class="text-sm">No hay observaciones registradas para esta clase en el período seleccionado.</p>          </div>
          
          <!-- Pie de tabla con estadísticas -->
          <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex flex-wrap justify-between">
              <div class="mr-4">
                <p><strong>Total alumnos:</strong> {{ classData.students.length }}</p>
                <p><strong>% Asistencia:</strong> {{ calculateAttendancePercentage(classData) }}%</p>
              </div>
              <div class="flex flex-wrap gap-3">
                <div class="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                  Presentes: {{ countTotalStatus(classData, 'P') }}
                </div>
                <div class="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">
                  Ausentes: {{ countTotalStatus(classData, 'A') }}
                </div>
                <div class="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">
                  Tardes: {{ countTotalStatus(classData, 'T') }}
                </div>
                <div class="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                  Justificados: {{ countTotalStatus(classData, 'J') }}
                </div>
              </div>
            </div>
          </div>
        </div>        <div v-if="classReports.length === 0" class="text-center py-8">
          <p class="text-gray-500 dark:text-gray-400">No hay datos para mostrar en el rango seleccionado.</p>
          <p class="text-sm mt-2">Intente seleccionar otro rango de fechas o verifique si hay asistencias registradas.</p>
        </div>      
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import Chart from 'chart.js/auto'
import { format, subDays, subWeeks, subMonths, parseISO, eachDayOfInterval, getDay, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import { useRoute } from 'vue-router'

// Add missing computed property for development mode
const isDevelopmentMode = computed(() => {
  return import.meta.env.DEV;
});

// Stores
import { useAttendanceStore } from '../modulos/Attendance/store/attendance'
import { useAuthStore } from '../stores/auth'
import { useClassesStore } from '../modulos/Classes/store/classes'
import { useStudentsStore } from '../modulos/Students/store/students'
import { useTeachersStore } from '../modulos/Teachers/store/teachers' // Add this import

// Props definition
const props = defineProps({
  teacherId: {
    type: String,
    default: ''
  }
})

// Get route to read query params
const route = useRoute()

// 1. Leer el usuario y su rol
const authStore = useAuthStore()
const attendanceStore = useAttendanceStore()
const classesStore = useClassesStore()
const studentsStore = useStudentsStore()
const teachersStore = useTeachersStore() // Add teachers store

// Estado del componente - UPDATED: use current year not future dates
const from = ref(format(subDays(new Date(), 30), 'yyyy-MM-dd')); // Changed to 30 days ago instead of a week
const to = ref(format(new Date(), 'yyyy-MM-dd')); // Today
const loading = ref(false);
const error = ref<string | null>(null)

// Get teacher ID based on user role
const currentTeacherId = computed(() => {
  const userRole = authStore.user?.role;
  
  // For Director or Admin roles, prioritize the query parameter
  if (userRole === 'Director' || userRole === 'Admin') {
    // If a teacherId was provided in the URL, use it
    if (route.query.teacherId) {
      return route.query.teacherId as string;
    }
  }
  
  // For teachers or as fallback, use the user's own ID
  return props.teacherId || authStore.user?.uid;
});

// Flag to show admin indicator
const isViewingOtherTeacher = computed(() => {
  return (authStore.user?.role === 'Director' || authStore.user?.role === 'Admin') && 
         route.query.teacherId && 
         route.query.teacherId !== authStore.user?.uid;
});

// Get teacher name from the store based on the ID
const teacherName = computed(() => {
  if (!currentTeacherId.value) return authStore.user?.email || 'Profesor'
  
  const teacher = teachersStore.teachers.find(t => t.id === currentTeacherId.value)
  return teacher ? teacher.name : authStore.user?.email || 'Profesor'
})

// Filtered teacher classes - only classes for the current teacher
const teacherClasses = ref<any[]>([])

// Referencias para gráficas
const chartDates = ref<HTMLCanvasElement | null>(null)
const chartWeekday = ref<HTMLCanvasElement | null>(null)
let chart1: any, chart2: any

// 2. Buscar las clases del maestro
// const teacherClasses = ref<any[]>([])

// 3. Listas para almacenar los datos procesados
const classReports = ref<Array<{
  classId: string;
  className: string;
  daySchedule: number[]; // días de la semana en que se da la clase [0, 3, 5] (domingo, miércoles, viernes)
  observations: Array<{ date: string; text: string }>;
  students: Array<{
    id: string;
    name: string;
    attendance: Record<string, string>; // fecha -> estado
    observations: string;
  }>;
  relevantDates?: string[]; // Add the missing property
}>>([])

// Rango de fechas entre from y to
const dateRange = computed(() => {
  try {
    const start = parseISO(from.value);
    const end = parseISO(to.value);
    return eachDayOfInterval({ start, end }).map(date => format(date, 'yyyy-MM-dd'));
  } catch (e) {
    console.error('Error generando rango de fechas:', e);
    return [];
  }
});

// Contadores para la sección de resumen
const totalPresentes = computed(() => {
  let total = 0;
  classReports.value.forEach(classData => {
    total += countTotalStatus(classData, 'P');
  });
  return total;
});

const totalAusentes = computed(() => {
  let total = 0;
  classReports.value.forEach(classData => {
    total += countTotalStatus(classData, 'A');
  });
  return total;
});

const totalTardes = computed(() => {
  let total = 0;
  classReports.value.forEach(classData => {
    total += countTotalStatus(classData, 'T');
  });
  return total;
});

const totalJustificados = computed(() => {
  let total = 0;
  classReports.value.forEach(classData => {
    total += countTotalStatus(classData, 'J');
  });
  return total;
});

// Obtener observaciones de la clase para una fecha específica
/**
 * Devuelve la observación (data.observations) del documento de asistencia
 * correspondiente a la clase y fecha, o cadena vacía si no existe.
 */
const getClassObservation = async (classId: string, date: string): Promise<string> => {
  // Primero cargar el documento de asistencia específico para esta fecha y clase
  await attendanceStore.fetchAttendanceDocument(date, classId);
  // Usar el getter getObservations para obtener la observación
  return attendanceStore.getObservations;
};

// Porcentaje promedio de asistencia
const averageAttendancePercentage = computed(() => {
  if (classReports.value.length === 0) return 0;
  
  let totalPercentage = 0;
  classReports.value.forEach(classData => {
    totalPercentage += calculateAttendancePercentage(classData);
  });
  
  return Math.round(totalPercentage / classReports.value.length);
});

// Día con mejor asistencia
const bestAttendanceDay = computed(() => {
  const attendanceByDay = [0, 0, 0, 0, 0, 0, 0]; // [dom, lun, mar, mié, jue, vie, sáb]
  const countByDay = [0, 0, 0, 0, 0, 0, 0];
  
  // Contar asistencia por día de la semana
  classReports.value.forEach(classData => {
    classData.students.forEach(student => {
      Object.entries(student.attendance).forEach(([date, status]) => {
        const dayOfWeek = getDay(parseISO(date));
        if (status === 'P' || status === 'J') {
          attendanceByDay[dayOfWeek]++;
        }
        countByDay[dayOfWeek]++;
      });
    });
  });
  
  // Calcular porcentaje por día
  const percentageByDay = attendanceByDay.map((count, idx) => ({
    day: idx,
    percentage: countByDay[idx] > 0 ? (count / countByDay[idx]) * 100 : 0
  }));
  
  // Ordenar por porcentaje descendente
  percentageByDay.sort((a, b) => b.percentage - a.percentage);
  
  // Si no hay datos, devolver mensaje
  if (percentageByDay.length === 0 || percentageByDay[0].percentage === 0) {
    return 'No hay datos suficientes';
  }
  
  // Devolver el nombre del día con mayor porcentaje
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return `${dayNames[percentageByDay[0].day]} (${Math.round(percentageByDay[0].percentage)}%)`;
});

// Funciones de formato y utilidades
const formatDate = (dateStr: string) => {
  try {
    const date = parseISO(dateStr);
    return format(date, 'dd MMM yyyy', { locale: es });
  } catch (e) {
    return dateStr;
  }
}

const formatDateShort = (dateStr: string) => {
  try {
    const date = parseISO(dateStr);
    return format(date, 'd MMM', { locale: es });
  } catch (e) {
    return dateStr;
  }
}

// Configurar rango de fechas con presets
function setRange(type: string) {
  const now = new Date()
  if (type === 'yesterday') {
    from.value = format(subDays(now, 1), 'yyyy-MM-dd')
    to.value = from.value
  }
  if (type === 'week') from.value = format(subWeeks(now, 1), 'yyyy-MM-dd')
  if (type === 'month') from.value = format(subMonths(now, 1), 'yyyy-MM-dd')
}

// Función mejorada para procesar los datos de asistencia
const processAttendanceData = (attendanceDoc: any) => {
  const result = {
    presentes: [] as string[],
    ausentes: [] as string[],
    tarde: [] as string[],
    justificados: [] as string[],
    observaciones: ''
  };

  if (!attendanceDoc || !attendanceDoc.data) {
    console.warn('Documento de asistencia inválido o vacío');
    return result;
  }

  // Validar y procesar cada estado
  if (Array.isArray(attendanceDoc.data.presentes)) {
    result.presentes = attendanceDoc.data.presentes;
  }
  if (Array.isArray(attendanceDoc.data.ausentes)) {
    result.ausentes = attendanceDoc.data.ausentes;
  }
  if (Array.isArray(attendanceDoc.data.tarde)) {
    result.tarde = attendanceDoc.data.tarde;
  }
  if (Array.isArray(attendanceDoc.data.justificacion)) {
    result.justificados = attendanceDoc.data.justificacion.map((j: any) => j.id);
  }
  
  result.observaciones = attendanceDoc.data.observations || '';
  
  return result;
};

// Función mejorada para calcular estadísticas
const calculateClassStatistics = (classData: any) => {
  const stats = {
    totalStudents: classData.students.length,
    totalDays: classData.relevantDates?.length || 0,
    presentes: 0,
    ausentes: 0,
    tarde: 0,
    justificados: 0,
    asistenciaPromedio: 0
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

// Función mejorada para validar y formatear fechas
const validateDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Fechas inválidas');
  }
  
  if (start > end) {
    throw new Error('La fecha inicial debe ser anterior a la fecha final');
  }
  
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd')
  };
};

// Función mejorada para obtener símbolo de estado
function getStatusSymbol(status: string): string {
  switch (status) {
    case 'P': return 'P';
    case 'A': return 'A';
    case 'T': return 'T';
    case 'J': return 'J';
    default: return '-';
  }
}

// Función para obtener clase CSS según estado
function getStatusClass(status: string): string {
  switch (status) {
    case 'P': return 'text-green-600 dark:text-green-400 font-bold';
    case 'A': return 'text-red-600 dark:text-red-400 font-bold';
    case 'T': return 'text-yellow-600 dark:text-yellow-400 font-bold';
    case 'J': return 'text-blue-600 dark:text-blue-400 font-bold';
    default: return 'text-gray-400';
  }
}

// Calcular porcentaje de asistencia para una clase
function calculateAttendancePercentage(classData: any): number {
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
}

// Contar total de un estado específico en una clase
function countTotalStatus(classData: any, status: string): number {
  let count = 0;
  
  for (const student of classData.students) {
    for (const date in student.attendance) {
      if (student.attendance[date] === status) {
        count++;
      }
    }
  }
  
  return count;
}

// Contar estado específico para una fecha específica en una clase
function countStatusForDate(classData: any, date: string, status: string): number {
  let count = 0;
  
  for (const student of classData.students) {
    if (student.attendance[date] === status) {
      count++;
    }
  }
  
  return count;
}

// Función para ordenar observaciones por fecha
const sortedObservations = (observations: Array<{ date: string; text: string }>) => {
  if (!observations) return [];
  return [...observations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Función para verificar si hay observaciones
const hasObservations = async (classId: any) => {
  // iterar classData y obtener el classData
  const classData = classReports.value.find(cls => cls.classId === classId);
  // crear un bucle para iterar classData.relevantDates y obtener el classData
  const relevantDates = classData.relevantDates || [];
  for (const date of relevantDates) {
    const observation = await getClassObservation(classId, date);
    if (observation) {
      console.log('Historial de observaciones:', observation);
      return true;
    }
  }

  // const res = await  attendanceStore.getObservationsHistory(classId, '2025-04-30');
  // return classData.observations && classData.observations.length > 0;
};
// vamos a llamar a la funcion hasObservations en el fetchReport


// Función para verificar si hay alguna observación para una clase
function hasAnyObservations(classData: any): boolean {
  if (classData.observations && classData.observations.length > 0) {
    return true;
  }
  
  // También verificar si hay observaciones en los documentos de asistencia
  for (const date of classData.relevantDates || []) {
    if (getClassObservation(classData.classId, date)) {
      return true;
    }
  }
  
  return false;
}

// FUNCIÓN PRINCIPAL: Generar el informe
const fetchReport = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    // Obtener rango de fechas validado
    const { start, end } = validateDateRange(from.value, to.value);
    console.log(`📆 Generando informe de ${start} a ${end} para profesor ${currentTeacherId.value}`);
    
    // Primero cargar las clases del profesor actual
    if (!currentTeacherId.value) {
      error.value = "ID de profesor no disponible";
      return;
    }
    
    // Cargar clases del profesor desde el store de clases
    // Use the action if available, otherwise fallback to filtering loaded classes
    let classes = [];
    if (typeof classesStore.fetchClassesByTeacher === 'function') {
      classes = await classesStore.fetchClassesByTeacher(currentTeacherId.value);
    } else if (typeof classesStore.getClassesByTeacher === 'function') {
      // Fallback: use getter if action is not available (for legacy/classic Pinia stores)
      classes = classesStore.getClassesByTeacher(currentTeacherId.value) || [];
    } else {
      // Fallback: filter loaded classes
      classes = (classesStore.classes || []).filter(c => c.teacherId === currentTeacherId.value);
    }
    teacherClasses.value = classes;
    console.log(`📚 Clases del profesor cargadas: ${teacherClasses.value.length}`);
    
    if (teacherClasses.value.length === 0) {
      error.value = "El profesor no tiene clases asignadas";
      return;
    }
    
    // Obtener datos de asistencia para el rango de fechas
    const attendanceDocs = await attendanceStore.fetchAttendanceByDateRange(start, end, currentTeacherId.value);
    console.log(`📊 Documentos de asistencia cargados: ${attendanceDocs.length}`);
    
    // Procesar cada clase para generar el reporte
    classReports.value = await Promise.all(
      teacherClasses.value.map(async (classObj) => {
        // Obtener documentos de asistencia para esta clase
        const classAttendance = attendanceStore.attendanceDocuments.filter(
          doc => doc.classId === classObj.id
        );
        
        // Obtener estudiantes de esta clase
        let students = [];
        if (classObj.studentIds && Array.isArray(classObj.studentIds)) {
          // Buscar información de cada estudiante
          students = await Promise.all(classObj.studentIds.map(async (studentId) => {
            const studentData = studentsStore.students.find(s => s.id === studentId) || 
              { id: studentId, nombre: 'Estudiante', apellido: 'Desconocido' };
              
            // Prepare attendance record for this student
            const attendance = {};
            
            // Initialize attendance as empty
            if (classAttendance.length > 0) {
              // For each attendance document, check if student was present/absent/etc
              classAttendance.forEach(doc => {
                const date = doc.fecha || doc.date || '';
                if (!date) return;
                
                // Determine status
                let status = '-';
                if (doc.data?.presentes?.includes(studentId)) {
                  status = 'P';
                } else if (doc.data?.ausentes?.includes(studentId)) {
                  status = 'A';
                } else if (doc.data?.tarde?.includes(studentId)) {
                  status = 'T';
                } else if (doc.data?.justificacion?.some(j => j.id === studentId)) {
                  status = 'J';
                }
                
                attendance[date] = status;
              });
            }
            
            return {
              id: studentId,
              name: `${studentData.nombre} ${studentData.apellido}`,
              attendance,
              observations: ''
            };
          }));
        }
        
        // Get unique dates with attendance records for this class
        const relevantDates = Array.from(new Set(
          classAttendance.map(doc => doc.fecha || doc.date || '')
        )).filter(date => date);
        
        // Sort dates chronologically
        relevantDates.sort();
        
        // Get observations for this class
        const observations = [];
        for (const doc of classAttendance) {
          if (doc.data?.observations) {
            observations.push({
              date: doc.fecha || doc.date || '',
              text: doc.data.observations
            });
          }
        }
        
        // Determinar los días de la semana en que se da esta clase
        const daySchedule = classObj.schedule ? 
          classObj.schedule.slots.map(slot => {
            // Convert day name to number (0 = Sunday, 1 = Monday, etc)
            const dayMap = { 
              'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3, 
              'jueves': 4, 'viernes': 5, 'sábado': 6 
            };
            return dayMap[slot.day.toLowerCase()] || 0;
          }) : [];
        
        return {
          classId: classObj.id,
          className: classObj.name || 'Clase sin nombre',
          daySchedule,
          observations,
          students,
          relevantDates
        };
      })
    );
    
    // Calcular estadísticas generales
    calculateGeneralStats();
    
  } catch (err) {
    console.error('Error al generar informe:', err);
    error.value = err instanceof Error ? err.message : 'Error al generar el informe';
  } finally {
    loading.value = false;
  }
};

// crear un metodo para sincronizar los datos de asistencia
    async function syncAttendanceData() {
    try {
      const attendanceData = await fetchAttendanceData();
      // Procesar y normalizar los datos de asistencia
      const processedData = attendanceData.map(doc => {
        // Los documentos ya son objetos, no necesitas llamar a .data()
        return {
          docId: doc.id || doc._id || '',
          fecha: doc.fecha,
          classId: doc.classId,
          teacherId: doc.teacherId,
          data: {
            presentes: doc.data?.presentes || [],
            ausentes: doc.data?.ausentes || [],
            tarde: doc.data?.tarde || [],
            justificados: doc.data?.justificacion || [], // nota: cambio de justificados a justificacion
          },
        };
      });
      // Actualizar el store con los datos procesados
      classReports.value = processedData;
      console.log(`✅ Datos sincronizados: ${processedData.length} documentos`);
    } catch (err) {
      console.error('Error al sincronizar datos de asistencia:', err);
    }
  };
// desarrolla un metodo para fetchAttendanceData en relacion al contexto
async function fetchAttendanceData() {
  try {
    const attendanceDocs = await attendanceStore.fetchAttendanceDocuments(currentTeacherId.value);
    return attendanceDocs;
  } catch (err) {
    console.error('Error al obtener datos de asistencia:', err);
    throw err;
  }
}

// Función para calcular estadísticas generales
function calculateGeneralStats() {
  try {
    // Preparar datos para las gráficas
    const chartData = prepareChartData();
    
    // Dibujar las gráficas con los datos actualizados
    drawCharts();
    
    // Log de observaciones si hay alguna
    if (classReports.value.some(c => c.observations && c.observations.length > 0)) {
      logObservationsGrouped(classReports.value);
    }
    
  } catch (err) {
    console.error('Error al calcular estadísticas generales:', err);
    error.value = err instanceof Error ? err.message : 'Error al calcular estadísticas';
  }
}

// Soporte para gráficas adecuado al modo oscuro
const isDarkMode = computed(() => {
  if (typeof window !== 'undefined') {
    return document.documentElement.classList.contains('dark') || 
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
})

// Preparar datos para las gráficas
function prepareChartData() {
  // Optimizar y simplificar la gráfica para solo mostrar datos relevantes
  // Datos para la gráfica por fecha - solo mostrar fechas con clases programadas
  const relevantDates = new Set<string>();
    // Recopilar todas las fechas relevantes de todas las clases
  classReports.value.forEach(classData => {
    if (classData.relevantDates && Array.isArray(classData.relevantDates)) {
      classData.relevantDates
        .filter(date => date && typeof date === 'string') // Asegurarse de que la fecha es válida
        .forEach(date => {
          try {
            // Validar que la fecha puede ser parseada
            const parsedDate = parseISO(date);
            if (!isNaN(parsedDate.getTime())) {
              relevantDates.add(date);
            }
          } catch (err) {
            console.warn(`Error adding date ${date}:`, err);
          }
        });
    }
  });
  

  // Ordenar las fechas relevantes
  const sortedRelevantDates = Array.from(relevantDates).sort();
  
  // Límite para mostrar solo hasta 15 fechas para evitar sobrecarga
  const limitedDates = sortedRelevantDates.length > 15 
    ? [
        ...sortedRelevantDates.slice(0, 7), 
        ...sortedRelevantDates.slice(sortedRelevantDates.length - 8)
      ]
    : sortedRelevantDates;
    
  const attendanceByDate = limitedDates.map(date => {
    let presentes = 0;
    let ausentes = 0;
    let tardes = 0;
    let justificados = 0;
    let total = 0;
    
    
    classReports.value.forEach(classData => {
      classData.students.forEach(student => {
        if (student.attendance[date]) {
          const status = student.attendance[date];
          if (status === 'P') presentes++;
          else if (status === 'A') ausentes++;
          else if (status === 'T') tardes++;
          else if (status === 'J') justificados++;
          
          if (status !== '-') total++;
        }
      });
    });
    
    return { 
      date, 
      presentes, 
      ausentes, 
      tardes, 
      justificados,
      // Calcular porcentajes para mostrar datos más significativos
      presentesPct: total > 0 ? (presentes / total) * 100 : 0,
      ausentesPct: total > 0 ? (ausentes / total) * 100 : 0,
      tardesPct: total > 0 ? (tardes / total) * 100 : 0,
      justificadosPct: total > 0 ? (justificados / total) * 100 : 0
    };
  });
  
  // Datos para la gráfica por día de la semana - optimizado
  const attendanceByWeekday = [0, 0, 0, 0, 0, 0, 0]; // [dom, lun, mar, mié, jue, vie, sáb]
  const totalByWeekday = [0, 0, 0, 0, 0, 0, 0];
    // Contar solo las fechas relevantes para optimizar el rendimiento
  for (const classData of classReports.value) {
    for (const date of classData.relevantDates || []) {
      // Validar que la fecha existe y es válida
      if (!date) continue;
      
      try {
        const parsedDate = parseISO(date);
        if (isNaN(parsedDate.getTime())) continue; // Skip invalid dates
        
        const dayOfWeek = getDay(parsedDate);
        
        for (const student of classData.students) {
          const status = student.attendance[date];
          if (status === 'P' || status === 'J') {
            attendanceByWeekday[dayOfWeek]++;
          }
          if (status !== '-') {
            totalByWeekday[dayOfWeek]++;
          }
        }
      } catch (err) {
        console.warn(`Error processing date ${date}:`, err);
        continue;
      }
    }
  }
  
  // Calcular porcentajes pero solo para días con datos
  const avgByWeekday = attendanceByWeekday.map((count, dayIndex) => ({
    day: dayIndex,
    avgPct: totalByWeekday[dayIndex] > 0 ? (count / totalByWeekday[dayIndex]) * 100 : 0,
    hasData: totalByWeekday[dayIndex] > 0
  })).filter(item => item.hasData); // Solo incluir días con datos
  
  return { attendanceByDate, avgByWeekday };
}

// Dibujar gráficas optimizadas
function drawCharts() {
  try {
    const chartData = prepareChartData();
    
    // Limpiar gráficos anteriores
    if (chart1) chart1.destroy();
    if (chart2) chart2.destroy();
    
    // No dibujar gráficos si no hay datos
    if (chartData.attendanceByDate.length === 0) {
      console.log("No hay datos suficientes para generar gráficos");
      return;
    }
    
    const darkMode = isDarkMode.value;
    const textColor = darkMode ? '#e5e7eb' : '#374151';
    const gridColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // Gráfica de barras por fecha - usando porcentajes para mejor visualización
    if (chartDates.value) {
      chart1 = new Chart(chartDates.value, {
        type: 'bar',
        data: {
          labels: chartData.attendanceByDate.map(d => formatDateShort(d.date)),
          datasets: [
            {
              label: 'Presentes',
              data: chartData.attendanceByDate.map(d => d.presentesPct), // Usar porcentajes
              backgroundColor: '#10b981'
            },
            {
              label: 'Ausentes',
              data: chartData.attendanceByDate.map(d => d.ausentesPct),
              backgroundColor: '#ef4444'
            },
            {
              label: 'Tardes',
              data: chartData.attendanceByDate.map(d => d.tardesPct),
              backgroundColor: '#f59e0b'
            },
            {
              label: 'Justificados',
              data: chartData.attendanceByDate.map(d => d.justificadosPct),
              backgroundColor: '#3b82f6'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { color: textColor }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.raw;
                  const dataIndex = context.dataIndex;
                  const datasetIndex = context.datasetIndex;
                  const record = chartData.attendanceByDate[dataIndex];
                  
                  // Obtener el valor absoluto según el dataset
                  let absoluteValue = 0;
                  if (datasetIndex === 0) absoluteValue = record.presentes;
                  else if (datasetIndex === 1) absoluteValue = record.ausentes;
                  else if (datasetIndex === 2) absoluteValue = record.tardes;
                  else if (datasetIndex === 3) absoluteValue = record.justificados;
                  
                  return `${context.dataset.label}: ${absoluteValue} (${value.toFixed(1)}%)`;
                }
              }
            }
          },
          scales: {
            x: {
              ticks: { 
                color: textColor,
                autoSkip: true,
                maxRotation: 45,
                minRotation: 45
              },
              grid: { color: gridColor }
            },
            y: {
              ticks: { color: textColor },
              grid: { color: gridColor },
              stacked: true, // Usar gráfico apilado para mejor visualización
              beginAtZero: true,
              max: 100, // Escala porcentual
              title: {
                display: true,
                text: 'Porcentaje (%)',
                color: textColor
              }
            }
          }
        }
      });
    }
    
    // Gráfica de línea por día de la semana - optimizada
    if (chartWeekday.value && chartData.avgByWeekday.length > 0) {
      chart2 = new Chart(chartWeekday.value, {
        type: 'bar', // Cambiado a barras para mejor visualización
        data: {
          labels: chartData.avgByWeekday.map(w => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][w.day]),
          datasets: [{
            label: '% asistencia promedio',
            data: chartData.avgByWeekday.map(w => w.avgPct),
            backgroundColor: darkMode ? '#60a5fa' : '#3b82f6',
            borderColor: darkMode ? '#3b82f6' : '#2563eb',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { color: textColor }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Asistencia: ${context.raw.toFixed(1)}%`;
                }
              }
            }
          },
          scales: {
            x: {
              ticks: { color: textColor },
              grid: { color: gridColor }
            },
            y: {
              ticks: { color: textColor },
              grid: { color: gridColor },
              beginAtZero: true,
              suggestedMax: 100,
              title: {
                display: true,
                text: 'Porcentaje de Asistencia',
                color: textColor
              }
            }
          }
        }
        });
    }
  } catch (error) {
    console.error("Error al dibujar gráficas:", error);
  }
}

// Functions for exporting
async function downloadPDF() {
  // Important: First find the element BEFORE setting loading state
  const reportElement = document.getElementById('printable-report');
  
  if (!reportElement) {
    error.value = 'No se pudo encontrar el elemento del informe. Asegúrese de que el informe está generado.';
    console.error('Error: elemento del informe no encontrado');
    return;
  }
  
  // Clone the element to prevent DOM changes affecting our PDF
  const clonedReport = reportElement.cloneNode(true) as HTMLElement;
  
  // Ahora mostrar indicador de carga
  loading.value = true;
  error.value = null;
  
  try {
    // Importar la función de generación de PDF
    const { generatePDF } = await import('./downloadPDF.js');
    
    const fileName = `informe-asistencia-${from.value}-${to.value}.pdf`;
    
    console.log('Preparando PDF con formato horizontal y una clase por página...');
    
    // Add page break markers to each class report
    const classElements = reportElement.querySelectorAll('.mb-10');
    classElements.forEach((el) => {
      el.classList.add('pdf-page-break');
    });
    
    // Opciones adicionales específicas para este informe
    const options = {
      filename: fileName,
      jsPDF: {
        format: 'A4'
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: true,
        letterRendering: true,
        allowTaint: false
      },
      pagebreak: {
        mode: ['css', 'legacy'],
        before: '.pdf-page-break',
        avoid: '.page-break-avoid'
      }
    };
    
    // Generar el PDF utilizando la función especializada
    await generatePDF(reportElement, fileName, options);
    
    console.log('PDF generado exitosamente');
  } catch (err) {
    console.error('Error al generar PDF:', err);
    error.value = `Error al generar PDF: ${err instanceof Error ? err.message : 'Error desconocido'}`;
  } finally {
    // Clean up any added classes
    const classElements = document.querySelectorAll('.pdf-page-break');
    classElements.forEach(el => el.classList.remove('pdf-page-break'));
    loading.value = false;
  }
}

function exportCSV() {
  // Implementación básica de exportación CSV
  const headers = ['Clase', 'Estudiante', ...dateRange.value.map(formatDateShort), 'Observaciones'];
  const rows: string[][] = [];
  
  // Crear filas para cada estudiante de cada clase
  classReports.value.forEach(classData => {
    classData.students.forEach(student => {
      const row = [
        classData.className,
        student.name,
        ...dateRange.value.map(date => getStatusSymbol(student.attendance[date])),
        student.observations
      ];
      rows.push(row);
    });
  });
  
  // Convertir a CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Crear archivo y descargarlo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `informe_asistencia_${from.value}_${to.value}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportXls() {
  // Esta es una implementación simple que utiliza tablas HTML para Excel
  // En un escenario real, se podría usar una librería como xlsx
  
  let htmlTable = '<table border="1">';
  
  // Encabezados
  htmlTable += '<tr><th>Clase</th><th>Estudiante</th>';
  dateRange.value.forEach(date => {
    htmlTable += `<th>${formatDateShort(date)}</th>`;
  });
  htmlTable += '<th>Observaciones</th></tr>';
  
  // Filas
  classReports.value.forEach(classData => {
    classData.students.forEach(student => {
      htmlTable += `<tr><td>${classData.className}</td><td>${student.name}</td>`;
      dateRange.value.forEach(date => {
        htmlTable += `<td>${getStatusSymbol(student.attendance[date])}</td>`;
      });
      htmlTable += `<td>${student.observations}</td></tr>`;
    });
  });
  
  htmlTable += '</table>';
  
  // Crear datos en formato de Excel y descargar
  const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `informe_asistencia_${from.value}_${to.value}.xls`;
  link.click();
}

// Monitorear cambios en el modo oscuro y aplicar al estilo de los gráficos
if (typeof window !== 'undefined') {
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  darkModeMediaQuery.addEventListener('change', () => {
    drawCharts();
  });
  
  const observer = new MutationObserver(() => {
    drawCharts();
  });
  observer.observe(document.documentElement, { 
    attributes: true, 
    attributeFilter: ['class'] 
  });
}

// Observar cambios en las fechas para regenerar informe
watch([currentTeacherId, from, to], () => {
  fetchReport();
});

// En el método onMounted
onMounted(async () => {
  try {
    // Cargar los profesores si es necesario
    if (teachersStore.teachers.length === 0) {
      await teachersStore.fetchTeachers();
    }
    
    // Cargar los estudiantes si es necesario
    if (studentsStore.students.length === 0) {
      await studentsStore.fetchStudents();
    }
    
    // Generar el informe
    await fetchReport();
  } catch (err) {
    console.error('Error al inicializar componente:', err);
    error.value = 'Error al cargar datos iniciales';
  }
});

// Función para agrupar y mostrar observaciones
const logObservationsGrouped = (classReports: any[]) => {
  console.group('Observaciones agrupadas por clase y fecha');
  
  classReports.forEach(classData => {
    if (classData.observations && classData.observations.length > 0) {
      console.group(`Clase: ${classData.className}`);
      
      // Agrupar observaciones por fecha
      const observationsByDate = classData.observations.reduce((acc: any, obs: any) => {
        if (!acc[obs.date]) {
          acc[obs.date] = [];
        }
        acc[obs.date].push(obs.text);
        return acc;
      }, {});
      
      // Mostrar observaciones agrupadas por fecha
      Object.entries(observationsByDate).forEach(([date, texts]: [string, any]) => {
        console.group(`Fecha: ${formatDate(date)}`);
        texts.forEach((text: string) => console.log('-', text));
        console.groupEnd();
      });
      
      console.groupEnd();
    }
  });
  
  console.groupEnd();
};


function formatJustificationText(text: string): string {
  if (!text) return '';
  
  // Reemplazar : con salto de línea
  let formatted = text.replace(/:/g, ':\n');
  
  // Reemplazar patrones de guion con salto de línea
  formatted = formatted.replace(/(\s-\s|\n-\s|^-\s)/g, '\n- ');
  
  return formatted;
}

/**
 * Formats observation text to improve readability:
 * - Adds line breaks after colons
 * - Formats dashes as bullet points
 * - Ensures proper spacing for list items
 * - Adds line break after each bullet point
 * 
 * @param text The observation text to format
 * @returns Formatted text with improved readability
 */
function formatObservationText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  // Replace colons with colon + line break
  let formatted = text.replace(/:\s*/g, ':\n');
  
  // Format dash-prefixed text as bullet points
  // Match dash followed by space at start of line or after line break
  formatted = formatted.replace(/^-\s+/gm, '• ');     // Dash at beginning of text
  formatted = formatted.replace(/\n-\s+/g, '\n• ');   // Dash after line break
  formatted = formatted.replace(/\s+-\s+/g, '\n• ');  // Dash with spaces before and after
  
  // Ensure two line breaks before bullet points that follow normal text
  formatted = formatted.replace(/([^\n])(\n• )/g, '$1\n\n• ');
  
  // Add line break after each bullet point item
  formatted = formatted.replace(/• (.+?)(?=\n• |\n\n|$)/g, '• $1\n');
  
  // Clean up any excessive line breaks (more than 2 consecutive)
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  return formatted;
}

/**
 * Get justification reason for a student on a specific date and class
 * 
 * @param classId - Class identifier
 * @param date - Date string in YYYY-MM-DD format
 * @param studentId - Student identifier
 * @returns The justification reason or null if not found
 */
function getStudentJustification(classId: string, date: string, studentId: string): string | null {
  // First check if we can find the document in the attendance store
  const document = attendanceStore.attendanceDocuments.find(
    doc => doc.classId === classId && 
           (doc.fecha === date || doc.Fecha === date || doc.date === date)
  );
  
  // If we found a document, look for justification
  if (document && document.data && document.data.justificacion) {
    const justification = document.data.justificacion.find(j => j.id === studentId);
    if (justification) {
      return justification.reason || '';
    }
  }
  
  // As a fallback, check in the class reports structure
  const classData = classReports.value.find(c => c.classId === classId);
  if (classData) {
    const student = classData.students.find(s => s.id === studentId);
    if (student && student.observations) {
      return student.observations;
    }
  }
  
  return null;
}

// ...existing code...
</script>

<style scoped>
</style>