<template>
  <div class="teacher-dashboard">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <!-- Próxima Clase -->
      <div class="card bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden col-span-2">
        <div class="bg-blue-50 dark:bg-blue-900/30 px-4 py-3 flex justify-between items-center">
          <h3 class="font-semibold text-blue-700 dark:text-blue-300 flex items-center">
            <ClockIcon class="h-5 w-5 mr-2" />
            Próxima Clase
          </h3>
          <span class="text-sm text-blue-600 dark:text-blue-400">
            {{ nextClassTime ? formatDateTime(nextClassTime) : "No hay clases programadas" }}
          </span>
        </div>

        <div v-if="nextClass" class="p-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 class="font-medium text-lg">{{ nextClass.name }}</h4>
              <p class="text-gray-600 dark:text-gray-400">{{ nextClass.description }}</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  class="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  {{ nextClass.instrument || "Música" }}
                </span>
                <span
                  class="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full"
                >
                  {{ nextClass.level || "Todos los niveles" }}
                </span>
              </div>
            </div>

            <div class="flex flex-row md:flex-col justify-between md:items-end">
              <div class="text-center md:text-right">
                <p class="text-gray-600 dark:text-gray-400">Estudiantes</p>
                <p class="font-bold text-lg">{{ nextClass.studentIds?.length || 0 }}</p>
              </div>

              <router-link :to="`/classes/${nextClass.id}`" class="btn btn-primary text-sm">
                Ver Detalles
              </router-link>
            </div>
          </div>
        </div>

        <div v-else class="p-4 text-center text-gray-500 dark:text-gray-400">
          <ClockIcon class="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No tienes clases programadas próximamente</p>
        </div>
      </div>

      <!-- Resumen de Asistencia -->
      <div class="card bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div class="bg-green-50 dark:bg-green-900/30 px-4 py-3">
          <h3 class="font-semibold text-green-700 dark:text-green-300 flex items-center">
            <ChartBarIcon class="h-5 w-5 mr-2" />
            Resumen de Asistencia
          </h3>
        </div>

        <div class="p-4">
          <div class="flex items-center justify-center h-48">
            <canvas ref="attendanceChartRef" />
          </div>

          <div class="grid grid-cols-2 gap-4 mt-4 text-center">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Total Asistencias</p>
              <p class="font-bold text-lg">{{ attendanceStats.total }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Tasa de Asistencia</p>
              <p class="font-bold text-lg">{{ Math.round(attendanceStats.rate * 100) }}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Alertas de Inasistencias -->
    <div class="card bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-6">
      <div class="bg-red-50 dark:bg-red-900/30 px-4 py-3">
        <h3 class="font-semibold text-red-700 dark:text-red-300 flex items-center">
          <ExclamationTriangleIcon class="h-5 w-5 mr-2" />
          Control de Inasistencias
        </h3>
      </div>
      <div class="p-4">
        <AbsenceAlertList />
      </div>
    </div>

    <!-- Actividades Recientes -->
    <div class="card bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div class="bg-purple-50 dark:bg-purple-900/30 px-4 py-3">
        <h3 class="font-semibold text-purple-700 dark:text-purple-300 flex items-center">
          <ClockIcon class="h-5 w-5 mr-2" />
          Actividades Recientes
        </h3>
      </div>

      <div class="p-4">
        <div v-if="recentActivities.length > 0" class="space-y-4">
          <div
            v-for="(activity, index) in recentActivities"
            :key="index"
            class="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0"
          >
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :class="getActivityIconClass(activity.type)"
            >
              <component :is="getActivityIcon(activity.type)" class="h-5 w-5" />
            </div>
            <div>
              <p class="font-medium">{{ activity.title }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ activity.description }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {{ formatTimeAgo(activity.timestamp) }}
              </p>
            </div>
          </div>
        </div>

        <div v-else class="text-center text-gray-500 dark:text-gray-400">
          <ClipboardDocumentListIcon class="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No hay actividades recientes registradas</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { format, formatDistance } from 'date-fns';
import { es } from 'date-fns/locale';
import Chart from 'chart.js/auto';
import { useTeachersStore } from '../../modulos/Teachers/store/teachers';
import { useClassesStore } from '../../modulos/Classes/store/classes';
import { useStudentsStore } from '../../modulos/Students/store/students';
import AbsenceAlertList from '@/components/AbsenceAlertList.vue';
import {
  ClockIcon,
  ChartBarIcon,
  StarIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  PencilSquareIcon,
  ChatBubbleLeftEllipsisIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline';

// Refs
const attendanceChartRef = ref(null);
let attendanceChart = null;

// Stores
const teachersStore = useTeachersStore();
const classesStore = useClassesStore();
const studentsStore = useStudentsStore();

// Datos para simular
const teacherId = '1'; // En un caso real, se obtendría del usuario autenticado

// Estado de los datos
interface ClassType {
  id: string
  name: string
  description: string
  instrument?: string
  level?: string
  studentIds?: string[]
  teacherId: string
  nextDate: string
}

interface Student {
  id: string
  nombre: string
  apellido: string
  instrumento?: string
  photoURL?: string
}

const nextClassTime = ref<Date | null>(null);
const students = ref<Student[]>([]);
const attendanceStats = reactive({
  total: 0,
  present: 0,
  absent: 0,
  justified: 0,
  rate: 0,
});
const nextClass = ref<ClassType | null>(null);

// Actividades recientes (simuladas)
const recentActivities = [
  {
    type: 'attendance',
    title: 'Registro de asistencia',
    description: 'Has registrado la asistencia para la clase de Piano Nivel 1',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
  },
  {
    type: 'comment',
    title: 'Nuevo comentario',
    description: 'Has añadido una observación para el estudiante Carlos Pérez',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 horas atrás
  },
  {
    type: 'class',
    title: 'Clase completada',
    description: 'Has finalizado la clase de Guitarra Nivel 2',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 día atrás
  },
  {
    type: 'evaluation',
    title: 'Evaluación registrada',
    description: 'Has evaluado el desempeño de 5 estudiantes',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 días atrás
  },
];

// Funciones auxiliares
const formatDateTime = (date) => {
  if (!date) return '';
  return format(new Date(date), 'EEEE d \'de\' MMMM, h:mm a', { locale: es });
};

const formatTimeAgo = (date) => {
  return formatDistance(new Date(date), new Date(), { addSuffix: true, locale: es });
};

const getActivityIcon = (type) => {
  switch (type) {
  case 'attendance':
    return ClipboardDocumentCheckIcon;
  case 'comment':
    return ChatBubbleLeftEllipsisIcon;
  case 'evaluation':
    return PencilSquareIcon;
  case 'class':
    return ClipboardDocumentListIcon;
  default:
    return ClockIcon;
  }
};

const getActivityIconClass = (type) => {
  switch (type) {
  case 'attendance':
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  case 'comment':
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  case 'evaluation':
    return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
  case 'class':
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  default:
    return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

// Inicializar la gráfica de asistencia
const initAttendanceChart = () => {
  if (!attendanceChartRef.value) return;

  const ctx = attendanceChartRef.value.getContext('2d');

  attendanceChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Presentes', 'Ausentes', 'Justificados'],
      datasets: [
        {
          data: [attendanceStats.present, attendanceStats.absent, attendanceStats.justified],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)', // Verde para presentes
            'rgba(239, 68, 68, 0.8)', // Rojo para ausentes
            'rgba(59, 130, 246, 0.8)', // Azul para justificados
          ],
          borderColor: ['rgba(34, 197, 94, 1)', 'rgba(239, 68, 68, 1)', 'rgba(59, 130, 246, 1)'],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    },
  });
};

// Cargar datos
onMounted(async () => {
  try {
    // Cargar clases
    if (classesStore.classes.length === 0) {
      await classesStore.fetchClasses();
    }

    // Obtener próxima clase
    const teacherClasses = classesStore.classes.filter((c) => c.teacherId === teacherId);
    const now = new Date();
    const upcomingClasses = teacherClasses
      .filter((c) => new Date(c.nextDate) > now)
      .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime());

    if (upcomingClasses.length > 0) {
      nextClass.value = upcomingClasses[0];
      if (nextClass.value) {
        nextClassTime.value = new Date(nextClass.value.nextDate);
      }
    }

    // Cargar estudiantes
    if (studentsStore.students.length === 0) {
      await studentsStore.fetchStudents();
    }

    // Filtrar estudiantes del profesor
    const studentIds = new Set();
    teacherClasses.forEach((c) => {
      c.studentIds?.forEach((id) => studentIds.add(id));
    });

    students.value = studentsStore.students.filter((s) => studentIds.has(s.id));

    // Simular datos de asistencia (en un caso real se obtendrían de un store)
    attendanceStats.total = 120;
    attendanceStats.present = 90;
    attendanceStats.absent = 20;
    attendanceStats.justified = 10;
    attendanceStats.rate = attendanceStats.present / attendanceStats.total;

    // Inicializar gráfica después de que los datos estén listos
    initAttendanceChart();
  } catch (error) {
    console.error('Error al cargar datos del dashboard:', error);
  }
});
</script>

<style scoped>
.card {
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -4px rgba(0, 0, 0, 0.05);
}
</style>
